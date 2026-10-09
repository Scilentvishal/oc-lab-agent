import { NextResponse } from "next/server";
import { generateText, generateEmbedding } from "@/lib/ollama";

/**
 * GET /api/test-ollama
 * Tests connection between Next.js server-side route handler and local Ollama.
 */
export async function GET() {
  try {
    // 1. Test LLM text generation
    const testPrompt = "In one concise sentence, what is an Out-of-Specification (OOS) result in a pharma QC lab?";
    const llmResult = await generateText({
      prompt: testPrompt,
      system: "You are an expert pharmaceutical Quality Control auditor. Keep answers factual and precise.",
    });

    // 2. Test vector embedding generation
    const sampleText = "Acceptance criteria: Assay of Paracetamol must be 95.0% to 105.0% of labeled claim.";
    const embedResult = await generateEmbedding({
      text: sampleText,
    });

    return NextResponse.json({
      status: "success",
      message: "Next.js successfully connected to local Ollama",
      llm: {
        model: llmResult.model,
        prompt: testPrompt,
        response: llmResult.response,
        durationMs: llmResult.totalDurationMs,
      },
      embeddings: {
        model: embedResult.model,
        inputSample: sampleText,
        vectorDimensions: embedResult.dimensions, // e.g. 768 for nomic-embed-text
        first5VectorValues: embedResult.embedding.slice(0, 5),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        hint: "Make sure Ollama is running locally on http://localhost:11434 and that the models are installed.",
      },
      { status: 500 }
    );
  }
}
