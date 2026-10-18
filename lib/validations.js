
export function validateStepDecision({
    stepDecision,
    currentBatchId,
    allowedTools = [
        "getBatch",
        "getSpecification",
        "checkBatch",
        "validateCalculation",
        "searchDocuments",
        "finishAnalysis",
    ],
}) {
    if (!stepDecision || typeof stepDecision !== "object") {
        return {
            isValid: false,
            error: "Step decision must be a non-null object",
            sanitizedDecision: null,
        };

    }

    if (typeof stepDecision.thought !== "string" || stepDecision.thought.trim().length === 0) {
        return {
            isValid: false,
            error: "Step decision missing valid 'thought'",
            sanitizedDecision: null,
        };
    }

    if (!allowedTools.includes(stepDecision.action)) {
        return {
            isValid: false,
            error: `Invalid action ${stepDecision.action} Must one of: ${allowedTools.join(", ")}`,
            sanitizedDecision: null
        }
    }
    const batchTargetingTools = ["getBatch", "checkBatch", "validateCalculation"];
    const args = { ...(stepDecision.arguments || {}) };
    if (batchTargetingTools.includes(stepDecision.action)) {
        const hasValidBatchId =
            typeof args.batchId === "string" && args.batchId.trim().length > 0;
        if (!hasValidBatchId) {
            // Auto-repair using the active batch ID
            args.batchId = currentBatchId;
        }
    }

    if (stepDecision.action == "searchDocuments") {
        if (!args.query || typeof args.query !== "string") {
            return {
                isValid: false,
                error: "Tool 'searchDocuments' requires a string 'query' argument",
                sanitizedDecision: null
            }
        }
    }
    if (stepDecision.action === "finishAnalysis") {
        const validDispositions = ["COMPLIANT", "REVIEW_REQUIRED"];
        if (!validDispositions.includes(args.dispositionRecommendation)) {
            // Safe default if the LLM hallucinated a different status
            args.dispositionRecommendation = "REVIEW_REQUIRED";
        }
    }
    return {
        isValid: true,
        sanitizedDecision: {
            thought: stepDecision.thought.trim(),
            action: stepDecision.action,
            arguments: args,
        },
    };
}