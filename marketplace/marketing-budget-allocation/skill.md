# Marketing Budget Allocation

**One-line description:** Marketing and finance each submit their real channel data and budget constraints — AI models ROI by channel, names the pipeline impact of cuts, and produces an allocation both sides can defend.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both marketing and finance must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_fiscal_period` (string, required): Planning period.

### Marketing Lead Submits Privately
- `marketing_channel_performance` (object, required): Historical performance by channel — spend, pipeline generated, CAC, conversion rates.
- `marketing_proposed_allocation` (object, required): Proposed budget by channel with rationale.
- `marketing_pipeline_targets` (object, required): What pipeline volume is marketing expected to generate?
- `marketing_what_gets_cut_if_reduced` (object, required): If you get 20% less, what specifically stops? What is the pipeline impact?
- `marketing_concerns_about_roi_framing` (array, required): Where does the finance lens on ROI miss how marketing actually works?

### Finance Lead Submits Privately
- `finance_total_budget_available` (object, required): Total marketing budget available and how it compares to prior period.
- `finance_roi_expectations` (object, required): What ROI or CAC payback does finance expect from marketing spend?
- `finance_concerns_about_efficiency` (array, required): Where does spending look inefficient or unjustified based on the data?
- `finance_what_needs_justification` (array, required): Specific line items that need more evidence.
- `finance_flexibility_areas` (object, required): Where is there budget flexibility or room to invest more if ROI is proven?

## Outputs
- `channel_roi_assessment` (object): Actual ROI by channel — which channels are working and which are not.
- `allocation_recommendation` (object): Recommended budget allocation by channel with rationale.
- `pipeline_impact_model` (object): Modeled pipeline output at the recommended allocation vs. cuts.
- `cut_scenario_analysis` (object): What stops at 10%, 20%, and 30% budget cuts with specific pipeline impact.
- `justification_package` (array): Evidence and framing for each line item finance flagged.
- `performance_tracking_framework` (object): How performance will be measured and when allocation can be adjusted.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm channel performance data and budget constraints present.
**Output:** Readiness confirmation.
**Quality Gate:** Historical channel performance and available budget both present.

---

### Phase 1: Assess Channel ROI
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Calculate actual ROI for each channel from historical data — pipeline per dollar, CAC, contribution to closed revenue. 2. Identify channels finance has flagged as inefficient and assess whether the concern is justified by data. 3. Identify where marketing's proposed allocation is increasing investment in high-ROI channels vs. low-ROI channels. 4. Flag channels where ROI attribution is difficult but the channel serves a real purpose.
**Output:** Channel ROI ranking, finance concern validity assessment, allocation-to-performance alignment.
**Quality Gate:** Every channel has a measurable ROI or an explicit "attribution is difficult because" explanation — not just "brand value."

---

### Phase 2: Model Cut Impact
**Entry Criteria:** ROI assessed.
**Actions:** 1. Model pipeline output at the proposed allocation. 2. Model the cut scenarios: 10%, 20%, 30% reduction — which channels get cut in each scenario and what is the pipeline impact? 3. Identify which cuts are recoverable (can restart quickly) vs. which destroy momentum that takes quarters to rebuild. 4. Check cut impact against pipeline targets — what pipeline gap does each scenario create?
**Output:** Pipeline model at proposed allocation, cut scenarios with pipeline impact, recovery classification.
**Quality Gate:** Cut impact is specific — "a 20% cut means eliminating the events budget, reducing pipeline by $X and pushing CAC from $Y to $Z."

---

### Phase 3: Build the Allocation Recommendation
**Entry Criteria:** Cuts modeled.
**Actions:** 1. Recommend the allocation that maximizes pipeline within the available budget. 2. Build the justification package for each flagged line item — address finance's specific concerns with data. 3. Build the performance tracking framework — what metrics, what cadence, what triggers a mid-year reallocation. 4. Identify where there is an investment case for budget expansion.
**Output:** Allocation recommendation, justification package, performance tracking framework, investment case.
**Quality Gate:** Justification package addresses every finance concern with data, not narrative.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Recommendation built.
**Actions:** 1. Present channel ROI assessment. 2. Present cut scenario analysis. 3. Deliver allocation recommendation. 4. Deliver justification package. 5. Deliver performance tracking framework.
**Output:** Full synthesis — channel ROI, cut scenarios, allocation recommendation, justification package, tracking framework.
**Quality Gate:** Finance has the data they need to approve. Marketing has an allocation they can execute against.

---

## Exit Criteria
Done when: (1) every channel has ROI or attribution explanation, (2) cut scenarios with specific pipeline impact at three levels, (3) allocation recommendation with rationale, (4) justification package for all flagged items, (5) performance tracking framework.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
