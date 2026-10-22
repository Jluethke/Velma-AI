# Hydrogen Efficiency And Cost Model

Build the efficiency chain and cost model: LCOH calculation, sensitivity to electricity price, and comparison against incumbent hydrogen production methods.

## Inputs

- `bop-design`: BOP equipment sizing and energy consumption
- `process-flow-diagram`: Mass and energy balance for efficiency calculation

## Outputs

- `efficiency-chain`: Electrical-to-hydrogen efficiency at rated and partial load, including all parasitic loads (BOP, compression, cooling)
- `lcoh-analysis`: Levelized cost of hydrogen in $/kg with breakdown by electricity, capex, stack replacement, and O&M, plus sensitivity to key variables

## Process

1. Calculate the overall system efficiency. Start with stack efficiency (kWh_DC / kg_H2), add rectifier losses (2-4%), BOP parasitics (pumps, fans, controls: 3-8% of rated power), compression energy, and cooling energy. The total specific energy consumption for a PEM system is typically 55-70 kWh/kg H2 including all parasitics. Express as a percentage of HHV: system efficiency = 39.4 / total_kWh_per_kg x 100%.
2. Build the LCOH model. LCOH = (Annualized_Capex + Annual_Opex + Annual_Stack_Replacement_Cost + Annual_Electricity_Cost) / Annual_H2_Production. Annualized capex uses CRF (capital recovery factor) from discount rate and project life. Stack replacement is a periodic cost (every 7-10 years for PEM, 10-12 years for alkaline) discounted to present value.
3. Electricity cost dominates LCOH. At 50 $/MWh and 55 kWh/kg, electricity alone is 2.75 $/kg H2. At 20 $/MWh (low-cost renewables), it drops to 1.10 $/kg. Capex contribution at current PEM costs (1000 $/kW, 4000 full-load hours) is approximately 1.50-2.00 $/kg. O&M adds 0.20-0.50 $/kg. Total LCOH for green hydrogen today is typically 3-6 $/kg depending on electricity cost and utilization.
4. Run sensitivity analysis. The variables with the largest impact: electricity price (+/- 10 $/MWh), capacity factor (+/- 1000 hours), stack efficiency degradation rate (+/- 0.5%/year), capex (+/- 30%), and stack replacement cost (+/- 50%). Present as a tornado chart. The breakeven electricity price against grey hydrogen (SMR at 1.50-2.00 $/kg with no carbon price) is approximately 15-25 $/MWh.
5. Evaluate the round-trip efficiency for power-to-gas-to-power (P2G2P). Electrolysis at 65% efficiency, compression at 90%, storage losses negligible for short-term, fuel cell or turbine at 40-60% efficiency. Total round-trip: 23-35%. This makes hydrogen energy storage expensive compared to batteries for short duration but competitive for seasonal storage where the alternative is curtailment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
