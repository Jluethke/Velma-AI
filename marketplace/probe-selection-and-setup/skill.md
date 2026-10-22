# Probe Selection And Setup

Select the correct oscilloscope probes for power supply measurements, understanding bandwidth limitations, loading effects, and the critical importance of probe grounding technique.

## Inputs

- `measurement-objectives`: What needs to be measured: output ripple, switching node voltage, gate drive waveform, current waveform, with expected voltage and frequency ranges
- `available-equipment`: Oscilloscope bandwidth and channel count, available probes (passive 10x, passive 1x, active differential, current probes)

## Outputs

- `probe-assignment`: Probe type assigned to each measurement point with rationale: bandwidth requirement, voltage range, common-mode rejection needs, and loading considerations
- `grounding-method`: Grounding method for each measurement: ground spring (tip-and-barrel) for ripple, standard ground clip for low-frequency, differential probe for high-side signals

## Process

1. For switching node voltage (fast transitions, 5-100ns edges, high voltage): use a standard 10x passive probe (500MHz bandwidth typical). The 10x attenuation reduces loading. The 10:1 ratio gives adequate resolution for signals above 1V. For GaN and SiC converters with sub-10ns edges, use a 500MHz+ active probe.
2. For output voltage ripple (millivolt-level AC riding on a DC rail): use a 1x passive probe or an active probe for maximum sensitivity. The scope must be AC-coupled or use the math channel (Ch1 - DC_offset) to see the millivolts of ripple on a multi-volt DC rail. Bandwidth-limit the scope to 20MHz to exclude high-frequency noise that is not true ripple.
3. Critical: ground lead technique. The standard 6-inch alligator ground clip adds 5-10nH of inductance, which creates a resonant antenna with the probe tip capacitance. At 100MHz, this picks up switching noise and adds 50-200mV of artifact. For ripple measurement, this artifact drowns the real signal. Use the tip-and-barrel method: remove the ground clip and use a short ground spring or bare wire soldered to a ground point within 5mm of the measurement point.
4. For high-side measurements (referenced to a switching node, not ground): use a differential probe. It has two inputs (+ and -) and rejects the common-mode voltage. Required CMRR: at 100V common mode and 10mV desired resolution, need >80dB CMRR. High-voltage differential probes (Tektronix, Teledyne LeCroy) provide 100:1 attenuation and >1kV common-mode range.
5. For gate drive waveforms: use a differential probe referenced to the MOSFET source (not circuit ground) to see the true Vgs. This is especially critical for high-side gate drive and for measuring Miller plateau and gate ringing. A standard probe referenced to circuit ground will show Vgs + source inductance noise.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
