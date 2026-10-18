/**
 * lib/tools.js
 * Pharmaceutical Quality Control Tool Registry & Function Calling Engine.
 *
 * Exposes core deterministic business logic and vector retrieval functions
 * as callable tools for LLM decision-making.
 *
 * The 5 Core Pharma QC Tools:
 * 1. getBatch             -> Retrieve analytical test results and metadata for a batch
 * 2. getSpecification     -> Retrieve registered acceptance criteria for a product
 * 3. checkBatch           -> Run deterministic QC rule validation (detects OOS & missing tests)
 * 4. searchDocuments      -> Semantic vector search for SOPs & test methods in Qdrant
 * 5. validateCalculation  -> Verify raw HPLC peak areas and mass balances for math errors
 */

import { getBatchById } from "./batches";
import { getSpecificationsByProduct, getSpecification } from "./specifications";
import { validateBatch } from "./qc-engine";
import { validateBatchCalculations } from "./calculations";
import { searchPoints, KNOWLEDGE_BASE_COLLECTION } from "./qdrant";
import { generateEmbedding, generateJSON } from "./ollama";
import { validateToolArguments } from "./validations";
/**
 * 1. Tool Schemas (Contracts presented to the LLM)
 */
export const toolDefinitions = [
  {
    name: "getBatch",
    description: "Retrieve laboratory test readings, manufacturing dates, and analyst logs for a specific batch ID.",
    parameters: {
      type: "object",
      properties: {
        batchId: {
          type: "string",
          description: "Unique batch identifier (e.g. 'B-2026-001', 'B-2026-002', 'B-2026-004')",
        },
      },
      required: ["batchId"],
    },
    handler: async ({ batchId }) => {
      const batch = getBatchById(batchId);
      if (!batch) return { error: `Batch '${batchId}' not found in laboratory records` };
      return { batch };
    },
  },
  {
    name: "getSpecification",
    description: "Retrieve registered acceptance criteria, tolerance ranges, and pharmacopeial limits for a product.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product identifier (e.g. 'PROD-PAR-500' for Paracetamol, 'PROD-AMX-250' for Amoxicillin)",
        },
        testKey: {
          type: "string",
          description: "Optional specific test name (e.g. 'assay', 'dissolution', 'appearance')",
        },
      },
      required: ["productId"],
    },
    handler: async ({ productId, testKey }) => {
      if (testKey) {
        const spec = getSpecification(productId, testKey);
        return { specification: spec || `No specification found for test '${testKey}'` };
      }
      const specs = getSpecificationsByProduct(productId);
      return { specificationsCount: specs.length, specifications: specs };
    },
  },
  {
    name: "checkBatch",
    description: "Run deterministic QC validation comparing recorded test readings against approved product specifications to detect Potential OOS and missing tests.",
    parameters: {
      type: "object",
      properties: {
        batchId: {
          type: "string",
          description: "Batch ID to validate (e.g. 'B-2026-001')",
        },
      },
      required: ["batchId"],
    },
    handler: async ({ batchId }) => {
      const batch = getBatchById(batchId);
      if (!batch) return { error: `Batch '${batchId}' not found` };
      const specs = getSpecificationsByProduct(batch.productId);
      const report = validateBatch(batch, specs);
      return {
        batchId: report.batchId,
        overallStatus: report.overallStatus,
        findingsCount: report.totalFindingsCount,
        findings: report.findings,
      };
    },
  },
  {
    name: "searchDocuments",
    description: "Perform semantic vector search in Qdrant for Standard Operating Procedures (SOPs), test methods, and regulatory guidelines.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search inquiry (e.g. 'Phase I laboratory investigation procedure for OOS assay')",
        },
        limit: {
          type: "number",
          description: "Number of relevant chunks to retrieve (default: 3)",
        },
      },
      required: ["query"],
    },
    handler: async ({ query, limit = 3 }) => {
      const { embedding } = await generateEmbedding({ text: query });
      const matches = await searchPoints({
        collectionName: KNOWLEDGE_BASE_COLLECTION,
        vector: embedding,
        limit,
        scoreThreshold: 0.5,
      });

      return {
        query,
        resultsCount: matches.length,
        results: matches.map((m) => ({
          documentId: m.payload.documentId,
          title: m.payload.documentTitle,
          version: m.payload.version,
          sectionTitle: m.payload.sectionTitle,
          similarityScore: Math.round(m.score * 1000) / 1000,
          excerpt: m.payload.text,
        })),
      };
    },
  },
  {
    name: "validateCalculation",
    description: "Independently recalculate analytical values from raw balance readings or HPLC peak areas to detect transcription or arithmetic errors.",
    parameters: {
      type: "object",
      properties: {
        batchId: {
          type: "string",
          description: "Batch ID containing raw instrument logs (e.g. 'B-2026-004')",
        },
      },
      required: ["batchId"],
    },
    handler: async ({ batchId }) => {
      const batch = getBatchById(batchId);
      if (!batch) return { error: `Batch '${batchId}' not found` };
      const calcFindings = validateBatchCalculations(batch);
      return {
        batchId,
        hasCalculationErrors: calcFindings.length > 0,
        discrepancies: calcFindings,
      };
    },
  },
];

/**
 * Execute a specific tool by name with arguments.
 *
 * @param {string} toolName
 * @param {object} args
 * @returns {Promise<object>}
 */
export async function executeTool(toolName, args = {}) {
  const tool = toolDefinitions.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found in registry. Available tools: ${toolDefinitions.map((t) => t.name).join(", ")}`);
  }
  // 2. Schema Validation Gate
  const validation = validateToolArguments(tool.parameters, args);
  if (!validation.isValid) {
    return {
      success: false,
      tool: toolName,
      error: `Validation failed for tool '${toolName}': ${validation.error}`,
    };
  }

  // 3. Safe Execution with Error Capture
  try {
    const result = await tool.handler(args);
    return {
      success: true,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      tool: toolName,
      error: `Tool execution error: ${err.message}`,
    };
  }
}

/**
 * Given a user request, instruct the LLM to select the appropriate tool and arguments,
 * execute the tool, and return the result.
 *
 * @param {object} params
 * @param {string} params.userInstruction - The user's query or instruction.
 * @returns {Promise<object>} - Tool call decision and execution outcome.
 */
export async function decideAndExecuteTool({ userInstruction }) {
  const startTime = Date.now();

  const toolCatalog = toolDefinitions.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));

  const prompt = `
AVAILABLE PHARMA QC TOOLS:
${JSON.stringify(toolCatalog, null, 2)}

USER INSTRUCTION:
"${userInstruction}"

TASK:
Analyze the user instruction and select the single most appropriate tool to call.
Output a JSON object adhering EXACTLY to this schema:
{
  "reasoning": "Brief explanation of why this tool was chosen",
  "toolName": "name of selected tool",
  "arguments": {
    "argName": "value"
  }
}
`.trim();

  // Level 3 JSON Schema: enforces exact field names, toolName enum, and required fields
  const toolDispatchSchema = {
    type: "object",
    properties: {
      reasoning: { type: "string" },
      toolName: {
        type: "string",
        enum: toolDefinitions.map((t) => t.name),
      },
      arguments: { type: "object" },
    },
    required: ["reasoning", "toolName", "arguments"],
  };

  // 1. LLM Selects Tool (Level 3 — toolName is constrained to valid tool names only)
  const { data: decision, model } = await generateJSON({
    prompt,
    system: "You are an autonomous Pharmaceutical QC Tool Dispatcher. Output ONLY valid JSON indicating the tool to execute.",
    schema: toolDispatchSchema,
  });

  // 2. JavaScript Executes Tool
  const toolResult = await executeTool(decision.toolName, decision.arguments || {});

  return {
    userInstruction,
    toolSelection: {
      reasoning: decision.reasoning,
      toolName: decision.toolName,
      arguments: decision.arguments,
      modelUsed: model,
    },
    executionResult: toolResult,
    durationMs: Date.now() - startTime,
  };
}
