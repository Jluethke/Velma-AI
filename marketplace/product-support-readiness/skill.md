# Product-Support Readiness

**One-line description:** Product and support each submit their real launch status and readiness gaps — Claude surfaces what support needs that product has not provided and ensures support is not learning the product from confused customers on launch day.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both product and support must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_feature_or_release` (string, required): What is being launched.
- `shared_launch_date` (string, required): Launch date.

### Product Manager Submits Privately
- `product_what_is_launching` (object, required): Description of the feature or change — what it does, how it works, who it affects.
- `product_known_edge_cases` (array, required): Edge cases and limitations product is aware of — what the feature does not handle, known bugs, expected failure modes.
- `product_what_support_should_know` (array, required): The most important things support needs to understand to handle customer questions effectively.
- `product_timeline_constraints` (string, required): What is the timeline for getting support-readiness materials done? Are there constraints?
- `product_concerns_about_support_readiness` (array, required): What concerns do you have about support's ability to handle this launch?

### Support / CS Lead Submits Privately
- `support_what_they_need_before_launch` (array, required): What materials, access, or information does support need before customers start contacting them?
- `support_volume_projections` (object, required): How much support volume do you expect from this launch? What is your capacity?
- `support_training_status` (string, required): Where are you on training? What is complete and what is pending?
- `support_documentation_gaps` (array, required): What documentation is missing or incomplete that you need to support customers?
- `support_what_will_cause_escalations` (array, required): What customer issues will go beyond tier 1 and require product or engineering involvement?

## Outputs
- `support_readiness_assessment` (object): Honest readiness status — what support can handle on day 1 and what they cannot.
- `documentation_gap_list` (array): Documentation that must be created before launch with owner and deadline.
- `training_plan` (object): Training that must be completed, by whom, by when.
- `escalation_path_definition` (object): Specific escalation paths for the issues support has flagged as likely to need escalation.
- `launch_support_coverage_plan` (object): How support is staffed for day 1 and the first week.
- `go_live_support_criteria` (array): Specific criteria that must be met for support to be considered launch-ready.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm product feature description and support needs list present.
**Output:** Readiness confirmation.
**Quality Gate:** Product's feature description and support's pre-launch requirements both present.

---

### Phase 1: Identify Documentation and Knowledge Gaps
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare what product says support should know against what support says they need — where are the gaps? 2. Check support's documentation gaps against what exists — is it missing entirely or just not yet shared? 3. Identify product's known edge cases and assess whether support has a documented response for each. 4. Assess whether product's timeline constraints are compatible with creating the needed materials before launch.
**Output:** Knowledge gap map, documentation status, edge case coverage, timeline feasibility.
**Quality Gate:** Every documentation gap is specific — "no KB article exists for the error state on X workflow" not "documentation is incomplete."

---

### Phase 2: Define Escalation Paths
**Entry Criteria:** Gaps identified.
**Actions:** 1. For each issue support flagged as likely to escalate, define the escalation path — who at tier 2 or product handles it, what information must be included, what the SLA is. 2. Identify escalation paths that do not exist or are unclear. 3. Check whether product has a designated contact for the launch period — someone support can reach quickly for tier 1 questions. 4. Assess volume projections against current support capacity.
**Output:** Escalation path by issue type, missing escalation paths, launch-period product contact, capacity assessment.
**Quality Gate:** Every escalation path has a named owner and a response SLA. "Escalate to product" is not a complete path.

---

### Phase 3: Build the Readiness Plan
**Entry Criteria:** Escalation paths defined.
**Actions:** 1. Build the documentation creation plan — every missing document, who writes it, and when before launch. 2. Build the training plan — who needs training, what format, and when. 3. Define the launch-day coverage plan — staffing levels, product contact availability, monitoring. 4. Define go-live support criteria — what must be complete before support declares readiness.
**Output:** Documentation plan with owners and deadlines, training plan, coverage plan, go-live criteria.
**Quality Gate:** Documentation plan accounts for review and approval time, not just writing time. Go-live criteria are binary.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present support readiness assessment. 2. Deliver documentation gap list with owners. 3. Deliver training plan. 4. Deliver escalation path definition. 5. Deliver coverage plan and go-live criteria.
**Output:** Full synthesis — readiness assessment, documentation gaps, training plan, escalation paths, coverage, go-live criteria.
**Quality Gate:** Product and support have a shared plan. Support knows what they are getting and when. Product knows what they need to deliver.

---

## Exit Criteria
Done when: (1) every documentation gap is specific with owner and deadline, (2) every escalation path has named owner and SLA, (3) training plan complete with who and when, (4) launch coverage plan defined, (5) go-live criteria are binary.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
