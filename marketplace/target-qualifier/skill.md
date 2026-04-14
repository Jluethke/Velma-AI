# Target Qualifier

Takes the raw target list from the sector scanner and qualifies each company against the specific patent claims — scoring deal size potential, regulatory urgency, warm path availability, and response probability. Outputs a scored, ranked list ready for the prioritization engine.

**Why this exists:** Not all qualifying targets are equal. A company with a $2B adaptive AI system and an EU AI Act deadline in 90 days is worth 10x the outreach effort of a $50M startup with no regulatory pressure. This skill separates the A-list from the noise before a single hour of outreach time is spent.

**Core principle:** Score on four dimensions — exposure magnitude, regulatory urgency, deal accessibility, and response probability. Weight toward companies where the pain is acute, the deal is reachable, and the timing is now.

## Inputs

- `raw_targets`: list[object] — Output from sector-target-scanner
- `patent_families`: list[object] — Families being licensed with claim details
- `deal_parameters`: object — `{target_upfront_min, target_upfront_max, royalty_rate_range, preferred_field_of_use}`
- `licensor_network`: object — `{investors, advisors, board, alumni_networks}` — for warm path scoring
- `urgency_window_days`: integer — How many days until key regulatory deadline (e.g., 120 for EU AI Act enforcement)

## Outputs

- `qualified_targets`: list[object] — Scored companies: `{company, overall_score, deal_size_estimate, urgency_score, accessibility_score, response_score, warm_paths, recommended_entry, disqualification_reason}`
- `a_list`: list[string] — Top 5-10 companies by overall score — immediate outreach priority
- `b_list`: list[string] — Next 10-20 companies — 90-day pipeline
- `disqualified`: list[object] — Companies removed with reason
- `qualification_report`: string — Summary of scoring methodology and top findings

---

## Execution

### Phase 1: CLAIM MAPPING

**For each raw target:**

1. **Map their known AI system to specific patent claims.**

   **Family B claim triggers (any one = qualifying):**
   - System adapts parameters based on live operational data → Claim 1 (six-stage pipeline)
   - System monitors its own behavioral drift → Claims 4, 5, 6 (N-axis divergence)
   - System has a trust or confidence score that degrades under stress → Claims 7, 8, 9 (trust computation)
   - System can roll back to a prior state → Claims 17, 18 (two-layer rollback)
   - System maintains an audit log of decisions → Claims 20-23 (audit chain)
   - System predicts future reliability from current trends → Claims 10-13 (trust horizon)

   **Family A claim triggers (any one = qualifying):**
   - System actuates physical outputs based on AI decisions → Claim 1 (actuation governance)
   - System has a safety envelope that constrains outputs → Claims covering enforcement adapter
   - System has a non-bypassable constraint layer → Anti-amplification invariant claims

2. **Assign claim coverage score.** How many independent claims does their system likely touch?
   - 1 independent claim → LOW coverage (narrow exposure)
   - 2 independent claims → MEDIUM coverage
   - 3 independent claims → HIGH coverage (strong licensing position)

**Output:** Claim mapping per target

---

### Phase 2: DEAL SIZE ESTIMATION

**For each target, estimate the economic value of a license:**

1. **Revenue base.** Find or estimate the revenue attributable to the AI system:
   - Insurance: gross written premium on AI-underwritten lines
   - Autonomous vehicles: vehicle revenue or software licensing revenue
   - Financial AI: AUM, trading volume, or subscription revenue
   - Medical AI: contract value or procedure volume
   - Robotics: unit sales or SaaS revenue

2. **Royalty estimate.** Apply the royalty rate range from deal_parameters to the revenue base:
   - 0.08-0.15% × revenue base = annual royalty estimate

3. **Upfront estimate.** Based on deal size and company profile:
   - Revenue > $1B: $3-5M upfront
   - Revenue $100M-$1B: $1-3M upfront
   - Revenue < $100M: $500K-$1M upfront

4. **Lifetime deal value.** Upfront + (annual royalty × 5 years) = LTV estimate

**Output:** `deal_size_estimate` per target

---

### Phase 3: URGENCY SCORING

Score 1-10 based on:

| Factor | Score Weight | High Score Criteria |
|---|---|---|
| Regulatory deadline proximity | 30% | Key deadline within 90 days |
| Regulator has issued specific guidance | 20% | Named company or sector in guidance |
| Peer company already licensed | 20% | Competitor has taken a license (creates FOMO) |
| Recent enforcement action in sector | 15% | Fine or citation in past 12 months |
| Company has publicly acknowledged gap | 15% | Exec quoted on AI governance challenges |

**Output:** `urgency_score` per target (1-10)

---

### Phase 4: ACCESSIBILITY SCORING

Score 1-10 based on:

| Factor | Score Weight | High Score Criteria |
|---|---|---|
| Warm path exists | 35% | STRONG warm path via shared investor or board |
| Decision-maker identified | 20% | GC or CRO named with LinkedIn confirmed |
| Decision-maker is publicly active | 15% | Posts on LinkedIn, speaks at conferences |
| Company size / procurement complexity | 15% | Mid-market ($100M-$1B) moves faster than enterprise |
| Prior licensing history | 15% | Company has licensed IP before (not allergic to it) |

**Output:** `accessibility_score` per target

---

### Phase 5: RESPONSE PROBABILITY SCORING

Score 1-10 based on:

| Factor | Score Weight | High Score Criteria |
|---|---|---|
| Regulatory pressure is acute | 25% | Regulator has specifically called out this company or sector |
| Technical team is engaged in governance | 20% | Engineering blog posts on model monitoring, drift, safety |
| GC or CRO has spoken publicly on AI risk | 20% | Quotes in press, conference talks on AI governance |
| Company is raising capital | 15% | Series B+ or IPO prep — diligence surfaces IP gaps |
| Company has been acquired or is in M&A | 10% | New owner does IP audit |
| No prior contact / clean slate | 10% | Not burned by a prior bad licensing interaction |

**Output:** `response_score` per target

---

### Phase 6: OVERALL SCORING AND RANKING

**Overall score formula:**
```
overall_score = (
    deal_size_normalized × 0.30 +
    urgency_score        × 0.25 +
    accessibility_score  × 0.25 +
    response_score       × 0.20
)
```

**A-List criteria (immediate outreach):**
- Overall score ≥ 7.0
- Deal size estimate ≥ $1M lifetime value
- At least one qualifying signal confirmed (not just inferred)

**B-List criteria (90-day pipeline):**
- Overall score 4.0-6.9
- Deal size estimate $250K-$1M lifetime value

**Disqualification criteria:**
- No qualifying AI system signal found after deep scan
- Company already in litigation with a patent holder (legal team is in defense mode)
- Company is pre-revenue or Series A (no budget for IP licensing)
- Company has explicitly stated they only use open-source AI (low exposure)

**Output:** `qualified_targets`, `a_list`, `b_list`, `disqualified`

---

### Phase 7: WARM PATH COMPILATION

For each A-List target:
1. Cross-reference licensor_network against the target's known investors, board members, advisors, alumni
2. Score each warm path: STRONG (shared investor who knows both), MEDIUM (2nd-degree LinkedIn), WEAK (conference overlap)
3. Draft the activation note for each STRONG or MEDIUM path

**Output:** `warm_paths` per A-List target

---

## Exit Criteria

Done when:
1. Every raw target has a claim mapping, deal size estimate, and four dimension scores
2. A-List and B-List separated with clear criteria
3. Disqualified targets documented with reason
4. Warm paths compiled for all A-List targets
5. Qualification report assembled

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
