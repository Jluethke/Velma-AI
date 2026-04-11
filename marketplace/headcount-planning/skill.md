# Headcount Planning

**One-line description:** Business unit and HR/finance each submit their real headcount needs and budget reality — Claude models the gap, assesses the business case, and produces a plan both sides can take to leadership.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both business unit and HR/finance must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_planning_period` (string, required): Planning period. e.g., "FY2027," "H1 2027."

### Business Unit Lead Submits Privately
- `bu_headcount_request` (object, required): Roles requested by title, level, timing, and full-year cost estimate.
- `bu_business_case` (string, required): What business problem does each hire solve? What does it enable?
- `bu_what_wont_happen_without_approval` (object, required): Specific deliverables, revenue, or capabilities that fail without this headcount.
- `bu_timing_requirements` (object, required): When does each hire need to be in seat? What is the cost of a 90-day delay?
- `bu_concerns_about_constraints` (array, required): What do you worry HR or finance does not understand about your function?

### HR / Finance Lead Submits Privately
- `hr_budget_available` (object, required): What headcount budget is available for this business unit in this period?
- `hr_org_wide_priorities` (array, required): What company-level priorities should drive headcount allocation decisions?
- `hr_alternative_options` (array, required): Contractors, agency staff, reallocation from other teams — what alternatives exist?
- `hr_leveling_guidance` (object, required): What levels are appropriate for the requested roles given the company's structure?
- `hr_concerns_about_request` (array, required): What about the request needs more evidence or seems out of scope?

## Outputs
- `request_vs_budget_gap` (object): The gap between what is requested and what is available.
- `business_case_assessment` (object): Which requests have strong business cases vs. which need more justification.
- `approved_headcount_plan` (object): What gets approved as submitted, conditionally approved, or deferred.
- `phasing_options` (object): How to phase hiring to fit within budget constraints while preserving business impact.
- `alternative_resourcing_options` (object): Where contractors or reallocation could address the need without full headcount.
- `decision_criteria_for_full_approval` (array): What the BU needs to demonstrate to get full request approved.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm headcount request with business case and budget constraints present.
**Output:** Readiness confirmation.
**Quality Gate:** Role list with cost estimates and budget available both present.

---

### Phase 1: Assess the Gap and Business Cases
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Calculate the total cost of the request against available budget. 2. Evaluate each role's business case — is the "what won't happen" consequence specific and credible? 3. Check the BU's concerns against HR's alternative options — which alternatives genuinely address the need vs. are workarounds. 4. Check leveling against company standards.
**Output:** Budget gap calculation, business case strength by role, alternative option assessment, leveling issues.
**Quality Gate:** Each role has one of three business case ratings: strong (specific consequence), needs more evidence, or not justified.

---

### Phase 2: Model Phasing and Alternatives
**Entry Criteria:** Gap assessed.
**Actions:** 1. Model phasing scenarios — what happens if timing is pushed 60 or 90 days for each role? 2. Model the alternative resourcing options for roles where alternatives could genuinely work. 3. Identify the minimum viable headcount plan that preserves the highest-priority business outcomes. 4. Identify which deferred hires create compounding problems vs. clean deferrals.
**Output:** Phasing scenarios with business impact, alternative resourcing options with cost comparison, minimum viable plan.
**Quality Gate:** Phasing impact is specific — "90-day delay on the engineering hire means the Q3 launch moves to Q4" not "it will slow things down."

---

### Phase 3: Build the Approved Plan
**Entry Criteria:** Options modeled.
**Actions:** 1. Build the approved headcount plan — what gets approved, conditionally approved, or deferred. 2. For conditional approvals, state the milestones that unlock them. 3. For deferrals, state what the BU needs to demonstrate to get full approval. 4. Document the HR/finance rationale for each decision.
**Output:** Approved headcount plan, conditional approval milestones, deferral criteria, decision rationale.
**Quality Gate:** Every decision has a rationale the BU can understand and act on. Deferrals are not permanent rejections without a path.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present budget gap and business case assessment. 2. Present phasing and alternative options. 3. Deliver approved headcount plan. 4. State decision criteria for full approval. 5. Deliver alternative resourcing plan where applicable.
**Output:** Full synthesis — gap analysis, business case ratings, approved plan, decision criteria, alternatives.
**Quality Gate:** BU knows exactly what they are getting, what is deferred, and what they need to do to get the rest.

---

## Exit Criteria
Done when: (1) every role has a business case assessment, (2) phasing scenarios with specific business impact, (3) approved/deferred decisions with rationale, (4) conditional approval milestones stated, (5) alternatives assessed for feasibility.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
