/**
 * lib/rag.js
 * Pharmaceutical Retrieval-Augmented Generation (RAG) Core.
 *
 * Implements strict, closed-domain question answering grounded in
 * verified SOPs, specifications, and test methods retrieved from Qdrant.
 */

import { generateEmbedding, generateText } from "./ollama";
import { searchPoints, KNOWLEDGE_BASE_COLLECTION } from "./qdrant";

/**
 * System prompt enforcing pharmaceutical compliance and zero-hallucination rules.
 */
const PHARMA_QC_SYSTEM_PROMPT = `
You are an expert Pharmaceutical Quality Control (QC) AI assistant operating under strict cGMP guidelines (FDA 21 CFR Part 211 / EU GMP Annex).

CRITICAL OPERATIONAL RULES:
1. Answer the user's question using ONLY the provided verified document excerpts below.
2. If the excerpts do not contain the answer, or if there is insufficient information, state explicitly:
   "I could not find sufficient information in the available documentation."
3. NEVER fabricate, extrapolate, or assume acceptance criteria, numbers, limits, SOP steps, or test methods.
4. Maintain formal, precise QC laboratory terminology.
5. Do NOT make final GMP disposition or batch release/rejection decisions.
`.trim();

/**
 * Executes the RAG pipeline for a given QC question.
 *
 * Flow:
 * Question -> Generate Embedding -> Query Qdrant -> Build Grounded Context -> Ollama LLM -> QC Answer
 *
 * @param {object} params
 * @param {string} params.question - The QC question (e.g. "What is the dissolution requirement for Paracetamol 500mg?").
 * @param {number} [params.topK=3] - Number of document chunks to retrieve as context.
 * @param {number} [params.scoreThreshold=0.6] - Minimum Cosine similarity score to consider relevant.
 * @returns {Promise<object>} - The generated answer, retrieved context chunks, and execution metrics.
 */
export async function askQCQuestion({ question, topK = 3, scoreThreshold = 0.55 }) {
  const startTime = Date.now();

  // Step 1: Convert inquiry into embedding vector (768 dimensions)
  const { embedding } = await generateEmbedding({ text: question });

  // Step 2: Retrieve Top-K semantically relevant chunks from Qdrant
  const searchResults = await searchPoints({
    collectionName: KNOWLEDGE_BASE_COLLECTION,
    vector: embedding,
    limit: topK,
    scoreThreshold,
  });

  // Step 3: Check if sufficient context was retrieved
  if (!searchResults || searchResults.length === 0) {
    return {
      answer: "I could not find sufficient information in the available documentation.",
      contextUsed: [],
      sourcesCount: 0,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Step 4: Assemble retrieved chunks into a structured ground-truth context block
  const formattedContext = searchResults
    .map((point, idx) => {
      const p = point.payload;
      return `[EXCERPT ${idx + 1}]
Document: ${p.documentTitle} (${p.documentId} ${p.version})
Section: ${p.sectionTitle}
Content:
${p.text}`;
    })
    .join("\n\n---\n\n");

  // Step 5: Construct the constrained prompt for Ollama
  const userPrompt = `
VERIFIED PHARMA QC CONTEXT:
${formattedContext}

USER QUESTION:
${question}

Based strictly on the verified excerpts above, provide a precise and factual response. If the information is missing from the excerpts, respond: "I could not find sufficient information in the available documentation."
`.trim();

  // Step 6: Generate response via local LLM (Ollama)
  const { response, model, totalDurationMs } = await generateText({
    prompt: userPrompt,
    system: PHARMA_QC_SYSTEM_PROMPT,
  });

  const durationMs = Date.now() - startTime;

  return {
    question,
    answer: response.trim(),
    modelUsed: model,
    sourcesCount: searchResults.length,
    contextUsed: searchResults.map((r) => ({
      documentId: r.payload.documentId,
      title: r.payload.documentTitle,
      version: r.payload.version,
      sectionTitle: r.payload.sectionTitle,
      similarityScore: Math.round(r.score * 1000) / 1000,
      excerpt: r.payload.text,
    })),
    executionTimeMs: durationMs,
    llmDurationMs: totalDurationMs,
  };
}
