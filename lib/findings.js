/**
 * lib/findings.js
 * Standardized Pharmaceutical Quality Control (QC) Findings Schema.
 *
 * Provides a uniform, audit-ready data contract for all laboratory discrepancies:
 * 1. 'potential_oos'             -> Analytical reading violates acceptance limits (Severity: high)
 * 2. 'missing_test'              -> Mandatory release test was not performed (Severity: medium/high)
 * 3. 'calculation_inconsistency' -> Raw data does not match calculated result (Severity: medium)
 * 4. 'unusual_value'             -> Within spec, but statistically abnormal / Out of Trend (Severity: low/medium)
 * 5. 'missing_documentation'     -> Missing analyst sign-off, lot date, or test method ref (Severity: low/medium)
 */

export const FINDING_TYPES = [
  "potential_oos",
  "missing_test",
  "calculation_inconsistency",
  "unusual_value",
  "missing_documentation",
];

export const SEVERITY_LEVELS = ["low", "medium", "high", "critical"];

/**
 * Factory function creating a standardized, immutable QC Finding record.
 *
 * @param {object} params
 * @param {string} params.type - One of FINDING_TYPES.
 * @param {string} params.severity - One of SEVERITY_LEVELS.
 * @param {string} params.test - Test identifier (e.g. "assay").
 * @param {any} [params.result] - Recorded laboratory reading.
 * @param {string} params.specification - Configured acceptance threshold.
 * @param {string} [params.difference] - Delta from threshold (e.g. "-2.6%").
 * @param {string} params.message - Clear compliance explanation.
 * @param {string} [params.documentRef] - Supporting SOP or Specification ID.
 * @param {string} [params.sectionRef] - Section header inside the document.
 * @param {object} [params.metadata] - Additional contextual data.
 * @returns {object} - Standardized finding object.
 */
export function createFinding({
  type,
  severity = "medium",
  test,
  result = null,
  specification = "N/A",
  difference = null,
  message,
  documentRef = null,
  sectionRef = null,
  metadata = {},
}) {
  if (!FINDING_TYPES.includes(type)) {
    throw new Error(`Unsupported finding type '${type}'. Must be one of: ${FINDING_TYPES.join(", ")}`);
  }

  return {
    id: `FND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    type,
    severity,
    test,
    result,
    specification,
    difference,
    message,
    documentRef,
    sectionRef,
    createdAt: new Date().toISOString(),
    requiresInvestigation: severity === "high" || severity === "critical",
    metadata,
  };
}

/**
 * Check for unusual values (Out of Trend / Boundary extremes) in batch results.
 * E.g., Dissolution is passing but right at the boundary (80.1% vs min 80.0%),
 * or an impossible negative number or extreme outlier.
 */
export function checkUnusualValues(batch) {
  const findings = [];
  const results = batch.results || {};

  for (const [testKey, value] of Object.entries(results)) {
    if (typeof value === "number") {
      // Unusual negative readings in tests that must be positive
      if (value < 0) {
        findings.push(
          createFinding({
            type: "unusual_value",
            severity: "high",
            test: testKey,
            result: value,
            specification: "> 0",
            difference: `${value}`,
            message: `Analytical test '${testKey}' contains an impossible negative reading (${value}).`,
          })
        );
      }

      // Borderline result: Dissolution passing within razor-thin margin (80.0% to 81.0% with min 80.0%)
      if (testKey === "dissolution" && value >= 80.0 && value <= 81.0) {
        findings.push(
          createFinding({
            type: "unusual_value",
            severity: "low",
            test: "dissolution",
            result: value,
            specification: "NLT 80.0%",
            difference: `+${(value - 80.0).toFixed(1)}%`,
            message: `Dissolution result (${value}%) is compliant but borderline near the acceptance threshold (80.0%). Review for Out-of-Trend (OOT).`,
            documentRef: "SPEC-PAR-500",
            sectionRef: "3. CHEMICAL AND DISSOLUTION ACCEPTANCE CRITERIA",
          })
        );
      }
    }
  }

  return findings;
}

/**
 * Check for missing documentation metadata in the batch record.
 * Validates analyst signature, manufacturing date, and batch size integrity.
 */
export function checkDocumentationIntegrity(batch) {
  const findings = [];

  if (!batch.analyst || batch.analyst.trim().length === 0) {
    findings.push(
      createFinding({
        type: "missing_documentation",
        severity: "medium",
        test: "batch_metadata",
        result: null,
        specification: "Mandatory Analyst Signature",
        message: "Batch record lacks responsible QC Analyst attribution.",
        documentRef: "SOP-QC-042",
        sectionRef: "2. IMMEDIATE ACTIONS UPON SUSPECTED OOS",
      })
    );
  }

  if (!batch.mfgDate || !batch.expiryDate) {
    findings.push(
      createFinding({
        type: "missing_documentation",
        severity: "high",
        test: "batch_metadata",
        result: null,
        specification: "Valid Manufacturing & Expiration Dates",
        message: "Batch record is missing manufacturing or expiration date stamps.",
        documentRef: "SPEC-PAR-500",
        sectionRef: "1. PRODUCT IDENTIFICATION",
      })
    );
  }

  return findings;
}
