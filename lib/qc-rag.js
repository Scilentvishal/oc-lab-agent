/**
 * lib/qc-rag.js
 * Integration of Deterministic QC Findings with Qdrant Vector Retrieval and LLM Synthesis.
 *
 * Automates the transition from:
 * Deterministic Finding (e.g. Potential OOS Assay 92.4%)
 * -> Targeted Semantic Retrieval (SOP-QC-042 OOS Investigation & TM-HPLC-012)
 * -> Grounded Regulatory AI Explanation & Immediate SOP Actions.
 */

import { generateEmbedding, generateText } from "./ollama";
import { searchPoints, KNOWLEDGE_BASE_COLLECTION } from "./qdrant";

const QC_FINDING_SYSTEM_PROMPT = `
You are an expert Pharmaceutical Quality Control (QC) Analytical Compliance Specialist operating under FDA 21 CFR Part 211 and EU GMP.

CRITICAL INSTRUCTIONS:
1. Explain the detected QC finding factually based ONLY on the provided deterministic finding data and verified SOP excerpts.
2. Provide the immediate laboratory actions required by the relevant Standard Operating Procedure (SOP).
3. Do NOT invent procedures, timeframes, or acceptance limits.
4. Do NOT make a final batch release or rejection decision; state that a formal Phase I investigation and QC review are required.
5. Explicitly cite the supporting document IDs and sections.
`.trim();

/**
 * Automatically formulate a targeted semantic search query from a standardized finding.
 *
 * @param {object} finding - Standardized finding object from lib/findings.js.
 * @param {object} [batch] - Batch context.
 * @returns {string} - Optimized search query for Qdrant.
 */
export function formulateQueryForFinding(finding, batch = {}) {
  const productName = batch.productName || "";
  const testKey = finding.test;

  switch (finding.type) {
    case "potential_oos":
      return `immediate actions and laboratory investigation procedure for out of specification OOS ${testKey} ${productName}`;
    case "missing_test":
      return `mandatory batch release testing requirements and specification limits for ${testKey} ${productName}`;
    case "calculation_inconsistency":
      return `analytical calculation verification chromatographic conditions and system suitability for ${testKey}`;
    case "unusual_value":
      return `out of trend OOT evaluation criteria and retesting guidelines for ${testKey}`;
    case "missing_documentation":
      return `data integrity sample retention and batch record documentation requirements`;
    default:
      return `${testKey} quality control procedure ${productName}`;
  }
}

/**
 * Connect a deterministic QC finding with relevant SOPs in Qdrant and generate an auditable AI explanation.
 *
 * @param {object} params
 * @param {object} params.finding - Standardized finding object.
 * @param {object} [params.batch] - Associated batch data.
 * @param {number} [params.topK=3] - Number of SOP chunks to retrieve.
 * @returns {Promise<object>} - Finding augmented with regulatory explanation and SOP sources.
 */
export async function analyzeFindingWithRAG({ finding, batch = {}, topK = 3 }) {
  const startTime = Date.now();

  // 1. Automatically generate targeted query
  const query = formulateQueryForFinding(finding, batch);

  // 2. Embed query
  const { embedding } = await generateEmbedding({ text: query });

  // 3. Retrieve relevant SOPs and test methods from Qdrant
  const searchResults = await searchPoints({
    collectionName: KNOWLEDGE_BASE_COLLECTION,
    vector: embedding,
    limit: topK,
    scoreThreshold: 0.5,
  });

  // 4. Format retrieved documentation context
  const contextText =
    searchResults.length > 0
      ? searchResults
          .map(
            (r, i) =>
              `[SOURCE ${i + 1}: ${r.payload.documentId} (${r.payload.version}) | ${r.payload.documentTitle} | Section: ${r.payload.sectionTitle}]\n${r.payload.text}`
          )
          .join("\n\n---\n\n")
      : "No direct SOP matches found in the active knowledge base.";

  // 5. Build prompt pairing deterministic finding with SOP evidence
  const userPrompt = `
DETERMINISTIC QC FINDING DETECTED BY RULE ENGINE:
- Finding ID: ${finding.id}
- Type: ${finding.type.toUpperCase()}
- Severity: ${finding.severity.toUpperCase()}
- Test: ${finding.test}
- Recorded Lab Result: ${finding.result ?? "N/A"}
- Acceptance Specification: ${finding.specification}
- Mathematical Difference: ${finding.difference ?? "N/A"}
- Rule Engine Message: ${finding.message}
- Associated Batch: ${batch.batchId || "N/A"} (${batch.productName || "N/A"})

VERIFIED REGULATORY DOCUMENTATION & SOPS FROM QDRANT:
${contextText}

TASK:
1. Explain the scientific and regulatory significance of this finding.
2. Outline the mandatory immediate laboratory steps the analyst and supervisor must execute according to the retrieved SOP.
3. Reference the specific document IDs and sections that govern this investigation.
`.trim();

  // 6. Generate grounded synthesis with local LLM
  const { response, model } = await generateText({
    prompt: userPrompt,
    system: QC_FINDING_SYSTEM_PROMPT,
  });

  // 7. Deduplicate sources
  const uniqueSources = [];
  const seen = new Set();
  for (const match of searchResults) {
    const key = `${match.payload.documentId}-${match.payload.sectionTitle}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSources.push({
        documentId: match.payload.documentId,
        title: match.payload.documentTitle,
        version: match.payload.version,
        sectionTitle: match.payload.sectionTitle,
        similarityScore: Math.round(match.score * 1000) / 1000,
        excerpt: match.payload.text,
      });
    }
  }

  return {
    findingId: finding.id,
    findingType: finding.type,
    severity: finding.severity,
    test: finding.test,
    recordedResult: finding.result,
    specification: finding.specification,
    difference: finding.difference,
    generatedQuery: query,
    aiExplanation: response.trim(),
    modelUsed: model,
    supportingSources: uniqueSources,
    executionTimeMs: Date.now() - startTime,
  };
}
