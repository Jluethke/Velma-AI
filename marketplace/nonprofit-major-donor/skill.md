# Nonprofit Major Donor Alignment

**One-line description:** The executive director and the major donor each submit their real priorities, concerns, and expectations before a major gift conversation — Claude finds where the donor's interests and the organization's needs align, and produces a gift structure that both closes and lasts.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both ED and donor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_organization_name` (string, required): Nonprofit organization name.
- `shared_gift_discussion` (string, required): What gift amount or program is being discussed.

### Executive Director Submits Privately
- `ed_organizational_priorities` (object, required): What the organization most needs to fund — programs, capacity, capital, endowment — and why.
- `ed_what_this_donor_means_to_the_organization` (string, required): Their history, relationship, and what they have given or indicated before.
- `ed_what_they_can_offer_the_donor` (object, required): Recognition, naming rights, reporting, involvement, advisory role — what you are prepared to offer.
- `ed_constraints_and_restrictions_they_cannot_accept` (array, required): What gift restrictions, conditions, or donor involvement would create operational problems.
- `ed_concerns_about_the_ask` (array, required): What are you worried the donor will push back on or attach conditions to?

### Major Donor Submits Privately
- `donor_philanthropic_priorities` (object, required): What causes, programs, or outcomes do you care most about funding?
- `donor_what_they_want_from_this_gift` (object, required): Impact visibility, recognition, involvement, legacy — what matters to you beyond the tax deduction?
- `donor_concerns_about_the_organization` (array, required): What worries you about this organization — leadership, financial health, program effectiveness, governance?
- `donor_gift_structure_preferences` (object, required): Outright gift, pledge, bequest, DAF, restricted vs. unrestricted — what works for your financial and estate situation?
- `donor_what_would_cause_them_not_to_give` (array, required): What would make you redirect this gift — what are your deal-breakers?

## Outputs
- `interest_alignment_map` (object): Where donor priorities and organizational needs intersect — the gift's sweet spot.
- `gift_structure_recommendation` (object): The specific gift structure — amount, timing, restrictions, recognition — that fits both parties.
- `donor_concern_response` (object): Each donor concern with the honest response and what the organization can do to address it.
- `recognition_and_involvement_plan` (object): What the donor gets — naming, reporting, involvement, stewardship — specifically.
- `ask_strategy` (object): How to frame the ask, what to lead with, how to respond to hesitation.
- `stewardship_plan` (object): How the relationship is maintained and the donor is reported to after the gift is made.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm organizational priorities and donor's philanthropic interests present.
**Output:** Readiness confirmation.
**Quality Gate:** ED's organizational needs and donor's philanthropic priorities both present.

---

### Phase 1: Find the Alignment Zone
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Map the donor's philanthropic priorities against the organization's funding needs — where is the natural overlap? 2. Assess how the donor's desired involvement and recognition align with what the organization can offer. 3. Identify the donor's concerns and assess whether they are based on accurate information or perception gaps. 4. Check whether the donor's gift structure preferences create any operational or legal issues.
**Output:** Interest alignment map, recognition alignment, concern root cause, structure feasibility.
**Quality Gate:** Alignment zone is specific — "donor's interest in youth workforce development aligns with the new apprenticeship program launching in Q2, which needs $150K for year one."

---

### Phase 2: Design the Gift
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Design the specific gift structure — amount, payment schedule, restrictions, fund designation. 2. Build the recognition and involvement plan — what the donor gets at what gift level, how reporting works. 3. Draft the response to each donor concern — honest, not defensive, with concrete evidence or actions. 4. Identify any gift restrictions or conditions the organization can accept vs. what must be declined.
**Output:** Gift design, recognition plan, concern responses, restriction assessment.
**Quality Gate:** Gift structure is specific enough to put in an agreement. Restrictions that cannot be accepted are named with alternative framings.

---

### Phase 3: Build the Ask Strategy
**Entry Criteria:** Gift designed.
**Actions:** 1. Write the ask — how to frame it, what to lead with, the specific language for the moment of ask. 2. Prepare responses to likely hesitation — "let me think about it," "I want to see the financials," "I need it restricted to X." 3. Define the stewardship plan — what the donor receives after giving, how often, from whom. 4. Define the follow-up cadence if the ask is not closed in the meeting.
**Output:** Ask strategy with language, hesitation responses, stewardship plan, follow-up cadence.
**Quality Gate:** Ask language is specific and ready to say. Stewardship plan has specific touchpoints and reporting commitments.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Ask built.
**Actions:** 1. Present interest alignment map. 2. Deliver gift structure recommendation. 3. Deliver donor concern responses. 4. Deliver recognition and involvement plan. 5. Present ask strategy and stewardship plan.
**Output:** Full synthesis — alignment, gift structure, concern responses, recognition, ask strategy, stewardship.
**Quality Gate:** ED walks into the donor meeting ready to ask, ready to respond, and ready to close.

---

## Exit Criteria
Done when: (1) interest alignment is specific and compelling, (2) gift structure is specific, (3) every donor concern has a response, (4) ask language is prepared, (5) stewardship plan is specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
