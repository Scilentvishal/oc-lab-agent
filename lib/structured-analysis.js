/**
 * lib/structured-analysis.js
 * Structured Pharmaceutical Quality Control AI Analysis Engine.
 *
 * Enforces guaranteed JSON output schema from local Ollama LLMs.
 * Produces structured, typed analysis reports suitable for database persistence
 * and direct frontend component binding.
 */

import { generateJSON } from "./ollama";

const STRUCTURED_QC_SYSTEM_PROMPT = `
You are an expert Pharmaceutical Quality Control (QC) AI Auditor operating under strict cGMP regulations (FDA 21 CFR Part 211 / EU GMP Annex).

CRITICAL RULES:
1. You MUST output ONLY valid JSON conforming to the requested schema. Do NOT include markdown text outside the JSON.
2. Ground all explanations strictly in the provided deterministic findings and verified SOP excerpts.
3. If information is not in the excerpts, do NOT invent or hallucinate it.
4. Never issue a final "Batch Rejected" disposition; always recommend "REVIEW_REQUIRED" if findings exist, or "COMPLIANT" if none exist.
5. All immediate actions must be traceable to the retrieved SOPs.
`.trim();

/**
 * Generate a structured, schema-compliant JSON analysis report for a pharmaceutical batch.
 *
 * @param {object} params
 * @param {object} params.batch - Batch metadata.
 * @param {Array<object>} params.findings - Standardized findings from lib/qc-engine.js.
 * @param {Array<object>} [params.retrievedSOPs] - Relevant SOP chunks from Qdrant.
 * @returns {Promise<object>} - Validated JSON analysis report.
 */
export async function generateStructuredQCAnalysis({ batch, findings = [], retrievedSOPs = [] }) {
  const startTime = Date.now();

  const formattedFindings = findings.map((f, i) => ({
    index: i + 1,
    id: f.id,
    type: f.type,
    severity: f.severity,
    test: f.test,
    recordedResult: f.result,
    specification: f.specification,
    difference: f.difference,
    message: f.message,
    documentRef: f.documentRef,
  }));

  const formattedSOPs = retrievedSOPs
    .map(
      (s, i) =>
        `[SOP REFERENCE ${i + 1}]\nDocument: ${s.documentId} (${s.version}) - ${s.title}\nSection: ${s.sectionTitle}\nContent:\n${s.excerpt || s.text}`
    )
    .join("\n\n---\n\n");

  const prompt = `
INPUT BATCH RECORD:
- Batch ID: ${batch.batchId}
- Product: ${batch.productName} (${batch.productId})
- Mfg Date: ${batch.mfgDate}
- Analyst: ${batch.analyst}

DETERMINISTIC QC FINDINGS (${findings.length} detected):
${JSON.stringify(formattedFindings, null, 2)}

VERIFIED GMP DOCUMENTATION & SOPS FROM QDRANT:
${formattedSOPs || "No specific SOP documents retrieved."}

TASK:
Analyze the batch findings against the SOPs and output a JSON object adhering EXACTLY to this JSON structure:

{
  "summary": "Concise 2-3 sentence executive summary of the batch evaluation",
  "dispositionRecommendation": "${findings.length > 0 ? "REVIEW_REQUIRED" : "COMPLIANT"}",
  "findingsAnalysis": [
    {
      "findingId": "string matching finding ID",
      "test": "string",
      "severity": "high | medium | low",
      "scientificExplanation": "Factual explanation of the root deviation",
      "immediateLabActions": ["Array of specific action steps required by SOP"],
      "supportingDocument": "Document ID e.g. SOP-QC-042",
      "supportingSection": "Section title from SOP"
    }
  ],
  "recommendedReviewSteps": [
    "Array of prioritized next investigation steps for the QC manager"
  ],
  "applicableDocuments": [
    {
      "documentId": "string",
      "title": "string",
      "version": "string",
      "section": "string"
    }
  ]
}
`.trim();

  // Level 3 JSON Schema: enforces exact audit report structure at grammar-decode time
  const auditReportSchema = {
    type: "object",
    properties: {
      summary: { type: "string" },
      dispositionRecommendation: {
        type: "string",
        enum: ["COMPLIANT", "REVIEW_REQUIRED"],
      },
      findingsAnalysis: {
        type: "array",
        items: {
          type: "object",
          properties: {
            findingId: { type: "string" },
            test: { type: "string" },
            severity: { type: "string", enum: ["high", "medium", "low"] },
            scientificExplanation: { type: "string" },
            immediateLabActions: { type: "array", items: { type: "string" } },
            supportingDocument: { type: "string" },
            supportingSection: { type: "string" },
          },
          required: ["findingId", "test", "severity", "scientificExplanation", "immediateLabActions"],
        },
      },
      recommendedReviewSteps: { type: "array", items: { type: "string" } },
      applicableDocuments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            documentId: { type: "string" },
            title: { type: "string" },
            version: { type: "string" },
            section: { type: "string" },
          },
          required: ["documentId", "title"],
        },
      },
    },
    required: ["summary", "dispositionRecommendation", "findingsAnalysis", "recommendedReviewSteps", "applicableDocuments"],
  };

  const { data, model, totalDurationMs } = await generateJSON({
    prompt,
    system: STRUCTURED_QC_SYSTEM_PROMPT,
    schema: auditReportSchema,
  });

  return {
    batchId: batch.batchId,
    productId: batch.productId,
    generatedAt: new Date().toISOString(),
    executionTimeMs: Date.now() - startTime,
    llmDurationMs: totalDurationMs,
    modelUsed: model,
    report: data,
  };
}
