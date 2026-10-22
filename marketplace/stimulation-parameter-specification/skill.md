# Stimulation Parameter Specification

Define stimulation parameters from the therapeutic target, ensuring charge-balanced waveforms within the electrochemical safety window of the electrode material.

## Inputs

- `therapeutic-objective`: What the stimulation must achieve (tremor suppression in Parkinson's, seizure termination, pain relief, motor cortex activation for BCI)
- `electrode-design`: Electrode material, geometry, impedance, and number of contacts available for stimulation

## Outputs

- `stimulation-parameters`: Waveform shape (biphasic, symmetric/asymmetric), pulse width, frequency, amplitude (current or voltage), inter-phase gap, and duty cycle
- `charge-safety-analysis`: Charge per phase, charge density, position relative to Shannon safety limit, and maximum safe parameters for the electrode

## Process

1. Select waveform shape. Charge-balanced biphasic pulses are mandatory for chronic stimulation to prevent electrode corrosion and tissue damage from net DC charge. Cathodic-first (negative first) is standard for neural activation (depolarizes at the electrode, lower threshold than anodic). Asymmetric biphasic (short cathodic, longer lower-amplitude anodic) is more charge-efficient: the cathodic phase activates, the anodic phase recovers charge at lower amplitude to avoid anodic block. Include an inter-phase gap of 25-100 us between phases to prevent the anodic phase from immediately canceling cathodic activation.
2. Set pulse width and frequency from the therapeutic literature. Deep brain stimulation for Parkinson's tremor: 60-90 us pulse width, 130-185 Hz frequency, 1-5 mA amplitude (for microelectrodes) or 1-5 V (for macroelectrodes). Cortical stimulation for motor activation: 200-400 us, 50-300 Hz. Spinal cord stimulation for pain: 200-500 us, 40-100 Hz. Vagus nerve stimulation: 250-500 us, 20-30 Hz. Start at the lowest effective parameters and increase to minimize energy consumption and tissue exposure.
3. Calculate charge per phase: Q = I x PW (for current-controlled) where I is amplitude and PW is pulse width. Charge density = Q / electrode_area. Apply the Shannon safety limit: log(Q/phase) + log(charge_density) should be less than k, where k = 1.5-2.0 (conservative to aggressive). For a 1 mm diameter electrode (area = 0.785 mm2) at 3 mA x 100 us = 0.3 uC/phase: charge density = 0.38 uC/cm2. Log(0.3e-6) + log(0.38) = -6.52 + (-0.42) = -6.94, well within the k=1.5 limit. For microelectrodes (15 um diameter), the small area makes charge density the binding constraint.
4. Calculate compliance voltage: V_compliance must exceed I_stim x Z_electrode + V_tissue. For a 10 kOhm electrode at 1 mA, 10 V across the electrode plus 1-2 V tissue voltage requires at least 12 V compliance. Higher compliance voltage increases power consumption. For battery-powered implants (3.7 V lithium cell), a charge pump or boost converter is needed to reach typical 12-18 V compliance. This is a major power consumer in implantable stimulators.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
