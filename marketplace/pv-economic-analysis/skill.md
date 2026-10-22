# Pv Economic Analysis

Compute the levelized cost of energy, financial returns, and project economics for the photovoltaic system.

## Inputs

- `system-design`: Total system size, component costs, installation costs
- `energy-yield-prediction`: Annual energy production and degradation rate

## Outputs

- `economic-analysis`: LCOE (cents/kWh), NPV, IRR, simple payback period, discounted payback period, cash flow table over the project lifetime
- `sensitivity-analysis`: LCOE sensitivity to module price, discount rate, degradation rate, electricity price escalation

## Process

1. LCOE = (sum of discounted lifetime costs) / (sum of discounted lifetime energy production). Costs include: CAPEX (modules, inverters, BOS, installation, permitting, interconnection), annual OPEX (O&M, insurance, land lease), and inverter replacement at year 12-15. Energy production degrades annually: E_year_n = E_year_1 * (1 - degradation_rate)^(n-1).
2. LCOE formula: LCOE = (CAPEX * CRF + OPEX_annual) / E_annual_year1 * (1 + d_deg) where CRF = r*(1+r)^N / ((1+r)^N - 1) is the capital recovery factor, r is the real discount rate, N is the project lifetime, and d_deg is the degradation correction factor.
3. For commercial projects: compute the after-tax IRR including the investment tax credit (ITC, currently 30% in the US), accelerated depreciation (MACRS 5-year), and the value of energy (retail rate for behind-the-meter, PPA rate for utility-scale). Cash flow: Year 0 = -CAPEX + ITC. Years 1-5: revenue - OPEX + depreciation tax shield. Years 6-N: revenue - OPEX.
4. Sensitivity analysis: vary each key parameter by +/- 20% and recompute LCOE. Plot a tornado diagram showing which parameters have the greatest impact. Typically: module price and discount rate dominate for utility-scale. Electricity price and self-consumption rate dominate for residential behind-the-meter.
5. Risk factors: module degradation faster than warranted (first-year LID can be 1-3% for PERC), inverter failure, extreme weather damage, curtailment (utility-mandated), PPA counterparty credit risk. Mitigation: bankable module warranty with independent engineering review, inverter service contract, insurance, PPA credit assessment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
