/**
 * lib/specifications.js
 * Structured Pharmaceutical Specification Store & Type Definitions.
 *
 * Provides a standardized registry of analytical acceptance limits across 5 core types:
 * 1. 'range'     -> min <= value <= max (e.g. Assay: 95.0% - 105.0%)
 * 2. 'minimum'   -> value >= min        (e.g. Dissolution: NLT 80%)
 * 3. 'maximum'   -> value <= max        (e.g. Impurity 4-Aminophenol: NMT 0.15%)
 * 4. 'exact'     -> value === expected  (e.g. Specific Gravity: 1.025)
 * 5. 'pass_fail' -> value === 'Pass'    (e.g. Appearance: 'Pass')
 */

export const SUPPORTED_SPEC_TYPES = ["range", "minimum", "maximum", "exact", "pass_fail"];

/**
 * Standardized Specifications Registry
 */
export const specificationStore = [
  // 1. RANGE: Assay (Potency) of Paracetamol
  {
    id: "SPEC-PAR-ASSAY",
    productId: "PROD-PAR-500",
    productName: "Paracetamol Tablets 500mg",
    testKey: "assay",
    testLabel: "Assay of Paracetamol (HPLC)",
    type: "range",
    min: 95.0,
    max: 105.0,
    unit: "%",
    isMandatory: true,
    documentRef: "SPEC-PAR-500",
    sectionRef: "3. CHEMICAL AND DISSOLUTION ACCEPTANCE CRITERIA",
  },

  // 2. MINIMUM: Dissolution (Q)
  {
    id: "SPEC-PAR-DISS",
    productId: "PROD-PAR-500",
    productName: "Paracetamol Tablets 500mg",
    testKey: "dissolution",
    testLabel: "Dissolution (Q at 30 min)",
    type: "minimum",
    min: 80.0,
    max: null,
    unit: "%",
    isMandatory: true,
    documentRef: "SPEC-PAR-500",
    sectionRef: "3. CHEMICAL AND DISSOLUTION ACCEPTANCE CRITERIA",
  },

  // 3. MAXIMUM: Impurity K (4-Aminophenol)
  {
    id: "SPEC-PAR-IMP-K",
    productId: "PROD-PAR-500",
    productName: "Paracetamol Tablets 500mg",
    testKey: "related_substance_4_aminophenol",
    testLabel: "4-Aminophenol Impurity K",
    type: "maximum",
    min: null,
    max: 0.15,
    unit: "% w/w",
    isMandatory: true,
    documentRef: "SPEC-PAR-500",
    sectionRef: "4. RELATED SUBSTANCES AND IMPURITIES (HPLC)",
  },

  // 4. PASS/FAIL: Appearance
  {
    id: "SPEC-PAR-APP",
    productId: "PROD-PAR-500",
    productName: "Paracetamol Tablets 500mg",
    testKey: "appearance",
    testLabel: "Physical Visual Appearance",
    type: "pass_fail",
    expected: "Pass",
    unit: "Visual",
    isMandatory: true,
    documentRef: "SPEC-PAR-500",
    sectionRef: "2. PHYSICAL AND VISUAL ACCEPTANCE CRITERIA",
  },

  // 5. EXACT: Identification by HPLC Retention Time Match
  {
    id: "SPEC-PAR-ID",
    productId: "PROD-PAR-500",
    productName: "Paracetamol Tablets 500mg",
    testKey: "identification_hplc",
    testLabel: "Identification by HPLC Concordance",
    type: "exact",
    expected: "Concordant",
    unit: "Text",
    isMandatory: true,
    documentRef: "SPEC-PAR-500",
    sectionRef: "3. CHEMICAL AND DISSOLUTION ACCEPTANCE CRITERIA",
  },

  // Amoxicillin 250mg Specifications (For multi-product testing)
  {
    id: "SPEC-AMX-ASSAY",
    productId: "PROD-AMX-250",
    productName: "Amoxicillin Trihydrate Capsules 250mg",
    testKey: "assay",
    testLabel: "Assay of Amoxicillin (HPLC)",
    type: "range",
    min: 90.0,
    max: 120.0,
    unit: "%",
    isMandatory: true,
    documentRef: "SPEC-AMX-250",
    sectionRef: "3. ASSAY AND DISSOLUTION ACCEPTANCE LIMITS",
  },
  {
    id: "SPEC-AMX-WATER",
    productId: "PROD-AMX-250",
    productName: "Amoxicillin Trihydrate Capsules 250mg",
    testKey: "water_content",
    testLabel: "Water Content (Karl Fischer)",
    type: "range",
    min: 11.5,
    max: 14.5,
    unit: "% w/w",
    isMandatory: true,
    documentRef: "SPEC-AMX-250",
    sectionRef: "2. PHYSICAL AND PHYSICOCHEMICAL PARAMETERS",
  },
];

/**
 * Retrieve all registered specifications for a specific product.
 *
 * @param {string} productId - Product ID (e.g. "PROD-PAR-500").
 * @returns {Array<object>} - Matching specifications.
 */
export function getSpecificationsByProduct(productId) {
  if (!productId) return specificationStore;
  return specificationStore.filter((s) => s.productId === productId);
}

/**
 * Retrieve a specific single test specification for a product.
 *
 * @param {string} productId - Product ID.
 * @param {string} testKey - Specific test identifier (e.g. "assay").
 * @returns {object|null}
 */
export function getSpecification(productId, testKey) {
  return (
    specificationStore.find(
      (s) => s.productId === productId && s.testKey === testKey
    ) || null
  );
}
