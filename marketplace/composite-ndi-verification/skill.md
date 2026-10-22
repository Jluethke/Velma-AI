# Composite Ndi Verification

Select and apply non-destructive inspection methods to verify the composite structure meets acceptance criteria, with defect disposition methodology.

## Inputs

- `manufacturing-plan`: Manufacturing process and quality targets for the composite part
- `process-quality-requirements`: Void content, delamination, and dimensional acceptance criteria

## Outputs

- `ndi-results`: Inspection results mapped to the acceptance criteria with pass/fail and defect location data
- `defect-disposition`: Engineering disposition for any detected defects (accept, repair, scrap) with substantiation

## Process

1. Select NDI method by defect type. Pulse-echo ultrasonic (A-scan/C-scan) for delaminations and voids: detects features larger than about half the wavelength (typically 0.5-1mm at 5MHz for carbon/epoxy). Through-transmission ultrasonic (TTU) for thick sections or attenuating materials. Thermography (flash or lock-in) for near-surface delaminations and water ingress in sandwich structures.
2. For ultrasonic C-scan: set the gate to capture the full laminate thickness. Calibrate the attenuation threshold using a reference standard with flat-bottom holes of known diameter (typically 6mm and 12mm). Scan at a pitch of 1mm or finer for aerospace primary structure. Map the attenuation data to create a full-area image of the part.
3. For sandwich structures: use bond testers (mechanical impedance analysis or resonance methods) to detect skin-to-core disbonds. X-ray or CT for core crush, node bond failure, and potting compound voids. Shearography for rapid full-field detection of disbonds under thermal or vacuum loading.
4. Interpret results against the accept/reject criteria. Typical aerospace criteria: no delamination larger than 6mm x 6mm (per contractual specification), no porosity above 2% by area in any inspection zone, no foreign object inclusion. For defects that exceed criteria, perform engineering disposition: repair if the defect can be removed and patched without exceeding the design allowable, scrap if structural integrity cannot be substantiated.
5. Document everything. The NDI report must include the method, equipment, calibration standard, scan parameters, operator certification level (NAS-410 / EN 4179 Level II or III), and the accept/reject determination for each inspection zone. Archive the raw scan data for the life of the structure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
