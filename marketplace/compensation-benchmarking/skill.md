# Compensation Benchmarking

**One-line description:** HR and finance each submit their real comp data, benchmark surveys, and budget constraints — AI models the gap, prioritizes equity adjustments, and produces a plan both sides can defend to leadership.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both HR and finance must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_roles_in_scope` (array, required): Roles or levels being benchmarked.

### HR / People Lead Submits Privately
- `hr_current_comp_data` (object, required): Current salaries by role/level. Actual numbers, not ranges.
- `hr_market_benchmarks` (object, required): What benchmark surveys show for each role. Source and percentile.
- `hr_equity_gaps` (array, required): Where are there internal equity problems? Who is paid below peers for comparable work?
- `hr_recommended_adjustments` (object, required): What changes HR is recommending and for whom.
- `hr_retention_risks` (array, required): Who is at risk of leaving due to comp? What is the replacement cost?

### Finance Lead Submits Privately
- `finance_payroll_budget` (object, required): Current total payroll and how it sits against plan.
- `finance_available_adjustment_budget` (object, required): How much budget exists for comp adjustments this cycle?
- `finance_concerns_about_request` (array, required): What about HR's likely recommendations concerns you?
- `finance_what_needs_justification` (array, required): Which adjustments need more evidence before finance would approve?
- `finance_flexibility_areas` (object, required): Where is there budget flexibility even if not formally allocated?

## Outputs
- `comp_gap_analysis` (object): Where current comp falls below market benchmarks by role.
- `retention_risk_assessment` (object): Flight risk ranked by comp gap and replacement cost.
- `adjustment_recommendations` (array): Prioritized comp adjustments with business case for each.
- `budget_impact_model` (object): Cost of full recommendations vs. prioritized subset vs. minimum viable adjustments.
- `implementation_plan` (object): Timing, phasing, and communication approach for adjustments.
- `equity_remediation_priorities` (array): Internal equity cases ranked by severity and budget impact.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm comp data, benchmarks, and budget figures are present.
**Output:** Readiness confirmation.
**Quality Gate:** Current comp data and available adjustment budget both present.

---

### Phase 1: Quantify the Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare current comp against market benchmarks by role — calculate the gap in dollars and percentile. 2. Identify internal equity gaps — who is paid below peers in comparable roles. 3. Cross-reference HR's recommended adjustments against finance's available budget. 4. Calculate the gap between what HR wants to do and what finance has to work with.
**Output:** Market gap by role, internal equity map, budget gap calculation.
**Quality Gate:** Every gap is stated in specific dollars, not "below market."

---

### Phase 2: Assess Retention Risk
**Entry Criteria:** Gap quantified.
**Actions:** 1. Rank retention risks by flight risk severity and replacement cost. 2. Identify which comp gaps correlate with HR's listed retention risks. 3. Model the cost of not acting — turnover cost vs. adjustment cost for each at-risk employee. 4. Identify which adjustments are urgent vs. can be phased.
**Output:** Retention risk ranking, cost-of-inaction model, urgency assessment.
**Quality Gate:** Retention risks are tied to specific roles and comp gaps, not general sentiment.

---

### Phase 3: Build the Adjustment Plan
**Entry Criteria:** Risks assessed.
**Actions:** 1. Build three adjustment scenarios: full HR recommendation, budget-constrained prioritized list, minimum viable adjustments. 2. For each scenario, model total cost and which equity/retention risks are addressed vs. left open. 3. Address each of finance's justification requirements. 4. Draft implementation phasing and communication approach.
**Output:** Three adjustment scenarios with cost and risk coverage, justification package, implementation plan.
**Quality Gate:** Every finance concern is addressed. Every retained equity gap in the constrained scenario is explicitly acknowledged as accepted risk.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present market gap analysis by role. 2. Present retention risk ranking with replacement cost model. 3. Deliver three adjustment scenarios. 4. Deliver implementation plan and communication approach. 5. State equity remediation priorities.
**Output:** Full synthesis — gap analysis, retention risk, adjustment scenarios, implementation plan, equity priorities.
**Quality Gate:** Leadership has what they need to make a decision. HR and finance are aligned on what gets approved and what gets deferred.

---

## Exit Criteria
Done when: (1) market gaps stated in specific dollars by role, (2) retention risks ranked with replacement cost, (3) three adjustment scenarios with full cost models, (4) every finance justification requirement addressed, (5) implementation plan with phasing.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
