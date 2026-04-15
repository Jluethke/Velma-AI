# Co-Founder Alignment

**One-line description:** Two co-founders each answer privately about vision, equity, roles, and working style — AI finds the gaps and drafts a working agreement before you build anything.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both co-founders must submit their side before synthesis runs. Neither founder sees the other's raw answers — only the synthesis is shared.

---

## Inputs

### Shared (visible to both founders before submitting)
- `shared_company_name` (string, required): What are you calling it, even if just a working title?
- `shared_stage` (string, required): Where are you? Idea / pre-product / MVP built / revenue / funded.
- `shared_idea_description` (string, required): One paragraph on what you're building and who it's for.

### Each Founder Submits Privately
- `vision` (object, required): Where does this company go in 10 years? What does a win look like — lifestyle business, venture-scale, or a 3-year acquisition? What does failure look like to you?
- `equity_expectations` (object, required): What split do you think is fair and why? What would feel deeply unfair? Do you expect vesting and a cliff? What happens if someone leaves in year one vs. year three?
- `role_definition` (object, required): What is your job? What are you explicitly not doing? Who has final say on product, hiring, and fundraising?
- `working_style` (object, required): Async or sync? How often do you want to sync? How do you handle disagreement? What does a healthy working relationship look like day-to-day?
- `dealbreakers` (array, required): What would make you walk away? Include the things you haven't said out loud yet.
- `commitment_level` (object, required): Full-time from day one or transitioning? Do you have runway? Are there financial, family, or health constraints on how long you can go without income?

## Outputs
- `alignment_map` (object): Where both founders genuinely agree (safe ground) vs. where they're misaligned (tension zones), categorized by input area.
- `gap_analysis` (array): Specific misalignments with severity — minor / significant / potential dealbreaker — and what the gap means in practice.
- `equity_recommendation` (object): A proposed equity structure based on both sides' expectations, with rationale. If the gap is wide, two options are presented with honest tradeoffs.
- `role_boundaries` (object): Draft role definitions for each founder with clear ownership areas and decision rights, including how overlapping domains are resolved.
- `working_agreement_draft` (string): Plain-English working agreement covering equity, roles, decision rights, working norms, and exit terms. Ready to review with a lawyer.
- `red_flags` (array): Things that warrant a deeper conversation before moving forward, surfaced without judgment, with severity rating and suggested framing.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both founders have submitted their side of the Fabric session.

**Actions:**
1. Confirm both sides contain all required inputs. If either side is missing critical fields (vision, equity_expectations, dealbreakers), note which fields are thin — this limits the analysis.
2. Read both sides fully before forming any conclusions.
3. Flag immediately if either side's dealbreakers list is empty — this is often avoidance, not agreement.

**Output:** Confirmation that both sides are sufficient to proceed, or a list of which fields need more detail.

**Quality Gate:** Both founders have submitted. At least vision, equity_expectations, and commitment_level are present on both sides. If a side is sparse, the synthesis notes which areas have limited coverage.

---

### Phase 1: Extract Core Beliefs
**Entry Criteria:** Both submissions confirmed sufficient.

**Actions:**
1. For each input category, extract the core belief from each founder — what they actually mean, not just what they wrote.
2. Pay attention to emphasis and omission: what each side lingered on, and what they avoided entirely.
3. Build an internal comparison matrix across all six input areas.
4. Flag anything one side named that the other didn't mention — silence is as informative as explicit disagreement.

**Output:** Internal comparison matrix (feeds subsequent phases — not shown directly to founders).

**Quality Gate:** Every input category has an extracted belief from both sides. Silent misalignments have been flagged.

---

### Phase 2: Score Alignment by Category
**Entry Criteria:** Comparison matrix complete.

**Actions:**
1. Score each category:
   - **Aligned:** Both founders agree, even if phrased differently.
   - **Workable gap:** Different views but a clear path to resolution.
   - **Tension zone:** Meaningful differences that will create friction if unaddressed.
   - **Potential dealbreaker:** Views incompatible enough to end the partnership if unresolved before building.
2. Assess the equity gap specifically:
   - Within 5-10%: workable. Suggest a structure and rationale.
   - 15%+: needs a direct conversation. Surface what each side's reasoning implies about how they value their own contribution.
   - 50/50 vs. 70/30: flag as requiring resolution before the company is formed.
3. Identify role overlap (both claim the same domain) and role gaps (neither claims a critical function).
4. Assess working style compatibility — not identical styles, but styles that won't poison the relationship under pressure.
5. Weight red flags by severity. A red flag is something that, left unaddressed, has a realistic path to ending the company or partnership.

**Output:** Alignment scores, equity gap assessment, role conflict and gap map, working style read, red flag list with severity.

**Quality Gate:** Severity ratings are honest. Red flags are named directly. Nothing is softened to preserve feelings.

---

### Phase 3: Draft the Working Agreement
**Entry Criteria:** Alignment assessment complete.

**Actions:**
1. Draft equity structure with 4-year vesting and 1-year cliff as default. Include what happens to unvested equity if a founder leaves voluntarily, is asked to leave, or becomes unable to work.
2. If there's a gap: present two options (one closer to each side) with honest tradeoffs.
3. Draft role definitions: assign clear domains, specify decision rights, address overlap explicitly.
4. Draft working norms: communication cadence, how disagreements escalate, performance accountability.
5. Draft exit terms: what triggers a buyout, how the company is valued, what happens if neither side can buy the other out.
6. Note what this agreement doesn't replace: a lawyer should review it; a formal shareholders' agreement is required.

**Output:** Draft working agreement sections covering equity, roles, decision rights, working norms, and exit terms.

**Quality Gate:** Every tension zone from Phase 2 has a proposed resolution. Unresolved items are named, not glossed over.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Working agreement drafted.

**Actions:**
1. Open with the alignment map — what's working. Start with good news to set a collaborative tone.
2. Present the gap analysis: each tension zone, what each side believes, what the gap means in practice.
3. Present red flags with context: "This is a potential dealbreaker not because you're incompatible — it's because it's unresolved. Here's the conversation to have."
4. Present the equity recommendation with rationale. If there's a gap, present both options.
5. Present role definitions. Flag any domains still needing resolution.
6. Deliver the working agreement draft labeled clearly as a starting point for legal review.
7. Close with the three most important conversations to have before building anything.

**Output:** Full synthesis — alignment map, gap analysis, red flags, equity recommendation, role definitions, working agreement draft, conversation priorities.

**Quality Gate:** Both founders can read this together without either feeling blamed. Hard truths are present and clearly stated. Nothing is buried.

---

## Exit Criteria
Done when: (1) all input categories compared and rated, (2) equity gap assessed with concrete recommendation, (3) role boundaries drafted with clear decision rights, (4) red flags surfaced directly with severity, (5) working agreement draft covers equity, roles, decision rights, working norms, and exit terms, (6) three priority conversations identified.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 0 | One founder submitted significantly less detail | Use what's there. Note in synthesis which areas have limited coverage. Flag those areas for a direct conversation. |
| Phase 2 | Expectations are so misaligned it's hard to see a path forward | Don't soften it. Name the incompatibility clearly and explain what resolving it would require. Some partnerships shouldn't happen. |
| Phase 3 | Equity gap is unbridgeable | Present the math honestly. If one founder expects 60% and the other also expects 60%, name it as a fundamental incompatibility — not a working agreement problem. |
| Phase 4 | Red flags involve sensitive personal circumstances (health, finances) | Handle with care but don't omit. Frame as "this came up as context" not "this is a problem with this person." |

## State Persistence
- Alignment history (re-run annually to track how the partnership evolves)
- Agreement versions (what was agreed to and when)
- Tension zone tracker (which issues resurface)
- Role evolution (how ownership shifts as the company grows)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
