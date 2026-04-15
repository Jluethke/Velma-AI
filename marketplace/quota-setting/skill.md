# Quota Setting

**One-line description:** Sales leadership and finance each submit their real pipeline read and revenue targets — AI models what is actually achievable, names the gap, and produces a quota plan both sides can commit to.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both sales leadership and finance must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_fiscal_period` (string, required): The period quotas are being set for.

### Sales Leadership Submits Privately
- `sales_territory_capacity` (object, required): Reps, territories, and capacity by segment/region.
- `sales_pipeline_reality` (object, required): Current pipeline coverage, quality assessment, conversion rates from prior periods.
- `sales_market_conditions` (string, required): What is the market doing? Headwinds, tailwinds, competitive changes.
- `sales_team_morale_risks` (string, required): At what quota level does the team stop believing it's achievable? What happens to retention?
- `sales_what_is_achievable` (object, required): What number does sales believe is realistic and stretching but attainable?

### Finance Lead Submits Privately
- `finance_revenue_targets` (object, required): What revenue number does finance need the business to hit?
- `finance_board_commitments` (object, required): What has been committed to the board or investors?
- `finance_comp_budget` (object, required): What is the OTE budget? What does it cost to pay out at 100% vs. 120% attainment?
- `finance_margin_requirements` (object, required): What margin requirements does the revenue target need to support?
- `finance_concerns_about_sales_estimates` (array, required): Where does sales' pipeline reality seem optimistic to finance?

## Outputs
- `quota_model` (object): Proposed quotas by rep/territory/segment.
- `attainment_probability_assessment` (object): Likelihood of hitting each quota level given pipeline and market conditions.
- `territory_allocation` (object): How quotas are distributed across territories and segments.
- `comp_plan_alignment` (object): Total comp cost at various attainment levels against comp budget.
- `risk_scenarios` (array): What happens to revenue if pipeline converts at 10% below expectation, 20% below, etc.
- `negotiated_quota_recommendation` (object): A specific quota recommendation with the tradeoffs stated.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm pipeline data and revenue targets present.
**Output:** Readiness confirmation.
**Quality Gate:** Pipeline coverage data and corporate revenue target both present.

---

### Phase 1: Stress-Test the Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare sales' achievable number against finance's required number — state the gap in dollars. 2. Check sales' pipeline coverage and conversion assumptions against historical actuals. 3. Identify where finance's concerns about optimistic assumptions are warranted vs. unfounded. 4. Model what the board commitment requires per rep at current team capacity.
**Output:** Gap calculation, pipeline assumption stress test, per-rep target requirement.
**Quality Gate:** Gap is specific — "$X million between what sales believes is achievable and what finance needs."

---

### Phase 2: Model Attainment Probability
**Entry Criteria:** Gap quantified.
**Actions:** 1. Model attainment probability at three quota levels: sales' achievable number, finance's required number, and a midpoint. 2. For each level: probability of hitting it given pipeline coverage and conversion rates. 3. Model comp cost at each level — what does it cost to pay out at 100%, 80%, and 60% attainment? 4. Model the morale/retention risk at each level.
**Output:** Attainment probability at three quota levels, comp cost model, retention risk assessment.
**Quality Gate:** Attainment probabilities are based on pipeline data, not opinion.

---

### Phase 3: Build the Quota Plan
**Entry Criteria:** Attainment modeled.
**Actions:** 1. Recommend the quota level that maximizes the probability of hitting it while meeting the minimum viable board commitment. 2. Allocate quotas across territories/segments based on capacity and pipeline distribution. 3. Identify what closing that gap requires — additional headcount, pipeline investment, or board expectation reset. 4. Build the risk scenarios.
**Output:** Quota recommendation with territory allocation, gap-closing options, risk scenarios.
**Quality Gate:** Recommendation is a specific number, not a range. Gap-closing options are actionable.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present gap between sales' view and finance's requirement. 2. Present attainment probability model. 3. Deliver quota recommendation with territory allocation. 4. Deliver comp plan alignment. 5. State risk scenarios.
**Output:** Full synthesis — gap analysis, attainment model, quota plan, comp alignment, risk scenarios.
**Quality Gate:** Sales leadership and finance can present this quota plan to the board together.

---

## Exit Criteria
Done when: (1) gap between achievable and required stated in specific dollars, (2) attainment probability modeled at three levels, (3) quota plan with territory allocation, (4) comp cost modeled at attainment scenarios, (5) gap-closing options identified.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
