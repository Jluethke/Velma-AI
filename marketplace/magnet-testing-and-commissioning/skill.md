# Magnet Testing And Commissioning

Plan and execute the magnet test program from room-temperature checks through full-field operation and field quality measurement.

## Inputs

- `cryostat-design`: Cryostat and thermal shield design
- `current-lead-design`: Current lead specifications
- `heat-load-budget`: Expected heat loads at each stage

## Outputs

- `test-plan`: Complete test sequence from warm to cold to operating field
- `field-quality-measurement`: Multipole content and field map data
- `training-curve`: Quench current vs quench number and comparison to short sample limit

## Process

1. Room temperature tests: insulation resistance (megger at 1kV), DC resistance of each circuit, leak check of cryostat (helium leak detector, sensitivity 10^-10 mbar*L/s), alignment survey.
2. Cool-down: control thermal gradients (< 50K across the cold mass for Nb3Sn, limited by differential contraction), monitor resistance for superconducting transition, verify instrumentation at cold.
3. Training: ramp current in steps, record quench current for each quench. Plot training curve. Compare to short-sample critical current at operating temperature and peak field. A well-built magnet reaches 90-95% of short sample within 1-3 quenches for Nb3Sn, often first quench for NbTi.
4. Field quality measurement: rotating coil (harmonic coil) or Hall probe mapping. Extract normal and skew multipole coefficients (b_n, a_n) in units of 10^-4 at reference radius. Compare to specifications. Measure at multiple currents to separate geometric and magnetization contributions.
5. Operational tests: ramp rate dependence of quench current, stability under mechanical disturbances, long-duration operation at design current, quench protection system functional test, measure actual heat loads and compare to budget.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
