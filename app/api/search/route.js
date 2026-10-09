import { NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/ollama";
import { searchPoints, KNOWLEDGE_BASE_COLLECTION } from "@/lib/qdrant";

/**
 * GET /api/search?q=...&limit=3
 * Performs semantic vector search across the indexed pharmaceutical documents in Qdrant.
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 3;

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      {
        error: "Missing required query parameter: ?q=...",
        example: "/api/search?q=What are the immediate steps if an assay test fails specification?",
      },
      { status: 400 }
    );
  }

  const startTime = Date.now();

  try {
    // 1. Convert user inquiry into mathematical vector coordinates
    const { embedding } = await generateEmbedding({ text: query });

    // 2. Query Qdrant for top-K nearest neighbors using Cosine similarity
    const matches = await searchPoints({
      collectionName: KNOWLEDGE_BASE_COLLECTION,
      vector: embedding,
      limit,
    });

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      status: "success",
      query,
      resultsCount: matches.length,
      durationMs,
      results: matches.map((m) => ({
        similarityScore: Math.round(m.score * 1000) / 1000,
        documentId: m.payload.documentId,
        title: m.payload.documentTitle,
        documentType: m.payload.documentType,
        sectionTitle: m.payload.sectionTitle,
        version: m.payload.version,
        excerpt: m.payload.text,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        query,
        error: error.message,
        suggestion: "Ensure Qdrant is running at http://localhost:6333 and documents are ingested via POST /api/ingest",
      },
      { status: 500 }
    );
  }
}
