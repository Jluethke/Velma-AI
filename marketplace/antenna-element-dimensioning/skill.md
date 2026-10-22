# Antenna Element Dimensioning

Calculate the initial physical dimensions of the selected antenna type from analytical models, then refine in simulation.

## Inputs

- `antenna-specification`: Frequency, gain, bandwidth, polarization requirements
- `candidate-antenna-types`: Selected antenna type with trade-off justification

## Outputs

- `antenna-dimensions`: Physical dimensions: element length/width, substrate thickness and dielectric constant (for patch), aperture size (for horn/dish), element spacing (for array)
- `feed-design`: Feed mechanism: probe feed position, aperture-coupled slot dimensions, microstrip feed line width, or coaxial feed point location

## Process

1. For a rectangular microstrip patch: length L = c/(2*f*sqrt(epsilon_eff)) - 2*delta_L, where epsilon_eff is the effective dielectric constant accounting for fringing and delta_L is the fringing extension. Width W = c/(2*f) * sqrt(2/(epsilon_r + 1)) for good radiation efficiency.
2. For a patch, select the substrate: thicker substrate (0.02 to 0.05 lambda) gives wider bandwidth but more surface wave loss. Lower dielectric constant gives wider bandwidth but larger size. FR-4 works below 2 GHz; use Rogers or similar PTFE substrates above 2 GHz for lower loss.
3. For probe feed: the feed point is offset from center along the length. The input impedance varies from 0 (center) to approximately 150 to 300 ohms (edge) sinusoidally. Place the probe where Rin = 50 ohms. The offset approximately = L * acos(sqrt(50/R_edge)) / pi.
4. For a horn antenna: the aperture dimensions set the gain. For a pyramidal horn, G = (4*pi*A_e)/(lambda^2) where A_e = epsilon_ap * A_physical and epsilon_ap is aperture efficiency (0.5 to 0.6 typical). The flare length must satisfy the phase error criterion: maximum phase error across the aperture should be less than pi/4 for good efficiency.
5. For an array: element spacing d = lambda/2 for maximum scan range without grating lobes. For a fixed beam, d can be larger. The array factor determines the beam shape: uniform illumination gives the narrowest beam but highest sidelobes (-13.2 dB). Tapered illumination (Taylor, Chebyshev) reduces sidelobes at the cost of wider beam.
6. Document all initial dimensions with the formulas and assumptions used. These are starting points for simulation refinement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
