/**
 * lib/batches.js
 * Pharmaceutical Batch Records & Analytical Test Results Store.
 *
 * Models commercial production lots and their lab-recorded testing results.
 */

export const batchStore = [
  {
    batchId: "B-2026-001",
    productId: "PROD-PAR-500",
    productName: "Paracetamol Tablets 500mg",
    mfgDate: "2026-09-28",
    expiryDate: "2028-09-28",
    batchSize: "250,000 Tablets",
    analyst: "Sarah Jenkins",
    status: "Under Review",
    results: {
      assay: 92.4,                           // Spec: 95.0% - 105.0% -> Potential OOS!
      dissolution: 88.0,                     // Spec: >= 80.0% -> OK
      appearance: "Pass",                    // Spec: Pass -> OK
      identification_hplc: "Concordant",     // Spec: Concordant -> OK
      // Note: 'related_substance_4_aminophenol' is omitted to test Missing Test detection in Stage 12!
    },
    rawReadings: [
      { testKey: "assay", reading: 92.4, unit: "%", testedAt: "2026-10-03T09:15:00Z" },
      { testKey: "dissolution", reading: 88.0, unit: "%", testedAt: "2026-10-03T11:00:00Z" },
      { testKey: "appearance", reading: "Pass", unit: "Visual", testedAt: "2026-10-03T08:30:00Z" },
      { testKey: "identification_hplc", reading: "Concordant", unit: "Text", testedAt: "2026-10-03T09:45:00Z" },
    ],
    analyticalRawData: {
      hplcAssay: {
        sampleArea: 184800,
        standardArea: 200000,
        sampleWeight: 500.0,
        standardWeight: 500.0,
        standardPurity: 100.0,
      },
    },
  },
  {
    batchId: "B-2026-002",
    productId: "PROD-PAR-500",
    productName: "Paracetamol Tablets 500mg",
    mfgDate: "2026-09-29",
    expiryDate: "2028-09-29",
    batchSize: "250,000 Tablets",
    analyst: "David Chen",
    status: "Compliant",
    results: {
      assay: 99.8,
      dissolution: 94.0,
      related_substance_4_aminophenol: 0.04,
      appearance: "Pass",
      identification_hplc: "Concordant",
    },
    rawReadings: [
      { testKey: "assay", reading: 99.8, unit: "%", testedAt: "2026-10-02T10:00:00Z" },
      { testKey: "dissolution", reading: 94.0, unit: "%", testedAt: "2026-10-02T11:30:00Z" },
      { testKey: "related_substance_4_aminophenol", reading: 0.04, unit: "% w/w", testedAt: "2026-10-02T14:15:00Z" },
      { testKey: "appearance", reading: "Pass", unit: "Visual", testedAt: "2026-10-02T09:00:00Z" },
      { testKey: "identification_hplc", reading: "Concordant", unit: "Text", testedAt: "2026-10-02T10:30:00Z" },
    ],
    analyticalRawData: {
      hplcAssay: {
        sampleArea: 199600,
        standardArea: 200000,
        sampleWeight: 500.0,
        standardWeight: 500.0,
        standardPurity: 100.0,
      },
    },
  },
  {
    batchId: "B-2026-003",
    productId: "PROD-AMX-250",
    productName: "Amoxicillin Trihydrate Capsules 250mg",
    mfgDate: "2026-10-01",
    expiryDate: "2028-10-01",
    batchSize: "100,000 Capsules",
    analyst: "Elena Rostova",
    status: "Under Review",
    results: {
      assay: 104.5,                          // Spec: 90.0% - 120.0% -> OK
      water_content: 15.2,                   // Spec: 11.5% - 14.5% -> Potential OOS (Moisture)!
    },
    rawReadings: [
      { testKey: "assay", reading: 104.5, unit: "%", testedAt: "2026-10-04T09:00:00Z" },
      { testKey: "water_content", reading: 15.2, unit: "% w/w", testedAt: "2026-10-04T10:30:00Z" },
    ],
  },
  {
    batchId: "B-2026-004",
    productId: "PROD-PAR-500",
    productName: "Paracetamol Tablets 500mg",
    mfgDate: "2026-10-05",
    expiryDate: "2028-10-05",
    batchSize: "250,000 Tablets",
    analyst: "Mark Taylor",
    status: "Under Review",
    results: {
      assay: 99.5,                           // Recorded as 99.5%, but raw instrument area shows 94.5%!
      dissolution: 91.0,
      appearance: "Pass",
      related_substance_4_aminophenol: 0.03,
      identification_hplc: "Concordant",
    },
    rawReadings: [
      { testKey: "assay", reading: 99.5, unit: "%", testedAt: "2026-10-05T09:00:00Z" },
      { testKey: "dissolution", reading: 91.0, unit: "%", testedAt: "2026-10-05T10:30:00Z" },
      { testKey: "appearance", reading: "Pass", unit: "Visual", testedAt: "2026-10-05T08:30:00Z" },
      { testKey: "related_substance_4_aminophenol", reading: 0.03, unit: "% w/w", testedAt: "2026-10-05T11:00:00Z" },
      { testKey: "identification_hplc", reading: "Concordant", unit: "Text", testedAt: "2026-10-05T09:30:00Z" },
    ],
    analyticalRawData: {
      hplcAssay: {
        sampleArea: 189000,                  // (189000 / 200000) * 100 = 94.5% -> Discrepancy with 99.5%!
        standardArea: 200000,
        sampleWeight: 500.0,
        standardWeight: 500.0,
        standardPurity: 100.0,
      },
    },
  },
];

/**
 * Retrieve all batches in the system.
 */
export function getAllBatches() {
  return batchStore;
}

/**
 * Retrieve a specific batch by its ID.
 *
 * @param {string} batchId - e.g. "B-2026-001".
 * @returns {object|null}
 */
export function getBatchById(batchId) {
  return batchStore.find((b) => b.batchId === batchId) || null;
}

/**
 * Create or append a new batch record.
 *
 * @param {object} newBatchData
 */
export function createBatch(newBatchData) {
  const existing = getBatchById(newBatchData.batchId);
  if (existing) {
    throw new Error(`Batch ID '${newBatchData.batchId}' already exists`);
  }
  batchStore.push(newBatchData);
  return newBatchData;
}
