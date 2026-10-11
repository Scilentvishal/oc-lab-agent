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
 * System prompt enforcing pharmaceutical compliance, zero-hallucination rules,
 * and explicit source citation requirements.
 */
const PHARMA_QC_SYSTEM_PROMPT = `
You are an expert Pharmaceutical Quality Control (QC) AI assistant operating under strict cGMP guidelines (FDA 21 CFR Part 211 / EU GMP Annex).

CRITICAL OPERATIONAL RULES:
1. Answer the user's question using ONLY the provided verified document excerpts below.
2. If the excerpts do not contain the answer, state explicitly:
   "I could not find sufficient information in the available documentation."
3. In your explanation, explicitly cite the supporting document and section (e.g. "According to [SPEC-PAR-500, Section 3. CHEMICAL AND DISSOLUTION ACCEPTANCE CRITERIA]...").
4. NEVER fabricate or extrapolate acceptance limits, numerical values, or test steps.
5. Maintain formal, precise QC laboratory terminology.
6. Do NOT make final GMP disposition or batch release/rejection decisions.
`.trim();

/**
 * Executes the Source-Aware RAG pipeline for a given QC question.
 *
 * Flow:
 * Question -> Generate Embedding -> Query Qdrant -> Build Structured Context -> Ollama LLM -> Answer with Clean Citations
 *
 * @param {object} params
 * @param {string} params.question - The QC question.
 * @param {number} [params.topK=3] - Number of document chunks to retrieve as context.
 * @param {number} [params.scoreThreshold=0.55] - Minimum Cosine similarity score.
 * @returns {Promise<object>} - The generated answer, structured sources, and execution metrics.
 */
export async function askQCQuestion({ question, topK = 3, scoreThreshold = 0.55 }) {
  const startTime = Date.now();

  // Step 1: Generate query embedding (768-dim float vector)
  const { embedding } = await generateEmbedding({ text: question });

  // Step 2: Retrieve Top-K semantically relevant chunks from Qdrant
  const searchResults = await searchPoints({
    collectionName: KNOWLEDGE_BASE_COLLECTION,
    vector: embedding,
    limit: topK,
    scoreThreshold,
  });

  // Step 3: Handle empty / below-threshold search results
  if (!searchResults || searchResults.length === 0) {
    return {
      question,
      answer: "I could not find sufficient information in the available documentation.",
      sources: [],
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Step 4: Assemble formatted context with explicit source tags
  const formattedContext = searchResults
    .map((point, idx) => {
      const p = point.payload;
      return `[SOURCE ${idx + 1}: ${p.documentId} (${p.version}) | ${p.documentTitle} | Section: ${p.sectionTitle}]
${p.text}`;
    })
    .join("\n\n---\n\n");

  // Step 5: Build prompt requiring clear inline attribution
  const userPrompt = `
VERIFIED PHARMA QC SOURCES:
${formattedContext}

USER QUESTION:
${question}

Provide a concise answer based solely on the verified sources above, explicitly referencing which document and section provided each fact.
`.trim();

  // Step 6: Generate grounded response with Ollama
  const { response, model, totalDurationMs } = await generateText({
    prompt: userPrompt,
    system: PHARMA_QC_SYSTEM_PROMPT,
  });

  // Step 7: Deduplicate and format clean source references
  const uniqueSourcesMap = new Map();
  searchResults.forEach((r) => {
    const key = `${r.payload.documentId}-${r.payload.sectionTitle}`;
    if (!uniqueSourcesMap.has(key)) {
      uniqueSourcesMap.set(key, {
        documentId: r.payload.documentId,
        title: r.payload.documentTitle,
        documentType: r.payload.documentType,
        version: r.payload.version,
        sectionTitle: r.payload.sectionTitle,
        similarityScore: Math.round(r.score * 1000) / 1000,
        relevantExcerpt: r.payload.text,
      });
    }
  });

  return {
    question,
    answer: response.trim(),
    modelUsed: model,
    sources: Array.from(uniqueSourcesMap.values()),
    executionTimeMs: Date.now() - startTime,
    llmDurationMs: totalDurationMs,
  };
}
