import { NextResponse } from "next/server";
import { askQCQuestion } from "@/lib/rag";

/**
 * POST /api/rag
 * Body: { question: string, topK?: number }
 *
 * Runs the closed-domain Pharma RAG pipeline:
 * Question -> nomic-embed-text -> Qdrant search -> Prompt with excerpts -> Ollama LLM -> Grounded QC Answer
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { question, topK = 3 } = body || {};

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Missing or invalid 'question' in request body.",
          example: {
            question: "What is the dissolution specification for Paracetamol 500mg tablets?",
          },
        },
        { status: 400 }
      );
    }

    const result = await askQCQuestion({ question, topK });
    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        suggestion: "Ensure Ollama and Qdrant are running locally and documents are ingested.",
      },
      { status: 500 }
    );
  }
}
