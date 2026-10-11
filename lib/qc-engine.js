import { validateBatchCalculations } from "./calculations";
import { createFinding, checkUnusualValues, checkDocumentationIntegrity } from "./findings";

/**
 * 1. Check if a numerical reading is within an inclusive [min, max] range.
 */
export function checkRange(value, min, max) {
  const num = Number(value);
  if (isNaN(num)) return { isCompliant: false, reason: "Result is not a valid number" };

  const isBelow = min !== null && min !== undefined && num < min;
  const isAbove = max !== null && max !== undefined && num > max;

  if (isBelow) {
    const diff = Math.round((num - min) * 100) / 100;
    return {
      isCompliant: false,
      reason: `Result (${num}) is below lower limit (${min}) by ${Math.abs(diff)}`,
      difference: `${diff}`,
      violationType: "BELOW_MINIMUM",
    };
  }

  if (isAbove) {
    const diff = Math.round((num - max) * 100) / 100;
    return {
      isCompliant: false,
      reason: `Result (${num}) exceeds upper limit (${max}) by +${diff}`,
      difference: `+${diff}`,
      violationType: "EXCEEDS_MAXIMUM",
    };
  }

  return { isCompliant: true, reason: "Within acceptable range", difference: "0.0" };
}

/**
 * 2. Check if a numerical reading meets a minimum requirement (>= min).
 */
export function checkMinimum(value, min) {
  const num = Number(value);
  if (isNaN(num)) return { isCompliant: false, reason: "Result is not a valid number" };

  if (num < min) {
    const diff = Math.round((num - min) * 100) / 100;
    return {
      isCompliant: false,
      reason: `Result (${num}) is below required minimum (${min}) by ${Math.abs(diff)}`,
      difference: `${diff}`,
      violationType: "BELOW_MINIMUM",
    };
  }

  return { isCompliant: true, reason: "Meets minimum limit", difference: "0.0" };
}

/**
 * 3. Check if a numerical reading does not exceed a maximum limit (<= max).
 */
export function checkMaximum(value, max) {
  const num = Number(value);
  if (isNaN(num)) return { isCompliant: false, reason: "Result is not a valid number" };

  if (num > max) {
    const diff = Math.round((num - max) * 100) / 100;
    return {
      isCompliant: false,
      reason: `Result (${num}) exceeds allowable maximum (${max}) by +${diff}`,
      difference: `+${diff}`,
      violationType: "EXCEEDS_MAXIMUM",
    };
  }

  return { isCompliant: true, reason: "Complies with maximum allowable limit", difference: "0.0" };
}

/**
 * 4. Check if a string/number matches an exact expected value.
 */
export function checkExact(value, expected) {
  const isMatch = String(value).trim().toLowerCase() === String(expected).trim().toLowerCase();
  return {
    isCompliant: isMatch,
    reason: isMatch ? "Matches expected value" : `Expected '${expected}', but recorded '${value}'`,
    difference: isMatch ? null : `Mismatch`,
  };
}

/**
 * 5. Check if a qualitative test is 'Pass'.
 */
export function checkPassFail(value, expected = "Pass") {
  const isPass = String(value).trim().toLowerCase() === String(expected).trim().toLowerCase();
  return {
    isCompliant: isPass,
    reason: isPass ? "Conforms to visual/qualitative acceptance criteria" : `Non-conforming visual status: '${value}'`,
    difference: isPass ? null : "Non-compliant",
  };
}

/**
 * Evaluate a single test result against its corresponding specification.
 *
 * @param {object} spec - Specification record from lib/specifications.js.
 * @param {any} resultValue - The recorded analytical reading.
 * @returns {object} - Standardized evaluation object.
 */
export function evaluateTestResult(spec, resultValue) {
  let check;

  switch (spec.type) {
    case "range":
      check = checkRange(resultValue, spec.min, spec.max);
      break;
    case "minimum":
      check = checkMinimum(resultValue, spec.min);
      break;
    case "maximum":
      check = checkMaximum(resultValue, spec.max);
      break;
    case "exact":
      check = checkExact(resultValue, spec.expected);
      break;
    case "pass_fail":
      check = checkPassFail(resultValue, spec.expected);
      break;
    default:
      check = { isCompliant: false, reason: `Unknown specification rule type: '${spec.type}'` };
  }

  return {
    testKey: spec.testKey,
    testLabel: spec.testLabel,
    specType: spec.type,
    unit: spec.unit,
    expectedCriteria:
      spec.type === "range"
        ? `${spec.min}${spec.unit} – ${spec.max}${spec.unit}`
        : spec.type === "minimum"
        ? `NLT ${spec.min}${spec.unit}`
        : spec.type === "maximum"
        ? `NMT ${spec.max}${spec.unit}`
        : spec.expected,
    recordedValue: resultValue,
    isCompliant: check.isCompliant,
    findingType: check.isCompliant ? "COMPLIANT" : "potential_oos",
    severity: check.isCompliant ? "none" : "high",
    reason: check.reason,
    difference: check.difference,
    documentRef: spec.documentRef,
    sectionRef: spec.sectionRef,
  };
}

/**
 * Detect required or mandatory analytical tests that are missing from the batch record.
 *
 * @param {object} batch - Batch object with .results map.
 * @param {Array<object>} specifications - Array of product specifications.
 * @returns {Array<object>} - Array of missing test findings.
 */
export function detectMissingTests(batch, specifications) {
  const missingFindings = [];
  const results = batch.results || {};

  for (const spec of specifications) {
    const isRecorded = results[spec.testKey] !== undefined && results[spec.testKey] !== null && results[spec.testKey] !== "";

    // If a mandatory specification test has not been logged
    if (!isRecorded && spec.isMandatory) {
      const criteriaStr =
        spec.type === "range"
          ? `${spec.min}${spec.unit} – ${spec.max}${spec.unit}`
          : spec.type === "minimum"
          ? `NLT ${spec.min}${spec.unit}`
          : spec.type === "maximum"
          ? `NMT ${spec.max}${spec.unit}`
          : spec.expected;

      missingFindings.push(
        createFinding({
          type: "missing_test",
          severity: "medium",
          test: spec.testKey,
          result: null,
          specification: criteriaStr,
          difference: null,
          message: `Mandatory release test '${spec.testLabel}' (${spec.testKey}) is missing from the batch record.`,
          documentRef: spec.documentRef,
          sectionRef: spec.sectionRef,
          metadata: { testLabel: spec.testLabel },
        })
      );
    }
  }

  return missingFindings;
}

/**
 * Validate all recorded test results for a batch against the product specifications.
 * Evaluates OOS, Missing Tests, Calculation Checks, Unusual Values, and Documentation Integrity.
 *
 * @param {object} batch - Batch object with .results map.
 * @param {Array<object>} specifications - Array of product specs.
 * @returns {object} - Complete deterministic validation report with standardized findings.
 */
export function validateBatch(batch, specifications) {
  const evaluations = [];
  const oosFindings = [];

  // 1. Evaluate recorded tests deterministically
  for (const spec of specifications) {
    const recordedValue = batch.results ? batch.results[spec.testKey] : undefined;

    if (recordedValue !== undefined && recordedValue !== null && recordedValue !== "") {
      const evalResult = evaluateTestResult(spec, recordedValue);
      evaluations.push(evalResult);

      if (!evalResult.isCompliant) {
        oosFindings.push(
          createFinding({
            type: "potential_oos",
            severity: "high",
            test: spec.testKey,
            result: recordedValue,
            specification: evalResult.expectedCriteria,
            difference: evalResult.difference,
            message: evalResult.reason,
            documentRef: spec.documentRef,
            sectionRef: spec.sectionRef,
            metadata: { testLabel: spec.testLabel },
          })
        );
      }
    }
  }

  // 2. Deterministically detect missing mandatory tests
  const missingFindings = detectMissingTests(batch, specifications);

  // 3. Deterministically validate calculations & raw instrumental records
  const rawCalcFindings = validateBatchCalculations(batch);
  const calcFindings = rawCalcFindings.map((c) =>
    createFinding({
      type: "calculation_inconsistency",
      severity: c.severity,
      test: c.testKey,
      result: c.recordedValue,
      specification: `Recalculated: ${c.computedValue}%`,
      difference: c.difference,
      message: c.message,
      metadata: { formula: c.formula, computedValue: c.computedValue },
    })
  );

  // 4. Check for unusual values / Out-of-Trend boundaries
  const unusualFindings = checkUnusualValues(batch);

  // 5. Check documentation integrity
  const docFindings = checkDocumentationIntegrity(batch);

  // 6. Aggregate all standardized findings
  const allFindings = [
    ...oosFindings,
    ...missingFindings,
    ...calcFindings,
    ...unusualFindings,
    ...docFindings,
  ];

  const hasOOS = oosFindings.length > 0;
  const hasMissing = missingFindings.length > 0;
  const hasCalcError = calcFindings.length > 0;
  const hasUnusual = unusualFindings.length > 0;
  const hasDocIssue = docFindings.length > 0;

  let overallStatus = "COMPLIANT";
  const issues = [];
  if (hasOOS) issues.push("Potential OOS");
  if (hasMissing) issues.push("Missing Tests");
  if (hasCalcError) issues.push("Calculation Discrepancy");
  if (hasUnusual) issues.push("Unusual Values");
  if (hasDocIssue) issues.push("Documentation Incomplete");

  if (issues.length > 0) {
    overallStatus = `REVIEW_REQUIRED (${issues.join(" & ")})`;
  }

  return {
    batchId: batch.batchId,
    productId: batch.productId,
    productName: batch.productName,
    overallStatus,
    totalSpecsDefined: specifications.length,
    testsRecordedCount: evaluations.length,
    missingTestsCount: missingFindings.length,
    oosCount: oosFindings.length,
    calcInconsistenciesCount: calcFindings.length,
    unusualValuesCount: unusualFindings.length,
    docIssuesCount: docFindings.length,
    totalFindingsCount: allFindings.length,
    findings: allFindings,
    evaluations,
    breakdownByType: {
      potential_oos: oosFindings,
      missing_test: missingFindings,
      calculation_inconsistency: calcFindings,
      unusual_value: unusualFindings,
      missing_documentation: docFindings,
    },
  };
}
