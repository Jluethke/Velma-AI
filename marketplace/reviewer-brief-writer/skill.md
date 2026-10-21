# Reviewer Brief Writer

Produces two documents per reviewer: a 1-page 30,000-foot pitch and a detailed architectural followup. Adapts voice, jargon load, and example domain to the reviewer's declared `domain_fluency` (native / adjacent / outside) and `relationship` (friend / peer / cold). Modeled on the `Mikkel_Finsen_Patent_AB_30K_Pitch.md` + `Mikkel_Finsen_Patent_AB_DETAILED_FOLLOWUP.md` pair in the Wayfinder MarketingOutreach package.

## Execution Pattern: Phase Pipeline

Justification: two sequential write phases per reviewer (30K brief → detailed followup), reviewer-independent parallelism across multiple reviewers, no feedback loop within a single reviewer's pair.

```
PHASE 1: CONFIGURE   --> Decide jargon budget, example domain, tone register from reviewer profile
PHASE 2: 30K BRIEF   --> 1 page: what it is, why now, why the reviewer specifically, ask
PHASE 3: FOLLOWUP    --> Deep architecture + claim shape + prior-art comparison (when portfolio_proof supports)
```

## Inputs

- `reviewer` (required)  --  `{name, role, org, domain_fluency, relationship, review_goal}`.
- `product_brief` (required, string).
- `voice_sample` (required, string)  --  ≥ 200 words.
- `case_studies` (required, array).
- `portfolio_proof` (optional, array)  --  patents, filings, certifications. Enables the detailed-followup path.
- `credibility_line` (required, string).
- `sender_signature` (required, object).
- `cross_domain_examples` (optional, object)  --  per-domain illustrative examples keyed by reviewer fluency domain. If absent, Phase 1 picks from a shipped catalog.

## Outputs

- `brief_30k_md`  --  1 page, jargon-adapted.
- `detailed_followup_md`  --  multi-page deep dive (null if portfolio_proof insufficient).
- `adaptation_notes`  --  what was substituted or stripped and why (internal review aid; not for the reviewer).

---

## Execution

### Phase 1: CONFIGURE  --  Adapt Parameters to Reviewer

### Entry Criteria
Reviewer object complete.

### Actions
1. **Jargon budget** by `domain_fluency`:
   - `native`  --  domain terms allowed freely; assumes the reviewer knows NAIC / Solvency II / IFRS 17 / Schedule P / Lloyd's syndicate structure / etc.
   - `adjacent`  --  domain terms allowed with a one-phrase parenthetical gloss on first use (`"NAIC Schedule P (the loss-reserving table US insurance regulators require)"`).
   - `outside`  --  domain terms stripped entirely; every concept translated into a plain-English or cross-domain analog.
2. **Example domain**  --  pick an illustrative example from the reviewer's own domain when possible. If `cross_domain_examples[reviewer.domain]` is present, use it. Else pick from the shipped catalog (healthcare IT example for a CTO/CISO, fintech example for a lending reviewer, etc.).
3. **Tone register** by `relationship`:
   - `friend`  --  warm, first-name, direct ask for a gut-check.
   - `peer`  --  professional, neutral, ask for a technical stress-test.
   - `cold`  --  formal, establish context before the ask, explicit on what you've already considered so you're not wasting their time.
4. Decide whether the detailed followup is viable  --  requires `portfolio_proof` with at least 2 proof points (patent numbers, filings, published work) so the claim-shape section has substance.

### Output
`config_pack` with jargon budget, example domain, tone register, followup_viable flag.

### Quality Gate
Jargon budget is one of the three known values; at least one example source is chosen; followup_viable is true or a specific reason is recorded.

### Phase 2: 30K BRIEF  --  1 Page High-Altitude Pitch

### Entry Criteria
config_pack built.

### Actions
1. Structure the brief in this order:
   - **Headline**  --  one sentence in the reviewer's language describing what the product does.
   - **Why now**  --  one short paragraph on the timing trigger, stripped of domain-specific regulatory names if `outside`.
   - **Why you specifically**  --  one paragraph tying the reviewer's role + stated review_goal to what they can stress-test in this product.
   - **What I've built so far**  --  3-5 bullet proof points from portfolio_proof + case_studies + past_deals, voiced at the jargon budget.
   - **What I'm asking for**  --  exact deliverable from the reviewer (a 30-minute call, a written gut-check, a technical review). Never vague.
   - **Background you may want before we talk**  --  links or attachments (the detailed followup if viable, a case study, a patent filing).
   - **Signature block**  --  `credibility_line` + `sender_signature` (name + role + entity + contact email + phone).
2. Apply voice anchor: match `voice_sample` register sentence-length, greeting style, closing style.
3. Enforce 1-page length: ≤ 450 words including all sections. Use a word counter.
4. **Jargon audit:** if `outside`, scan for forbidden tokens from the reviewer's non-domain (e.g. for a healthcare reviewer being pitched an insurance product: strip "NAIC", "Solvency II", "Schedule P", "IFRS 17", "cedent", "ceding commission", "BCAR"  --  replace with generic equivalents or cross-domain analogs).

### Output
`brief_30k_md`.

### Quality Gate
≤ 450 words; all six sections present in order; jargon audit passes; voice-anchor sentence-length median within ±15% of voice_sample.

### Phase 3: FOLLOWUP  --  Deep Architecture + Claim Shape (Conditional)

### Entry Criteria
`config_pack.followup_viable` is true.

### Actions
1. Structure the followup:
   - **Architecture**  --  how the product is built, in 3-6 subsections matching the product_brief's architectural spine.
   - **Claim shape**  --  if the product is patent-backed, what the independent claims cover and why they're novel. Stripped of patent-prosecution jargon if `outside`.
   - **Prior-art comparison**  --  3-5 comparable products / papers / open-source projects and how this differs. Include links.
   - **What could break**  --  candid failure modes the reviewer should probe (non-bypassability assumption, edge cases in the governor's constraint scaling, coverage gaps in the envelope, etc.). Writing out the weaknesses signals intellectual honesty and invites the stress-test.
   - **Specific questions for you**  --  tailored to the reviewer's role and review_goal, 3-5 sharp questions.
2. Apply jargon budget from config_pack; apply voice anchor.
3. Emit as markdown with H2/H3 structure so the DOCX builder renders clean headings.

### Output
`detailed_followup_md` or null.

### Quality Gate
All five sections present (if emitted); at least 3 prior-art comparables with links; at least 3 specific questions; jargon budget honoured.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Produces a 1-page 30K-foot pitch and a detailed architectural followup per revie, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

1. `brief_30k_md` exists, ≤ 450 words, six sections, jargon-adapted.
2. `detailed_followup_md` exists if portfolio_proof supported, else null with a recorded reason.
3. `adaptation_notes` records every substitution (e.g. "replaced 'NAIC Schedule P' with 'loss-reserving disclosure table' for outside-fluency reviewer").
4. Voice anchor check passes for both docs.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| CONFIGURE | Reviewer's domain not in catalog and no `cross_domain_examples` | **Default**  --  use closest-fit example from the catalog; flag in adaptation_notes |
| CONFIGURE | portfolio_proof too thin for followup | **Adjust**  --  produce 30K brief only; record followup_viable=false with reason |
| 30K BRIEF | Word count exceeds 450 | **Retry**  --  once with stricter budget; if still over, trim the "Background" section first, then "What I've built" |
| 30K BRIEF | Jargon audit finds forbidden tokens after strip | **Retry**  --  with an explicit forbidden-token list; if still failing, flag for human review |
| FOLLOWUP | Prior-art comparables fabricated (no real link) | **Retry**  --  once with strict source-citation enforcement; if still failing, reduce to 1-2 verified comparables |

## Reference

### Shipped Example Catalog

- **Healthcare IT (CTO / CISO / CMIO)**  --  clinical decision support governance: model proposes a treatment, never acts; governor evaluates against an approved-indication envelope; emits an audit trail for the medical board.
- **Fintech / lending CRO**  --  credit model governance: model proposes a credit line, never acts; governor evaluates against a fair-lending envelope; emits an audit trail for the examiner.
- **Platform / agentic AI CTO**  --  agent tool-call governance: agent proposes a tool call, never executes; governor evaluates against a capability envelope; emits an audit trail for the platform incident-response team.
- **Autonomous-vehicle safety lead**  --  actuator governance: model proposes a maneuver, never executes; governor evaluates against a safety envelope; emits an audit trail for the AVSC committee.
- **Geopolitical risk analyst**  --  forecast governance: model proposes a scenario, never commits to it; governor evaluates against a calibrated-prior envelope; emits an audit trail for the intelligence consumer.
- **Default (non-regulated CTO / VP Eng)**  --  same pattern, generic example: model proposes a system change, never applies it; governor evaluates against a stability envelope; emits an audit trail for the operator.

### Jargon Strip Table (Illustrative  --  Insurance Products → Healthcare Reviewer)

| Domain term | Strip to |
|---|---|
| NAIC Schedule P | loss-reserving disclosure table |
| Solvency II SFCR | European solvency-and-capital disclosure |
| AM Best BCAR | capital-adequacy rating calculation |
| IFRS 17 | insurance-contract accounting standard |
| cedent / ceding commission | the insurer passing risk upstream / the fee paid for that pass |
| combined ratio | loss + expense as a percent of premium (under 100 = profitable) |
| GWP | annual premium volume |

The skill ships similar tables for CRE→outside, lending→outside, etc.

### Why 30K First, Detailed Second

An outside-fluency reviewer who gets the detailed followup first will bounce off the jargon and the volume. The 30K brief earns the right to send the followup. This is the `feedback_pitch_altitude` lesson from the Wayfinder user's accumulated feedback  --  default high-altitude, ship detail only on request.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2026-present The Wayfinder Trust. All rights reserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
