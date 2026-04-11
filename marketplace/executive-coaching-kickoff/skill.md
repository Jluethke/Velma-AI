# Executive Coaching Kickoff

**One-line description:** Coach and executive each submit their honest read on what the engagement is really for — Claude aligns the goals, surfaces the resistance, and produces a charter so the first session is work, not setup.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both coach and executive must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_engagement_context` (string, required): How did this engagement come about? Who initiated it and why?

### Coach Submits Privately
- `coach_approach` (string, required): What's your coaching methodology and what does an effective engagement look like in your experience?
- `coach_what_they_need_from_the_executive` (array, required): What do you need from this person for the engagement to work?
- `coach_concerns` (array, required): What are you worried about based on what you've seen so far?
- `coach_assessment_from_intake` (object, required): Your honest read on what this person's real development need is.

### Executive Submits Privately
- `executive_goals` (array, required): What do you want to get from this engagement? Be specific.
- `executive_real_problem` (string, required): What's the real problem you're trying to solve? Not the official reason — what you actually need help with.
- `executive_what_they_need_from_coaching` (string, required): What would make this worth your time?
- `executive_what_they_are_resistant_to` (string, required): What kind of coaching or feedback do you tend to resist or dismiss? Be honest.
- `executive_definition_of_success` (string, required): What does a successful engagement look like to you in 6 months?

## Outputs
- `alignment_map` (object): Where the coach's assessment and the executive's goals point in the same direction.
- `coaching_focus_areas` (array): The 2-3 highest-leverage development areas based on both submissions.
- `resistance_map` (object): What the executive is resistant to, and how the coach can work with rather than against it.
- `engagement_charter` (object): Goals, cadence, format, success metrics, and ground rules.
- `first_session_agenda` (object): What the first working session should cover.
- `success_metrics` (array): How both sides will know the engagement is working.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm `coach_assessment_from_intake`, `executive_real_problem`, and `executive_what_they_are_resistant_to` present.
**Output:** Readiness confirmation.
**Quality Gate:** Real problem and resistance fields present from executive.

---

### Phase 1: Align the Real Goals
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare the executive's stated goals to the coach's assessment of the real development need. 2. Identify where they're aligned and where the coach sees a need the executive hasn't named. 3. Extract the executive's real problem — this is often more important than the official goals. 4. Note what the executive is resistant to — this shapes the coaching approach.
**Output:** Goal alignment map, real problem extraction, resistance profile.
**Quality Gate:** Gap between official goals and real problem is named if present.

---

### Phase 2: Identify Focus Areas and Approach
**Entry Criteria:** Goals aligned.
**Actions:** 1. Identify the 2-3 highest-leverage development areas based on both sides. 2. Assess how the coach's approach fits the executive's resistance profile — and where it might hit friction. 3. Define what the coach needs from the executive and assess whether the executive's submission suggests they'll provide it.
**Output:** Focus areas, approach-resistance fit, what coach needs assessment.
**Quality Gate:** Focus areas are specific behaviors or capabilities, not vague themes.

---

### Phase 3: Draft the Engagement Charter
**Entry Criteria:** Focus areas identified.
**Actions:** 1. Draft goals with measurable outcomes. 2. Define cadence and format. 3. Define ground rules: confidentiality, what feedback looks like, how disagreement is handled. 4. Draft success metrics for 3 months and 6 months. 5. Build the first session agenda: goals review, resistance discussion, first focus area.
**Output:** Engagement charter with goals, cadence, ground rules, success metrics. First session agenda.
**Quality Gate:** Success metrics are specific enough to evaluate at the 3-month mark.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Charter drafted.
**Actions:** 1. Present alignment map. 2. Name coaching focus areas. 3. Present resistance map — including how the coach plans to work with it. 4. Deliver engagement charter. 5. Deliver first session agenda.
**Output:** Full synthesis — alignment, focus areas, resistance map, charter, first session agenda.
**Quality Gate:** Executive sees their real problem reflected. Coach has a specific approach.

---

## Exit Criteria
Done when: (1) real problem named, (2) 2-3 focus areas identified, (3) resistance profile mapped with approach guidance, (4) charter covers goals, cadence, and success metrics, (5) first session agenda is ready.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Executive's real problem is significantly different from why they were enrolled | Flag this. An executive doing coaching for the wrong reason, or under pressure rather than genuine motivation, significantly affects engagement success. |
| Phase 2 | Executive's resistance covers almost everything the coach's approach requires | Name the tension and recommend a direct conversation about fit before the engagement begins. |

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
