# Underperformer Plan

**One-line description:** Manager and HR each submit their real account of the performance situation and process requirements — AI assesses risk, fills documentation gaps, and produces a plan that is fair to the employee and legally defensible for the company.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both manager and HR must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_employee_role` (string, required): Employee's role and level.

### Manager Submits Privately
- `manager_performance_concerns` (array, required): Specific performance concerns — what is the employee failing to do, at what level, and with what impact?
- `manager_documented_evidence` (array, required): What documentation exists — emails, reviews, meeting notes, missed targets, customer complaints?
- `manager_what_they_have_already_tried` (array, required): What have you already done to address this — coaching conversations, feedback, support, resources?
- `manager_desired_outcome` (string, required): What outcome do you want — genuine improvement, mutual departure, or involuntary separation?
- `manager_timeline` (string, required): How urgent is this? What is driving the timeline?

### HR / People Partner Submits Privately
- `hr_legal_risk_assessment` (object, required): What is the legal exposure if this situation is handled incorrectly? Protected class, retaliation risk, prior complaints?
- `hr_documentation_requirements` (object, required): What documentation does the company need before taking action?
- `hr_process_requirements` (array, required): What process must be followed — PIP requirements, required conversations, approval chain, separation process?
- `hr_what_manager_needs_to_do_differently` (array, required): What gaps exist in how the manager has handled this so far?
- `hr_concerns_about_approach` (array, required): What concerns do you have about the manager's desired outcome or timeline?

## Outputs
- `situation_assessment` (object): Honest assessment of the situation — strength of the performance case, risk level, and documentation gaps.
- `legal_risk_summary` (object): The legal risks in this situation and what is required to mitigate them.
- `documentation_gap_analysis` (array): What documentation is missing and what needs to be created before the company can take action.
- `recommended_approach` (object): Recommended path — coaching plan, PIP, or separation — with the conditions for each.
- `performance_improvement_plan_draft` (string): If a PIP is recommended: specific, measurable improvement goals with timeline and success criteria.
- `manager_coaching_recommendations` (array): What the manager needs to do differently — in their behavior, documentation, and communication.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm performance concerns with evidence and HR's process requirements present.
**Output:** Readiness confirmation.
**Quality Gate:** Documented performance concerns and HR's legal risk assessment both present.

---

### Phase 1: Assess the Situation Honestly
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess the strength of the performance case — is the evidence specific and documented, or is it vague and undocumented? 2. Identify where the manager's concerns are legitimate performance issues vs. personal friction or management style conflicts. 3. Check the legal risk assessment — are there protected characteristics, retaliation risks, or prior complaints that elevate the risk? 4. Identify documentation gaps that must be addressed before any action.
**Output:** Case strength assessment, legitimate vs. non-performance concern separation, legal risk flags, documentation gaps.
**Quality Gate:** Case strength is honest — "the documented evidence is insufficient to support a PIP without additional documentation" is a valid assessment.

---

### Phase 2: Assess the Manager's Approach
**Entry Criteria:** Situation assessed.
**Actions:** 1. Evaluate what the manager has tried against what HR's process requires — have they had the required direct conversations? 2. Identify what the manager needs to do differently — not to blame them, but because it affects the legal defensibility and the employee's ability to improve. 3. Assess the manager's desired outcome and timeline against what the evidence supports. 4. Identify what needs to happen before the situation is ready for formal action.
**Output:** Manager approach assessment, required steps, desired outcome vs. evidence alignment, pre-action requirements.
**Quality Gate:** Manager coaching recommendations are specific and actionable — not "be more communicative" but "have a documented conversation addressing X within two weeks."

---

### Phase 3: Build the Plan
**Entry Criteria:** Approach assessed.
**Actions:** 1. Recommend the appropriate path — coaching plan, PIP, or separation process — based on the evidence, legal risk, and outcome desired. 2. If PIP: draft specific, measurable improvement goals with a realistic timeline and success criteria that can be objectively evaluated. 3. If coaching: define what the manager must do, document, and communicate before re-assessing. 4. If separation: outline the process requirements, timeline, and documentation needed.
**Output:** Recommended approach with rationale, PIP draft if applicable, documentation and communication plan.
**Quality Gate:** PIP goals are specific and measurable — "hit X metric by date Y" not "improve performance." Timeline is realistic for the employee to demonstrate improvement.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present situation assessment with case strength. 2. Present legal risk summary. 3. Present documentation gap analysis. 4. Deliver recommended approach. 5. Deliver PIP draft or next-steps plan and manager coaching recommendations.
**Output:** Full synthesis — situation assessment, legal risk, documentation gaps, recommended approach, plan, manager coaching.
**Quality Gate:** Manager knows exactly what they need to do and what the standard is. HR has a process they can stand behind legally.

---

## Exit Criteria
Done when: (1) case strength assessed against documentation, (2) legal risks identified with mitigation requirements, (3) documentation gaps with specific items needed, (4) recommended path with rationale, (5) PIP or coaching plan is specific and measurable.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
