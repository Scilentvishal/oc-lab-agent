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
 * Generate a guaranteed structured JSON response from the local LLM.
 *
 * Level 2 (default): Pass format: "json" — guarantees valid JSON, any shape.
 * Level 3 (with schema): Pass a JSON Schema object — guarantees exact shape,
 *   required fields, and enum values via Ollama's grammar-constrained decoding.
 *
 * @param {object} params
 * @param {string} params.prompt - Instruction prompt with JSON schema definition.
 * @param {string} [params.system] - System prompt with strict constraints.
 * @param {string} [params.model] - Model name.
 * @param {object} [params.schema] - Optional JSON Schema object for Level 3 enforcement.
 *   When provided, Ollama constrains token sampling to ONLY produce output matching
 *   this schema (field names, types, enums, required fields all enforced at decode time).
 * @returns {Promise<object>} - Parsed JavaScript JSON object.
 */
export async function generateJSON({ prompt, system = "", model = DEFAULT_LLM_MODEL, schema = null }) {
  const payload = {
    model,
    prompt,
    system,
    stream: false,
    // Level 3: full JSON Schema object → exact shape enforced by grammar sampler
    // Level 2: "json" string → valid JSON guaranteed but any shape allowed
    format: schema ?? "json",
    options: {
      temperature: 0.1, // Near-zero temperature for deterministic schema compliance
    },
  };

  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama JSON generation error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const rawText = data.response.trim();

  // Defensive parsing: Strip any markdown code fences if the model emitted them
  const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleanedText);
    return {
      data: parsed,
      model: data.model,
      totalDurationMs: Math.round(data.total_duration / 1e6),
    };
  } catch (parseError) {
    throw new Error(`Failed to parse LLM response into JSON: ${parseError.message}. Raw output: ${rawText.substring(0, 200)}...`);
  }
}

/**
 * Generate a numerical vector embedding for a piece of text.
 * Supports both:
 * 1. Hugging Face Serverless Inference API (Cloud, 100% Free)
 * 2. Ollama local instance (Local nomic-embed-text)
 *
 * Configured via process.env.EMBEDDING_PROVIDER ("huggingface" | "ollama").
 *
 * @param {object} params
 * @param {string} params.text - The input text (e.g. document chunk or search query).
 * @param {string} [params.model] - Optional override model name.
 * @returns {Promise<{embedding: number[], dimensions: number, model: string}>}
 */
export async function generateEmbedding({ text, model }) {
  const provider = (process.env.EMBEDDING_PROVIDER || "huggingface").toLowerCase();

  // ROUTE 1: Hugging Face Serverless Inference API (Cloud Free Tier)
  if (provider === "huggingface") {
    const hfToken = process.env.HF_ACCESS_TOKEN;
    const hfModel = model || process.env.HF_EMBEDDING_MODEL || "BAAI/bge-small-en-v1.5";

    if (!hfToken) {
      throw new Error(
        "HF_ACCESS_TOKEN is missing in environment variables. Please add your free token to .env.local (https://huggingface.co/settings/tokens)."
      );
    }

    let res;
    try {
      res = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${hfModel}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      });
    } catch (networkError) {
      throw new Error(`Failed to reach Hugging Face API: ${networkError.message}. Details: ${networkError.cause || "Network error"}`);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Hugging Face Serverless Inference error (${res.status}): ${errText}`);
    }

    const data = await res.json();

    // HF feature-extraction returns float array e.g. [0.012, -0.043, ...]
    const embedding = Array.isArray(data[0]) ? data[0] : data;

    return {
      embedding,
      dimensions: embedding.length,
      model: hfModel,
      provider: "huggingface",
    };
  }

  // ROUTE 2: Local Ollama (nomic-embed-text)
  const embedModel = model || DEFAULT_EMBED_MODEL;
  const payload = {
    model: embedModel,
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
    model: embedModel,
    provider: "ollama",
  };
}
