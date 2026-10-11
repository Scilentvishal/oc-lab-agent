import { NextResponse } from "next/server";
import { getBatchById, getAllBatches } from "@/lib/batches";
import { getSpecificationsByProduct } from "@/lib/specifications";
import { validateBatch } from "@/lib/qc-engine";

/**
 * GET /api/qc/validate?batchId=B-2026-001
 * Runs deterministic rule evaluation of a batch against its product specifications.
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId") || "B-2026-001";

  const batch = getBatchById(batchId);
  if (!batch) {
    return NextResponse.json(
      { error: `Batch '${batchId}' not found.` },
      { status: 404 }
    );
  }

  const specs = getSpecificationsByProduct(batch.productId);
  const report = validateBatch(batch, specs);

  return NextResponse.json({
    status: "success",
    validationEngine: "Deterministic JavaScript QC Rule Engine (No LLM Math)",
    ...report,
  });
}
