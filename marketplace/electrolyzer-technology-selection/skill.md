# Electrolyzer Technology Selection

Select the electrolysis technology by matching application requirements to the operating characteristics, efficiency, and maturity of PEM, alkaline, and solid oxide electrolyzers.

## Inputs

- `production-target`: Required hydrogen output in kg/day or Nm3/hr, purity specification, and delivery pressure
- `power-source-profile`: Electricity source (grid, solar, wind, hybrid), variability profile, availability factor, and cost per MWh

## Outputs

- `electrolyzer-selection`: Selected technology with rated capacity, stack efficiency curve, turndown ratio, ramp rate, and expected stack lifetime
- `technology-comparison`: Side-by-side comparison of PEM, alkaline, and SOEC on efficiency, cost, durability, dynamic response, and technology readiness

## Process

1. Characterize the duty cycle. If the power source is variable (solar or wind), the electrolyzer must handle frequent load changes. PEM electrolyzers respond in seconds and tolerate 5-100% load range. Alkaline electrolyzers are slower (minutes for large load steps) with a typical minimum load of 20-40%. SOEC operates at high temperature (700-850C) and is best suited for steady-state baseload operation where waste heat is available.
2. Compare stack efficiency. The thermodynamic minimum for water splitting is 39.4 kWh per kg H2 (higher heating value basis). PEM stacks operate at 50-65 kWh/kg at rated power. Alkaline stacks achieve 50-60 kWh/kg. SOEC achieves 35-45 kWh/kg by substituting heat for electricity (Faradaic efficiency above 95% at operating temperature). Express efficiency as kWh per kg H2 or as a percentage of HHV (HHV of H2 = 39.4 kWh/kg).
3. Evaluate capital cost and stack lifetime. PEM: higher capital cost (800-1500 $/kW) but improving rapidly; stack lifetime 60,000-80,000 hours. Alkaline: lower capital cost (500-1000 $/kW), more mature supply chain; stack lifetime 80,000-100,000 hours. SOEC: highest capital cost currently (1500-3000 $/kW), limited commercial deployment; stack degradation is the main challenge (1-3% per 1000 hours).
4. Assess water quality requirements. PEM requires deionized water (less than 1 microsiemens/cm conductivity) to protect the proton exchange membrane. Alkaline uses a KOH electrolyte (25-30% concentration) and is less sensitive to water purity. SOEC uses steam, which must be clean but not ultrapure. Water consumption is approximately 9 liters per kg H2 produced.
5. Select based on the application fit. For renewable-coupled (variable power): PEM for its dynamic response, unless budget constraints favor alkaline with an intermediate buffer. For industrial baseload with available heat: SOEC for its superior electrical efficiency. For cost-sensitive, steady-state grid-connected: alkaline for its lower capital cost and proven durability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
