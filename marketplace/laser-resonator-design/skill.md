# Laser Resonator Design

Design the optical resonator for stability, mode size, and output coupling using ABCD matrix propagation and stability criteria.

## Inputs

- `gain-medium-selection`: Selected gain medium and its properties
- `emission-cross-section-data`: Gain cross-section and saturation intensity
- `beam-quality-requirement`: Target M-squared and mode

## Outputs

- `resonator-layout`: Mirror curvatures, separations, and folding geometry
- `mode-size-profile`: Beam waist size at each point in the cavity including in the gain medium
- `output-coupler-spec`: Output coupler reflectivity for maximum output power given gain and loss

## Process

1. Choose resonator type. Plane-parallel for high energy storage but alignment-sensitive. Confocal for minimum diffraction loss but tight tolerance. Hemispherical (one flat, one curved mirror) is the workhorse for stability. Ring cavity for unidirectional operation (eliminates spatial hole burning).
2. Apply the stability condition: 0 <= g1*g2 <= 1 where gi = 1 - L/Ri. Plot the stability diagram. Select mirror radii that place the operating point away from the stability boundary for tolerance to thermal lensing.
3. Calculate the TEM00 mode size at each point using the ABCD matrix. Beam waist w0 = sqrt(lambda*L/pi * sqrt(g1*g2*(1-g1*g2)/(g1+g2-2*g1*g2)^2)). The mode must fill the gain medium adequately to extract stored energy (mode-gain overlap > 80%) without clipping on apertures.
4. For high power, include thermal lensing of the gain medium as an intracavity lens in the ABCD matrix. The thermal lens focal length f_th = K*A / (dn/dT * P_heat) where K is thermal conductivity, A is pump area, dn/dT is thermo-optic coefficient, P_heat is absorbed pump power minus laser output. Track stability versus pump power.
5. Optimize output coupler reflectivity. Use Rigrod analysis: P_out = I_sat * A * (ln(1/R) * (2*g0*l/total_loss - 1)) / (1 + sqrt(R/(R*exp(-2*alpha*L)))). Find the R that maximizes P_out numerically. Typical values range from 2% (high gain) to 90% (low gain, e.g. HeNe).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
