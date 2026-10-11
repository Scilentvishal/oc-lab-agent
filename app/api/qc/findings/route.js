import { NextResponse } from "next/server";
import { getBatchById } from "@/lib/batches";
import { getSpecificationsByProduct } from "@/lib/specifications";
import { validateBatch } from "@/lib/qc-engine";
import { FINDING_TYPES, SEVERITY_LEVELS } from "@/lib/findings";

/**
 * GET /api/qc/findings?batchId=B-2026-001&type=potential_oos
 * Returns normalized, standardized QC findings conforming to the Stage 14 schema.
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId") || "B-2026-001";
  const typeFilter = searchParams.get("type");

  const batch = getBatchById(batchId);
  if (!batch) {
    return NextResponse.json(
      { error: `Batch '${batchId}' not found.` },
      { status: 404 }
    );
  }

  const specs = getSpecificationsByProduct(batch.productId);
  const report = validateBatch(batch, specs);

  let filteredFindings = report.findings;
  if (typeFilter && FINDING_TYPES.includes(typeFilter)) {
    filteredFindings = report.findings.filter((f) => f.type === typeFilter);
  }

  return NextResponse.json({
    status: "success",
    batchId: report.batchId,
    productName: report.productName,
    overallStatus: report.overallStatus,
    supportedFindingTypes: FINDING_TYPES,
    severityLevels: SEVERITY_LEVELS,
    findingsCount: filteredFindings.length,
    findings: filteredFindings,
    breakdownByType: report.breakdownByType,
  });
}
