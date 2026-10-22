# Biological Testing Execution

Execute the required biological tests (cytotoxicity, sensitization, irritation, systemic toxicity, genotoxicity, implantation, hemocompatibility) per ISO 10993 test standards and compile results.

## Inputs

- `biological-evaluation-plan`: Tests to execute with standards and sample prep requirements
- `extractables-report`: Chemical characterization results informing test design

## Outputs

- `biological-test-reports`: Individual test reports for each biological endpoint with pass/fail against acceptance criteria
- `biological-evaluation-report`: Integrated report per ISO 10993-1 summarizing all biological evidence and overall biocompatibility conclusion

## Process

1. Cytotoxicity per ISO 10993-5: MEM elution or direct contact method with L-929 cells. Grade reactivity 0-4. Grade 2 or higher is a cytotoxic response requiring investigation. Also run quantitative viability assay (MTT or XTT) reporting percent viability vs negative control.
2. Sensitization: LLNA (local lymph node assay per ISO 10993-10 Annex B) as first choice due to reduction in animal use. Stimulation index below 3.0 is non-sensitizing. If LLNA is not applicable (device extracts are too viscous or colored), use guinea pig maximization test (GPMT).
3. Irritation per ISO 10993-10 or ISO 10993-23 (reconstructed human cornea-like epithelium for ocular devices). For skin-contacting devices, intracutaneous reactivity test in rabbits or in-vitro reconstructed skin model.
4. Genotoxicity per ISO 10993-3: Ames test (bacterial reverse mutation) plus in-vitro mammalian cell assay (mouse lymphoma or chromosomal aberration). Both must be negative. A positive result in either requires follow-up in-vivo test (micronucleus).
5. For implant devices: implantation test per ISO 10993-6 with histopathological evaluation at specified time points. For blood-contacting devices: hemocompatibility per ISO 10993-4 (hemolysis, thrombosis, coagulation, platelet, complement, hematology as applicable).
6. Compile the biological evaluation report per ISO 10993-1. Integrate chemical characterization, biological test results, clinical data, and literature review. State the overall biocompatibility conclusion with any conditions or limitations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
