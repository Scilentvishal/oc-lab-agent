
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

export function validateToolArguments(schema, args) {
    // 1. If no schema or no properties are defined, any arguments are acceptable
    if (!schema || !schema.properties) {
        return { isValid: true };
    }

    // 2. Normalize args to a safe object
    const safeArgs = args && typeof args === "object" ? args : {};

    // 3. Check Required Fields
    const requiredKeys = schema.required || [];
    for (const key of requiredKeys) {
        const val = safeArgs[key];
        // Check if missing, null, undefined, or empty whitespace string
        const isMissing =
            val === undefined ||
            val === null ||
            (typeof val === "string" && val.trim().length === 0);
        if (isMissing) {
            return {
                isValid: false,
                error: `Missing required argument '${key}'.`,
            };
        }
    }

    // 4. Type Validation for provided fields
    for (const [key, val] of Object.entries(safeArgs)) {
        const propSpec = schema.properties[key];
        if (!propSpec || val === undefined || val === null) {
            continue; // Optional field omitted or unknown field
        }
        if (propSpec.type === "string" && typeof val !== "string") {
            return {
                isValid: false,
                error: `Argument '${key}' must be a string, received ${typeof val}.`,
            };
        }
        if (propSpec.type === "number") {
            if (typeof val !== "number" || isNaN(val)) {
                return {
                    isValid: false,
                    error: `Argument '${key}' must be a valid number, received ${typeof val}.`,
                };
            }
        }
        if (propSpec.type === "boolean" && typeof val !== "boolean") {
            return {
                isValid: false,
                error: `Argument '${key}' must be a boolean, received ${typeof val}.`,
            };
        }
    }
    return { isValid: true };

}

