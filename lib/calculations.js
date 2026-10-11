/**
 * lib/calculations.js
 * Deterministic Pharmaceutical Analytical Calculation Validator.
 *
 * In GMP QC laboratories, analytical results (Assay %, Loss on Drying, Friability, Content Uniformity)
 * are derived from raw instrument or balance measurements.
 * Human analysts or lab software can make transcription or arithmetic errors.
 *
 * This module independently recalculates values from raw analytical inputs and
 * flags any discrepancies between the recorded result and the mathematically true result.
 */

/**
 * 1. Calculate Assay % from HPLC Peak Areas and Standard Weights.
 * Formula: (Sample Area / Standard Area) * (Standard Weight / Sample Weight) * (Purity / 100) * 100
 */
export function calculateHPLCAssay({
  sampleArea,
  standardArea,
  sampleWeight = 500,
  standardWeight = 500,
  standardPurity = 100.0,
}) {
  if (!sampleArea || !standardArea || standardArea === 0) {
    throw new Error("Invalid chromatographic peak areas provided");
  }
  const factor = (sampleArea / standardArea) * (standardWeight / sampleWeight) * (standardPurity / 100.0);
  const calculatedPercentage = Math.round(factor * 1000) / 10; // Round to 1 decimal place (e.g. 92.4%)
  return calculatedPercentage;
}

/**
 * 2. Calculate Percentage Weight Loss (Friability / Moisture / Loss on Drying).
 * Formula: ((Initial Mass - Final Mass) / Initial Mass) * 100
 */
export function calculateWeightLoss({ initialMass, finalMass }) {
  if (!initialMass || initialMass <= 0 || finalMass === undefined) {
    throw new Error("Invalid masses for weight loss calculation");
  }
  const loss = ((initialMass - finalMass) / initialMass) * 100;
  return Math.round(loss * 100) / 100; // Round to 2 decimal places
}

/**
 * 3. Calculate Average Unit Weight from bulk composite weight.
 * Formula: Total Weight / Unit Count
 */
export function calculateAverageMass({ totalMass, unitCount = 20 }) {
  if (!totalMass || unitCount <= 0) {
    throw new Error("Invalid parameters for average mass");
  }
  return Math.round((totalMass / unitCount) * 100) / 100;
}

/**
 * Validates all calculation trails attached to a batch.
 * Detects arithmetic errors, rounding discrepancies, and transcription mistakes.
 *
 * @param {object} batch - The batch object containing raw analytical logs.
 * @returns {Array<object>} - Array of calculation findings (if any).
 */
export function validateBatchCalculations(batch) {
  const calculationFindings = [];
  const rawData = batch.analyticalRawData;

  if (!rawData) {
    return calculationFindings; // No raw calculation inputs provided to verify
  }

  // 1. Check HPLC Assay Calculation
  if (rawData.hplcAssay) {
    const { sampleArea, standardArea, sampleWeight, standardWeight, standardPurity } = rawData.hplcAssay;
    const computedAssay = calculateHPLCAssay({
      sampleArea,
      standardArea,
      sampleWeight,
      standardWeight,
      standardPurity,
    });
    const recordedAssay = batch.results?.assay;

    if (recordedAssay !== undefined && recordedAssay !== null) {
      const diff = Math.abs(Math.round((computedAssay - recordedAssay) * 100) / 100);
      // Tolerance of 0.1% for normal lab rounding
      if (diff > 0.1) {
        calculationFindings.push({
          findingType: "calculation_inconsistency",
          severity: "medium",
          testKey: "assay",
          testLabel: "Assay of Paracetamol (HPLC Calculation Check)",
          recordedValue: recordedAssay,
          computedValue: computedAssay,
          difference: `${computedAssay > recordedAssay ? "+" : "-"}${diff}%`,
          message: `Recorded assay (${recordedAssay}%) does not match raw HPLC recalculated value (${computedAssay}%). Discrepancy: ${diff}%.`,
          formula: "(Sample Area / Std Area) * (Std Weight / Sample Weight) * Purity",
        });
      }
    }
  }

  // 2. Check Weight Loss / Moisture Calculation
  if (rawData.weightLoss) {
    const { initialMass, finalMass, recordedLossKey } = rawData.weightLoss;
    const computedLoss = calculateWeightLoss({ initialMass, finalMass });
    const recordedLoss = batch.results ? batch.results[recordedLossKey] : undefined;

    if (recordedLoss !== undefined && recordedLoss !== null) {
      const diff = Math.abs(Math.round((computedLoss - recordedLoss) * 100) / 100);
      if (diff > 0.05) {
        calculationFindings.push({
          findingType: "calculation_inconsistency",
          severity: "medium",
          testKey: recordedLossKey,
          testLabel: `${recordedLossKey} (Weight Loss Calculation Check)`,
          recordedValue: recordedLoss,
          computedValue: computedLoss,
          difference: `${computedLoss > recordedLoss ? "+" : "-"}${diff}%`,
          message: `Recorded ${recordedLossKey} (${recordedLoss}%) differs from recalculated mass balance (${computedLoss}%). Discrepancy: ${diff}%.`,
          formula: "((Initial Mass - Final Mass) / Initial Mass) * 100",
        });
      }
    }
  }

  return calculationFindings;
}
