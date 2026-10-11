import { NextResponse } from "next/server";
import { runQCAgent } from "@/lib/agent";

/**
 * POST /api/qc/agent
 * Body: { batchId: "B-2026-001", userGoal?: string }
 *
 * Runs the Autonomous Pharmaceutical QC Agent ReAct loop:
 * Reason -> Select Tool -> Execute Tool -> Observe Output -> Decide Next Action -> Finalize Audit Report
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { batchId = "B-2026-001", userGoal } = body || {};

    const agentResult = await runQCAgent({
      batchId,
      userGoal,
      maxSteps: 5,
    });

    return NextResponse.json({
      status: "success",
      agentType: "Autonomous ReAct Pharma QC Intelligence Agent",
      ...agentResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        suggestion: "Ensure Ollama and Qdrant are active locally.",
      },
      { status: 500 }
    );
  }
}
