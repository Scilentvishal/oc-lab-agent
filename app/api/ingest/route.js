import { NextResponse } from "next/server";
import { pharmaCorpus } from "@/lib/pharma-corpus";
import { chunkAllDocuments } from "@/lib/chunker";
import { generateEmbedding } from "@/lib/ollama";
import {
  ensureCollection,
  upsertPoints,
  getCollectionInfo,
  KNOWLEDGE_BASE_COLLECTION,
} from "@/lib/qdrant";

/**
 * GET /api/ingest
 * Inspect current status of the Qdrant pharma knowledge base.
 */
export async function GET() {
  try {
    const info = await getCollectionInfo(KNOWLEDGE_BASE_COLLECTION);
    return NextResponse.json({
      status: "ready",
      collection: KNOWLEDGE_BASE_COLLECTION,
      pointsCount: info.points_count ?? 0,
      vectorsCount: info.vectors_count ?? 0,
      statusColor: info.status,
      message:
        (info.points_count ?? 0) > 0
          ? "Pharma QC knowledge base is populated and ready for semantic search"
          : "Collection exists but contains 0 points. Run POST /api/ingest to populate.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "not_initialized",
        collection: KNOWLEDGE_BASE_COLLECTION,
        error: error.message,
        suggestion: "Ensure Qdrant is running at http://localhost:6333 and trigger POST /api/ingest",
      },
      { status: 503 }
    );
  }
}

/**
 * POST /api/ingest
 * Executes the complete Pharma document ingestion pipeline:
 * 1. Ensures Qdrant collection exists (768-dim, Cosine)
 * 2. Parses and chunks SOPs, Specs, and Test Methods with contextual breadcrumbs
 * 3. Computes vector embeddings via local Ollama (nomic-embed-text)
 * 4. Batch upserts all points and payloads into Qdrant
 */
export async function POST(req) {
  const startTime = Date.now();

  try {
    // 1. Ensure collection exists
    await ensureCollection({
      collectionName: KNOWLEDGE_BASE_COLLECTION,
      vectorSize: 768,
      distance: "Cosine",
    });

    // 2. Optional: Allow client to pass custom documents, or default to pharmaCorpus
    let documentsToIngest = pharmaCorpus;
    try {
      const body = await req.json();
      if (body && Array.isArray(body.documents) && body.documents.length > 0) {
        documentsToIngest = body.documents;
      }
    } catch {
      // No JSON body passed; use default pharmaCorpus
    }

    // 3. Chunk all documents
    const chunks = chunkAllDocuments(documentsToIngest);

    // 4. Generate embeddings in parallel batches for speed
    const BATCH_SIZE = 5;
    const points = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const slice = chunks.slice(i, i + BATCH_SIZE);
      const batchPromises = slice.map(async (chunk) => {
        const { embedding } = await generateEmbedding({ text: chunk.text });
        return {
          id: chunk.id,
          vector: embedding,
          payload: {
            chunkIndex: chunk.chunkIndex,
            documentId: chunk.documentId,
            documentTitle: chunk.documentTitle,
            documentType: chunk.documentType,
            version: chunk.version,
            sectionTitle: chunk.sectionTitle,
            text: chunk.text,
            charCount: chunk.charCount,
          },
        };
      });

      const batchResults = await Promise.all(batchPromises);
      points.push(...batchResults);
    }

    // 5. Batch upsert into Qdrant
    const upsertRes = await upsertPoints({
      collectionName: KNOWLEDGE_BASE_COLLECTION,
      points,
    });

    // 6. Read updated collection stats
    const collectionInfo = await getCollectionInfo(KNOWLEDGE_BASE_COLLECTION);
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      status: "success",
      message: `Successfully ingested ${documentsToIngest.length} documents (${chunks.length} chunks) into Qdrant.`,
      metrics: {
        documentsIngested: documentsToIngest.length,
        totalChunksCreated: chunks.length,
        qdrantPointsCount: collectionInfo.points_count,
        embeddingDimensions: 768,
        totalDurationMs: durationMs,
      },
      documentBreakdown: documentsToIngest.map((d) => ({
        documentId: d.documentId,
        title: d.title,
        documentType: d.documentType,
        chunksGenerated: chunks.filter((c) => c.documentId === d.documentId).length,
      })),
      qdrantStatus: upsertRes.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Ingestion pipeline failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
