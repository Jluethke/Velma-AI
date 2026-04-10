# Study Planner

Takes a subject, exam date or learning goal, available study hours per week, and current knowledge level, then builds a structured study plan with spaced repetition. Breaks topics into digestible chunks, schedules review sessions at optimal intervals, and creates practice questions. Works for students, certification prep, or adults learning new skills.

## Execution Pattern: ORPA Loop

## Inputs
- subject: string -- What you're studying (e.g., "AP Biology", "AWS Solutions Architect cert", "Spanish for travel", "real estate exam")
- goal: object -- Target outcome and deadline: exam date, certification test date, or learning milestone (e.g., "conversational Spanish by June")
- hours_available: object -- Hours per week available for study, which days are free, preferred study time (morning/afternoon/evening), and maximum single-session length
- current_level: string -- Where you are now: "total beginner", "some background", "refreshing old knowledge", "almost ready just need review"
- learning_style: string -- (Optional) How you learn best: "reading", "flashcards", "practice problems", "videos", "teaching others", "hands-on projects"
- resources: array -- (Optional) Textbooks, courses, or materials you already have access to

## Outputs
- study_plan: object -- Week-by-week schedule with daily sessions, topics per session, and time allocations
- topic_breakdown: array -- Subject broken into ordered topics with dependencies mapped (what to learn before what)
- review_schedule: object -- Spaced repetition calendar: when to review each topic for maximum retention (1 day, 3 days, 7 days, 14 days, 30 days after initial study)
- practice_questions: array -- 5-10 practice questions per topic, ranging from recall to application, with answer explanations
- progress_checkpoints: array -- Weekly self-assessment milestones to verify you're on track

## Execution

### OBSERVE: Assess the Situation
**Entry criteria:** Subject and either a deadline or learning goal provided.
**Actions:**
1. Identify the full scope of the subject. For standardized exams, pull the official topic list or exam blueprint (e.g., "AP Bio covers 8 units: Chemistry of Life, Cell Structure, Cellular Energetics..."). For informal learning, define a reasonable scope.
2. Calculate available study time: total hours between now and deadline. Subtract 10% for buffer (life happens).
3. Assess current knowledge: which topics does the user already know? Which are completely new? This determines where to spend the most time.
4. Identify high-yield vs. low-yield topics: for exams, which topics appear most frequently? For practical skills, which are used most often in real life?
5. Check for prerequisites: does the subject have a natural order? (You can't study calculus without algebra. You can't study organic chemistry without general chemistry.)
6. Note the user's learning style and schedule constraints. Night owls shouldn't plan 6 AM study sessions.

**Output:** Topic inventory with priority weights, available time budget, knowledge gap map, prerequisite chain.
**Quality gate:** All major topics identified. Time budget is realistic (not counting on 8-hour weekend sessions if user has kids). Prerequisites mapped.

### REASON: Design the Study Architecture
**Entry criteria:** Topic inventory and time budget complete.
**Actions:**
1. Sequence topics by prerequisite order first, then by priority weight (high-yield topics early, low-yield topics later).
2. Allocate time per topic proportional to: (a) how much the user doesn't know, (b) how heavily it's tested or how important it is, (c) how complex it is.
3. Build the spaced repetition schedule using expanding intervals:
   - Day 1: Learn new topic.
   - Day 2: Quick review (10 min).
   - Day 4: Review with practice questions (15 min).
   - Day 8: Review only weak spots (10 min).
   - Day 15: Final review or move to long-term retention.
4. Design study sessions that fit the user's maximum session length. No session over 90 minutes without a break. Pomodoro (25 min on, 5 min off) for sessions over 45 minutes.
5. Alternate between heavy topics and lighter topics within each day to prevent fatigue.
6. Schedule weekly "checkpoint" sessions: a self-test covering everything studied that week.
7. Build in "flex days" (1 per week) for catching up if you fall behind. If you don't fall behind, use them for extra practice.
8. For the final 10-15% of the timeline, schedule pure review and practice exams -- no new material.

**Output:** Week-by-week study plan with daily sessions, topic sequence, spaced repetition calendar, and checkpoint schedule.
**Quality gate:** All topics covered before deadline. Spaced repetition intervals are maintained. No study session exceeds stated maximum. At least one flex day per week.

### PLAN: Create Study Materials
**Entry criteria:** Study schedule finalized.
**Actions:**
1. Break each topic into a single-session study chunk. Each chunk has: a learning objective ("After this session, you should be able to..."), key concepts (3-5 per chunk), and a practice activity.
2. Create practice questions for each topic:
   - Level 1 (Recall): "What is X? Define Y."
   - Level 2 (Understanding): "Explain why X happens. Compare X and Y."
   - Level 3 (Application): "Given this scenario, how would you apply X?"
   - Level 4 (Analysis): "What would happen if X changed? Why does this approach fail?"
3. Design checkpoint assessments for each week: 10-15 questions mixing all topics studied so far, with a target score (e.g., 80% to stay on track).
4. Create "cheat sheets" for each topic: one-page summaries with the most important facts, formulas, or concepts. These become the review material for spaced repetition sessions.
5. Match study activities to learning style: flashcard users get flashcard-format materials, practice-problem learners get worked examples, visual learners get diagram suggestions.
6. For exam prep, include timing practice: "You'll have 90 seconds per question on the real exam, so practice answering these in under 2 minutes each."

**Output:** Study chunks with objectives, practice questions by level, weekly checkpoints, cheat sheets, and style-matched activities.
**Quality gate:** Every topic has at least 5 practice questions. Checkpoints cover cumulative material. Cheat sheets are genuinely one page.

### ACT: Deliver and Calibrate
**Entry criteria:** Study plan and materials are complete.
**Actions:**
1. Present the full study plan in a clean weekly calendar format showing exactly what to study each day and for how long.
2. Deliver the first week's materials in detail (study chunks, practice questions, cheat sheet). Subsequent weeks delivered as the user progresses.
3. Explain the spaced repetition system: "You'll see old topics pop up on your schedule. That's intentional -- reviewing at these intervals is what makes knowledge stick."
4. Set the first checkpoint: "After Week 1, test yourself on these 10 questions. If you score below 70%, spend your flex day reviewing before moving on."
5. Offer adjustment: "If this pace feels too fast or too slow after the first week, we'll recalibrate. The plan is a starting point, not a prison."

**Output:** Formatted study plan, first week's materials, checkpoint criteria, and adjustment protocol.
**Quality gate:** Plan is actionable starting today. First session is clearly defined. User understands the review system.

## Exit Criteria
Done when: (1) all topics are sequenced and scheduled within the available time, (2) spaced repetition review sessions are built into the calendar, (3) practice questions exist for every topic, (4) weekly checkpoints are defined with pass/fail criteria, (5) the plan fits within the user's stated available hours.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Not enough time for the scope | Escalate -- show the math: "You have 30 hours and this subject typically needs 60. Here are your options: extend the deadline, narrow the scope to high-yield topics only, or increase study hours" |
| OBSERVE | Subject is too vague ("I want to learn science") | Adjust -- help narrow down: "Science is broad. Are you preparing for a specific exam? Learning a specific field? Let's pick a concrete target" |
| REASON | Spaced repetition creates scheduling conflicts | Adjust -- combine review sessions for related topics. Review organic chemistry and biochemistry together instead of separately |
| REASON | User has zero free days for flex time | Adjust -- build 15-minute buffer into each session instead of full flex days. Flag that falling behind will be harder to recover from |
| PLAN | Cannot create practice questions (highly specialized topic) | Adjust -- create comprehension questions instead: "Explain X in your own words" and "How does X relate to Y?" |
| ACT | User falls behind schedule | Adjust -- recalculate from current position. Drop lowest-priority topics if needed. Never abandon the review schedule for old topics to cram new ones |
| ACT | User rejects final output | **Targeted revision** -- ask which section fell short (topic sequence, time allocation, spaced repetition intervals, or practice questions for a specific topic) and rerun only that section. Do not rebuild the full plan. |

## State Persistence
- Study progress per topic (not started, in progress, learned, reviewing, mastered)
- Checkpoint scores over time (track improvement trajectory)
- Topics that needed extra review (flag for future spaced repetition emphasis)
- Preferred session length and time of day (optimize future plans)
- Questions the user got wrong (feed into targeted review sessions)
- Effective study techniques for this user (which methods produced the best checkpoint scores)

---

## Reference

### Spaced Repetition Intervals

| Review Session | Timing After Initial Study | Session Length |
|---|---|---|
| Review 1 | Day 1 (next day) | 10 min quick recall |
| Review 2 | Day 3-4 | 15 min with practice questions |
| Review 3 | Day 7-8 | 10 min weak spots only |
| Review 4 | Day 14-15 | Final review or move to long-term |

### Session Length Guidelines

- Maximum single session: 90 minutes (break required after)
- Pomodoro blocks: 25 min on / 5 min off for sessions over 45 minutes
- Alternate heavy and light topics within a day to prevent fatigue
- Final 10-15% of timeline: review and practice exams only (no new material)

### Practice Question Levels

| Level | Type | Example Prompt |
|---|---|---|
| 1 — Recall | Definition, fact | "What is [term]? Define [concept]." |
| 2 — Understanding | Explanation, comparison | "Explain why X happens. Compare X and Y." |
| 3 — Application | Scenario-based | "Given [situation], how would you apply X?" |
| 4 — Analysis | Prediction, critique | "What would happen if X changed? Why does this approach fail?" |

### Time Budget Reality Check

`Available hours = (hours/week) × (weeks remaining) × 0.9` (10% buffer for life)

If available hours < estimated hours needed: either narrow scope to high-yield topics, extend the deadline, or increase weekly hours. Cramming is less effective than distributed practice at a lower pace.

### Checkpoint Pass Criteria

- Below 70% → spend flex day on review before moving to new material
- 70-85% → continue on schedule; flag weak topics for extra repetition
- Above 85% → ahead of plan; use buffer for harder topics or extended practice

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.