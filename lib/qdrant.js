/**
 * lib/qdrant.js
 * Server-side client for local Qdrant vector database (http://localhost:6333).
 * Uses native fetch for transparent, zero-dependency REST communication.
 */

const QDRANT_BASE_URL = process.env.QDRANT_BASE_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || "";
export const KNOWLEDGE_BASE_COLLECTION = process.env.QDRANT_COLLECTION || "knowledge_base";

/**
 * Build request headers including API key if configured (for Qdrant Cloud).
 */
function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (QDRANT_API_KEY) {
    headers["api-key"] = QDRANT_API_KEY;
  }
  return headers;
}

/**
 * Check if a collection exists.
 */
export async function collectionExists(collectionName = KNOWLEDGE_BASE_COLLECTION) {
  const res = await fetch(`${QDRANT_BASE_URL}/collections/${collectionName}`, {
    headers: getHeaders(),
  });
  return res.status === 200;
}

/**
 * Ensure a collection exists in Qdrant; if not, create it.
 *
 * @param {string} collectionName - Name of the collection.
 * @param {number} vectorSize - Dimensions of vectors (768 for nomic-embed-text).
 * @param {string} distance - Distance metric ("Cosine", "Euclid", or "Dot").
 */
export async function ensureCollection({
  collectionName = KNOWLEDGE_BASE_COLLECTION,
  vectorSize = 768,
  distance = "Cosine",
} = {}) {
  const exists = await collectionExists(collectionName);
  if (exists) {
    return { created: false, message: `Collection '${collectionName}' already exists` };
  }

  // Create collection with vector configuration
  const payload = {
    vectors: {
      size: vectorSize,
      distance: distance,
    },
  };

  const res = await fetch(`${QDRANT_BASE_URL}/collections/${collectionName}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create Qdrant collection (${res.status}): ${errorText}`);
  }

  return { created: true, message: `Collection '${collectionName}' created successfully` };
}

/**
 * Upsert (insert or update) a vector point with metadata payload.
 *
 * @param {string} collectionName - Target collection.
 * @param {number|string} id - Unique identifier for the point (number or UUID).
 * @param {number[]} vector - Array of float numbers (e.g. 768 dimensions).
 * @param {object} payload - Metadata stored alongside the vector.
 */
export async function upsertPoint({
  collectionName = KNOWLEDGE_BASE_COLLECTION,
  id,
  vector,
  payload = {},
}) {
  const body = {
    points: [
      {
        id,
        vector,
        payload,
      },
    ],
  };

  const res = await fetch(`${QDRANT_BASE_URL}/collections/${collectionName}/points?wait=true`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to upsert point to Qdrant (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data;
}

/**
 * Retrieve a specific point by its ID.
 *
 * @param {string} collectionName - Collection name.
 * @param {number|string} id - Point ID.
 */
export async function getPoint({ collectionName = KNOWLEDGE_BASE_COLLECTION, id }) {
  const res = await fetch(`${QDRANT_BASE_URL}/collections/${collectionName}/points/${id}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to retrieve point from Qdrant (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.result;
}

/**
 * Get collection status and vector counts.
 */
export async function getCollectionInfo(collectionName = KNOWLEDGE_BASE_COLLECTION) {
  const res = await fetch(`${QDRANT_BASE_URL}/collections/${collectionName}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get collection info (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  return data.result;
}

/**
 * Batch upsert multiple points into Qdrant.
 *
 * @param {string} collectionName - Target collection.
 * @param {Array<{id: number|string, vector: number[], payload: object}>} points - List of points.
 */
export async function upsertPoints({
  collectionName = KNOWLEDGE_BASE_COLLECTION,
  points = [],
}) {
  if (points.length === 0) return { status: "ok", count: 0 };

  const res = await fetch(`${QDRANT_BASE_URL}/collections/${collectionName}/points?wait=true`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ points }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to batch upsert points to Qdrant (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Search Qdrant collection for nearest vectors using Cosine similarity.
 *
 * @param {string} collectionName - Target collection.
 * @param {number[]} vector - Query vector embedding.
 * @param {number} limit - Maximum number of nearest neighbors to return.
 * @param {number} [scoreThreshold] - Optional minimum similarity score (0.0 to 1.0).
 * @param {object} [filter] - Optional Qdrant payload filter.
 */
export async function searchPoints({
  collectionName = KNOWLEDGE_BASE_COLLECTION,
  vector,
  limit = 4,
  scoreThreshold = 0.0,
  filter = null,
}) {
  // AUTO-HEALING: Check if collection exists before querying. If not, auto-create it!
  const isHF = (process.env.EMBEDDING_PROVIDER || "huggingface").toLowerCase() === "huggingface";
  const vectorDimensions = isHF
    ? parseInt(process.env.HF_EMBEDDING_DIMENSIONS || "384", 10)
    : 384;

  const exists = await collectionExists(collectionName);
  if (!exists) {
    await ensureCollection({
      collectionName,
      vectorSize: vectorDimensions,
      distance: "Cosine",
    });
  }

  const body = {
    vector,
    limit,
    with_payload: true,
    with_vector: false, // Don't return raw floats to save bandwidth
  };

  if (scoreThreshold > 0) {
    body.score_threshold = scoreThreshold;
  }

  if (filter) {
    body.filter = filter;
  }

  const res = await fetch(`${QDRANT_BASE_URL}/collections/${collectionName}/points/search`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to search Qdrant collection (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.result || [];
}
