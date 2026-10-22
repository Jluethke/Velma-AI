# Renewable Inverter Topology Selection

Select the inverter topology for grid-tied renewable applications based on power level, voltage, efficiency, and harmonic performance requirements.

## Inputs

- `system-requirements`: Power rating, DC input voltage range, AC grid voltage, efficiency target, and harmonic limits
- `application-context`: Solar/wind/battery, utility-scale or distributed, outdoor or indoor installation

## Outputs

- `topology-selection`: Selected topology with switching device ratings, number of levels, modulation strategy, and predicted efficiency curve
- `topology-trade-off-analysis`: Comparison of candidate topologies on efficiency, cost, complexity, harmonic performance, and common-mode voltage

## Process

1. Map the application to a topology class. Two-level voltage source inverter (VSI): simplest, lowest cost, adequate for string inverters up to 100kW. Three-level NPC (neutral point clamped): halves the device voltage stress and reduces output harmonics, standard for central inverters 500kW-4MW. T-type (three-level active NPC): combines advantages of two-level (fewer devices at zero crossing) and NPC (reduced dv/dt), suitable for 100-500kW. Modular multilevel converter (MMC): for HVDC and very high power.
2. Select switching devices. For 1500V DC systems: 1200V SiC MOSFETs or 1700V Si IGBTs in a two-level topology, or 900-1200V devices in a three-level. SiC offers lower switching losses (enabling higher switching frequency or higher efficiency) at higher cost per amp. Si IGBTs are cost-effective above 100kW and available in high-current modules. GaN is entering the market for lower-power string inverters.
3. Choose the modulation strategy. Space vector PWM (SVPWM) maximizes DC bus utilization (15% higher than sinusoidal PWM) and provides lower harmonic distortion. For three-level topologies, SVPWM with neutral point balancing prevents DC bus capacitor voltage drift. Discontinuous PWM reduces switching losses by clamping one phase to the rail for a portion of each cycle, trading harmonic performance for efficiency at partial load.
4. Predict the efficiency curve. Calculate losses at each operating point: conduction losses (from device I-V characteristics and current waveform), switching losses (from switching energy curves and switching frequency), and gate driver losses. For SiC at 16kHz switching frequency, typical inverter efficiency is 98.5-99% at rated power. Partial-load efficiency matters for solar (CEC-weighted efficiency emphasizes 10-75% loading).
5. Evaluate common-mode voltage. Two-level inverters generate high-frequency common-mode voltage steps equal to Vdc/2, causing leakage current through parasitic capacitances to ground. This is a concern for transformerless solar inverters (leakage current through PV module frame capacitance). Three-level topologies reduce common-mode steps to Vdc/4. H5, H6, and HERIC topologies specifically address common-mode voltage in single-phase transformerless applications.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
