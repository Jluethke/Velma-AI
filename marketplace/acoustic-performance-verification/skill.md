# Acoustic Performance Verification

Measure the completed space against acoustic targets and verify compliance with specified reverberation, noise, and insulation criteria.

## Inputs

- `absorption-treatment-plan`: Installed acoustic treatments
- `reverberation-target`: Target RT60
- `noise-criteria`: Background noise target
- `sound-insulation-requirements`: Required STC/OITC

## Outputs

- `reverberation-measurement`: Measured RT60 by octave band at multiple positions compared to target
- `background-noise-measurement`: Measured background noise spectrum compared to NC/RC target
- `field-stc-measurement`: Measured field STC (FSTC) or NIC for partitions compared to laboratory STC requirement

## Process

1. Measure reverberation time per ISO 3382: use interrupted noise or impulse response method. Measure at minimum 3 source positions and 6 receiver positions distributed through the space. Report T20 or T30 (decay evaluated over 20 or 30 dB) by octave band from 125 Hz to 4 kHz.
2. Measure background noise with all HVAC operating at design conditions. Use a calibrated sound level meter with octave-band filters. Measure at multiple locations within the occupied zone. Plot against the NC or RC curves to determine the room's noise rating.
3. Measure field sound insulation per ASTM E336 or ISO 16283. Use a loudspeaker source in the sending room. Measure sound pressure levels in both rooms. Calculate the Noise Isolation Class (NIC) or field STC (FSTC). Field values are typically 5-10 points lower than laboratory STC due to flanking through shared structure, outlets, doors, and gaps.
4. Identify deficiencies and diagnose causes. If RT60 is too long, additional absorption is needed at the frequencies where it fails. If background noise exceeds NC curve, identify the spectral region: low-frequency excess is often the air handler or ductwork rumble; mid/high is often diffuser noise or terminal unit.
5. Document compliance with a formal report including measurement methodology, instrument calibration certificates, measurement positions, results by location, and comparison to criteria.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
