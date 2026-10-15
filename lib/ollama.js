/**
 * lib/ollama.js (Compatibility layer)
 * Re-exports the unified Google Gemini client functions from lib/gemini.js.
 */

import {
  generateGeminiText,
  generateGeminiJSON,
  generateGeminiEmbedding,
} from "./gemini";

export async function generateText({ prompt, system = "", model }) {
  const result = await generateGeminiText({ prompt, system, model });
  return {
    response: result.response,
    model: result.model,
    totalDurationMs: result.durationMs,
  };
}

export async function generateJSON({ prompt, system = "", model, schema = null }) {
  const result = await generateGeminiJSON({ prompt, system, model, schema });
  return {
    data: result.data,
    model: result.model,
    totalDurationMs: result.durationMs,
  };
}

export async function generateEmbedding({ text, model, dimensions }) {
  return await generateGeminiEmbedding({ text, model, dimensions });
}
