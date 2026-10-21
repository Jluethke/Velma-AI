# Vertical Scaffolder

Produces the per-vertical README + roadmap + vertical-brief slice that sits at the root of every `<Vertical>_Vertical/` folder in a MarketingOutreach project. Converts the architect's scope_pack into vertical-specific positioning material that downstream steps (outreach-engine, pricing-model-writer) consume.

## Execution Pattern: Phase Pipeline

Justification: three sequential writes, each reading upstream outputs; no branching, no loop.

```
PHASE 1: VERTICAL BRIEF   --> Slice product_brief for this vertical's regulatory/timing context
PHASE 2: README           --> Operator-facing summary: positioning, ICP, archetypes, timing triggers, deal shape
PHASE 3: ROADMAP          --> Wave 1/2/3 sequencing with milestones and success metrics
```

## Inputs

- `vertical` (required)  --  `{vertical_name, icp_definition, archetypes, regulatory_context, timing_triggers}`.
- `product_brief` (required, string)  --  ≥ 500 words.
- `voice_sample` (required, string).
- `credibility_line` (required, string).
- `sender_signature` (required, object).
- `company_history` (required, string)  --  used for the "why us in this vertical" narrative.
- `competitive_wins_losses` (optional, object)  --  informs the roadmap's risk assumptions.

## Outputs

- `vertical_brief_md`  --  300-600 words; vertical-specific slice of the product_brief that outreach-engine and pricing-model-writer consume as THEIR `product_brief` input.
- `readme_md`  --  operator-facing summary of this vertical folder.
- `roadmap_md`  --  Wave 1/2/3 sequencing with milestones.

---

## Execution

### Phase 1: VERTICAL BRIEF  --  Slice the Portfolio Brief

### Entry Criteria
All required inputs present.

### Actions
1. Take the `product_brief`, extract only the sections that apply to this vertical (look for vertical_name tokens, regulatory terms from regulatory_context, timing triggers).
2. Add a 1-2 paragraph intro specific to this vertical: the buyer's pain in their language, the timing trigger in their regulatory calendar, the mechanism of capture that's most relevant for their stack layer.
3. Append a short "Why us for this vertical" paragraph built from `company_history` + any past_deals or case_studies that specifically touched this vertical (detected by archetype match).
4. Include the `credibility_line`.
5. Omit everything not relevant to this vertical (e.g. in a CRE brief, omit NAIC references; in an insurance brief, omit loan-book terms).

### Output
`vertical_brief_md` (300-600 words).

### Quality Gate
Word count in range; `regulatory_context` tokens present; no cross-vertical terms that don't apply; voice-anchor sentence-length median within ±15% of voice_sample.

### Phase 2: README  --  Operator-Facing Summary

### Entry Criteria
`vertical_brief_md` built.

### Actions
Write the README with these sections in order:

1. **Vertical name + 1-sentence purpose**  --  what this folder is for.
2. **Positioning**  --  2-3 sentences: what we sell this vertical, why them, why now.
3. **ICP summary**  --  bulleted highlights from `icp_definition` (industry, size band, geography, key signals, deal-breakers).
4. **Archetypes covered**  --  list with a 1-sentence value-capture hook per archetype.
5. **Timing triggers**  --  bullets from `vertical.timing_triggers` with current dates or regulatory calendar references.
6. **Expected deal shape**  --  base license range, royalty mechanism, performance share direction. Points at the pricing doc.
7. **Folder contents**  --  enumerate what the operator will find in this folder (README, roadmap, outreach list, tactical copy, pricing one-pagers, etc.).
8. **How to use**  --  5-step operator workflow (pick Wave 1 targets → warm paths first → cold sends second → response handling → calendar review).

### Output
`readme_md` (~400-700 words).

### Quality Gate
All eight sections present; every archetype in `vertical.archetypes` appears in the archetype section; folder contents list matches the architect's standard layout.

### Phase 3: ROADMAP  --  Wave Sequencing with Milestones

### Entry Criteria
`readme_md` built.

### Actions
Write the roadmap with these sections:

1. **Wave 1 (Days 0-30)**  --  who we hit first and why. Pull the top-scored archetype × top-scored targets per the architect's scoring model. Include warm-intro targets ahead of cold.
2. **Wave 2 (Days 30-60)**  --  broader set; includes channel partners and upstream buyers that propagate the artifact downstream.
3. **Wave 3 (Days 60-120)**  --  long-tail + retargets from Wave 1/2 that didn't respond.
4. **Milestones**  --  first response → first call → first NDA → first term sheet → first signed engagement. Estimated calendar dates from launch.
5. **Success metrics per wave**  --  response rate target (baseline 2-5% cold, 15-30% warm), meeting-booked target, NDA-signed target, term-sheet target.
6. **Assumptions we're making**  --  if `competitive_wins_losses` supplied, list what we're assuming about buyer decision drivers; if not, list what would need to be true for Wave 1 to hit the response target.
7. **Retarget protocol**  --  Wave 1 non-responders get Wave 2 archetype material at Day 45; Wave 2 non-responders get a soft 90-day re-engage at Day 135.

### Output
`roadmap_md` (~600-900 words).

### Quality Gate
All seven sections present; wave dates are explicit day ranges; milestones have estimated calendar dates; success metrics have numeric targets, not vague "improve response rate".

---


---

## Worked Example

Illustrative only.

Given typical inputs for Produces per-vertical README + roadmap + vertical-brief slice. Downstream flows , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

1. `vertical_brief_md` exists, 300-600 words, regulatory context tokens present.
2. `readme_md` exists with all eight sections.
3. `roadmap_md` exists with all seven sections and numeric targets.
4. Voice anchor check passes for all three.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| VERTICAL BRIEF | product_brief has no vertical-specific content detectable | **Adjust**  --  generate a generic brief and flag for human review |
| VERTICAL BRIEF | Word count out of range | **Retry**  --  once with tighter budget; if still out, accept |
| README | Archetype list is empty | **Abort for this vertical**  --  upstream scope_pack is incomplete |
| ROADMAP | No archetypes × targets scored yet (roadmap runs before outreach-engine?) | **Defer**  --  emit a placeholder roadmap with TBD target names and flag for re-run after outreach-engine emits scored_lead_list |

## Reference

### Why This Skill Exists

Without vertical-scaffolder, every downstream step has to re-derive vertical context from the portfolio-level product_brief. That produces inconsistent framing across verticals in the same run (insurance brief uses one phrase for the timing trigger, CRE brief uses a different one). Centralizing the vertical-brief slice here gives outreach-engine and pricing-model-writer a single consistent voice per vertical.

The README + roadmap are operator-facing  --  they don't feed other flows. They exist so the operator can orient themselves inside any vertical folder without re-reading the portfolio-level PROJECT_BRIEF.

### Vertical Brief Shape

```markdown
# <Vertical>  --  Commercial Positioning

## The buyer's pain
<2-3 paragraphs in the buyer's language>

## Why now
<timing trigger  --  regulatory calendar, industry shift, recent high-profile failure>

## What we capture
<mechanism  --  the 2-3 surfaces of their operation that our product touches>

## Why us here
<company_history + past deals / case studies that landed in this vertical>

<credibility_line>
```

This is the shape outreach-engine's `product_brief` input expects, so vertical-scaffolder and outreach-engine are tightly coupled by convention.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2026-present The Wayfinder Trust. All rights reserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
