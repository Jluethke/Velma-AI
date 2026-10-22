# Silicon Photonic Ring And Filter Design

Design ring resonators and wavelength filters for WDM multiplexing, switching, and sensing applications on the silicon photonic platform.

## Inputs

- `waveguide-design`: Waveguide dimensions, effective index, group index, propagation loss
- `modulator-design`: Modulator specifications if rings are used for modulation (ring modulator)

## Outputs

- `ring-resonator-design`: Ring radius, coupling gap, coupling coefficient (kappa), free spectral range (FSR), Q-factor, finesse, extinction ratio, through and drop port spectra
- `thermal-tuning-design`: Heater type (doped Si or metal), heater resistance, power per FSR tuning, thermal time constant, feedback control for wavelength locking

## Process

1. Compute the free spectral range: FSR = lambda^2 / (n_g * 2*pi*R) where n_g is the group index and R is the ring radius. For n_g = 4.2 and R = 10um: FSR = 9.1nm at 1550nm. For WDM with 100GHz (0.8nm) channel spacing, FSR must exceed the channel count * spacing, so FSR > N_channels * 0.8nm.
2. Design the coupling region: the coupling coefficient kappa^2 is set by the gap between the bus waveguide and the ring, and the coupling length. For a point coupler (no straight coupling section): kappa depends exponentially on the gap. Typical gap: 100-200nm for 220nm SOI. Use a directional coupler (straight coupling section) for precise kappa control.
3. Compute the Q-factor and extinction ratio. For an all-pass ring (single bus): Q = (pi * n_g * L_rt * sqrt(a * r)) / (lambda * (1 - a*r)) where a = round-trip amplitude transmission and r = self-coupling coefficient (r^2 + kappa^2 = 1). Critical coupling (maximum extinction) when a = r. For add-drop (two bus waveguides): design symmetric coupling for flat-top passband.
4. Thermal tuning: silicon has dn/dT = 1.86e-4 /K. One FSR tuning requires delta_T = FSR * n_g / (lambda * dn/dT). For FSR = 9nm: delta_T = 9e-9 * 4.2 / (1550e-9 * 1.86e-4) = 131K. Power dissipation depends on the thermal resistance of the heater structure to the substrate. Typical: 20-50 mW per FSR for a micro-heater directly above the ring.
5. For wavelength locking: monitor the through-port power with an integrated Ge photodetector. Use a dither-and-lock feedback loop: modulate the heater current at a frequency above the signal bandwidth, demodulate the detected power at the dither frequency, and drive the heater to maintain the ring resonance at the signal wavelength. Bandwidth of the control loop: > 1 kHz to track thermal transients.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
