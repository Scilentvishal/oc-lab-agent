import { NextResponse } from "next/server";
import { getBatchById } from "@/lib/batches";
import { getSpecificationsByProduct } from "@/lib/specifications";
import { validateBatch } from "@/lib/qc-engine";
import { formulateQueryForFinding } from "@/lib/qc-rag";
import { generateEmbedding } from "@/lib/ollama";
import { searchPoints, KNOWLEDGE_BASE_COLLECTION } from "@/lib/qdrant";
import { generateStructuredQCAnalysis } from "@/lib/structured-analysis";

/**
 * POST /api/qc/structured-analysis
 * Body: { batchId: "B-2026-001" }
 *
 * Runs deterministic rule evaluation, retrieves relevant SOPs from Qdrant,
 * and produces a guaranteed JSON structured AI analysis report via Ollama.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { batchId = "B-2026-001" } = body || {};

    const batch = getBatchById(batchId);
    if (!batch) {
      return NextResponse.json(
        { error: `Batch '${batchId}' not found.` },
        { status: 404 }
      );
    }

    // 1. Deterministic validation
    const specs = getSpecificationsByProduct(batch.productId);
    const validationReport = validateBatch(batch, specs);

    // 2. Retrieve relevant SOPs from Qdrant for detected findings
    const retrievedSOPs = [];
    const seenSOPs = new Set();

    for (const finding of validationReport.findings) {
      if (finding.type === "potential_oos" || finding.type === "missing_test") {
        const query = formulateQueryForFinding(finding, batch);
        const { embedding } = await generateEmbedding({ text: query });
        const matches = await searchPoints({
          collectionName: KNOWLEDGE_BASE_COLLECTION,
          vector: embedding,
          limit: 2,
          scoreThreshold: 0.5,
        });

        for (const m of matches) {
          const key = `${m.payload.documentId}-${m.payload.sectionTitle}`;
          if (!seenSOPs.has(key)) {
            seenSOPs.add(key);
            retrievedSOPs.push({
              documentId: m.payload.documentId,
              title: m.payload.documentTitle,
              version: m.payload.version,
              sectionTitle: m.payload.sectionTitle,
              excerpt: m.payload.text,
            });
          }
        }
      }
    }

    // 3. Generate guaranteed JSON analysis
    const analysisResult = await generateStructuredQCAnalysis({
      batch,
      findings: validationReport.findings,
      retrievedSOPs,
    });

    return NextResponse.json({
      status: "success",
      batchId,
      productName: batch.productName,
      ...analysisResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        suggestion: "Ensure Ollama and Qdrant are active locally.",
      },
      { status: 500 }
    );
  }
}
