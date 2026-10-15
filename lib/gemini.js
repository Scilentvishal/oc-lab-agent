/**
 * lib/gemini.js
 * Centralized, production-ready Google Gemini client.
 *
 * Provides reusable functions for:
 * 1. generateGeminiText()      -> Free-form text generation
 * 2. generateGeminiJSON()      -> Grammar-constrained Level 3 JSON generation
 * 3. generateGeminiEmbedding() -> Vector embeddings with Matryoshka dimensionality
 *
 * All configuration (model names, dimensions, API keys) is read dynamically from environment variables.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DEFAULT_LLM_MODEL = process.env.GEMINI_LLM_MODEL || "gemini-1.5-flash";
const DEFAULT_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const DEFAULT_EMBED_DIMENSIONS = parseInt(process.env.GEMINI_EMBED_DIMENSIONS || "768", 10);

function checkApiKey() {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing in environment variables. Please get a free API key at https://aistudio.google.com/app/apikey and add it to .env.local / Vercel."
    );
  }
}

/**
 * Generate a text response using Google Gemini.
 *
 * @param {object} params
 * @param {string} params.prompt - Main user prompt / instruction.
 * @param {string} [params.system] - System guidelines or domain guardrails.
 * @param {string} [params.model] - Override model name (default: gemini-1.5-flash).
 * @param {number} [params.temperature=0.1] - Sampling temperature (low = deterministic).
 * @returns {Promise<{response: string, model: string, durationMs: number}>}
 */
export async function generateGeminiText({
  prompt,
  system = "",
  model = DEFAULT_LLM_MODEL,
  temperature = 0.1,
}) {
  checkApiKey();
  const startTime = Date.now();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const contents = [];
  if (system) {
    contents.push({ role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS:\n${system}` }] });
    contents.push({ role: "model", parts: [{ text: "Understood. I will strictly follow these regulatory guidelines." }] });
  }
  contents.push({ role: "user", parts: [{ text: prompt }] });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini generateText error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return {
    response: candidateText,
    model,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Generate a guaranteed structured JSON response using Google Gemini.
 * Uses native responseMimeType: "application/json" and optional Level 3 JSON Schema.
 *
 * @param {object} params
 * @param {string} params.prompt - Main instruction prompt.
 * @param {string} [params.system] - System constraints.
 * @param {string} [params.model] - Override model name.
 * @param {object} [params.schema] - Optional JSON Schema object for strict field enforcement.
 * @param {number} [params.temperature=0.1] - Sampling temperature.
 * @returns {Promise<{data: object, model: string, durationMs: number}>}
 */
export async function generateGeminiJSON({
  prompt,
  system = "",
  model = DEFAULT_LLM_MODEL,
  schema = null,
  temperature = 0.1,
}) {
  checkApiKey();
  const startTime = Date.now();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const contents = [];
  if (system) {
    contents.push({ role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS:\n${system}` }] });
    contents.push({ role: "model", parts: [{ text: "Understood. I will output strictly valid JSON conforming to the requested schema." }] });
  }
  contents.push({
    role: "user",
    parts: [{ text: `${prompt}\n\nCRITICAL: Return ONLY a valid JSON object matching the schema. No markdown fences, no explanatory text outside the JSON.` }],
  });

  const bodyPayload = {
    contents,
    generationConfig: {
      responseMimeType: "application/json",
      temperature,
    },
  };

  if (schema) {
    bodyPayload.generationConfig.responseSchema = schema;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini generateJSON error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawText = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
  const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleanedText);
    return {
      data: parsed,
      model,
      durationMs: Date.now() - startTime,
    };
  } catch (parseError) {
    throw new Error(`Failed to parse Gemini response into JSON: ${parseError.message}. Raw output: ${cleanedText.substring(0, 250)}`);
  }
}

/**
 * Generate numerical vector embeddings using Google Gemini.
 * Uses Matryoshka Representation Learning (outputDimensionality) to match your vector store schema.
 *
 * @param {object} params
 * @param {string} params.text - The text to vectorize.
 * @param {string} [params.model] - Override embedding model (default: gemini-embedding-001).
 * @param {number} [params.dimensions] - Override output dimensions (default: 768).
 * @returns {Promise<{embedding: number[], dimensions: number, model: string}>}
 */
export async function generateGeminiEmbedding({
  text,
  model = DEFAULT_EMBED_MODEL,
  dimensions = DEFAULT_EMBED_DIMENSIONS,
}) {
  checkApiKey();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: {
        parts: [{ text }],
      },
      outputDimensionality: dimensions,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini generateEmbedding error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const embedding = data.embedding?.values || [];

  return {
    embedding,
    dimensions: embedding.length,
    model,
  };
}
