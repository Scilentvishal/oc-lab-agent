export function formatExecutionHistory({ executionTrace = [], recentStepsCount = 3 }) {
    if (!executionTrace || executionTrace.length === 0) {
        return "No actions taken yet. This is the initial step.";
    }
    const totalSteps = executionTrace.length;
    const cutoffIndex = Math.max(0, totalSteps - recentStepsCount);
    const olderSteps = executionTrace.slice(0, cutoffIndex);
    const recentSteps = executionTrace.slice(cutoffIndex);
    const lines = [];
    if (olderSteps.length > 0) {
        lines.push("EARLIER MILESTONES (COMPACTED):");
        olderSteps.forEach((s) => {
            const stepNum = s.step || "?";
            const act = s.action || "unknown";
            const summary = s.observationSummary ? s.observationSummary.slice(0, 80) : "completed";
            lines.push(`- Step ${stepNum} [${act}]: ${summary}`);
        });
        lines.push("");
    }
    lines.push("RECENT ACTIONS (DETAILED):");
    recentSteps.forEach((s) => {
        lines.push(`Step ${s.step}:`);
        lines.push(`  Thought: ${s.thought || "N/A"}`);
        lines.push(`  Action: ${s.action || "N/A"}`);
        lines.push(`  Observation: ${s.observationSummary || "N/A"}`);
    });
    return lines.join("\n").trim();
}