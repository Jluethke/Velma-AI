# Mentor-Mentee Charter

**One-line description:** Mentor and mentee each submit what they actually expect before the relationship starts — Claude surfaces the gaps that kill most mentorships and produces a charter so both people start with clarity.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both mentor and mentee must submit before synthesis runs.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_relationship_context` (string, required): How did this mentorship come about? e.g., "Company program," "Industry introduction," "Mutual connection."

### Mentor Submits Privately
- `mentor_motivation` (string, required): Why are you doing this? What's your honest motivation for being a mentor to this specific person?
- `mentor_what_they_can_offer` (array, required): What can you genuinely offer? Specific expertise, network, experience, time.
- `mentor_what_they_cannot_offer` (array, required): What are you not able to give? Be specific — job referrals, emotional support, frequent availability, expertise outside your domain.
- `mentor_expectations` (object, required): What do you expect from the mentee? Preparation, communication, follow-through, growth?
- `mentor_boundaries` (object, optional): What would cause you to end or pull back from this relationship?

### Mentee Submits Privately
- `mentee_goals` (array, required): What specific outcomes do you want from this mentorship? What does success look like in 12 months?
- `mentee_what_they_need` (array, required): What do you actually need from a mentor? Introductions, candid feedback, a sounding board, tactical advice, emotional support?
- `mentee_what_they_will_bring` (string, required): What do you bring to this relationship? What will you do to make this worth the mentor's time?
- `mentee_fears_about_the_relationship` (string, optional): What are you worried about? Taking too much of their time, asking the wrong things, being judged?

## Outputs
- `alignment_map` (object): Where the mentor can actually deliver what the mentee actually needs.
- `expectation_gaps` (array): Specific mismatches — what the mentee needs that the mentor can't offer, and what the mentor expects that the mentee hasn't committed to.
- `working_charter` (object): The structure of the relationship — cadence, format, goals, what's in scope and out of scope.
- `first_90_days_plan` (array): Specific focus areas and milestones for the first 90 days.
- `relationship_risks` (array): The most common reasons mentorships fail, assessed against what both sides submitted.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both mentor and mentee have submitted.

**Actions:**
1. Confirm `mentor_what_they_can_offer` and `mentee_what_they_need` are present — these are the core fit check.
2. Confirm `mentee_goals` is present.

**Output:** Readiness confirmation.

**Quality Gate:** Core fit fields present from both sides.

---

### Phase 1: Assess the Fit
**Entry Criteria:** Both submissions confirmed.

**Actions:**
1. Map each of the mentee's stated needs to the mentor's stated offerings.
2. Score each need: met / partially met / not in scope for this mentor.
3. Flag any critical need the mentor explicitly cannot offer.
4. Assess motivation alignment: is the mentor doing this for reasons that will sustain the relationship?

**Output:** Fit map with per-need scores and motivation assessment.

**Quality Gate:** Every stated need is mapped. Gaps are not softened.

---

### Phase 2: Surface the Expectation Gaps
**Entry Criteria:** Fit map complete.

**Actions:**
1. Compare what the mentor expects from the mentee to what the mentee has committed to bring.
2. Identify the expectations the mentor has that the mentee hasn't addressed — these become resentment points.
3. Identify the needs the mentee has that the mentor can't fulfill — these lead to disappointment.
4. Assess the mentee's fears and whether they'll inhibit the relationship.

**Output:** Expectation gap list with severity, mentee fear assessment.

**Quality Gate:** Gaps are specific. "The mentor expects proactive communication; the mentee hasn't mentioned communication style" is a gap. "They might not get along" is not.

---

### Phase 3: Draft the Working Charter
**Entry Criteria:** Expectation gaps surfaced.

**Actions:**
1. Define the meeting cadence: how often, what format, how long.
2. Define the focus areas: what topics and goals are in scope.
3. Define what's out of scope: based on what the mentor said they cannot offer.
4. Define the mentee's responsibilities: what they commit to do between sessions.
5. Define how the relationship evolves: what does a successful 12 months look like?
6. Draft the first 90 days plan: 3 specific focus areas with milestones.

**Output:** Working charter with cadence, scope, responsibilities, 90-day plan.

**Quality Gate:** Charter is specific enough that both sides could check whether they're following it 3 months in.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Charter drafted.

**Actions:**
1. Present the alignment map — where this mentorship is well-matched.
2. Present the expectation gaps — what needs to be discussed before the first session.
3. Deliver the working charter.
4. Deliver the first 90 days plan.
5. Name the top 3 relationship risks based on what was submitted.
6. Close: "The best mentorships are explicit. This charter is yours to edit — but starting with it beats starting from scratch."

**Output:** Full synthesis — alignment map, expectation gaps, working charter, 90-day plan, relationship risks.

**Quality Gate:** Both sides have a specific, agreed-upon structure. Expectation gaps are on the table before the relationship starts.

---

## Exit Criteria
Done when: (1) fit map covers all stated needs, (2) expectation gaps identified with severity, (3) working charter covers cadence, scope, and responsibilities, (4) first 90 days has 3 specific focus areas, (5) relationship risks named.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Mentor cannot offer what the mentee most needs | Name the gap directly. Recommend either finding a more appropriate mentor for the specific need, or setting expectations that this relationship will serve different goals. |
| Phase 2 | Mentee's primary fear is about being judged by the mentor | Address this in the charter: "The mentee needs explicit permission to ask questions without judgment. This should be a stated norm of the relationship." |

## State Persistence
- Goal progress tracking
- Charter adherence
- Relationship health over time

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
