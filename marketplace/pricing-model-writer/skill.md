# Pricing Model Writer

Produces a **top-down business plan** per vertical: portfolio context → addressable market → go-to-market motion → **4-component commercial model** (Base License band + Scale Royalty in bps + Performance Share tied to outcome metric + **First-Mover TRUST Incentive**) → per-archetype pricing table → term-sheet outline → milestones & success metrics. Sized and worded for the specific archetype shape of the target buyer ecosystem, with every dollar figure provenanced back to a `past_deal` or `case_study` entry in the business_pack. Also emits a 1-page investor overview variant and (when portfolio_proof is supplied) a formal risk register.

**First-Mover TRUST Incentive (4th component).** For the first licensee signed per archetype × per vertical, the deal includes: (a) designation as the named `<Vertical> Implementation Creator` on the TRUST registry  --  a canonical, publicly-attested credit for being the industry's first production implementer; (b) one-time TRUST token grant of `Y` tokens, vested 50% on signature + 50% on 12-month live-production milestone; (c) commercial utility retained  --  the Base / Royalty / Performance structure stands independently, TRUST is additive and never substitutive. Scope: one Creator designation per archetype per vertical. Purpose: drive traction simultaneously on the commercial side (Patent A/B licensing) and the TRUST ecosystem (Family F adoption velocity) without discounting the commercial terms. See template section 4.4 for the standard clause.

Mirrors the CAIRN dossier pattern: **baseline template → Claude refinement → parse → fabrication gate**. The baseline comes from a shipped template library; Claude's job is to refine voice and size numbers against provided comparables, not invent them.

## Execution Pattern: Phase Pipeline

Justification: three sequential phases (baseline → refine → emit), no branching, no feedback loop once the refinement pass completes.

```
PHASE 1: BASELINE   --> Pick template for vertical, substitute variables, size bands from comparables
PHASE 2: REFINE     --> Claude refines voice + fills archetype-specific rows + checks provenance
PHASE 3: EMIT       --> Write pricing_business_plan.md + investor_overview.md + risk_register.md (if eligible)
```

## Inputs

- `vertical` (required, object)  --  `{vertical_name, icp_definition, archetypes, regulatory_context, timing_triggers}`.
- `product_brief` (required, string)  --  synthesized product brief from the architect's INTAKE phase.
- `voice_sample` (required, string)  --  ≥ 200 words; voice anchor.
- `case_studies` (required, array)  --  `{title, customer_or_archetype, challenge, approach, outcome_metric}`.
- `past_deals` (required, array, may be empty)  --  `{counterparty, year, type, size_band, outcome, takeaway}`.
- `archetype_pack_registry` (required, object)  --  per-archetype one-pagers; the pricing one-pagers mirror this shape.
- `target_intel_registry` (required, object)  --  used to sanity-check that pricing bands match the observable size of the targets.
- `portfolio_proof` (optional, array)  --  patents, filings, certifications. If present, the risk register variant is generated.
- `credibility_line` (required, string).
- `sender_signature` (required, object).

## Outputs

- `pricing_business_plan_md` (string)  --  the main 3-component pricing document.
- `investor_overview_md` (string)  --  1-page variant sized for investor audience, not buyer audience.
- `risk_register_md` (string or null)  --  formal risk register; null if portfolio_proof was empty.
- `archetype_pricing_one_pagers` (object)  --  per-archetype pricing one-pager keyed by archetype name.
- `provenance_map` (object)  --  maps every dollar figure in every output to its source (past_deal.counterparty or case_study.title). Required for the fabrication gate.

---

## Execution

### Phase 1: BASELINE  --  Template Pick + Variable Substitution

### Entry Criteria
All required inputs present; case_studies + past_deals between them have at least one quantifiable outcome metric.

### Actions
1. Pick a vertical template from the Reference library (insurance / CRE / healthcare / lending / agentic-AI / services / default). The template is a markdown skeleton with placeholders `{{company_name}}`, `{{credibility_line}}`, `{{archetype_<n>_name}}`, `{{base_license_band}}`, `{{scale_royalty_bps}}`, `{{performance_share_metric}}`, etc.
2. **Size the bands from comparables:**
   - Base License band = median(past_deals[type=license].size_band) ± one tier, floored at vertical's minimum-viable-deal size for the archetype. If no license deals, use case_study outcome_metric to back into a band ("if the customer saved $X, the license captures 5-15% of that annualized").
   - Scale Royalty = integer basis points tied to the archetype's gross scale proxy (for insurance: Gross Written Premium bps; for CRE: loan-book bps or asset-value bps; for lending: originated-dollar bps). Default starting ranges shipped per vertical.
   - Performance Share = percent of quantified outcome metric (loss ratio improvement, capital relief, loan default reduction, triage accuracy lift)  --  ranged at 10-30% of the outcome with the range tightened by case_study evidence.
3. Substitute placeholders. Leave a comment in the markdown `<!-- PROVENANCE: <source> -->` after every quantitative claim so the REFINE phase can verify.

### Output
`baseline_pricing_md` (markdown with provenance comments), `baseline_investor_overview_md`, optional `baseline_risk_register_md`.

### Quality Gate
Every `{{...}}` placeholder resolved; every quantitative claim has a PROVENANCE comment; no comment resolves to "fabricated" or empty.

### Phase 2: REFINE  --  Claude Refines Voice + Archetype Rows

### Entry Criteria
`baseline_*_md` artifacts emitted.

### Actions
1. Claude reads `voice_sample` + `baseline_pricing_md` + `product_brief` and refines: tone consistency across sections, connector sentences between archetype rows, clarification of mechanism vs commercial term, removal of AI-tone tells (no "current", no "smoothly", no "unlock").
2. For each archetype in `vertical.archetypes`, Claude generates a 200-300-word pricing paragraph inside the same document:
   - Headline: archetype-specific value capture.
   - Base License range for that archetype.
   - Scale Royalty tied to that archetype's specific volume metric.
   - Performance Share tied to that archetype's specific outcome metric.
   - One-line justification citing a past_deal or case_study.
3. Claude emits `archetype_pricing_one_pagers`  --  one 400-600-word standalone doc per archetype (mirrors archetype_pack_registry structure but focused on commercial terms, not product pitch).
4. Claude emits `provenance_map`: `{claim_text: source_reference}` for every dollar figure and bps figure in every output. This gets audited by the fabrication gate.
5. Claude refines `baseline_investor_overview_md` to a clean 1-page structure: Problem → Mechanism → Commercial model → Traction (past_deals) → Ask.
6. If `portfolio_proof` present, Claude refines `baseline_risk_register_md`: regulatory / technical / commercial / operational / IP risk categories, each with likelihood × impact × mitigation.

### Output
Refined `pricing_business_plan_md`, `investor_overview_md`, `risk_register_md` (if eligible), `archetype_pricing_one_pagers`, `provenance_map`.

### Quality Gate
- **Fabrication gate:** every entry in provenance_map resolves to a real past_deal or case_study (string match of counterparty or title). If any entry resolves to "derived" or "estimated" without a source, the gate fails  --  pick the closest comparable and re-derive, or soften the claim to a range with no anchor.
- **Voice gate:** no forbidden tokens ("current", "smoothly", "unlock", "synergy", "leverage" as a verb, "world-class"). Sentence length median ≤ 22 words.
- **Length gate:** pricing_business_plan 2-4 pages; investor_overview exactly 1 page; per-archetype one-pagers 400-600 words.

### Phase 3: EMIT  --  Write Artifacts

### Entry Criteria
All refined artifacts + provenance_map built and gated.

### Actions
Write every artifact to its file in the architect's output_root. Record file + sha256 in the output object so artifact-codegen can pick them up for DOCX conversion.

### Output
File paths keyed by artifact name.

### Quality Gate
Files exist; sha256 recorded; lengths within bounds.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Produces a 3-component pricing document (Base License + Scale Royalty bps + Perf, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

1. `pricing_business_plan_md` exists and covers all archetypes.
2. `investor_overview_md` exists and is exactly 1 page.
3. `risk_register_md` exists iff portfolio_proof was supplied.
4. `archetype_pricing_one_pagers` contains one entry per archetype in vertical.archetypes.
5. `provenance_map` maps every quantitative claim to a real source.
6. Fabrication gate, voice gate, length gate all pass.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| BASELINE | No template for vertical | **Fallback**  --  use "default" template; flag the output for human review |
| BASELINE | past_deals + case_studies contain zero quantitative outcomes | **Adjust**  --  produce the plan with ranges only, no anchor figures; flag explicitly in the doc as "pricing bands illustrative pending first closed deal" |
| REFINE | Fabrication gate fails (claim can't be sourced) | **Retry**  --  once with stricter enforcement; if still failing, soften the claim to a sourced range |
| REFINE | Voice gate fails | **Retry**  --  once with a tighter voice prompt; if still failing, accept and flag for human review |
| REFINE | Length gate fails | **Retry**  --  once with a tighter length budget; if still failing, accept |
| EMIT | File write fails | **Surface**  --  report path + OS error; do not swallow |

## Reference

### Template Library (Shipped)

- `insurance.md`  --  archetypes: primary carrier, reinsurer, rating agency, reinsurance broker, ILS, captive, core-system, Big-Actuarial. Volume proxy: Gross Written Premium. Outcome metric: combined ratio / loss ratio / ceding commission / CAT-layer savings.
- `cre.md`  --  archetypes: Lloyd's syndicate, commercial carrier, MGA, wholesale broker, reinsurer, lender, REIT, sponsor. Volume proxy: asset value or loan book. Outcome metric: loss-cost, LTV improvement, policy-renewal close rate.
- `healthcare.md`  --  archetypes: AMC CMIO, payor medical director, EHR vendor, SaMD operator, FDA consultancy, AHRQ adjacent. Volume proxy: covered lives or annual claims count. Outcome metric: diagnostic accuracy lift, documentation-burden reduction, denied-claim rate drop.
- `lending.md`  --  archetypes: bank model risk officer, fintech lender CRO, OCC examiner-facing GC, credit-card model team, BNPL CRO. Volume proxy: originated dollars. Outcome metric: default rate delta, fair-lending audit pass rate, CCAR capital relief.
- `agentic_ai.md`  --  archetypes: platform CTO, enterprise agentic buyer, risk/control officer, policy/GC, system integrator. Volume proxy: deployed agents or tool-call volume. Outcome metric: incident rate, rollback frequency, auditor acceptance.
- `services.md`  --  archetypes: managing partner, director of services, head of solutions, VP CS, RFP coordinator. Volume proxy: engagement dollars or seat count. Outcome metric: utilization, retention, expansion ARR.
- `default.md`  --  fallback template with generic archetype shape and commercial terms.

### 4-Component Pricing Shape

Every pricing plan this skill emits uses the same four-component shape:

1. **Base License**  --  annual fixed fee by archetype band. Covers access + standard support.
2. **Scale Royalty**  --  basis points on a volume proxy that scales with the buyer's business (GWP, loan book, covered lives, etc.). Bps are small  --  the design is that the buyer never feels the royalty as a cost they could escape by cancelling.
3. **Performance Share**  --  percent of quantified outcome the product drove (loss-ratio improvement, capital relief, etc.). The upside component  --  the one that makes the deal look cheap at scale once the outcome is real.
4. **First-Mover TRUST Incentive**  --  for the first signed licensee per archetype × per vertical only. Named `<Vertical> Implementation Creator` designation on the TRUST registry + one-time TRUST token grant vested over 12 months. Additive to the commercial terms, never substitutive. Designed to co-drive adoption of the Patent A/B product AND the TRUST ecosystem. Falls away for subsequent licensees in the same archetype × vertical  --  they get the commercial terms only.

This shape is designed to pass four tests simultaneously:
- **Procurement-friendly** (most of the money is at scale, not upfront)
- **Audit-friendly** (every component ties to a measurable)
- **Outcome-aligned** (performance share means the seller shares the risk)
- **Traction-aligned** (first-mover incentive accelerates both commercial and ecosystem adoption without diluting commercial terms)

### Why Baseline + Refine Is Safer Than Generate-From-Scratch

A from-scratch LLM pricing doc tends to hallucinate dollar figures that sound plausible but aren't anchored to any real comparable. The baseline template forces every quantitative claim to come from either (a) a shipped default range or (b) a past_deal / case_study. Claude's job is to refine voice and structure, not to invent numbers. The provenance_map is the receipt.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2026-present The Wayfinder Trust. All rights reserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
