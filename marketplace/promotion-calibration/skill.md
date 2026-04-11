# Promotion Calibration

**One-line description:** Manager and HR each submit their real promotion case and calibration data — Claude assesses readiness against the leveling bar, surfaces evidence gaps, and produces a calibration package for the review.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both manager and HR must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_employee_role_and_level` (string, required): Current role and level of the employee being considered.

### Manager Submits Privately
- `manager_promotion_case` (string, required): Why does this person deserve to be promoted? What have they done?
- `manager_accomplishments_and_evidence` (array, required): Specific accomplishments with measurable impact — not job duties, but demonstrated performance above current level.
- `manager_timing_rationale` (string, required): Why now? What changes if this is delayed another 6 months?
- `manager_concerns_about_process` (array, required): What do you worry the calibration process will miss or misunderstand about this person?

### HR / People Partner Submits Privately
- `hr_calibration_data` (object, required): How does this person's performance compare to others promoted at this level? What did prior promotions look like?
- `hr_leveling_criteria` (object, required): What does the next level actually require in terms of scope, impact, and demonstrated capabilities?
- `hr_peer_comparison` (string, required): How does this case compare to other promotion decisions at this level in this cycle?
- `hr_comp_implications` (object, required): What is the comp adjustment required? Is it within budget?
- `hr_concerns_about_case` (array, required): What is missing or weak in the manager's case? What will the calibration committee push back on?

## Outputs
- `promotion_readiness_assessment` (object): Honest assessment of whether this person is ready for promotion now, nearly ready, or needs more time.
- `leveling_evaluation` (object): How the accomplishments map to next-level criteria — what is demonstrated and what is not.
- `evidence_gap_analysis` (array): What is missing from the case that would make it stronger or is needed for approval.
- `comp_adjustment_recommendation` (object): Proposed comp adjustment with budget impact.
- `calibration_talking_points` (array): How to present this case in the calibration conversation — what to lead with, what to defend, what to acknowledge.
- `promotion_decision_recommendation` (object): Promote now, promote next cycle, or develop further — with the specific rationale.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm promotion case with accomplishments and leveling criteria present.
**Output:** Readiness confirmation.
**Quality Gate:** Manager's accomplishment evidence and HR's leveling criteria both present.

---

### Phase 1: Evaluate Against the Leveling Bar
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Map each of the manager's accomplishments against the next-level criteria — does the evidence demonstrate operating at the next level or excelling at the current level? 2. Identify criteria that are clearly met, partially met, and undemonstrated. 3. Assess the strength of the evidence — are these outcomes with measurable impact or descriptions of activity? 4. Flag concerns HR has identified about the case.
**Output:** Criteria coverage map, evidence strength assessment, gap list.
**Quality Gate:** Every next-level criterion has a status — demonstrated with evidence, partially demonstrated, or not yet demonstrated.

---

### Phase 2: Calibrate Against Context
**Entry Criteria:** Leveling evaluated.
**Actions:** 1. Compare this case against HR's calibration data — how does it compare to prior promotions at this level? 2. Assess whether the manager's timing rationale adds urgency that justifies acting now vs. waiting. 3. Assess the retention risk if the promotion is delayed. 4. Check comp implications against budget.
**Output:** Calibration comparison, timing urgency assessment, retention risk, comp budget check.
**Quality Gate:** Calibration comparison is honest — "this case is stronger/weaker than average" with specific evidence.

---

### Phase 3: Build the Calibration Package
**Entry Criteria:** Calibration complete.
**Actions:** 1. Draft the promotion recommendation — promote now, promote next cycle with specific milestones, or develop further with a 12-month plan. 2. Build the calibration talking points — how to present the strongest version of the case and how to respond to likely pushback. 3. Identify what additional evidence the manager should gather before the calibration meeting. 4. Draft the comp adjustment recommendation.
**Output:** Promotion recommendation with rationale, calibration talking points, evidence to gather, comp recommendation.
**Quality Gate:** Recommendation is honest — not the most favorable interpretation of the evidence but the most accurate one.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Package built.
**Actions:** 1. Present promotion readiness assessment. 2. Present leveling evaluation with criteria coverage. 3. Deliver evidence gap analysis. 4. Deliver calibration talking points. 5. State promotion decision recommendation with comp adjustment.
**Output:** Full synthesis — readiness assessment, leveling evaluation, evidence gaps, talking points, decision recommendation.
**Quality Gate:** Manager knows how strong their case is and what to prepare. HR has a recommendation they can defend in calibration.

---

## Exit Criteria
Done when: (1) every next-level criterion has a status, (2) evidence gaps specifically named, (3) calibration comparison to prior promotions done, (4) promotion decision recommendation with rationale, (5) comp adjustment with budget check.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
