import { NextResponse } from "next/server";
import { toolDefinitions, decideAndExecuteTool, executeTool } from "@/lib/tools";

/**
 * GET /api/qc/tools
 * Lists all registered tools and their JSON schemas.
 */
export async function GET() {
  return NextResponse.json({
    status: "success",
    toolsCount: toolDefinitions.length,
    tools: toolDefinitions.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
  });
}

/**
 * POST /api/qc/tools
 * Body: { instruction: "Check if batch B-2026-001 has any out of specification results" }
 *
 * Flow:
 * User Instruction -> LLM Tool Selection -> JavaScript Tool Execution -> Tool Result Returned
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { instruction, directTool, arguments: directArgs } = body || {};

    // Allow direct manual execution if requested for debugging
    if (directTool) {
      const result = await executeTool(directTool, directArgs || {});
      return NextResponse.json({
        status: "success",
        mode: "direct_execution",
        tool: directTool,
        result,
      });
    }

    if (!instruction || typeof instruction !== "string") {
      return NextResponse.json(
        {
          error: "Missing required 'instruction' field in request body.",
          example: {
            instruction: "What are the analytical test results for batch B-2026-001?",
          },
        },
        { status: 400 }
      );
    }

    // LLM-Driven Autonomous Tool Selection & Execution
    const response = await decideAndExecuteTool({ userInstruction: instruction });

    return NextResponse.json({
      status: "success",
      mode: "llm_autonomous_dispatch",
      ...response,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        suggestion: "Ensure Ollama is running and local models are pulled.",
      },
      { status: 500 }
    );
  }
}
