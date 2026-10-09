/**
 * lib/ollama.js
 * Server-side client for local Ollama instance (http://localhost:11434).
 * Handles text generation (LLM) and vector embeddings without third-party frameworks.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "qwen3:8b";
const DEFAULT_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

/**
 * Generate a text response from the local LLM.
 *
 * @param {string} prompt - The user prompt or instruction.
 * @param {string} [system] - Optional system prompt (e.g., Pharma QC rules).
 * @param {string} [model] - Model name (defaults to qwen3:8b).
 * @returns {Promise<string>} - The generated text response.
 */
export async function generateText({ prompt, system = "", model = DEFAULT_LLM_MODEL }) {
  const payload = {
    model,
    prompt,
    system,
    stream: false, // Return complete response at once for easy backend handling
    options: {
      temperature: 0.1, // Low temperature for deterministic, factual QC analysis
    },
  };

  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama generation error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    response: data.response,
    model: data.model,
    totalDurationMs: Math.round(data.total_duration / 1e6),
  };
}

/**
 * Generate a numerical vector embedding for a piece of text.
 *
 * @param {string} text - The input text (e.g. document chunk or search query).
 * @param {string} [model] - Embedding model (defaults to nomic-embed-text).
 * @returns {Promise<number[]>} - Float vector array (e.g. 768 dimensions).
 */
export async function generateEmbedding({ text, model = DEFAULT_EMBED_MODEL }) {
  const payload = {
    model,
    prompt: text,
  };

  const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama embedding error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    embedding: data.embedding,
    dimensions: data.embedding.length,
    model,
  };
}
