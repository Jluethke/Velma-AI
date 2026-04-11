# Law Firm Lateral Hire

**One-line description:** The law firm and the lateral candidate each submit their real expectations, book of business claims, and cultural requirements — Claude aligns on a compensation structure and role definition that closes without a year-one disappointment on either side.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both firm and candidate must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_firm_and_candidate` (string, required): Firm name and candidate name/role.
- `shared_practice_area` (string, required): Practice area and proposed level (partner, counsel, associate).

### Law Firm Submits Privately
- `firm_strategic_need` (object, required): Why you need this hire — capability gap, client need, geographic expansion, succession planning.
- `firm_compensation_offer` (object, required): Base, bonus, origination credit, equity partnership timeline, guaranteed period.
- `firm_book_of_business_expectations` (object, required): What revenue the candidate is expected to bring and when — what you are building the economics around.
- `firm_concerns_about_the_candidate` (array, required): Book portability risk, client conflict issues, integration into firm culture, rainmaking vs. service partner risk.
- `firm_what_they_need_from_the_lateral` (array, required): Practice building, client relationships, training juniors, committee work — what the role actually entails.

### Lateral Candidate Submits Privately
- `candidate_book_of_business_reality` (object, required): Honest assessment of what clients will follow — who is truly portable, what revenue you can actually move.
- `candidate_compensation_requirements` (object, required): What you need — guaranteed minimum, origination credit structure, path to equity, what you are leaving behind.
- `candidate_reasons_for_moving` (string, required): Why are you actually leaving — compensation, culture, platform, conflicts with current partners, clients pushing for a move?
- `candidate_concerns_about_the_firm` (array, required): Conflicts, culture, support staff, firm financials, platform quality — what due diligence has raised concerns.
- `candidate_what_must_be_true_to_join` (array, required): The specific conditions — comp guarantee, conflict waivers, support structure — that must be in the offer to sign.

## Outputs
- `book_of_business_reality_check` (object): Honest assessment of portable revenue — what is realistic vs. what is optimistic.
- `compensation_structure` (object): Guaranteed period, origination credit, bonus, equity path — specific terms that work for both parties.
- `role_and_expectations_alignment` (object): What the candidate is actually expected to do vs. what they expect to do.
- `conflict_and_integration_assessment` (object): Client conflicts, firm culture fit, integration plan.
- `offer_framework` (object): The specific offer terms ready for a term sheet.
- `year_one_success_criteria` (array): How success is measured in the first year — client retention, revenue, integration milestones.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm firm's expectations and candidate's book reality present.
**Output:** Readiness confirmation.
**Quality Gate:** Firm's revenue expectations and candidate's portable book assessment both present.

---

### Phase 1: Assess Book Reality and Economics
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare firm's book expectations against candidate's honest portable revenue assessment — is there a deal on economics? 2. Identify the portability risk — what makes clients portable and what makes them stay? 3. Check compensation requirements against what the firm can offer given the revenue reality. 4. Assess the conflict situation — what clients create conflicts with existing firm clients?
**Output:** Revenue reality check, portability risk, comp-to-revenue alignment, conflict assessment.
**Quality Gate:** Revenue expectation gap is specific — "firm expects $X in year one; candidate's portable book is realistically $Y; gap is $Z and depends on outcome of conflicts for clients A, B, C."

---

### Phase 2: Design the Compensation and Role Structure
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Design the compensation structure — guarantee period, amount, origination credit formula, bonus triggers, equity partnership timeline. 2. Define the role clearly — what the candidate is expected to do day one, what they are not responsible for. 3. Define the conflict resolution plan — what happens to conflicted clients. 4. Build the integration plan — who they work with, what support they get, how they are introduced to firm clients.
**Output:** Compensation structure, role definition, conflict plan, integration plan.
**Quality Gate:** Compensation structure is specific — guarantee of $X for Y months, origination credit of Z% on collected fees from moved clients.

---

### Phase 3: Build the Offer and Success Criteria
**Entry Criteria:** Structure designed.
**Actions:** 1. Assemble the offer framework — all terms ready for a formal letter. 2. Define year-one success criteria — what must happen for both parties to feel good at the one-year mark. 3. Define the review process — when comp structure transitions from guarantee to performance. 4. Define early termination — what triggers it and how separation is handled.
**Output:** Offer framework, success criteria, review process, termination terms.
**Quality Gate:** Success criteria are specific — not "doing well" but named client retention, revenue, and integration milestones.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Offer built.
**Actions:** 1. Present book of business reality check. 2. Deliver compensation structure. 3. Deliver role and expectations alignment. 4. Deliver conflict and integration assessment. 5. Present offer framework and success criteria.
**Output:** Full synthesis — book reality, comp, role, conflicts, offer, success criteria.
**Quality Gate:** Firm makes an informed offer. Candidate joins understanding what the realistic year-one looks like.

---

## Exit Criteria
Done when: (1) portable revenue is honestly assessed, (2) comp structure is specific, (3) role expectations are aligned, (4) conflicts are identified and planned for, (5) success criteria are named.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
