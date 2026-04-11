# Forecast Alignment

**One-line description:** Business unit and finance each submit their real forecast and the assumptions underneath it — Claude stress-tests the assumptions, models risk scenarios, and produces an agreed forecast with the confidence level explicitly stated.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both business unit and finance must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_forecast_period` (string, required): Forecast period. e.g., "Q3 2026," "FY2027."

### Business Unit Lead Submits Privately
- `bu_revenue_forecast` (object, required): Revenue forecast by month or quarter with total.
- `bu_assumptions` (object, required): The key assumptions driving the forecast — pipeline conversion, deal timing, average contract value, new business vs. renewals.
- `bu_pipeline_and_backlog` (object, required): Current pipeline and backlog that supports the forecast. Coverage ratio.
- `bu_risks_to_forecast` (array, required): What could cause you to miss? What are the most likely downside scenarios?
- `bu_upside_scenarios` (object, required): What would have to happen to exceed the forecast?

### Finance / FP&A Lead Submits Privately
- `finance_corporate_target` (object, required): What the corporate plan requires from this business unit.
- `finance_concerns_about_bu_forecast` (array, required): Where does the BU forecast look optimistic, unsupported, or inconsistent with historical patterns?
- `finance_historical_forecast_accuracy` (object, required): How accurate has this BU's forecasting been? Bias and variance.
- `finance_what_needs_to_be_true` (array, required): What assumptions must hold for the BU to hit the forecast?
- `finance_sensitivity_analysis_requests` (array, required): What scenarios do you want modeled — pipeline conversion, deal timing, attrition?

## Outputs
- `forecast_gap_analysis` (object): The gap between BU forecast and corporate target.
- `assumption_stress_test` (object): Each key assumption assessed against historical actuals and pipeline data.
- `risk_adjusted_forecast` (object): The forecast adjusted for the most likely downside scenarios.
- `upside_and_downside_scenarios` (array): Three scenarios — base, downside, upside — with the conditions for each.
- `confidence_assessment` (object): How confident is this forecast and what is the primary driver of uncertainty.
- `agreed_forecast_submission` (object): The forecast both sides are submitting, with the stated confidence level and key assumptions.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm BU forecast with assumptions and corporate target present.
**Output:** Readiness confirmation.
**Quality Gate:** BU forecast and corporate target both present.

---

### Phase 1: Stress-Test the Assumptions
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. For each key assumption, compare it against historical actuals — is the BU assuming a conversion rate, deal size, or timing that is higher than they have achieved historically? 2. Check pipeline coverage against the forecast — does the pipeline support the forecast at historical conversion rates? 3. Identify assumptions finance has flagged as optimistic and assess whether the concern is data-based. 4. Calculate the forecast at historical conversion rates vs. the BU's assumed rates.
**Output:** Assumption validity by assumption, pipeline coverage check, finance concern assessment, forecast-at-historical-rates.
**Quality Gate:** Every assumption has an assessment against historical data — not just finance's opinion.

---

### Phase 2: Model Scenarios
**Entry Criteria:** Assumptions stress-tested.
**Actions:** 1. Build three scenarios: base (BU forecast), downside (historical conversion rates applied), and upside (top-end assumptions). 2. For each scenario, identify the conditions that would cause it to materialize. 3. Calculate the gap between each scenario and the corporate target. 4. Assess which risks from the BU's list are most likely to drive downside.
**Output:** Three-scenario model, conditions for each, corporate target gap at each scenario, top downside risk drivers.
**Quality Gate:** Scenarios are based on specific assumption changes, not arbitrary haircuts. Each scenario has a probability-of-occurrence assessment.

---

### Phase 3: Build the Agreed Forecast
**Entry Criteria:** Scenarios modeled.
**Actions:** 1. Agree on a forecast to submit — typically the base case with risk adjustments if specific risks are high-probability. 2. State the confidence level explicitly — what probability does the BU assign to hitting the submitted forecast? 3. Identify the key assumptions that must hold and what happens if they do not. 4. Build the early warning indicators — what metrics, if trending wrong in month 1, would signal the forecast is at risk.
**Output:** Agreed forecast, confidence level, key assumption dependencies, early warning indicators.
**Quality Gate:** Confidence level is explicit — "80% confident at the submitted number" not "we believe we can hit it." Early warning indicators are specific metrics.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Forecast agreed.
**Actions:** 1. Present assumption stress test results. 2. Present three-scenario model. 3. Deliver risk-adjusted forecast. 4. Deliver agreed forecast submission with confidence level. 5. State early warning indicators.
**Output:** Full synthesis — assumption stress test, scenarios, risk-adjusted forecast, agreed forecast, early warnings.
**Quality Gate:** Finance and BU submit the same forecast with the same stated assumptions and confidence level.

---

## Exit Criteria
Done when: (1) every assumption assessed against historical actuals, (2) three scenarios with specific conditions, (3) corporate target gap at each scenario, (4) agreed forecast with explicit confidence level, (5) early warning indicators defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
