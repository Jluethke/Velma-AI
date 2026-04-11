# Recording Studio Artist Engagement

**One-line description:** A recording studio and an artist each submit their real creative vision, budget, and production expectations before the session begins — Claude aligns on a production arrangement that captures the artist's sound without the cost overruns and creative conflicts that stall most recording projects.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both studio and artist must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_artist_and_studio` (string, required): Artist/band name and recording studio name.
- `shared_project_scope` (string, required): Album, EP, single, or demo — number of tracks, genre, and timeline.

### Studio Submits Privately
- `studio_production_approach` (object, required): How you work — producer involvement, engineer, equipment, workflow, what makes recordings done in your studio distinctive.
- `studio_rates_and_fees` (object, required): Day rate, block rate, engineer fees, producer fees, mixing, mastering — full cost breakdown.
- `studio_availability_and_scheduling` (object, required): Available dates, typical session length, scheduling constraints.
- `studio_concerns_about_this_project` (array, required): Budget vs. scope, artist preparedness, producer relationship, timeline realism.
- `studio_what_they_will_not_do` (array, required): Production approaches you will not take, budget levels you will not work at, genres or content outside your scope.

### Artist Submits Privately
- `artist_creative_vision` (object, required): What you want the record to sound like — influences, reference tracks, vibe, what you are trying to express.
- `artist_budget_reality` (object, required): Total budget for recording, mixing, and mastering — the real number, not the aspirational one.
- `artist_preparation_level` (object, required): How prepared you are — pre-production complete, arrangements finalized, demos recorded, what is still in flux.
- `artist_concerns_about_the_process` (array, required): Losing creative control, going over budget, disagreements with producer/engineer, timeline pressure.
- `artist_what_they_will_not_compromise` (array, required): Creative elements you will not change regardless of production suggestion.

## Outputs
- `project_scope_and_session_plan` (object): Tracks, sessions needed, realistic timeline, what is and is not included.
- `budget_and_cost_breakdown` (object): Full cost estimate with scenarios — what gets you a great record at this budget.
- `production_approach_alignment` (object): How the record will be made — producer/engineer roles, creative input, decision-making.
- `pre-production_requirements` (object): What must be ready before the first session to stay on time and budget.
- `creative_ownership_and_rights` (object): Who owns the masters, producer royalties, mixing credits.
- `studio_agreement_framework` (object): Key terms for the studio services agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm studio's rates and artist's budget and creative vision both present.
**Output:** Readiness confirmation.
**Quality Gate:** Studio's cost structure and artist's budget and creative goals both present.

---

### Phase 1: Assess Budget and Creative Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Build the session cost estimate against artist's budget — what is achievable? 2. Assess artist preparation level — will sessions be productive? 3. Evaluate creative vision against studio's production approach. 4. Identify what must be resolved before first session.
**Output:** Budget feasibility, preparation assessment, creative fit, pre-production requirements.
**Quality Gate:** Budget estimate is specific — sessions needed × day rate + all additional fees = total cost.

---

### Phase 2: Plan the Production
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the session plan — number of days, sequence, what gets recorded when. 2. Build the budget with contingency. 3. Define creative decision-making — who has final say on what. 4. Establish the rights framework.
**Output:** Session plan, detailed budget, creative decision framework, rights structure.
**Quality Gate:** Every session has a specific purpose and deliverable — not "recording time" but "track 1-4 basic tracks."

---

### Phase 3: Define Operations and Terms
**Entry Criteria:** Plan built.
**Actions:** 1. Define the booking and cancellation policy. 2. Build the deliverables list — what the artist walks away with. 3. Define the mixing and mastering plan. 4. Assemble the studio agreement framework.
**Output:** Booking policy, deliverables list, mixing/mastering plan, agreement framework.
**Quality Gate:** Deliverables are specific formats and files — not "the recordings" but named stems, mixes, and formats.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — session plan, full budget, production approach, rights framework, deliverables, agreement terms.
**Quality Gate:** Artist knows what they will spend and what they will receive. Studio knows the scope and the creative approach.

---

## Exit Criteria
Done when: (1) session plan is specific, (2) full cost is estimated, (3) creative decision rights are defined, (4) rights framework is established, (5) deliverables are named.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
