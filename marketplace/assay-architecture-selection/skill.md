# Assay Architecture Selection

Select the assay platform, capture reagent, and detection method based on the target analyte, required sensitivity, and clinical use case.

## Inputs

- `target-analyte`: The biomarker or pathogen to detect: molecular identity, expected concentration range in clinical samples, sample matrix
- `clinical-use-case`: Point-of-care vs central lab, quantitative vs qualitative, turnaround time requirement, throughput

## Outputs

- `assay-architecture`: Selected platform (lateral flow, ELISA, PCR, electrochemical), detection method, and capture reagent strategy
- `performance-targets`: Target sensitivity, specificity, precision, and limit of detection based on clinical decision points

## Process

1. Match analyte concentration to detection technology sensitivity. Lateral flow immunoassay detects ng/mL range (adequate for hCG, cardiac troponin triage). ELISA reaches pg/mL (cytokines, tumor markers). PCR detects single copies of nucleic acid (infectious disease, genetic mutations). Electrochemical sensors suit continuous monitoring (glucose).
2. For immunoassays, select the capture reagent: monoclonal antibody for high specificity, polyclonal for broader epitope recognition, aptamer for chemical stability and batch consistency. Sandwich format (two antibodies) for larger analytes with multiple epitopes. Competitive format for small molecules with single epitopes.
3. For nucleic acid tests, select the amplification method: real-time PCR for quantitative detection in a lab, isothermal amplification (LAMP, RPA) for point-of-care simplicity (no thermal cycler). Design primers and probes targeting conserved regions of the pathogen genome to avoid false negatives from mutations.
4. Define performance targets from the clinical decision point. If the clinical cutoff is 0.04 ng/mL (high-sensitivity troponin), the assay LoD must be well below that, and precision at the cutoff must yield a CV below 10%. Total imprecision determines whether the assay can distinguish clinically meaningful changes.
5. Select the detection method: colorimetric (visual read for qualitative, reader for quantitative), fluorescent (higher sensitivity, requires reader), chemiluminescent (highest sensitivity for immunoassay, lab-based), electrochemical (direct transduction, suitable for miniaturization and continuous sensing).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
