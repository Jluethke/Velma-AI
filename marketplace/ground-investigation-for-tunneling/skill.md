# Ground Investigation For Tunneling

Plan and execute the ground investigation campaign needed before tunnel design: boreholes, CPT, geophysics, and groundwater characterization.

## Inputs

- `tunnel-alignment-corridor`: Proposed horizontal and vertical alignment corridor with surface constraints
- `tunnel-diameter-range`: Expected excavated diameter range from functional requirements

## Outputs

- `ground-model`: Interpreted geotechnical model along alignment: soil/rock stratigraphy, strength parameters, permeability, groundwater levels
- `investigation-risk-register`: Residual uncertainties in ground model with their spatial extent and consequence

## Process

1. Start with desk study: geological maps, historical boreholes, aerial photographs, and records of previous construction in the corridor.
2. Define borehole spacing by ground variability. 50 to 100 m spacing in uniform geology, 25 to 50 m at transitions, fault zones, or where cover is thin.
3. Select in-situ tests by ground type. CPTu for soft ground (provides continuous profile of qt, fs, u2). SPT in granular soils where CPT refusal occurs. Pressuremeter in rock for deformability. Vane shear in soft clay for undrained strength.
4. Plan laboratory program: classification tests on every sample, strength tests (UU, CU, CD triaxial) at intervals, consolidation tests in compressible layers, permeability tests in aquifers. Include abrasivity tests (CAI, LCPC) in rock for cutter life prediction.
5. Install piezometers at multiple depths to characterize groundwater regime: perched water, artesian pressures, tidal influence near coasts. Run pumping tests if dewatering or ground treatment is anticipated.
6. Run geophysical surveys (seismic refraction, MASW, ERT) between boreholes to interpolate stratigraphy and detect anomalies (voids, buried structures, boulders in glacial till).
7. Build interpreted ground model: longitudinal section along alignment with soil/rock units, strength envelopes, groundwater levels, and expected TBM behavior zones. Flag transitions between ground types as high-risk reaches.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
