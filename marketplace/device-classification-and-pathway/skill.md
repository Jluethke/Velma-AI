# Device Classification And Pathway

Classify the neural device under FDA regulations and identify the appropriate premarket pathway (510(k), De Novo, or PMA).

## Inputs

- `device-description`: What the device does, its intended use, how it contacts the body (implanted, external, duration), and its risk level
- `predicate-device-search`: Results of searching FDA databases (510(k), PMA, De Novo) for similar devices already cleared or approved

## Outputs

- `regulatory-classification`: FDA product code, classification (Class I, II, or III), and recommended premarket pathway with rationale
- `regulatory-strategy`: Timeline, key submissions, standards to meet, and estimated cost for the selected pathway

## Process

1. Determine device classification. Most neural recording devices are Class II (510(k)) if they have a predicate (e.g., EEG systems with predicate to existing cleared EEG devices, product code GWQ). Implantable neural stimulators are typically Class III (PMA) due to high risk: deep brain stimulators (product code PFG), responsive neurostimulators (NeuroPace RNS is the predicate for seizure-responsive stimulation). Novel BCI devices with no predicate may use the De Novo pathway to establish a new classification.
2. For 510(k): identify a legally marketed predicate device with the same intended use and similar technological characteristics. If the new device differs from the predicate in technology (e.g., wireless vs wired), prepare to demonstrate substantial equivalence through bench testing, biocompatibility, and possibly clinical data. Performance data must show the new device is at least as safe and effective as the predicate. Timeline: 3-6 months for FDA review after submission.
3. For PMA (Class III): this requires clinical evidence of safety and effectiveness. Plan for an IDE (Investigational Device Exemption) to conduct a clinical trial before submission. The PMA submission includes: device description, manufacturing information, bench testing, biocompatibility (ISO 10993), electrical safety (IEC 60601), software documentation (IEC 62304), EMC testing, sterility validation, clinical trial data, and labeling. Timeline: 1-3 years for clinical trial plus 6-12 months for FDA review. Cost: typically 1-5 million USD for the clinical trial plus regulatory consultants.
4. For all pathways: identify applicable consensus standards. IEC 60601-1 (general safety and essential performance), IEC 60601-1-2 (EMC), IEC 62304 (software lifecycle for medical devices), ISO 14708 (implantable medical devices), ISO 10993 (biocompatibility), ISO 11607 (packaging validation), ISO 11135 or 11137 (sterilization). FDA recognizes these standards: declaring conformity reduces review burden. For cybersecurity of connected neural devices: follow FDA guidance on premarket cybersecurity (threat modeling, SBOM, update mechanism).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
