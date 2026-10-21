/**
 * lib/agent.js
 * Autonomous Pharmaceutical Quality Control (QC) Intelligence Agent.
 *
 * Implements a goal-driven ReAct (Reason + Act + Observe) autonomous loop.
 *
 * Given a high-level instruction (e.g. "Analyze Batch B-2026-001"), the agent:
 * 1. Reasons about what information is missing.
 * 2. Selects and executes appropriate tools dynamically.
 * 3. Observes tool outputs.
 * 4. Selectively retrieves SOPs only if discrepancies are discovered.
 * 5. Synthesizes a traceable, compliant final audit report.
 */

import { executeTool, toolDefinitions } from "./tools";
import { generateJSON } from "./ollama";
import { isDuplicateAction, reconcileDisposition, validateStepDecision, verifySourceAttribution } from "./validations";
import { formatExecutionHistory } from "./formating";

const AGENT_SYSTEM_PROMPT = `
You are an autonomous Pharmaceutical Quality Control (QC) Intelligence Agent operating under cGMP guidelines (FDA 21 CFR Part 211 / EU GMP Annex).

YOUR ROLE:
Autonomously investigate and analyze pharmaceutical batch records for commercial release readiness.

AVAILABLE TOOLS:
1. "getBatch": { batchId } -> Retrieves recorded test readings, batch lot metadata, and analyst logs.
2. "getSpecification": { productId, testKey? } -> Retrieves registered acceptance criteria.
3. "checkBatch": { batchId } -> Runs deterministic rule evaluation to detect Potential OOS and missing tests.
4. "validateCalculation": { batchId } -> Recalculates raw instrument peak areas and mass balances for math errors.
5. "searchDocuments": { query, limit? } -> Searches Qdrant for SOPs and test methods.
6. "finishAnalysis": { summary, dispositionRecommendation, findings, immediateActions, governingDocuments } -> Concludes investigation.

AGENT BEHAVIOR GUIDELINES:
- Do NOT execute tools blindly. If a batch is fully compliant, do NOT search for OOS SOPs.
- If checkBatch or validateCalculation reveals an Out-of-Specification (OOS) result or calculation error, YOU MUST search for the applicable SOP (e.g. SOP-QC-042).
- When all required evidence is gathered, invoke "finishAnalysis" with a comprehensive report.
- Never state "Batch Rejected"; recommend "REVIEW_REQUIRED" if deviations exist, or "COMPLIANT" if none exist.
`.trim();

/**
 * Run the Autonomous QC Agent on a target batch.
 *
 * @param {object} params
 * @param {string} params.batchId - Target batch ID (e.g. "B-2026-001").
 * @param {string} [params.userGoal] - Optional custom instruction.
 * @param {number} [params.maxSteps=5] - Safety ceiling to prevent infinite looping.
 * @returns {Promise<object>} - Complete agent trajectory, execution trace, and final report.
 */
export async function runQCAgent({
  batchId = "B-2026-001",
  userGoal = `Perform a comprehensive QC release analysis on batch ${batchId}. Identify any Potential OOS, missing tests, or calculation errors, and provide required SOP remediation steps.`,
  maxSteps = 5,
}) {
  const startTime = Date.now();
  const executionTrace = [];
  let currentStep = 0;
  let isFinished = false;
  let finalReport = null;

  // Working memory scratchpad accumulated across iterations
  const agentScratchpad = {
    batchId,
    batchData: null,
    validationResults: null,
    calculationChecks: null,
    retrievedDocumentation: [],
  };

  while (!isFinished && currentStep < maxSteps) {
    currentStep++;

    // Format the agent's current state and execution history
    const formattedHistory = formatExecutionHistory({
      executionTrace,
      recentStepsCount: 3,
    });

    const agentPrompt = `
GOAL:
${userGoal}

TARGET BATCH: ${batchId}

EXECUTION HISTORY SO FAR:
${formattedHistory}

CURRENT KNOWLEDGE BASE STATE:
- Batch Retrieved: ${agentScratchpad.batchData ? "YES (" + agentScratchpad.batchData.productName + ")" : "NO"}
- Deterministic QC Validation Performed: ${agentScratchpad.validationResults ? "YES (" + agentScratchpad.validationResults.overallStatus + ")" : "NO"}
- Calculation Checks Performed: ${agentScratchpad.calculationChecks ? "YES" : "NO"}
- Relevant SOP Documents Retrieved: ${agentScratchpad.retrievedDocumentation.length} documents

TASK FOR STEP ${currentStep}:
Decide the single next logical action. If you have gathered all necessary information, invoke "finishAnalysis".
Output a JSON object conforming EXACTLY to this schema:

{
  "thought": "Clear reasoning of what has been discovered so far and what needs to be done next",
  "action": "toolName (getBatch | getSpecification | checkBatch | validateCalculation | searchDocuments | finishAnalysis)",
  "arguments": {
    "argName": "value"
  }
}
`.trim();

    // Level 3 JSON Schema: action is constrained to exactly these 6 tool names
    const reactStepSchema = {
      type: "object",
      properties: {
        thought: { type: "string" },
        action: {
          type: "string",
          enum: ["getBatch", "getSpecification", "checkBatch", "validateCalculation", "searchDocuments", "finishAnalysis"],
        },
        arguments: { type: "object" },
      },
      required: ["thought", "action", "arguments"],
    };

    // 1. REASON: LLM decides next action based on accumulated history (Level 3 schema-enforced)
    let stepDecision = null;
    let modelUsed = "unknown";

    try {
      const { data, model } = await generateJSON({
        prompt: agentPrompt,
        system: AGENT_SYSTEM_PROMPT,
        schema: reactStepSchema,
      });
      stepDecision = data;
      modelUsed = model;
    } catch (err) {
      executionTrace.push({
        step: currentStep,
        thought: "Model generation failed. Terminating agent loop to preserve audit integrity.",
        action: "error",
        arguments: {},
        observation: { error: err.message },
        observationSummary: `Model error: ${err.message}`,
        modelUsed: "none",
      });
      break;
    }
    // 2. CONTROL GATE: Validate and auto-repair using your new function
    const validation = validateStepDecision({
      stepDecision,
      currentBatchId: batchId,
      allowedTools: [
        "getBatch",
        "getSpecification",
        "checkBatch",
        "validateCalculation",
        "searchDocuments",
        "finishAnalysis",
      ],
    });
    // If the model returned gibberish or an unauthorized tool, reject it
    if (!validation.isValid) {
      executionTrace.push({
        step: currentStep,
        thought: stepDecision?.thought || "Invalid step decision emitted by model",
        action: stepDecision?.action || "unknown",
        arguments: stepDecision?.arguments || {},
        observation: { validationError: validation.error },
        observationSummary: `Control Gate rejected action: ${validation.error}`,
        modelUsed: modelUsed,
      });
      break;
    }
    // Extract the clean, auto-repaired decision
    const { thought, action, arguments: actionArgs } = validation.sanitizedDecision;

    if (isDuplicateAction(executionTrace, action, actionArgs, 2)) {
      executionTrace.push({
        step: currentStep,
        thought,
        action,
        arguments: actionArgs,
        observation: {
          warning: `Repetitive loop detected: Tool '${action}' was already executed twice with identical arguments. Do not re-run this tool. Proceed to validate specifications with 'checkBatch', verify calculations, or conclude the audit with 'finishAnalysis'.`,
        },
        observationSummary: `Loop Guard intercepted duplicate '${action}' call.`,
        modelUsed: modelUsed,
      });
      continue; // Skip redundant execution and give the LLM a chance to self-correct
    }
    // 2. ACT & OBSERVE
    if (action === "finishAnalysis") {
      isFinished = true;
      // Deterministic Reconciliation Gate: Enforce mathematical authority over LLM
      const reconciliation = reconcileDisposition({
        proposedDisposition: actionArgs.dispositionRecommendation,
        scratchpad: agentScratchpad,
      });
      if (reconciliation.wasOverridden) {
        actionArgs.dispositionRecommendation = reconciliation.finalDisposition;
        actionArgs.complianceOverrideNotice = reconciliation.overrideReason;
      }
      // Evidence Grounding Gate: Verify citations against retrieved chunks
      const attribution = verifySourceAttribution({
        reportDetails: actionArgs,
        retrievedDocs: agentScratchpad.retrievedDocumentation,
      });
      finalReport = {
        conclusion: thought,
        details: actionArgs,
        reconciliation,
        evidenceGrounding: attribution,
        completedAtStep: currentStep,
      };
      executionTrace.push({
        step: currentStep,
        thought,
        action: "finishAnalysis",
        arguments: actionArgs,
        observation: attribution.warning
          ? `Analysis finalized with citation warning: ${attribution.warning}`
          : "Analysis finalized with 100% verified source attribution.",
        observationSummary: "Finalized audit report.",
      });
      break;
    }

    // Execute selected tool
    let toolResult;
    try {
      toolResult = await executeTool(action, actionArgs);
    } catch (err) {
      toolResult = { error: err.message };
    }

    // Update working scratchpad state
    if (action === "getBatch" && toolResult.batch) {
      agentScratchpad.batchData = toolResult.batch;
    } else if (action === "checkBatch") {
      agentScratchpad.validationResults = toolResult;
    } else if (action === "validateCalculation") {
      agentScratchpad.calculationChecks = toolResult;
    } else if (action === "searchDocuments" && toolResult.results) {
      agentScratchpad.retrievedDocumentation.push(...toolResult.results);
    }

    // Record step in trajectory
    const obsStr = JSON.stringify(toolResult);
    const shortObs = obsStr.length > 250 ? obsStr.substring(0, 250) + "..." : obsStr;

    executionTrace.push({
      step: currentStep,
      thought,
      action,
      arguments: actionArgs,
      observation: toolResult,
      observationSummary: shortObs,
      modelUsed: modelUsed,
    });
  }

  // Safety fallback if loop reached maxSteps without calling finishAnalysis
  if (!isFinished && !finalReport) {
    finalReport = {
      conclusion: "Agent reached maximum execution steps. Synthesizing preliminary findings.",
      details: {
        dispositionRecommendation:
          agentScratchpad.validationResults?.findings?.length > 0
            ? "REVIEW_REQUIRED"
            : "COMPLIANT",
        findings: agentScratchpad.validationResults?.findings || [],
      },
      completedAtStep: currentStep,
    };
  }

  return {
    batchId,
    userGoal,
    totalStepsExecuted: currentStep,
    isFinished,
    executionTrace,
    finalReport,
    gatheredKnowledge: {
      hasBatchData: !!agentScratchpad.batchData,
      overallStatus: agentScratchpad.validationResults?.overallStatus || "Unknown",
      totalFindings: agentScratchpad.validationResults?.findingsCount || 0,
      documentsRetrievedCount: agentScratchpad.retrievedDocumentation.length,
    },
    totalDurationMs: Date.now() - startTime,
  };
}
