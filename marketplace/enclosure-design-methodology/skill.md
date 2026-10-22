# Enclosure Design Methodology

Design the loudspeaker enclosure (sealed, ported, or transmission line) optimized for the driver's Thiele-Small parameters.

## Inputs

- `driver-selection`: Driver with Thiele-Small parameters
- `driver-model`: Equivalent circuit model
- `audio-requirements`: Target frequency response shape and low-frequency extension
- `size-constraints`: Maximum enclosure volume

## Outputs

- `enclosure-specification`: Enclosure type, internal volume, port dimensions (if ported), and construction details
- `system-frequency-response`: Predicted anechoic frequency response of the driver-enclosure combination
- `group-delay`: Group delay vs frequency showing transient behavior of the design

## Process

1. Select enclosure type from Qts. Sealed: suits drivers with Qts between 0.3 and 0.7. Low Qts (0.3) in a sealed box gives an overdamped response (gradual rolloff, good transient). Qts = 0.707 in an appropriately sized sealed box gives a Butterworth (B2) alignment: maximally flat, -3 dB at Fc. Ported: suits drivers with Qts between 0.2 and 0.5 for extended bass.
2. For sealed enclosure: Vb = Vas / ((Qtc/Qts)^2 - 1) where Qtc is the desired system Q (0.707 for Butterworth). System resonance Fc = Fs*sqrt(Vas/Vb + 1). The response rolls off at 12 dB/octave below Fc.
3. For ported enclosure: use alignment tables (SBB4, QB3, SC4) indexed by Qts to find Vb and Fb (box tuning frequency). Size the port: area must be large enough that air velocity at maximum excursion stays below 5% of sound speed to avoid port noise. Port length from: L = (23562*Sd^2)/(Fb^2*Vb) - 0.73*sqrt(port_area).
4. Account for internal losses: stuffing in sealed boxes adds 15-20% to the effective volume. Damping material in ported boxes should not block the port. Brace the enclosure panels to push panel resonances above the operating range; unbraced panels radiate and color the sound.
5. Predict the system frequency response: combine the driver's electromechanical model with the enclosure acoustic load. Verify against the target. Plot group delay: a sealed box has monotonically decreasing group delay; a ported box has a group delay peak near the port tuning frequency that may be audible if excessive.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
