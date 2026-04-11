# Budget Alignment

**One-line description:** Department head and finance each submit their real constraints before budget negotiations — Claude quantifies the gap, models the cut impact, and produces a negotiated budget draft with the justification package finance needs to approve it.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both department head and finance must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_fiscal_period` (string, required): e.g., "FY2027."

### Department Head Submits Privately
- `dept_budget_request` (object, required): Requested budget by category — headcount, software, services, capex, other.
- `dept_business_case` (string, required): Why do you need this budget? What does it enable?
- `dept_what_gets_cut_if_reduced` (object, required): If you get 20% less, what specifically gets cut or doesn't happen?
- `dept_non_negotiables` (array, required): What cannot be cut without material business impact?
- `dept_concerns_about_budget_process` (array, required): What do you worry finance doesn't understand about your function?

### Finance Submits Privately
- `finance_budget_constraints` (object, required): What is the total company budget constraint and how much is available for this department?
- `finance_company_priorities` (array, required): What company-level priorities should this budget serve?
- `finance_concerns_about_request` (array, required): What about this request concerns you? What needs more justification?
- `finance_what_needs_justification` (array, required): Specific line items that need more evidence before you'd approve.
- `finance_flexibility_areas` (object, required): Where is there budget flexibility, even if not formally allocated?

## Outputs
- `alignment_map` (object): Where the department request aligns with company priorities.
- `request_vs_reality_gap` (object): The gap between what's requested and what's available.
- `cut_impact_assessment` (object): What actually stops happening if the budget is reduced, with business impact.
- `negotiated_budget_draft` (object): A proposed budget both sides can work with.
- `justification_package` (array): The specific evidence and framing needed for each flagged line item.
- `decision_criteria` (array): What finance needs to see to approve the full request.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm `dept_budget_request`, `finance_budget_constraints`, and `dept_what_gets_cut_if_reduced` present.
**Output:** Readiness confirmation.
**Quality Gate:** Budget request and constraints both present.

---

### Phase 1: Quantify the Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare total request to available budget. Calculate the gap. 2. Check each budget category against finance's concerns and what needs justification. 3. Identify the department's non-negotiables and whether they fit within constraints.
**Output:** Gap calculation, line item status, non-negotiable fit assessment.
**Quality Gate:** Gap is stated in specific dollars by category.

---

### Phase 2: Assess Cut Impact
**Entry Criteria:** Gap quantified.
**Actions:** 1. Model what a 10%, 20%, and 30% reduction looks like against what the department said gets cut. 2. Assess the business impact of each cut scenario — what doesn't happen, what risks increase. 3. Identify which cuts are recoverable and which create permanent capability gaps.
**Output:** Cut impact models at three scenarios with business impact.
**Quality Gate:** Impact is specific — "customer support headcount reduction will increase response time from 4h to 48h" not "service quality will suffer."

---

### Phase 3: Build the Negotiated Budget
**Entry Criteria:** Cut impact assessed.
**Actions:** 1. Build a budget that protects the department's non-negotiables within finance's constraints. 2. Identify phasing or reallocation options. 3. Draft the justification package for every flagged line item. 4. Draft the decision criteria for the full request.
**Output:** Negotiated budget, justification package, decision criteria.
**Quality Gate:** Justification package addresses every concern finance listed.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Budget built.
**Actions:** 1. Present alignment. 2. Present gap with cut impact at three scenarios. 3. Deliver negotiated budget. 4. Deliver justification package. 5. State decision criteria.
**Output:** Full synthesis — alignment, gap, cut impact, negotiated budget, justification package, decision criteria.
**Quality Gate:** Finance has what they need to make a decision. Department head knows exactly what they're getting and what's been cut.

---

## Exit Criteria
Done when: (1) gap quantified by category, (2) cut impact modeled at three scenarios with specific business impacts, (3) negotiated budget protects non-negotiables, (4) justification package addresses every finance concern.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
