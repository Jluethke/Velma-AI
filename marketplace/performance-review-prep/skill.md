# Performance Review Prep

**One-line description:** Manager and employee each submit their honest perspective before the review — AI finds the rating, compensation, and growth gaps so the meeting is a real conversation instead of a performance.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both manager and employee must submit before synthesis runs. Neither sees the other's input until the synthesis is shared.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_employee_name` (string, required): Employee's name.
- `shared_role` (string, required): Job title and team.
- `shared_review_period` (string, required): e.g., "Q4 2025" or "Annual 2025."

### Manager Submits Privately
- `performance_assessment` (object, required): Overall rating (if applicable), key strengths, areas of concern, and the specific evidence behind each.
- `rating_rationale` (string, required): Why this rating? What would a higher rating have required?
- `compensation_plans` (object, required): Is a raise, bonus, or promotion being considered? What's the range and what's the budget reality?
- `concerns` (array, optional): What are you worried about — performance, reliability, skill gaps, or flight risk?
- `growth_plans` (object, required): What does the next 6-12 months look like for this person? What's their ceiling on your team?
- `relationship_health` (string, required): How would you describe the working relationship? Any tension that needs addressing?

### Employee Submits Privately
- `self_assessment` (object, required): How do you rate your own performance this period? What did you do well? Where did you fall short?
- `accomplishments` (array, required): Specific things you're proud of. Quantify where possible.
- `compensation_expectations` (object, required): What are you hoping for — raise, bonus, promotion, or title change? What do you think is fair?
- `blockers` (array, optional): What's gotten in your way this period? Resources, clarity, management, tooling, process?
- `growth_goals` (object, required): What do you want to be doing in 12 months? What would keep you engaged and at this company?
- `relationship_health` (string, required): How's your relationship with your manager? Is there anything that needs to be said?

## Outputs
- `alignment_map` (object): Where manager and employee agree on performance level, growth trajectory, and relationship quality.
- `gap_analysis` (array): Specific divergences with context — rating gap, compensation gap, growth plan misalignment, unspoken tension.
- `talking_points` (array): The 3-5 things that most need to be addressed in the meeting, with suggested framing for each.
- `compensation_bridge` (object): The gap between what the manager is planning and what the employee is expecting, with realistic bridging options.
- `growth_plan_draft` (object): A 6-12 month development plan incorporating both sides' input.
- `risk_flags` (array): Flight risk signals, trust breakdown indicators, or anything that, left unaddressed, has a realistic path to a resignation or a performance issue.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both manager and employee have submitted their Fabric session.

**Actions:**
1. Confirm both sides contain all required inputs.
2. Flag if either side's compensation field is absent — this is the most important field and its absence limits the analysis.
3. Note any fields that are thin on both sides and flag them for the synthesis.

**Output:** Readiness confirmation or list of fields needing more detail.

**Quality Gate:** Both sides submitted. At minimum, performance_assessment, compensation (both sides), and growth_plans are present.

---

### Phase 1: Extract Core Assessments
**Entry Criteria:** Both submissions confirmed sufficient.

**Actions:**
1. Extract the manager's core beliefs: rating and rationale, compensation intention, growth ceiling, concerns, relationship read.
2. Extract the employee's core beliefs: self-rating, what they expect to be acknowledged for, compensation ask, what they need to stay engaged.
3. Note what each side emphasized and what they conspicuously avoided.
4. Flag anything the employee mentioned that the manager didn't, and vice versa.

**Output:** Side-by-side core beliefs across all input categories.

**Quality Gate:** Every input category has an extracted position from both sides. Silences are flagged.

---

### Phase 2: Quantify the Gaps
**Entry Criteria:** Core assessments extracted.

**Actions:**
1. Rating gap: If both submitted a rating or rating language, how far apart are they? 1 level: workable. 3 levels: relationship problem.
2. Compensation gap: Identify the specific dollar or percentage gap between what the manager is planning and what the employee is expecting. This is the most important gap to name precisely.
3. Growth trajectory: Is the manager's ceiling for this person lower than where the employee wants to go? Calculate the time horizon before this becomes a flight risk.
4. Relationship health: If both sides mentioned friction in vague terms — something is there. Flag it even if neither was explicit.
5. Blocker accountability: Did the employee name a specific blocker the manager controls? Is the manager aware of it?

**Output:** Quantified gaps across rating, compensation, growth trajectory, and relationship health.

**Quality Gate:** Compensation gap is stated with specific numbers or percentages, not vague language.

---

### Phase 3: Build the Meeting Briefing
**Entry Criteria:** Gaps quantified.

**Actions:**
1. Prioritize talking points by urgency: compensation gap and flight risk signals go first.
2. For each gap, draft a manager framing that opens the conversation without it feeling like an ambush. Example: "I want to talk about where I see your growth going — and I want to understand what you're hoping for."
3. Draft compensation bridge options:
   - If the raise amount is in range: how to present it.
   - If there's a gap: realistic options — larger raise, deferred raise with timeline, one-time bonus, non-comp alternatives (title, scope, flexibility).
4. Draft growth plan foundations based on what both sides said they want.
5. Identify risk flags that warrant action beyond this meeting: HR escalation, urgent retention conversation, or immediate performance plan.

**Output:** Meeting briefing with prioritized talking points, manager framings, compensation bridge options, growth plan draft, risk flags.

**Quality Gate:** Every quantified gap from Phase 2 has a proposed resolution path. Nothing is buried in the briefing.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Meeting briefing complete.

**Actions:**
1. Open with the alignment — what both sides agree on. Start on solid ground.
2. Present each gap with both sides' positions and what the gap means.
3. Deliver talking points with suggested framings for the manager.
4. Deliver compensation bridge options explicitly.
5. Deliver the growth plan draft.
6. List risk flags with recommended actions.
7. Close with one sentence: the single most important thing to accomplish in this meeting.

**Output:** Full synthesis — alignment, gaps, talking points, compensation bridge, growth plan, risk flags, priority action.

**Quality Gate:** Both manager and employee can read this and feel their perspective was accurately represented. Hard truths are present. Nothing is in HR-speak.

---

## Exit Criteria
Done when: (1) rating gap quantified, (2) compensation gap stated with specific numbers and bridging options, (3) growth plan draft exists with 6-12 month horizon, (4) risk flags named with recommended actions, (5) manager has 3-5 concrete talking points with framings.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 0 | Employee's self-assessment is vague or all-positive | Note the gap in specificity. Use what's there and flag which areas have limited employee input. |
| Phase 2 | Compensation expectations are incompatible with budget reality | Name the constraint with numbers. "The manager's budget allows for X. The employee is expecting Y. This gap needs to be addressed directly." |
| Phase 3 | Relationship health signals suggest serious trust breakdown | Recommend HR involvement or structured mediation before a standard review conversation proceeds. |
| Phase 4 | Rating gap is 3+ levels apart | Flag this prominently. A gap this wide means the employee will experience the review as a surprise attack regardless of framing. Recommend a pre-review conversation to close the gap before the formal meeting. |

## State Persistence
- Review history (track performance trajectory and rating gaps over time)
- Compensation history (what was promised vs. delivered)
- Growth plan progress (what was agreed to, what happened)
- Relationship health trend (early warning system)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
