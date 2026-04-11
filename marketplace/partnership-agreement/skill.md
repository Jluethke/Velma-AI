# Partnership Agreement

**One-line description:** Two business partners each submit their real expectations about contributions, returns, decision rights, and exit terms — Claude produces an alignment map and draft agreement before the handshake becomes a dispute.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both partners must submit before synthesis runs. Neither sees the other's input until the synthesis is shared.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_partnership_name` (string, required): Name of the partnership or venture.
- `shared_business_type` (string, required): What is this partnership? e.g., "Joint venture," "Co-ownership," "Revenue share," "LLC partnership."
- `shared_structure` (string, required): Proposed legal structure, e.g., "50/50 LLC," "Revenue share," "Equity split TBD."

### Each Partner Submits Privately
- `contribution` (object, required): What are you actually bringing? Capital, IP, relationships, operational capacity, brand, skills. Be specific and honest about quantity.
- `expected_returns` (object, required): What financial return do you expect? Timeline to returns? Distribution preferences? What would feel fair vs. unfair?
- `role_definition` (object, required): What is your role? What are you not doing? Where are the lines of responsibility?
- `decision_rights` (object, required): How should decisions be made? Who has authority over what? What requires mutual consent?
- `exit_expectations` (object, required): Under what conditions would you want to exit? What would a fair exit look like? What happens if one partner wants out and the other doesn't?
- `dealbreakers` (array, required): What would make you walk away from this partnership before it starts — or end it once it's started?

## Outputs
- `alignment_map` (object): Where both partners agree on contributions, returns, roles, and decision rights vs. where they're misaligned.
- `contribution_gap` (object): Analysis of whether the contributions are balanced relative to the ownership split, and what an equitable structure looks like.
- `decision_rights_draft` (object): Draft decision-making framework with specific domains assigned and consent requirements defined.
- `profit_structure_recommendation` (object): Recommended distribution structure based on both sides' expectations, with rationale and alternatives.
- `exit_clause_draft` (object): Draft exit terms covering voluntary exit, forced exit, valuation method, and buyout mechanics.
- `partnership_agreement_draft` (string): Plain-English partnership agreement covering all of the above. Starting point for legal review.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both partners have submitted their Fabric session.

**Actions:**
1. Confirm contribution, expected_returns, and exit_expectations are present from both sides — these are the three highest-risk gaps.
2. Flag if either side's dealbreakers list is empty.
3. Note any fields that are vague or absent.

**Output:** Readiness confirmation or missing fields.

**Quality Gate:** contribution, expected_returns, and exit_expectations present from both sides.

---

### Phase 1: Extract Core Expectations
**Entry Criteria:** Both submissions confirmed sufficient.

**Actions:**
1. Extract each partner's contribution claim — what they're actually bringing — and assess specificity.
2. Extract each partner's return expectation — what they expect to receive and on what timeline.
3. Extract role definitions and identify overlaps (both claim the same domain) and gaps (neither claims a critical function).
4. Extract decision rights preferences and identify conflicts.
5. Extract exit expectations and note incompatibilities.
6. Flag dealbreakers from both sides — check whether either side's dealbreaker is implicitly present in the other's answers.

**Output:** Side-by-side extraction across all input categories with flagged conflicts and gaps.

**Quality Gate:** All input categories extracted. Dealbreaker conflicts flagged even if implicit.

---

### Phase 2: Assess Contribution Balance
**Entry Criteria:** Core expectations extracted.

**Actions:**
1. Compare the two contribution claims. Are they commensurate with the proposed ownership split?
2. Identify contribution types: capital (liquid, certain) vs. sweat equity (uncertain, time-dependent) vs. IP/brand (hard to value) vs. relationships (highly uncertain).
3. If contributions are asymmetric, assess whether the proposed split reflects that asymmetry.
4. Identify what isn't being contributed that the partnership needs — and who is expected to provide it.
5. Assess return expectations against contribution realism: does the expected return timeline match the actual revenue potential of this type of business?

**Output:** Contribution balance assessment, proposed split evaluation, return timeline reality check.

**Quality Gate:** Contribution asymmetry is quantified where possible. Return timelines are compared to realistic business benchmarks.

---

### Phase 3: Draft the Agreement Components
**Entry Criteria:** Contribution balance assessed.

**Actions:**
1. Draft decision rights framework:
   - Assign clear domains to each partner.
   - Define what requires unanimous consent (major capital decisions, adding partners, selling the business).
   - Define what one partner can decide alone.
   - Define tie-breaking mechanism if neither partner has final say.
2. Draft profit structure:
   - If expectations are compatible: propose a specific structure with rationale.
   - If there's a gap: present two options with honest tradeoffs.
   - Include distribution timing (monthly, quarterly, annual) and reinvestment requirements.
3. Draft exit terms:
   - Voluntary exit (partner chooses to leave): notice period, buyout calculation, non-compete.
   - Forced exit (partner breach or incapacity): trigger conditions, valuation method.
   - Dead-hand scenarios: what happens if neither partner can buy the other out?
   - Valuation method: revenue multiple, asset-based, or third-party appraisal?
4. Draft operating norms: communication cadence, dispute resolution process, annual review process.

**Output:** Decision rights draft, profit structure, exit terms, operating norms.

**Quality Gate:** Every tension zone from Phase 2 has a proposed resolution. Exit terms cover voluntary, forced, and dead-hand scenarios.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement components drafted.

**Actions:**
1. Open with the alignment map — what both sides agree on.
2. Present the gap analysis: each area of misalignment with severity and what it means in practice.
3. Present contribution balance assessment honestly — if one side is contributing significantly more, say so.
4. Present the decision rights draft with any unresolved domains flagged.
5. Present the profit structure recommendation with alternatives if there's a gap.
6. Present the exit terms draft.
7. Deliver the full partnership agreement draft labeled clearly as a starting point for legal review.
8. Close with the three conversations to have before signing anything.

**Output:** Full synthesis — alignment map, gap analysis, contribution assessment, agreement draft, conversation priorities.

**Quality Gate:** Both partners can read this and have a specific, honest conversation about what they're actually agreeing to. Nothing is softened to preserve the relationship.

---

## Exit Criteria
Done when: (1) all input categories compared and gaps rated, (2) contribution balance assessed relative to proposed split, (3) decision rights draft assigns clear domains with consent requirements, (4) profit structure recommendation is specific, (5) exit terms cover voluntary / forced / dead-hand scenarios, (6) partnership agreement draft is ready for legal review.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Contributions are highly asymmetric but proposed split is 50/50 | Name the imbalance clearly. "Partner A is contributing X; Partner B is contributing Y. A 50/50 split implies these are equivalent. They may not be." |
| Phase 3 | Return expectations are incompatible with the business model | Explain the reality: "This type of business typically generates returns on [timeline]. Expecting [Partner A's timeline] is optimistic; expecting [Partner B's timeline] may be realistic." |
| Phase 3 | Exit terms trigger a dealbreaker for one side | Surface it before the draft is delivered. "Partner B's exit expectation conflicts with Partner A's stated dealbreaker. This needs direct resolution." |
| Phase 4 | Decision rights overlaps are unresolvable given both sides' claims | Flag the specific conflict with options. Don't paper over overlap — it will surface as a dispute under pressure. |

## State Persistence
- Partnership history (track agreements, amendments, and disputes)
- Contribution tracking (what was committed vs. actually delivered)
- Decision log (who decided what and when)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
