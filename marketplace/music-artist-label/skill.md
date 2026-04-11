# Music Artist-Label Deal

**One-line description:** The artist and the label each submit their real vision, deal expectations, and non-negotiables before signing — Claude aligns on a record deal structure that gives the artist creative control where it matters and the label the commercial rights they need to invest, without the artist signing away their career.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both artist and label must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_artist_name` (string, required): Artist or band name.
- `shared_deal_type` (string, required): Deal type under discussion (recording, distribution, licensing, 360, joint venture).

### Artist Submits Privately
- `artist_creative_vision` (string, required): What kind of artist are you building? What creative control is non-negotiable?
- `artist_financial_needs` (object, required): Advance expectations, royalty floor, recoupment concerns — what you need to live and create.
- `artist_what_they_will_not_sign` (array, required): Rights you will not give — life rights, 360 participation, publishing, touring income, sync rights.
- `artist_concerns_about_the_label` (object, required): Creative interference, marketing commitment, priority status, what happens if the first album underperforms?
- `artist_what_success_looks_like` (object, required): Chart position, audience size, creative legacy, financial independence — what are you actually trying to achieve?

### Label Submits Privately
- `label_investment_and_return_model` (object, required): What you plan to invest — advance, recording budget, marketing — and what return you need to justify it.
- `label_commercial_priorities` (object, required): What market, what timeline, what commercial outcomes you are targeting.
- `label_deal_terms_required` (object, required): Royalty rates, term, album commitment, options, rights sought — what the deal structure needs to look like.
- `label_concerns_about_the_artist` (array, required): Commercial risk factors — genre challenges, streaming trends, artist behavior, team quality.
- `label_what_makes_this_artist_valuable` (string, required): Why are you interested — what do you see that others do not?

## Outputs
- `deal_economics_alignment` (object): Whether the advance and royalty structure works for the artist and the label's return model.
- `rights_framework` (object): What rights the label gets, what the artist retains, what has carve-outs.
- `creative_control_provisions` (object): What creative decisions the artist owns, what requires label approval, how creative disputes are resolved.
- `recoupment_structure` (object): How the advance recoups against what income streams, and what happens when it does.
- `term_and_options_structure` (object): Album commitment, option periods, what triggers vs. prevents options, what terminates the deal.
- `deal_term_sheet` (object): Key terms for music industry counsel.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm artist's requirements and label's investment model present.
**Output:** Readiness confirmation.
**Quality Gate:** Artist's financial requirements and label's deal terms both present.

---

### Phase 1: Assess Economics and Rights Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare artist's advance expectations against label's investment model — does the economics work? 2. Map what rights the label needs against what the artist will not give — where are the conflicts? 3. Assess the recoupment structure — at the proposed royalty rates and typical sales, when does the artist start seeing money? 4. Check creative control requirements against the label's commercial priorities.
**Output:** Economics viability, rights conflict map, recoupment timeline, creative control alignment.
**Quality Gate:** Recoupment is modeled specifically — "at $X advance and Y% royalty rate on Z streams, recoupment takes N years under realistic projections."

---

### Phase 2: Design the Deal Structure
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Design the advance and recording budget — how it is paid, what it covers. 2. Define the royalty structure — base rate, digital rate, deductions, escalators. 3. Define the rights package — master ownership or license, term, territory, format. 4. Build the creative control provisions — approval rights on artwork, singles, videos, touring.
**Output:** Advance structure, royalty design, rights package, creative control provisions.
**Quality Gate:** Royalty rate is specific and net — not gross after deductions that effectively cut the rate in half. Creative control is specific — named approval rights, not "consultation."

---

### Phase 3: Define Term and Optionality
**Entry Criteria:** Structure designed.
**Actions:** 1. Define the album commitment and option structure — how many albums, what triggers each option, what the option price is. 2. Build the termination rights — what the artist can do if the label does not release on time, does not spend on marketing, does not exercise options. 3. Define reversion rights — when and how masters revert to the artist. 4. Assemble the term sheet.
**Output:** Options structure, termination triggers, reversion rights, term sheet.
**Quality Gate:** Reversion rights have specific triggers — "if label does not release within X months of delivery" not "if label fails to exploit."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Term sheet built.
**Actions:** 1. Present deal economics alignment. 2. Deliver rights framework. 3. Deliver creative control provisions. 4. Deliver recoupment structure. 5. Present term and options structure and term sheet.
**Output:** Full synthesis — economics, rights, creative control, recoupment, term, term sheet.
**Quality Gate:** Artist and label can brief their entertainment lawyers from this synthesis.

---

## Exit Criteria
Done when: (1) economics are viable for both parties, (2) rights conflicts are resolved, (3) creative control is specific, (4) recoupment is modeled, (5) reversion rights are specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
