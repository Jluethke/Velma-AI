# Pv Financial Model

Build the financial model for a PV project: LCOE calculation, PPA pricing, degradation-adjusted cash flows, and sensitivity analysis on key variables.

## Inputs

- `annual-energy-yield`: P50 and P90 energy production estimates
- `loss-chain-breakdown`: Itemized losses for cost-benefit analysis of mitigation measures

## Outputs

- `lcoe-analysis`: Levelized cost of energy in $/MWh with all-in cost assumptions and degradation schedule
- `project-economics`: IRR, NPV, payback period, DSCR at P90, and sensitivity tornado chart on key variables

## Process

1. Calculate LCOE: total lifecycle cost (capex + NPV of opex + NPV of inverter replacement + decommissioning) divided by NPV of lifetime energy production. Use a real discount rate (nominal minus inflation). Typical utility-scale LCOE components: modules 25-35%, inverters 5-8%, BOS 20-30%, soft costs 15-25%, O&M NPV 10-15%.
2. Build the degradation schedule. Year 1 degradation (LID + initial settling) is typically 2-3%. Subsequent annual degradation is 0.4-0.6% per year for crystalline silicon. Bifacial modules may degrade slightly faster on the rear side. The degradation rate is the single largest uncertainty in 25-35 year production estimates.
3. Model PPA pricing. The PPA price must cover debt service (DSCR of 1.3-1.4x at P90 energy for investment-grade financing), equity return (levered IRR target, typically 8-12%), and O&M escalation. PPA escalators of 1-2% per year are common but reduce competitiveness against flat PPAs.
4. Run sensitivity analysis. The variables with the largest impact on IRR are typically: energy yield (+/- 5%), capex (+/- 10%), PPA price (+/- $5/MWh), degradation rate (+/- 0.1%/yr), and discount rate (+/- 1%). Present results as a tornado chart showing IRR sensitivity to each variable independently.
5. Assess bankability risk factors. Lenders evaluate: technology risk (module warranty, inverter replacement schedule), resource risk (P90 vs P50 spread), curtailment risk (grid constraints), offtaker credit quality, and insurance coverage. The gap between P50 and P90 energy directly determines the debt sizing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
