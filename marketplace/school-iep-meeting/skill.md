# School IEP Meeting

**One-line description:** The school team and the parent each submit their real observations, concerns, and goals for the student before the IEP meeting — AI produces a plan that reflects what the student actually needs, not just what the school can offer or what the parent can demand.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both school team and parent must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_student_name_or_id` (string, required): Student identifier (name or ID).
- `shared_grade_and_setting` (string, required): Grade level and current educational setting.

### School Team Submits Privately
- `school_current_performance_data` (object, required): Academic performance, assessment scores, attendance, behavior — the data picture.
- `school_what_is_working` (array, required): Supports, strategies, or settings where the student is making progress.
- `school_what_is_not_working` (array, required): Areas where current supports are insufficient or the student is not progressing.
- `school_proposed_goals_and_services` (object, required): Proposed annual goals, related services, accommodations, and placement.
- `school_constraints_they_are_working_within` (array, required): Resource limitations, staffing, what is realistically available in this district.

### Parent Submits Privately
- `parent_what_they_observe_at_home` (string, required): What the student's experience looks like outside school — strengths, struggles, emotional state, how they talk about school.
- `parent_what_they_want_for_their_child` (object, required): Goals for the student — academic, social, emotional, long-term.
- `parent_concerns_about_current_services` (array, required): What is not meeting the student's needs in your view?
- `parent_what_they_have_tried` (array, required): Tutoring, therapy, strategies at home — what has helped and what has not.
- `parent_concerns_about_the_meeting` (array, required): What are you worried the school will not address or will push back on?

## Outputs
- `student_profile_synthesis` (object): An integrated picture of the student — strengths, needs, what works, what does not.
- `goal_alignment_assessment` (object): Where school and parent goals align and where there are gaps.
- `iep_goal_recommendations` (array): Specific, measurable annual goals that reflect both school data and parent priorities.
- `service_and_support_plan` (object): Services, accommodations, and supports recommended — with rationale.
- `parent_questions_and_concerns_addressed` (object): Each parent concern with the school's response and any remaining open items.
- `meeting_agenda_and_talking_points` (object): How to structure the IEP meeting to reach agreement efficiently.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm school's performance data and parent's goals present.
**Output:** Readiness confirmation.
**Quality Gate:** School's assessment data and parent's priorities both present.

---

### Phase 1: Build the Student Profile
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Synthesize the school's data picture with the parent's home observations — where do they agree and where do they diverge? 2. Identify the student's genuine strengths and what conditions produce progress. 3. Map the gaps in current services against the student's documented needs. 4. Assess where parent concerns reflect documented needs vs. where they go beyond what data supports.
**Output:** Integrated student profile, strength and need map, service gap analysis, parent concern assessment.
**Quality Gate:** Student profile is specific — not "struggles with reading" but "reading fluency is at X grade equivalent, comprehension stronger at Y; home observations suggest anxiety about timed tasks."

---

### Phase 2: Align on Goals and Services
**Entry Criteria:** Profile built.
**Actions:** 1. Draft annual IEP goals that are specific, measurable, and reflect both school data and parent priorities. 2. Recommend services and supports tied to documented needs — with rationale for each. 3. Identify where school constraints affect what is available and what the parent's options are. 4. Address each parent concern directly — either with a service response or an honest explanation of why it is not in the IEP.
**Output:** Draft IEP goals, service recommendations, constraint transparency, parent concern responses.
**Quality Gate:** Every goal is measurable. Every parent concern has a response — acceptance into the IEP, or honest rationale for why it is not included.

---

### Phase 3: Build the Meeting Plan
**Entry Criteria:** Goals aligned.
**Actions:** 1. Structure the IEP meeting agenda — present levels, goals, services, placement, parent questions. 2. Identify where agreement is likely vs. where there will be tension and prepare for both. 3. Define what the school will commit to and what it cannot. 4. Prepare the parent's talking points — what to ask for, how to frame it, what constitutes agreement.
**Output:** Meeting agenda, tension points, school commitments, parent talking points.
**Quality Gate:** Agenda is specific with time allocation. Tension points have prepared responses, not avoidance strategies.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Meeting planned.
**Actions:** 1. Present student profile synthesis. 2. Deliver goal alignment assessment. 3. Deliver IEP goal recommendations. 4. Deliver service and support plan. 5. Present meeting agenda and parent concerns addressed.
**Output:** Full synthesis — student profile, goals, services, parent concerns, meeting plan.
**Quality Gate:** Both parties walk into the meeting knowing what the student needs, what they agree on, and what they need to resolve.

---

## Exit Criteria
Done when: (1) student profile integrates school and home observations, (2) every IEP goal is measurable, (3) every service has a rationale, (4) every parent concern has a response, (5) meeting agenda is specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
