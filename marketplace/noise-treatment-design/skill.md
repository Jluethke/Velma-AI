# Noise Treatment Design

Design noise control treatments including barriers, enclosures, damping, and absorbers sized to meet the target reduction.

## Inputs

- `source-ranking`: Ranked noise sources with contributions
- `path-characterization`: Airborne and structure-borne paths with relative contributions
- `dominant-frequencies`: Frequency bands requiring reduction
- `noise-target`: Target noise level or reduction requirement

## Outputs

- `treatment-design`: Specified noise control treatments with predicted insertion loss for each path
- `predicted-reduction`: Expected noise level at receiver after treatment, verified against target
- `treatment-specifications`: Material specifications, dimensions, mounting details, and installation requirements

## Process

1. Address the dominant path first. If 90% of noise comes from one path, treating secondary paths has no effect (logarithmic addition: two equal sources are only 3 dB above one).
2. For airborne paths through panels: increase transmission loss. Mass law gives 6 dB per doubling of surface density at a given frequency. Coincidence frequency limits single-wall performance; design the wall so coincidence falls outside the problem frequency range. Double-wall construction with an air gap provides TL exceeding mass law above the mass-air-mass resonance frequency.
3. For barriers (partial enclosures, screens): calculate insertion loss from the Maekawa chart using Fresnel number N = 2*delta/lambda where delta is the path length difference over vs around the barrier. Minimum practical insertion loss for a barrier is about 5 dB; maximum about 20 dB, limited by flanking over and around edges.
4. For enclosures: design for insertion loss equal to the required reduction plus a margin for flanking. Identify every penetration (piping, wiring, ventilation) and treat each to the same TL as the wall. Ventilation openings require silencers: absorptive for broadband, reactive for tonal.
5. For structure-borne paths: apply damping treatment to vibrating surfaces. Constrained layer damping is effective for thin panels (loss factor increase of 0.01 to 0.1). Free-layer damping works where constrained layer is impractical. Target the damping to the radiating surface and the frequency range that dominates.
6. For absorption treatment inside reverberant spaces: calculate the required absorption increase from the Sabine equation delta_L = 10*log10(A_after/A_before). Select absorber material and thickness: porous absorber thickness should be at least one-quarter wavelength of the lowest frequency to treat. Mount absorbers on surfaces with highest particle velocity.
7. Predict total noise at the receiver after all treatments by subtracting each treatment's insertion loss from its corresponding path contribution. Verify the sum meets the target. If not, identify the next limiting path and add treatment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
