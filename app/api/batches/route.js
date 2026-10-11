import { NextResponse } from "next/server";
import { batchStore, getBatchById, createBatch } from "@/lib/batches";

/**
 * GET /api/batches?batchId=B-2026-001
 * Returns all batches or a single batch by ID.
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");

  if (batchId) {
    const batch = getBatchById(batchId);
    if (!batch) {
      return NextResponse.json(
        { error: `Batch '${batchId}' not found in laboratory records` },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: "success", batch });
  }

  return NextResponse.json({
    status: "success",
    totalCount: batchStore.length,
    batches: batchStore,
  });
}

/**
 * POST /api/batches
 * Inserts a new analytical batch result record.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { batchId, productId, productName, results } = body;

    if (!batchId || !productId || !results) {
      return NextResponse.json(
        { error: "Missing required fields: batchId, productId, results" },
        { status: 400 }
      );
    }

    const created = createBatch({
      batchId,
      productId,
      productName: productName || "Generic Finished Product",
      mfgDate: body.mfgDate || new Date().toISOString().split("T")[0],
      expiryDate: body.expiryDate || "2028-12-31",
      batchSize: body.batchSize || "100,000 Units",
      analyst: body.analyst || "QC Analytical Chemist",
      status: "Under Review",
      results,
      rawReadings: Object.entries(results).map(([testKey, reading]) => ({
        testKey,
        reading,
        unit: typeof reading === "number" ? "%" : "Text",
        testedAt: new Date().toISOString(),
      })),
    });

    return NextResponse.json({ status: "success", batch: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 400 });
  }
}
