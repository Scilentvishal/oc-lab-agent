/**
 * lib/pharma-corpus.js
 * Realistic Pharmaceutical Quality Control (QC) documentation repository.
 * Contains standard GMP documents: SOPs, Product Release Specifications, and Test Methods.
 */

export const pharmaCorpus = [
  {
    documentId: "SOP-QC-042",
    title: "Management and Investigation of Out of Specification (OOS) Laboratory Results",
    documentType: "Standard Operating Procedure",
    version: "v3.2",
    effectiveDate: "2025-01-15",
    department: "Quality Control Analytical Laboratory",
    content: `
# SOP-QC-042: Management and Investigation of Out of Specification (OOS) Laboratory Results

## 1. PURPOSE AND SCOPE
This Standard Operating Procedure defines the mandatory responsibilities and procedural workflow for evaluating, reporting, and investigating Out of Specification (OOS) and Out of Trend (OOT) test results obtained during the analysis of raw materials, in-process samples, and finished pharmaceutical products. This procedure complies with FDA 21 CFR Part 211 and EU GMP Annex guidelines.

## 2. IMMEDIATE ACTIONS UPON SUSPECTED OOS
2.1 When an analyst observes any analytical result failing to comply with approved release specifications, testing must be immediately halted.
2.2 The analyst must preserve all original test preparations, HPLC vials, mobile phases, standard solutions, instrument calibrations, and instrument log printouts. Do not discard any test materials.
2.3 The analyst must notify the QC Laboratory Supervisor within two (2) hours of observing the non-conforming result using Form QC-F042-A.

## 3. PHASE I LABORATORY INVESTIGATION
3.1 Phase I investigation must be completed within two (2) business days from notification.
3.2 The QC Supervisor and analyst must review:
  - Correct execution of the analytical test method (SOP/TM compliance).
  - Accuracy of weighings, volumetric dilutions, and pipetting steps.
  - Chromatographic integration parameters, baseline stability, and system suitability.
  - Expiry and storage conditions of reference standards, reagents, and columns.
  - Instrument maintenance logs for calibration deviations or pressure fluctuations.
3.3 If an unequivocal laboratory assignable cause is identified (e.g., standard dilution error, instrument bubble), the initial result may be invalidated. The specific cause must be documented with full objective evidence.
3.4 If no clear laboratory error is documented, the result cannot be invalidated, and the investigation immediately escalates to Phase II Manufacturing Root Cause Investigation.

## 4. PHASE II INVESTIGATION AND RETESTING
4.1 Phase II evaluates the manufacturing process, batch blending logs, temperature controls, environmental records, and raw material lots.
4.2 Retesting of the original sample or resample requires written authorization from Quality Assurance (QA) with a pre-approved retest testing protocol.
4.3 Retest protocol mandates a minimum of duplicate testing by the original analyst and a second qualified independent analyst.
4.4 Averaging of OOS results with passing retest results to obtain a passing mean is strictly prohibited under GMP regulations.
    `.trim(),
  },
  {
    documentId: "SPEC-PAR-500",
    title: "Finished Product Release Specification - Paracetamol 500mg Tablets",
    documentType: "Product Specification",
    version: "v4.0",
    effectiveDate: "2024-11-01",
    department: "Quality Assurance & Regulatory Compliance",
    content: `
# SPEC-PAR-500: Finished Product Release Specification - Paracetamol 500mg Tablets

## 1. PRODUCT IDENTIFICATION
Product Name: Paracetamol Tablets 500mg (Film Coated)
Dosage Form: Oral Tablet
Strength: 500 mg Paracetamol (Acetaminophen) per tablet
Pharmacopeial Reference: USP / Ph. Eur. current monograph

## 2. PHYSICAL AND VISUAL ACCEPTANCE CRITERIA
2.1 Appearance: White, oblong, biconvex film-coated tablets with central score line on one side. Free from chipping, discoloration, capping, and mottling.
2.2 Average Mass: Target 580.0 mg ± 3.0% (Acceptance Range: 562.6 mg to 597.4 mg per 20 tablets).
2.3 Hardness: Mean hardness between 70 N and 110 N (Breaking force).
2.4 Friability: Not more than (NMT) 0.8% weight loss after 100 revolutions in a Roche friabilator.

## 3. CHEMICAL AND DISSOLUTION ACCEPTANCE CRITERIA
3.1 Identification: Infrared Absorption (IR) spectrum matches reference standard; retention time in HPLC assay concordant with standard within ±1.0%.
3.2 Assay (Potency): 95.0% to 105.0% of stated label claim (475.0 mg to 525.0 mg Paracetamol per tablet) by HPLC TM-HPLC-012.
3.3 Dissolution: In 900 mL Phosphate Buffer pH 5.8 at 37.0°C ± 0.5°C using USP Apparatus 2 (Paddle) at 50 rpm. Acceptance criterion: Not less than (NLT) 80% (Q) of labeled amount dissolved within 30 minutes.
3.4 Uniformity of Dosage Units (Content Uniformity): Complies with USP <905> / Ph. Eur. 2.9.40. Acceptance Value (AV) L1 <= 15.0.

## 4. RELATED SUBSTANCES AND IMPURITIES (HPLC)
4.1 4-Aminophenol (Impurity K): Not more than (NMT) 0.15% (w/w).
4.2 4-Chloroacetanilide (Impurity J): Not more than (NMT) 0.05% (w/w).
4.3 Any other individual unspecified impurity: Not more than (NMT) 0.10% (w/w).
4.4 Total Impurities: Not more than (NMT) 0.50% (w/w).
    `.trim(),
  },
  {
    documentId: "SPEC-AMX-250",
    title: "Finished Product Release Specification - Amoxicillin Trihydrate Capsules 250mg",
    documentType: "Product Specification",
    version: "v2.3",
    effectiveDate: "2024-08-20",
    department: "Quality Assurance & Regulatory Compliance",
    content: `
# SPEC-AMX-250: Finished Product Release Specification - Amoxicillin Trihydrate Capsules 250mg

## 1. PRODUCT IDENTIFICATION
Product Name: Amoxicillin Trihydrate Hard Gelatin Capsules 250mg
Dosage Form: Size 1 hard gelatin capsules with maroon cap and yellow body
Strength: Equivalent to 250 mg anhydrous Amoxicillin per capsule
Pharmacopeial Reference: USP / BP

## 2. PHYSICAL AND PHYSICOCHEMICAL PARAMETERS
2.1 Appearance: Maroon/yellow hard gelatin capsules containing off-white to pale cream granular powder.
2.2 Water Content (Karl Fischer Titration): 11.5% to 14.5% (w/w). Results below 11.5% indicate desiccation; results above 14.5% indicate moisture degradation.
2.3 Disintegration: Complete capsule shell and content disintegration in purified water at 37°C in Not More Than 15 minutes.

## 3. ASSAY AND DISSOLUTION ACCEPTANCE LIMITS
3.1 Assay: 90.0% to 120.0% of labeled amount of Amoxicillin (C16H19N3O5S) determined by validated HPLC assay.
3.2 Dissolution: In 900 mL water at 37°C using USP Apparatus 1 (Basket) at 100 rpm. Stage 1 (S1) acceptance limit: Not less than 80% (Q) dissolved in 45 minutes.
3.3 Uniformity of Dosage Units: Complies with weight variation / content uniformity test (AV <= 15.0).
    `.trim(),
  },
  {
    documentId: "TM-HPLC-012",
    title: "Analytical Test Method - Reverse Phase HPLC Assay and Chromatographic Purity",
    documentType: "Test Method",
    version: "v5.1",
    effectiveDate: "2024-10-10",
    department: "Quality Control Analytical Development",
    content: `
# TM-HPLC-012: Analytical Test Method - Reverse Phase HPLC Assay and Chromatographic Purity

## 1. CHROMATOGRAPHIC CONDITIONS
1.1 Stationary Phase: C18 Octadecylsilane silica column (250 mm × 4.6 mm ID, 5 µm particle size, e.g. Inertsil ODS-3V).
1.2 Mobile Phase: Acetonitrile : 0.05 M Potassium dihydrogen phosphate buffer pH 3.5 (20:80 v/v). Filtered through 0.45 µm nylon membrane and degassed.
1.3 Flow Rate: 1.0 mL/min, isocratic elution.
1.4 Detection Wavelength: UV 243 nm for Paracetamol assay; UV 215 nm for 4-aminophenol impurity monitoring.
1.5 Injection Volume: 10 µL. Column Temperature: 30°C ± 1°C. Autosampler Temperature: Ambient (20-25°C).

## 2. SYSTEM SUITABILITY REQUIREMENTS
Before analyzing sample batches, the chromatographic system must meet all following criteria across 6 replicate injections of Working Standard:
2.1 Peak Area Repeatability: Relative Standard Deviation (RSD) <= 1.0% for 6 consecutive replicate injections.
2.2 Retention Time Repeatability: RSD <= 1.0% across replicate injections.
2.3 Peak Symmetry (Tailing Factor): Not more than 1.5 measured at 5% peak height.
2.4 Theoretical Plates (Column Efficiency): Not less than 3,000 theoretical plates for the principal analyte peak.
2.5 Resolution: Minimum chromatographic resolution (Rs) >= 3.0 between Paracetamol peak and adjacent related substance peak.
    `.trim(),
  },
  {
    documentId: "SOP-QC-018",
    title: "Retention Samples and Stability Testing Storage Conditions",
    documentType: "Standard Operating Procedure",
    version: "v2.0",
    effectiveDate: "2023-06-01",
    department: "Quality Control Stability Unit",
    content: `
# SOP-QC-018: Retention Samples and Stability Testing Storage Conditions

## 1. SAMPLE RETENTION REQUIREMENTS
1.1 Representative samples of each commercial batch must be retained in their final commercial market packaging.
1.2 Quantity: Minimum of twice the quantity necessary to conduct full analytical testing for batch release as defined in product specifications.
1.3 Retention Duration: Finished product retention samples must be maintained for one (1) full year beyond the stated product expiration date.

## 2. STABILITY STORAGE CONDITIONS (ICH GUIDELINES)
2.1 Long Term Stability: 25°C ± 2°C / 60% RH ± 5% RH for climatic zones I and II.
2.2 Accelerated Stability: 40°C ± 2°C / 75% RH ± 5% RH for a duration of six (6) months.
2.3 Intermediate Testing Condition: 30°C ± 2°C / 65% RH ± 5% RH when significant change occurs during accelerated stability testing.
2.4 Significant change criteria for finished formulations:
  - 5% potency loss from initial release assay value.
  - Any degradation impurity exceeding individual specification limit.
  - Failure to meet dissolution criteria for 12 dosage units.
    `.trim(),
  },
];
