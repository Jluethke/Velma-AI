# Safety Classification Insulation Design

Classify the device and design the insulation system: MOPP/MOOP determination, creepage and clearance, and protective earth requirements.

## Inputs

- `device-electrical-architecture`: Power supply topology, patient connections, operator interface, signal paths
- `applied-parts-definition`: Parts of the device intended to contact the patient, and the type of contact (surface, invasive, cardiac)

## Outputs

- `safety-classification`: Protection class (I or II), applied part type (B, BF, CF), and insulation diagram showing MOPP and MOOP requirements
- `insulation-design-specification`: Creepage, clearance, and dielectric withstand requirements for each insulation barrier

## Process

1. Classify applied parts: Type B (no direct patient connection or connection that is not critical), Type BF (direct patient connection, floating), Type CF (direct cardiac connection, floating). CF requires the highest level of protection against leakage current through the patient connection.
2. Determine means of protection: MOPP (means of operator protection) and MOOP (means of patient protection). Between mains and the patient-connected circuit of a CF applied part, 2 MOPP are required. Between mains and the enclosure, 1 MOOP for Class I (with protective earth) or 2 MOOP for Class II (double insulation).
3. For each insulation barrier, determine creepage and clearance from IEC 60601-1 Table 11 and Table 13. Values depend on working voltage (peak and RMS), pollution degree (typically PD2 for medical devices), and material group (I, II, IIIa, IIIb based on CTI of the insulating material).
4. Design the dielectric withstand: each MOPP must withstand the test voltage from IEC 60601-1 Table 6 (typically 1500Vrms for mains-rated MOPP, 4000Vrms for reinforced/double insulation). Design PCB spacing and transformer construction to pass this test with margin.
5. For Class I devices, design the protective earth connection: low-impedance path from accessible conductive parts to the earth terminal. Resistance below 0.1 ohms at 25A for 10 seconds per IEC 60601-1 clause 8.6.4.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
