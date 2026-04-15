# Literary Agent Author Engagement

**One-line description:** A literary agent and an author each submit their real submission strategy, career goals, and creative vision before signing — AI aligns on a representation arrangement that gets the right book to the right publisher with the right deal, not just the fastest sale.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both agent and author must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_agent_and_author` (string, required): Literary agent/agency name and author name.
- `shared_project` (string, required): Book project — title, genre, length, stage of completion.

### Agent Submits Privately
- `agent_market_assessment` (object, required): How you see this book in the current market — comparable titles, which editors and publishers are the right targets, realistic advance range.
- `agent_submission_strategy` (object, required): How you plan to submit — simultaneous or exclusive, which imprints first, timeline.
- `agent_commission_and_terms` (object, required): Domestic commission, foreign rights commission, how sub-agents are engaged, what the agency agreement says.
- `agent_concerns_about_this_project` (array, required): Market timing, author's platform, manuscript readiness, comparable sales, what will be hard.
- `agent_what_they_will_not_do` (array, required): Projects you will not submit, publishers you will not approach, deal terms you will not recommend.

### Author Submits Privately
- `author_career_goals` (object, required): What you want from this book — advance size, publisher prestige, editorial relationship, long-term career, readership.
- `author_creative_vision` (object, required): What the book is trying to do — the story you are telling, why it matters, what you will not change for a deal.
- `author_platform_reality` (object, required): Honest assessment of your platform — social following, media presence, existing audience, what you can realistically do to support the book.
- `author_concerns_about_the_process` (array, required): Rejection, editorial interference, publisher size, deal structure, what happened to authors you know.
- `author_what_they_will_not_accept` (array, required): Publisher categories, deal terms, editorial demands, or career compromises you will not make.

## Outputs
- `submission_strategy_alignment` (object): Target publishers, timeline, approach — and why.
- `market_and_advance_reality` (object): Realistic advance range, what platform and comps drive publishers' offers.
- `commission_and_rights_framework` (object): Full agent economics — domestic, foreign, film/TV, what the author keeps.
- `career_and_creative_alignment` (object): Whether this agent's strategy matches the author's career goals.
- `author_platform_plan` (object): What the author should do before submission to strengthen the position.
- `representation_agreement_framework` (object): Key terms for the literary agency agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm agent's market assessment and author's career goals and creative vision both present.
**Output:** Readiness confirmation.
**Quality Gate:** Agent's strategy and author's career goals and platform reality both present.

---

### Phase 1: Assess Market Fit and Career Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate the project against current market — where does this book fit? 2. Assess platform against publisher requirements. 3. Evaluate career goals against what this agent's submission strategy can achieve. 4. Identify creative compromises the author should expect.
**Output:** Market assessment, platform gap, career alignment, creative compromise risk.
**Quality Gate:** Market assessment names specific editors and imprints — not category descriptions.

---

### Phase 2: Build the Submission Strategy
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the submission list — specific editors at specific imprints with rationale. 2. Build the timeline — when to submit, simultaneous or rounds. 3. Establish the advance expectations with a realistic range. 4. Define what the author must do before submission.
**Output:** Submission list, timeline, advance expectations, pre-submission actions.
**Quality Gate:** Submission list has at least 8 named editors with specific rationale for each.

---

### Phase 3: Define Representation Terms
**Entry Criteria:** Strategy built.
**Actions:** 1. Define the commission structure — all categories, foreign rights process, sub-agent relationships. 2. Build the communication cadence — how often, in what form. 3. Define what happens if the book doesn't sell — how long, what the agent does next, when the relationship ends. 4. Assemble the agency agreement framework.
**Output:** Commission structure, communication plan, non-sale plan, agency agreement framework.
**Quality Gate:** Non-sale plan names specific alternative strategies if initial submission is unsuccessful.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — market assessment, submission strategy, advance expectations, commission structure, platform plan, agency agreement framework.
**Quality Gate:** Author knows what to expect and what is required. Agent knows the creative vision and the career goals.

---

## Exit Criteria
Done when: (1) submission list is specific, (2) advance expectations are realistic, (3) commission structure is fully disclosed, (4) pre-submission plan is defined, (5) non-sale strategy is addressed.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
