import { NextResponse } from "next/server";
import { getBatchById } from "@/lib/batches";
import { getSpecificationsByProduct } from "@/lib/specifications";
import { validateBatch } from "@/lib/qc-engine";
import { analyzeFindingWithRAG } from "@/lib/qc-rag";

/**
 * POST /api/qc/analyze-finding
 * Body: { batchId: "B-2026-001", findingIndex?: 0 }
 *
 * Connects the deterministic finding with Qdrant SOP retrieval and LLM investigation synthesis.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { batchId = "B-2026-001", findingIndex = 0 } = body || {};

    const batch = getBatchById(batchId);
    if (!batch) {
      return NextResponse.json(
        { error: `Batch '${batchId}' not found.` },
        { status: 404 }
      );
    }

    const specs = getSpecificationsByProduct(batch.productId);
    const report = validateBatch(batch, specs);

    if (report.findings.length === 0) {
      return NextResponse.json({
        status: "success",
        message: `Batch '${batchId}' has no non-compliant findings. Batch is fully compliant.`,
        findingsCount: 0,
      });
    }

    const targetFinding = report.findings[findingIndex] || report.findings[0];
    const analysis = await analyzeFindingWithRAG({
      finding: targetFinding,
      batch,
    });

    return NextResponse.json({
      status: "success",
      batchId,
      productName: batch.productName,
      ...analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        suggestion: "Ensure Ollama and Qdrant are running locally.",
      },
      { status: 500 }
    );
  }
}
