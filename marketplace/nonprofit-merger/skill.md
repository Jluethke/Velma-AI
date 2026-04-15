# Nonprofit Merger Alignment

**One-line description:** Two nonprofit CEOs each submit their real concerns about organizational culture, mission alignment, and post-merger leadership before the integration begins — AI surfaces the tensions that kill nonprofit mergers and builds a structure where the combined organization serves the mission better than either could alone.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both CEOs must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_organizations` (string, required): Both organization names and their primary missions.
- `shared_merger_rationale` (string, required): Why this merger is being pursued — financial, geographic, mission alignment, capacity.

### CEO A Submits Privately
- `org_a_mission_and_identity` (object, required): What your organization stands for, what makes it distinctive, what must be preserved in a merger.
- `org_a_financial_and_operational_reality` (object, required): Financial position, programs, staff, facilities — the full picture including what is struggling.
- `org_a_leadership_expectations` (object, required): What you expect in terms of your role in the combined organization, leadership transition, board representation.
- `org_a_cultural_concerns` (array, required): What you are afraid of losing — culture, program approach, staff, donor relationships.
- `org_a_deal_breakers` (array, required): What would make this merger not worth doing — name elimination, program discontinuation, leadership exclusion.

### CEO B Submits Privately
- `org_b_mission_and_identity` (object, required): What your organization stands for and what must be preserved.
- `org_b_financial_and_operational_reality` (object, required): Financial position, programs, staff, facilities — honest assessment.
- `org_b_leadership_expectations` (object, required): What you expect for your role, transition, and the combined leadership structure.
- `org_b_cultural_concerns` (array, required): What you are afraid of losing or being absorbed into.
- `org_b_deal_breakers` (array, required): What would make this merger not worth doing.

## Outputs
- `mission_alignment_assessment` (object): Where missions align and where they differ — what the combined mission should be.
- `financial_and_operational_picture` (object): Combined financial reality — assets, liabilities, program overlap, operational integration needs.
- `leadership_structure_framework` (object): How leadership is structured post-merger — CEO, board, program directors.
- `program_and_culture_integration_plan` (object): What is preserved, what is consolidated, what the combined culture should be.
- `stakeholder_and_donor_transition_plan` (object): How donors, funders, and community stakeholders are managed through the transition.
- `merger_agreement_framework` (object): Key terms for legal counsel and board approval.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm both CEOs' mission, financial reality, and leadership expectations present.
**Output:** Readiness confirmation.
**Quality Gate:** Both organizations' financial positions and leadership expectations present — including things that are hard to say.

---

### Phase 1: Assess Mission and Cultural Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess mission alignment — is there genuine mission overlap or a forced fit? 2. Evaluate financial positions — what does each organization actually bring? 3. Identify leadership conflict — what happens to two CEOs in one organization? 4. Surface cultural concerns that, if unaddressed, will kill the merger after signing.
**Output:** Mission fit assessment, financial picture, leadership conflict map, cultural risk assessment.
**Quality Gate:** Mission assessment is honest — if this is a financial rescue disguised as a mission merger, that is named.

---

### Phase 2: Design the Combined Organization
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the combined mission and identity — what does the merged organization stand for? 2. Build the leadership structure — who leads, what roles exist, what transition looks like. 3. Design the program integration — what is preserved, consolidated, or discontinued. 4. Define the board composition and governance structure.
**Output:** Combined mission, leadership structure, program integration design, governance framework.
**Quality Gate:** Leadership structure addresses every current leader's role post-merger — not vague promises but specific positions.

---

### Phase 3: Plan the Integration
**Entry Criteria:** Structure designed.
**Actions:** 1. Build the staff transition plan — who stays, who goes, how decisions are made. 2. Define the donor and funder communication strategy. 3. Build the brand and name decision framework. 4. Assemble the merger agreement framework for legal review.
**Output:** Staff transition plan, donor communication strategy, brand framework, merger agreement.
**Quality Gate:** Staff transition plan addresses every current employee category — not just senior leadership.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan complete.
**Output:** Full synthesis — mission alignment, financial picture, leadership structure, program integration, staff plan, donor strategy, merger framework.
**Quality Gate:** Both CEOs understand what the combined organization looks like and what each must give up to make it work.

---

## Exit Criteria
Done when: (1) mission alignment is assessed honestly, (2) financial reality is complete, (3) leadership structure is specific, (4) program integration is designed, (5) staff and donor transition plans are defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
