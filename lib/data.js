/**
 * PHARMA QC DATA MODELS & STORE
 *
 * Plain JavaScript data structures modeling the core entities of a QC laboratory.
 * These models bridge deterministic QC evaluation, vector retrieval, and AI reasoning.
 */

// 1. PRODUCT
// Defines the pharmaceutical product (drug formulation, strength, and dosage form).
export const products = [
  {
    id: "PROD-PAR-500",
    name: "Paracetamol Tablets",
    strength: "500mg",
    dosageForm: "Tablet",
    therapeuticCategory: "Analgesic / Antipyretic",
  },
  {
    id: "PROD-AMX-250",
    name: "Amoxicillin Trihydrate Capsules",
    strength: "250mg",
    dosageForm: "Capsule",
    therapeuticCategory: "Antibiotic",
  },
];

// 2. DOCUMENT
// Unstructured or semi-structured QC documents (SOPs, Specifications, Test Methods)
// to be chunked and indexed in Qdrant for semantic search and RAG.
export const documents = [
  {
    id: "DOC-SOP-042",
    name: "SOP-QC-042: Out of Specification (OOS) Investigations",
    type: "SOP",
    version: "v4.0",
    productId: null, // Universal SOP applicable to all products
    status: "Active",
    effectiveDate: "2026-01-15",
  },
  {
    id: "DOC-SPEC-PAR",
    name: "SPEC-PAR-01: Paracetamol Tablets 500mg Finished Product Specification",
    type: "Specification",
    version: "v2.1",
    productId: "PROD-PAR-500",
    status: "Active",
    effectiveDate: "2026-03-01",
  },
  {
    id: "DOC-TM-HPLC",
    name: "TM-HPLC-09: Assay of Paracetamol by Reverse Phase HPLC",
    type: "Test Method",
    version: "v3.0",
    productId: "PROD-PAR-500",
    status: "Active",
    effectiveDate: "2026-03-01",
  },
];

// 3. SPECIFICATION
// Structured acceptance criteria used by the deterministic rule engine.
// Supports rule types: 'range', 'minimum', 'maximum', 'exact', 'pass_fail'.
export const specifications = [
  {
    id: "SPEC-001",
    productId: "PROD-PAR-500",
    test: "assay",
    testLabel: "Assay of Paracetamol (HPLC)",
    type: "range",
    min: 95.0,
    max: 105.0,
    unit: "%",
    isMandatory: true,
    testMethodDocId: "DOC-TM-HPLC",
  },
  {
    id: "SPEC-002",
    productId: "PROD-PAR-500",
    test: "dissolution",
    testLabel: "Dissolution (Q)",
    type: "minimum",
    min: 80.0,
    max: null,
    unit: "%",
    isMandatory: true,
    testMethodDocId: null,
  },
  {
    id: "SPEC-003",
    productId: "PROD-PAR-500",
    test: "related_substances",
    testLabel: "Related Substances (4-Aminophenol)",
    type: "maximum",
    min: null,
    max: 0.1,
    unit: "% w/w",
    isMandatory: true,
    testMethodDocId: "DOC-TM-HPLC",
  },
  {
    id: "SPEC-004",
    productId: "PROD-PAR-500",
    test: "appearance",
    testLabel: "Appearance",
    type: "pass_fail",
    expected: "Pass",
    unit: "Visual",
    isMandatory: true,
    testMethodDocId: null,
  },
];

// 4. BATCH
// Manufacturing production lot submitted to the QC laboratory for release testing.
export const batches = [
  {
    id: "B-2026-001",
    productId: "PROD-PAR-500",
    mfgDate: "2026-09-28",
    expiryDate: "2028-09-28",
    batchSize: "250,000 Tablets",
    status: "Under Review",
  },
  {
    id: "B-2026-002",
    productId: "PROD-PAR-500",
    mfgDate: "2026-09-29",
    expiryDate: "2028-09-29",
    batchSize: "250,000 Tablets",
    status: "Compliant",
  },
];

// 5. BATCH RESULT
// Actual quantitative or qualitative test readings obtained by QC analysts.
export const batchResults = [
  // Results for Batch B-2026-001 (Contains Potential OOS and Missing Test)
  {
    id: "RES-001",
    batchId: "B-2026-001",
    test: "assay",
    value: 92.4, // Spec is 95.0 - 105.0 -> Potential OOS!
    unit: "%",
    analyst: "Sarah Jenkins",
    testedAt: "2026-10-03T09:15:00Z",
  },
  {
    id: "RES-002",
    batchId: "B-2026-001",
    test: "dissolution",
    value: 88.0, // Spec is min 80.0 -> OK
    unit: "%",
    analyst: "Sarah Jenkins",
    testedAt: "2026-10-03T11:00:00Z",
  },
  {
    id: "RES-003",
    batchId: "B-2026-001",
    test: "appearance",
    value: "Pass", // Spec is Pass -> OK
    unit: "Visual",
    analyst: "Sarah Jenkins",
    testedAt: "2026-10-03T08:30:00Z",
  },
  // Note: 'related_substances' is omitted to simulate a Missing Mandatory Test!

  // Results for Batch B-2026-002 (Compliant batch)
  {
    id: "RES-004",
    batchId: "B-2026-002",
    test: "assay",
    value: 99.8,
    unit: "%",
    analyst: "David Chen",
    testedAt: "2026-10-02T10:00:00Z",
  },
  {
    id: "RES-005",
    batchId: "B-2026-002",
    test: "dissolution",
    value: 94.0,
    unit: "%",
    analyst: "David Chen",
    testedAt: "2026-10-02T11:30:00Z",
  },
  {
    id: "RES-006",
    batchId: "B-2026-002",
    test: "related_substances",
    value: 0.04,
    unit: "% w/w",
    analyst: "David Chen",
    testedAt: "2026-10-02T14:15:00Z",
  },
  {
    id: "RES-007",
    batchId: "B-2026-002",
    test: "appearance",
    value: "Pass",
    unit: "Visual",
    analyst: "David Chen",
    testedAt: "2026-10-02T09:00:00Z",
  },
];

// 6. FINDING
// A standardized discrepancy detected by the deterministic QC rule engine.
export const findings = [
  {
    id: "FND-001",
    batchId: "B-2026-001",
    type: "potential_oos",
    severity: "high",
    test: "assay",
    result: 92.4,
    specification: "95.0% – 105.0%",
    difference: "-2.6%",
    message: "Result is below the lower acceptance specification limit.",
  },
  {
    id: "FND-002",
    batchId: "B-2026-001",
    type: "missing_test",
    severity: "medium",
    test: "related_substances",
    result: null,
    specification: "NMT 0.1% w/w",
    difference: null,
    message: "Mandatory release test 'related_substances' has no recorded result.",
  },
];

// 7. ANALYSIS
// The composite audit record combining deterministic findings, RAG sources, and AI guidance.
export const analyses = [
  {
    id: "ANA-001",
    batchId: "B-2026-001",
    status: "REVIEW_REQUIRED",
    findingsCount: 2,
    evaluatedAt: "2026-10-04T11:45:00Z",
    aiExplanation: null, // Will be generated by Ollama in Stage 16
    sources: [],         // Will be retrieved from Qdrant in Stage 15
  },
];

// Helper functions for easy querying across stages
export function getProduct(productId) {
  return products.find((p) => p.id === productId) || null;
}

export function getSpecificationsForProduct(productId) {
  return specifications.filter((s) => s.productId === productId);
}

export function getBatch(batchId) {
  return batches.find((b) => b.id === batchId) || null;
}

export function getBatchResults(batchId) {
  return batchResults.filter((r) => r.batchId === batchId);
}

export function getBatchFindings(batchId) {
  return findings.filter((f) => f.batchId === batchId);
}
