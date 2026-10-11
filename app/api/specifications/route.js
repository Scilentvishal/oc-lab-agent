import { NextResponse } from "next/server";
import {
  specificationStore,
  getSpecificationsByProduct,
  getSpecification,
  SUPPORTED_SPEC_TYPES,
} from "@/lib/specifications";

/**
 * GET /api/specifications?productId=PROD-PAR-500&test=assay
 * Returns structured pharmaceutical specifications with acceptance rules.
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const testKey = searchParams.get("test");

  // If both productId and testKey are provided, return the specific rule
  if (productId && testKey) {
    const spec = getSpecification(productId, testKey);
    if (!spec) {
      return NextResponse.json(
        {
          error: `Specification not found for product '${productId}' and test '${testKey}'`,
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: "success", specification: spec });
  }

  // If only productId is provided, return all specs for that product
  if (productId) {
    const specs = getSpecificationsByProduct(productId);
    return NextResponse.json({
      status: "success",
      productId,
      count: specs.length,
      specifications: specs,
    });
  }

  // Return all specifications across all products
  return NextResponse.json({
    status: "success",
    totalCount: specificationStore.length,
    supportedTypes: SUPPORTED_SPEC_TYPES,
    specifications: specificationStore,
  });
}
