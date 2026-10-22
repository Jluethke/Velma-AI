# Driver Design And Characterization

Design or select a loudspeaker driver and characterize its Thiele-Small parameters for enclosure modeling.

## Inputs

- `audio-requirements`: Target frequency range, sensitivity, power handling, and directivity pattern for the loudspeaker system
- `size-constraints`: Maximum driver diameter and enclosure volume available

## Outputs

- `driver-selection`: Selected or designed driver(s) with Thiele-Small parameters (Fs, Qes, Qms, Qts, Vas, Sd, xmax, sensitivity)
- `driver-model`: Equivalent circuit model of the driver for frequency response prediction
- `power-handling`: Thermal and mechanical power limits with duty cycle considerations

## Process

1. Define the driver count and type from the frequency range. Subwoofer (20-200 Hz): 200-460 mm cone. Woofer (40-500 Hz): 130-300 mm. Midrange (200 Hz-5 kHz): 75-130 mm. Tweeter (2 kHz-20 kHz): 19-38 mm dome or ribbon.
2. Measure or obtain Thiele-Small parameters. Fs (free-air resonance): from impedance measurement, the frequency at the impedance peak. Qes (electrical Q): from impedance curve fitting. Qms (mechanical Q): similarly. Qts = Qes*Qms/(Qes+Qms). Vas (equivalent compliance volume): from shift in resonance when a known mass is added to the cone.
3. For custom driver design: motor strength BL product determines sensitivity and Qes. Higher BL gives lower Qes (more electrical damping) and higher sensitivity. Cone mass Mms affects Fs and sensitivity: lighter cone = higher sensitivity but higher Fs. The trade-off between sensitivity and low-frequency extension is fundamental.
4. Model the driver as a lumped electromechanical circuit: voice coil resistance Re, inductance Le, BL product transformer, mechanical mass Mms, compliance Cms, and damping Rms. This circuit predicts impedance and frequency response in any enclosure.
5. Check excursion limits: at low frequencies the driver must not exceed xmax (linear excursion limit). Maximum SPL below Fs is limited by xmax: SPL_max = 112 + 20*log10(Sd*xmax*f^2) in dB at 1m, where Sd is effective piston area.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
