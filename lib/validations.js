
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


export async function withTimeout(
    asyncOperation,
    timeoutMs = 7000,
    timeoutMessage = `Operation timed out after ${timeoutMs}ms.`
) {
    let timerId = null;

    const targetPromise =
        typeof asyncOperation === "function" ? asyncOperation() : asyncOperation;

    // 2. Create the timeout rejection promise
    const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => {
            reject(new Error(timeoutMessage));
        }, timeoutMs);
        // Unref timer so it doesn't hold open the Node.js event loop
        if (timerId && typeof timerId.unref === "function") {
            timerId.unref();
        }
    });
    // 3. Race the target operation against the timer
    try {
        return await Promise.race([targetPromise, timeoutPromise]);
    } finally {
        // 4. Always clear the timer so background timers don't leak memory
        if (timerId) {
            clearTimeout(timerId);
        }
    }
}

export function isDuplicateAction(
    executionTrace = [],
    proposedAction,
    proposedArgs = {},
    threshold = 2
) {
    if (!Array.isArray(executionTrace) || executionTrace.length < threshold) {
        return false;
    }
    if (proposedAction === "finishAnalysis") {
        return false; // Finalizing is always permitted
    }
    // 2. Slice the last `threshold` items from the execution trace
    const recentSteps = executionTrace.slice(-threshold);
    // Normalize proposed arguments to a JSON string for deterministic comparison
    const targetArgsStr = JSON.stringify(proposedArgs || {});
    // 3. Consecutive Check: Did every step in the recent window match the proposed action and args?
    const isLooping = recentSteps.every((step) => {
        const isSameAction = step.action === proposedAction;
        const isSameArgs = JSON.stringify(step.arguments || {}) === targetArgsStr;
        return isSameAction && isSameArgs;
    });
    return isLooping;
}

// **
//  * Reconciles the LLM's proposed batch disposition against authoritative deterministic findings.
//     * Enforces cGMP compliance: An LLM can never mark a batch COMPLIANT if deterministic defects exist.
//  *
//  * @param { object } params
//     * @param { string } params.proposedDisposition - "COMPLIANT" or "REVIEW_REQUIRED".
//  * @param { object } [params.scratchpad = {}] - The agent's working memory (validationResults, calculationChecks).
//     * @returns { { finalDisposition: string, wasOverridden: boolean, overrideReason ?: string } }
//  */

export function reconcileDisposition({ proposedDisposition, scratchpad = {} }) {
    const hasValidationRun = !!scratchpad.validationResults;
    const findingsCount = scratchpad.validationResults?.findingsCount || 0;
    const hasCalcErrors = scratchpad.calculationChecks?.hasCalculationErrors || false;
    // Rule 1: Cannot declare COMPLIANT if specification validation was never executed
    if (!hasValidationRun) {
        return {
            finalDisposition: "REVIEW_REQUIRED",
            wasOverridden: proposedDisposition === "COMPLIANT",
            overrideReason:
                "Deterministic check: Batch release testing was never completed. 'checkBatch' was not executed.",
        };
    }
    // Rule 2: Cannot declare COMPLIANT if active findings or calculation errors exist
    if (findingsCount > 0 || hasCalcErrors) {
        if (proposedDisposition === "COMPLIANT") {
            return {
                finalDisposition: "REVIEW_REQUIRED",
                wasOverridden: true,
                overrideReason: `Authoritative override: Batch contains ${findingsCount} finding(s) and calculation discrepancy flags. Cannot be released as COMPLIANT.`,
            };
        }
        return {
            finalDisposition: "REVIEW_REQUIRED",
            wasOverridden: false,
        };
    }
    // Rule 3: Fully verified and zero findings
    return {
        finalDisposition: "COMPLIANT",
        wasOverridden: false,
    };
}

export function validateIngestionDocuments(documents) {
    // 1. Guard against non-array or empty array inputs
    if (!Array.isArray(documents) || documents.length === 0) {
        return {
            isValid: false,
            validDocuments: [],
            errors: ["No documents provided for ingestion. Expected a non-empty array."],
        };
    }
    const validDocuments = [];
    const errors = [];
    // 2. Validate each document in the upload payload
    documents.forEach((doc, idx) => {
        // Check if doc is a non-null object
        if (!doc || typeof doc !== "object") {
            errors.push(`Document at index ${idx} is not a valid object.`);
            return;
        }
        const hasValidId =
            typeof doc.documentId === "string" && doc.documentId.trim().length > 0;
        const hasValidTitle =
            typeof doc.title === "string" && doc.title.trim().length > 0;
        const hasValidContent =
            typeof doc.content === "string" && doc.content.trim().length >= 20;
        if (!hasValidId) {
            errors.push(`Document at index ${idx} is missing a valid 'documentId'.`);
        } else if (!hasValidTitle) {
            errors.push(`Document '${doc.documentId}' (index ${idx}) is missing a valid 'title'.`);
        } else if (!hasValidContent) {
            errors.push(
                `Document '${doc.documentId}' (index ${idx}) has insufficient content. Must be at least 20 characters.`
            );
        } else {
            // 3. Clean and normalize valid document
            validDocuments.push({
                documentId: doc.documentId.trim(),
                title: doc.title.trim(),
                documentType: doc.documentType ? doc.documentType.trim() : "Standard Operating Procedure",
                version: doc.version ? doc.version.trim() : "v1.0",
                effectiveDate: doc.effectiveDate || new Date().toISOString().split("T")[0],
                department: doc.department || "Quality Control",
                content: doc.content.trim(),
            });
        }
    });
    return {
        isValid: validDocuments.length > 0,
        validDocuments,
        errors,
    };
}

export function buildQdrantFilter({ documentType, documentId } = {}) {
    const must = [];
    if (typeof documentType === "string" && documentType.trim().length > 0) {
        must.push({
            key: "documentType",
            match: { value: documentType.trim() },
        });
    }
    if (typeof documentId === "string" && documentId.trim().length > 0) {
        must.push({
            key: "documentId",
            match: { value: documentId.trim() },
        });
    }
    return must.length > 0 ? { must } : null;
}