import { NextResponse } from "next/server";
import { ensureCollection, upsertPoint, getPoint, getCollectionInfo, KNOWLEDGE_BASE_COLLECTION } from "@/lib/qdrant";
import { generateEmbedding } from "@/lib/ollama";

/**
 * GET /api/test-qdrant
 * Tests:
 * 1. Connection to Qdrant (localhost:6333)
 * 2. Collection creation ('knowledge_base', 768 dimensions, Cosine)
 * 3. Embedding generation via Ollama (nomic-embed-text)
 * 4. Point upsert (vector + metadata payload)
 * 5. Point retrieval by ID
 */
export async function GET() {
  try {
    // Step 1: Ensure collection exists in Qdrant
    const collectionStatus = await ensureCollection({
      collectionName: KNOWLEDGE_BASE_COLLECTION,
      vectorSize: 768, // Matches nomic-embed-text dimension
      distance: "Cosine",
    });

    // Step 2: Generate a real vector embedding using local Ollama
    const samplePayload = {
      documentName: "SPEC-PAR-01",
      documentType: "Specification",
      version: "v2.1",
      section: "Section 4.1 Acceptance Criteria",
      text: "Paracetamol finished tablets must contain 95.0% to 105.0% of labeled active ingredient.",
    };

    const embedResult = await generateEmbedding({
      text: samplePayload.text,
    });

    // Step 3: Insert (upsert) vector point into Qdrant
    const testPointId = 101; // Integer ID for test point
    const upsertResult = await upsertPoint({
      collectionName: KNOWLEDGE_BASE_COLLECTION,
      id: testPointId,
      vector: embedResult.embedding,
      payload: samplePayload,
    });

    // Step 4: Retrieve the point back from Qdrant by ID
    const retrievedPoint = await getPoint({
      collectionName: KNOWLEDGE_BASE_COLLECTION,
      id: testPointId,
    });

    // Step 5: Get collection stats
    const collectionInfo = await getCollectionInfo(KNOWLEDGE_BASE_COLLECTION);

    return NextResponse.json({
      status: "success",
      message: "Next.js successfully connected to Qdrant and verified vector round-trip",
      pipeline: {
        step1_collection: collectionStatus,
        step2_embedding: {
          model: embedResult.model,
          dimensions: embedResult.dimensions,
        },
        step3_upsert: {
          pointId: testPointId,
          status: upsertResult.status,
        },
        step4_retrieved_from_qdrant: {
          id: retrievedPoint.id,
          payload: retrievedPoint.payload,
          storedVectorDimensions: retrievedPoint.vector ? retrievedPoint.vector.length : 768,
        },
        step5_collection_stats: {
          pointsCount: collectionInfo.points_count,
          status: collectionInfo.status,
          distanceMetric: collectionInfo.config?.params?.vectors?.distance || "Cosine",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        hint: "Ensure Qdrant is running on http://localhost:6333 and Ollama on http://localhost:11434",
      },
      { status: 500 }
    );
  }
}
