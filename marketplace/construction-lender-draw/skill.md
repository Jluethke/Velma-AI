# Construction Lender Draw

**One-line description:** Developer and construction lender each submit their real draw position and project concerns — AI aligns on conditions, surfaces open items, and produces a funding path that does not let administrative gaps delay construction.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both borrower/developer and lender must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_name` (string, required): Project name.
- `shared_draw_number` (string, required): Draw number and period covered.

### Borrower / Developer Submits Privately
- `borrower_draw_request` (object, required): Amount requested by line item — hard costs, soft costs, interest reserve, and fee categories.
- `borrower_work_completed` (object, required): What work has been completed since the prior draw? Percentage complete by trade or CSI division.
- `borrower_inspector_concerns_to_address` (object, required): What concerns did the inspector raise on the last inspection and how have they been addressed?
- `borrower_project_status` (object, required): Budget-to-date, schedule status, and any material changes since the prior draw.
- `borrower_concerns_about_lender_conditions` (array, required): What conditions is the lender requiring that you are having difficulty satisfying?

### Construction Lender Submits Privately
- `lender_draw_review_findings` (object, required): Inspector's findings — percentage completion by trade, lien waiver status, any deficiencies noted.
- `lender_conditions_to_funding` (array, required): What conditions must be satisfied before this draw can be funded?
- `lender_project_concerns` (array, required): What concerns the lender has about the project — budget, schedule, contractor performance, title.
- `lender_loan_covenant_status` (object, required): Status of all loan covenants — in compliance, at risk, or in default.
- `lender_what_they_need_to_release_funds` (array, required): Specific documentation, certifications, or remediation required to release this draw.

## Outputs
- `draw_readiness_assessment` (object): Whether the draw is fundable as submitted or what is needed.
- `conditions_checklist` (array): All conditions to funding with status — satisfied, pending, or outstanding.
- `project_health_summary` (object): Honest assessment of project health — budget, schedule, contractor, and covenant status.
- `inspector_finding_resolution` (object): How inspector findings have been addressed or what the resolution plan is.
- `funding_timeline` (object): When the draw can be funded based on when conditions are satisfied.
- `open_items_to_resolve` (array): Items requiring resolution before this or the next draw — with owners and deadlines.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm draw request and lender's conditions present.
**Output:** Readiness confirmation.
**Quality Gate:** Draw amount and lender's conditions to funding both present.

---

### Phase 1: Assess Draw Readiness
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare the borrower's claimed percentage completion against the inspector's findings — are they consistent? 2. Verify lien waiver coverage against the draw request. 3. Check inspector findings against borrower's described resolution status. 4. Identify conditions the lender has listed that the borrower has not addressed.
**Output:** Completion verification, lien waiver status, inspector finding resolution status, unaddressed condition list.
**Quality Gate:** Every condition to funding has a status — satisfied, pending with a date, or outstanding and blocking.

---

### Phase 2: Assess Project Health
**Entry Criteria:** Draw readiness assessed.
**Actions:** 1. Review budget-to-date against the construction budget — is the project tracking on budget or is there overrun exposure? 2. Review schedule status against the loan completion date — is the project on track? 3. Assess covenant status — are any covenants at risk? 4. Evaluate the borrower's concerns about lender conditions — are they legitimate operational concerns or compliance issues?
**Output:** Budget status, schedule risk, covenant compliance, condition concern assessment.
**Quality Gate:** Budget status includes projected final cost vs. budget — not just spend to date. Covenant status is specific.

---

### Phase 3: Build the Funding Path
**Entry Criteria:** Health assessed.
**Actions:** 1. Build the conditions checklist — what must be satisfied before funding, who is responsible, and by what date. 2. Determine the funding timeline — when each condition can realistically be met and when funds can be released. 3. Identify open items for future draws — what needs to be resolved to avoid delays in subsequent draws. 4. Draft any project health concerns requiring borrower action.
**Output:** Conditions checklist with owners and dates, funding timeline, future draw open items, borrower action items.
**Quality Gate:** Funding timeline shows a specific date, not "upon receipt of satisfactory documentation." Conditions have named owners.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Funding path built.
**Actions:** 1. Present draw readiness assessment. 2. Deliver conditions checklist with status. 3. Present project health summary. 4. Deliver funding timeline. 5. State open items to resolve.
**Output:** Full synthesis — readiness assessment, conditions, project health, funding timeline, open items.
**Quality Gate:** Developer knows exactly what is needed and when funds will flow. Lender has a clear record of conditions and project status.

---

## Exit Criteria
Done when: (1) every condition to funding has a status, (2) completion verification against inspector findings, (3) project health assessment with budget and schedule status, (4) funding timeline with specific date, (5) future draw open items identified.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
