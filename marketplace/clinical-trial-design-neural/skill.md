# Clinical Trial Design Neural

Design the clinical trial for a neural device including endpoints, patient population, trial structure, and safety monitoring.

## Inputs

- `regulatory-classification`: FDA pathway and classification
- `device-description`: Device function, intended use, target patient population

## Outputs

- `clinical-trial-protocol`: Trial design (randomized, single-arm, crossover), sample size, primary and secondary endpoints, inclusion/exclusion criteria, and duration
- `ide-submission-outline`: Structure of the IDE application including preclinical data package, risk analysis, and informed consent elements

## Process

1. Define the primary endpoint from the intended use. For a BCI typing device: typing speed in characters per minute compared to baseline (no-device) condition. For a DBS device for Parkinson's: change in UPDRS motor score (Part III) from pre-implant baseline to 6 or 12 months post-implant. For a seizure-responsive stimulator: percent reduction in seizure frequency compared to a pre-implant baseline period. The primary endpoint must be clinically meaningful, objectively measurable, and previously used in neural device trials for comparability.
2. Determine sample size from the expected effect size and variability. For DBS in Parkinson's: existing data shows a mean UPDRS improvement of 10-15 points with SD of 8-10 points. To detect a 10-point improvement (Cohen's d approximately 1.0) at alpha = 0.05, power = 0.9, need approximately 20 subjects per group. For a single-arm trial (no control group, comparing to baseline): approximately 15 subjects. Add 20% for dropout. For first-in-human BCI studies: initial safety cohorts may be as small as 3-5 subjects under a feasibility IDE.
3. Design the trial structure. For high-risk neural devices: a staggered enrollment is typical (first 3 subjects implanted sequentially with a safety review between each, then enrollment opens). Include a blinded assessment period if possible (for stimulation devices: randomize to stimulation ON vs OFF periods, with the patient blinded). Follow-up: minimum 1 year for implantable devices, with scheduled assessments at 1, 3, 6, and 12 months. Record all adverse events (device-related and procedure-related) with severity and relatedness classification.
4. Prepare the IDE submission package. Sections: (1) device description and intended use, (2) prior investigations (bench testing, animal studies with chronic implant histology, biocompatibility testing per ISO 10993), (3) risk analysis (ISO 14971, with risk/benefit for each identified hazard), (4) manufacturing summary (design controls per 21 CFR 820), (5) clinical investigation plan (the protocol above), (6) informed consent document (must include: surgical risks, device risks, alternative treatments, right to withdraw, long-term follow-up obligations), (7) IRB approval. Submit to FDA: 30-day default review, FDA may place a clinical hold if deficiencies are identified.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
