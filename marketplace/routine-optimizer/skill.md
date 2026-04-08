# Routine Optimizer

**One-line description:** Analyze a user's daily routine, identify energy leaks and inefficiencies, suggest targeted micro-habits, and output redesigned morning and evening routines optimized for energy and productivity.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `routine_description` (string, required): User's current daily routine in conversational or structured format. Should include morning routine (wake time through leaving home/starting work), evening routine (end of work through sleep), and any notable activities, transitions, or pain points. Minimum: 5 distinct activities with approximate timings. Format example: "I wake at 6 AM, shower for 10 minutes, eat breakfast while checking email for 15 minutes, commute for 30 minutes, arrive at work by 7:30 AM. In the evening, I finish work at 6 PM, spend 30 minutes on the commute home, have dinner with family for 45 minutes, then watch TV until 11 PM before bed."
- `user_constraints` (object, optional): Fixed constraints that cannot be changed (e.g., work start time, family obligations, commute duration). Structure: `{"constraint_name": "description", ...}`. Example: `{"work_start_time": "7:30 AM", "family_dinner": "6:30 PM required", "commute_duration": "30 min"}`
- `energy_baseline` (string, optional): User's typical energy level throughout the day (e.g., "low morning energy, afternoon crash, evening second wind"). Helps calibrate recommendations. If omitted, energy assessment will infer baseline from routine structure.
- `micro_habit_preferences` (array, optional): Types of micro-habits user is open to (e.g., ["movement", "breathing", "hydration", "mindfulness", "journaling"]). If omitted, all types are suggested.

---

## Outputs

- `clarified_routine` (object): Structured representation of user's current routine with activities, timings, and transitions. Schema: `{"morning_routine": [{"activity": "string", "start_time": "HH:MM AM/PM", "end_time": "HH:MM AM/PM", "duration_min": number, "purpose": "string"}], "evening_routine": [...]}`
- `energy_analysis` (object): Per-activity energy impact assessment with reasoning. Schema: `{"activities": [{"activity": "string", "impact": "+/0/-", "reasoning": "string", "sequencing_effects": "string"}], "energy_profile": "string", "sleep_quality_assessment": "string"}`
- `identified_leaks` (array): Energy leaks and inefficiencies ranked by severity and addressability. Schema: `[{"leak_type": "string", "description": "string", "severity": "high/medium/low", "addressability": "micro-habit/structural", "rank": number}]`
- `micro_habits_suggested` (array): Prioritized list of micro-habits (1-3 min each) with implementation details. Schema: `{"starter_set": [{"name": "string", "description": "string", "target_leaks": ["string"], "trigger": "string", "duration_min": number, "difficulty": "easy"}], "full_set": [{"name": "string", "description": "string", "target_leaks": ["string"], "trigger": "string", "duration_min": number, "difficulty": "easy/medium/hard", "expected_impact": "string"}]}`
- `optimized_morning_routine` (object): Redesigned morning routine with sequencing, timings, and integrated micro-habits. Schema: `{"timeline": [{"time": "HH:MM AM", "activity": "string", "duration_min": number, "micro_habits": ["string"], "rationale": "string"}], "total_duration_min": number, "constraints_honored": boolean}`
- `optimized_evening_routine` (object): Redesigned evening routine with sequencing, timings, and integrated micro-habits. Schema: `{"timeline": [{"time": "HH:MM PM", "activity": "string", "duration_min": number, "micro_habits": ["string"], "rationale": "string"}], "total_duration_min": number, "wind_down_start_time": "HH:MM PM", "constraints_honored": boolean}`
- `optimization_report` (string): Complete analysis and recommendations in readable format with before/after comparison. Markdown format with sections: Executive Summary, Current State Analysis, Energy Leaks, Micro-Habits, Optimized Routines, Implementation Plan, Troubleshooting, Tracking Template.

---

## Execution Phases

### Phase 1: Parse and Clarify Routine

**Entry Criteria:**
- `routine_description` is provided and contains at least 5 distinct activities.
- User constraints (if any) are clearly stated.

**Actions:**

1. Read the routine description end-to-end. Extract every activity mentioned (e.g., "wake up," "shower," "breakfast," "commute," "work," "dinner," "wind down," "sleep"). List activities in order of occurrence.
2. For each activity, infer or ask for: start time (HH:MM format), end time (HH:MM format), duration in minutes, purpose (why the user does this activity), and any transitions or delays between activities.
3. Identify implicit activities the user omitted (e.g., "I shower then breakfast" omits the decision of what to eat, the preparation time, the cleanup). Add these as sub-activities with estimated durations.
4. Create a structured timeline: `[{"activity": "Wake up", "start": "6:00 AM", "end": "6:05 AM", "duration_min": 5, "purpose": "Begin day", "transition_from_previous": "none"}, ...]`
5. Separate morning routine (wake to work/home start) and evening routine (work end to sleep). Identify the boundary times (e.g., morning ends at 7:30 AM when user leaves for work; evening starts at 6:00 PM when user finishes work).
6. Flag any ambiguities or missing information for clarification (e.g., "You mentioned breakfast but not how long it takes. Is it 10 minutes or 30 minutes?").

**Output:** `clarified_routine` object with morning and evening timelines, each activity with start/end/duration/purpose/transition notes.

**Quality Gate:**
- Every activity has a defined start and end time in HH:MM format (or duration estimate if exact times unknown).
- No activity is described as "handle it" or "do stuff." All are concrete and observable (e.g., "Shower" not "Get ready").
- Total morning routine duration is 30-90 minutes. Total evening routine duration is 30-120 minutes. If outside these ranges, flag as unusual and ask for clarification.
- All transitions between activities are accounted for (no gaps >5 minutes unexplained).

---

### Phase 2: Assess Energy Impact

**Entry Criteria:**
- Clarified routine is complete with all activities and timings.

**Actions:**

1. For each activity in the routine, assess its energy impact using this framework:
   - **Energy Gain (+):** Activities that increase alertness, motivation, or well-being (e.g., exercise, cold shower, healthy breakfast, sunlight exposure, accomplishment, social connection).
   - **Neutral (0):** Activities that are necessary but neither drain nor gain energy (e.g., getting dressed, commuting, routine tasks, hygiene).
   - **Energy Drain (−):** Activities that deplete focus, motivation, or well-being (e.g., checking email first thing, decision fatigue, rushed transitions, screen time before bed, stressful news).
2. For each activity, document the reasoning: why does it gain, drain, or neutralize energy? Reference the user's stated energy baseline if provided. If baseline not provided, infer from activity type and timing.
3. Identify sequencing effects: does the order of activities amplify or mitigate energy impact? (E.g., "Exercise before breakfast gains more energy than after a heavy meal." or "Checking email after coffee is less draining than before coffee.") Document at least one sequencing effect per phase (morning/evening).
4. Create an energy profile: timeline showing estimated cumulative energy level (1-10 scale) throughout the day based on activity sequence. Example: "6:00 AM: 3/10 (just woke) → 6:10 AM: 4/10 (cold shower) → 6:30 AM: 7/10 (breakfast + sunlight) → 7:00 AM: 6/10 (commute) → 7:30 AM: 5/10 (work email check)."
5. Highlight activities that conflict with sleep quality (evening) or morning alertness (morning). Specifically flag: screens within 1 hour of bedtime, caffeine after 2 PM, intense exercise within 3 hours of bedtime, no morning sunlight exposure, no morning movement.

**Output:** `energy_analysis` object with per-activity impact (+/0/−), reasoning, sequencing effects, energy profile timeline, and sleep-quality assessment.

**Quality Gate:**
- Every activity has an explicit energy classification (+, 0, or −). No activity is left unclassified.
- Reasoning is specific to the user's context, not generic (e.g., "Cold shower before breakfast amplifies energy gain for this user because they report low morning energy" not "Cold showers are energizing").
- At least 2 sequencing effects are identified (one for morning, one for evening).
- Energy profile is a timeline with estimated energy scores (1-10) at 3-4 key points in the day.
- Sleep-quality assessment explicitly addresses: screen time before bed, caffeine timing, exercise timing, wind-down period, bedroom environment (if mentioned).

---

### Phase 3: Identify Energy Leaks and Inefficiencies

**Entry Criteria:**
- Energy analysis is complete.

**Actions:**

1. Scan the energy profile for patterns and categorize leaks:
   - **Leak Type A: Unnecessary Energy Drains** — Activities that drain energy but are not essential or could be deferred (e.g., checking email first thing, social media, decision fatigue from too many choices, news consumption).
   - **Leak Type B: Sequencing Inefficiencies** — Activities in suboptimal order (e.g., exercise after breakfast instead of before; difficult decisions when energy is low; screens before bed instead of after dinner).
   - **Leak Type C: Missing Energy Gains** — Obvious energy-gain activities absent from the routine (e.g., no sunlight exposure, no movement, no hydration, no social connection, no accomplishment/win).
   - **Leak Type D: Transition Friction** — Unclear or rushed transitions between activities causing stress or decision fatigue (e.g., "I shower then breakfast but don't know what to eat, so I waste 10 minutes deciding").
   - **Leak Type E: Sleep Sabotage** — Evening activities that undermine sleep quality (e.g., screens before bed, caffeine, stimulating content, no wind-down period).
2. For each leak, assess severity using this scale: **High** (significantly impacts energy/productivity, user reports frustration), **Medium** (noticeable impact, user mentions it), **Low** (minor impact, user may not notice).
3. For each leak, assess addressability: **Micro-habit addressable** (fixable in 1-3 minutes, no structural change needed) or **Structural** (requires changing activity, timing, or constraint). Example: "Email overwhelm is micro-habit addressable (batch email to 2x/day) but 'must check email first thing' is structural if it's a work requirement."
4. Rank leaks by impact × addressability: (High impact + Micro-habit addressable) > (High impact + Structural) > (Medium impact + Micro-habit addressable) > etc.
5. For structural leaks, note whether they can be negotiated (see Phase 1.5 Constraint Negotiation) or must be accepted as constraints.

**Output:** `identified_leaks` array with leak type, description, severity, addressability, rank, and negotiability note.

**Quality Gate:**
- At least 3 leaks are identified. If fewer than 3, the routine is already optimized; note this and proceed to Phase 4 with focus on fine-tuning and resilience.
- Each leak has a specific, observable manifestation (not vague). Example: "Email overwhelm: user checks email 15+ times per day, starting immediately after waking, causing decision fatigue" not "User is stressed about email."
- Severity and addressability are justified with reference to the energy analysis and user's stated constraints.
- Leaks are ranked with clear rationale (e.g., "Leak #1: High impact + Micro-habit addressable = highest priority").

---

### Phase 3.5: Constraint Negotiation (NEW)

**Entry Criteria:**
- Identified leaks include structural issues that conflict with user constraints.

**Actions:**

1. For each structural leak that conflicts with a user constraint, identify the constraint (e.g., "Must check email first thing for work").
2. Propose mitigation strategies that honor the constraint while reducing the energy drain:
   - **Time-box the activity**: "Check email for 10 minutes only, then move to energy-gain activity."
   - **Filter or prioritize**: "Use email filters to show only urgent messages. Check urgent first, then defer non-urgent to later."
   - **Pair with energy gain**: "Check email while standing at a standing desk, or while sipping water and looking out a window."
   - **Defer the drain**: "Check email after a 5-minute energizing activity (cold water, stretch) to reduce the drain."
3. For each mitigation strategy, estimate the residual energy drain (e.g., "Time-boxed email + cold water before = reduces drain from −3 to −1").
4. Ask user to choose: accept the constraint and use mitigation, or negotiate the constraint (e.g., "Can you check email at 8 AM instead of 6 AM?").
5. Document the negotiated constraint and mitigation strategy in the routine design phases.

**Output:** Negotiated constraints and mitigation strategies, integrated into Phase 5-6 routine design.

**Quality Gate:**
- Every structural leak has a mitigation strategy proposed.
- Mitigation strategies are specific and actionable (not "reduce the drain somehow").
- User has explicitly chosen to accept constraint + mitigation, or negotiate constraint.

---

### Phase 4: Generate Micro-Habit Suggestions

**Entry Criteria:**
- Identified leaks are ranked and micro-habit-addressable leaks are flagged.

**Actions:**

1. For each micro-habit-addressable leak, brainstorm 2-3 micro-habits (1-3 min each) that target it. Micro-habits must meet these criteria:
   - **Atomic**: One small, concrete action (not a vague goal like "be healthier"). Example: "Drink 8 oz water" not "Stay hydrated."
   - **Triggerable**: Attached to an existing routine activity ("After I pour coffee, I drink a glass of water"). Trigger must be specific and already in the routine.
   - **Low-friction**: Requires minimal willpower or setup. No special equipment, <3 min, no decision-making required.
   - **Evidence-based**: Grounded in behavioral science or user's stated preferences. Reference specific principles (e.g., "Hydration improves cognitive function within 5 minutes" or "User stated preference for movement-based habits").
   - **Measurable**: Observable and trackable (e.g., "drink 8 oz water" not "stay hydrated").
2. For each micro-habit, specify:
   - Name and description (1 sentence).
   - Target leak(s) (which leaks does this address?).
   - Trigger (when/where to do it, attached to existing activity).
   - Expected energy impact (e.g., "+1 to +2 energy points").
   - Implementation difficulty (easy/medium/hard based on willpower required, setup time, frequency of trigger).
3. Prioritize micro-habits by:
   - Impact on identified leaks (high-impact leaks first).
   - Implementation difficulty (easy wins first).
   - User's stated preferences (if provided in `micro_habit_preferences`).
4. Create two sets:
   - **Starter set**: 3-5 micro-habits, all "easy" difficulty, targeting the top 3 leaks, total time <3 min/day.
   - **Full set**: 8-12 micro-habits, mix of easy/medium/hard, targeting all addressable leaks, total time <10 min/day.
5. For each set, provide a 4-week implementation plan: Week 1 (starter set), Week 2-3 (add 2-3 medium habits), Week 4+ (add remaining habits or structural changes).

**Output:** `micro_habits_suggested` object with starter set, full set, implementation plan, and rationale for each habit.

**Quality Gate:**
- Every micro-habit is 1-3 minutes and requires no special equipment.
- Every micro-habit has a clear trigger attached to an existing routine activity (not "do this sometime during the day").
- Starter set is achievable (3-5 habits, all "easy" difficulty, <3 min total, targeting top 3 leaks).
- Micro-habits address at least 70% of identified micro-habit-addressable leaks.
- Each habit includes expected energy impact quantified (e.g., "+1 to +2 points" not "improves energy").

---

### Phase 5: Redesign Morning Routine

**Entry Criteria:**
- Micro-habits are prioritized.
- User constraints and negotiated constraints are known.
- Energy analysis is complete.

**Actions:**

1. Start with the user's current morning routine and constraints (e.g., must leave by 8:00 AM, must exercise, must eat breakfast, work start time 7:30 AM).
2. Reorder activities to maximize energy gain:
   - Place high-energy activities (sunlight, movement, cold water, healthy nutrition) early, within 30 minutes of waking.
   - Defer energy-draining activities (email, news, decisions) to after energy-gain activities or to later in the morning.
   - Group similar activities to reduce transition friction (e.g., all hygiene activities together, all nutrition activities together).
   - Use sequencing effects identified in Phase 2 (e.g., "Cold shower before breakfast amplifies energy gain").
3. Integrate starter-set micro-habits into the routine:
   - Attach each micro-habit to an existing activity as a trigger (e.g., "After pouring coffee, drink 8 oz water").
   - Ensure total routine duration does not exceed user's available time (typically 30-90 min). If it does, prioritize activities by impact and remove or defer lowest-impact activities.
   - Ensure micro-habits are distributed throughout the morning (not all clustered at one time).
4. Create a detailed timeline with activities, timings, micro-habits, and rationale:
   ```
   6:00 AM - Wake up (no snooze)
   6:05 AM - Drink water (micro-habit: hydration trigger)
   6:10 AM - 5-min cold shower (energy gain: alertness + circulation)
   6:15 AM - Get dressed
   6:25 AM - Breakfast (no screens, focus on nutrition)
   6:45 AM - 10-min walk or stretch (micro-habit: movement trigger, energy gain)
   6:55 AM - Prepare for day (check calendar, set 3 priorities)
   7:10 AM - Leave for work
   ```
5. Validate against constraints: Does the routine fit the user's schedule and obligations? Does it honor all constraints (work start time, family obligations, commute duration)? If not, adjust.
6. Add rationale notes explaining the rationale for each change (e.g., "Cold shower before breakfast amplifies energy gain and improves alertness by 2-3 points. Moved from after breakfast to before to maximize effect.").
7. Calculate total morning duration and verify it fits available time.

**Output:** `optimized_morning_routine` object with timeline (time, activity, duration, micro-habits, rationale), total duration, and constraints_honored flag.

**Quality Gate:**
- Routine fits within user's available time (morning duration ≤ available time before work/home start).
- All user constraints are honored (work start time, family obligations, commute duration, etc.).
- At least 2 energy-gain activities are present in the morning routine.
- Starter-set micro-habits are integrated without exceeding 3 min total.
- Routine is sequenced to maximize morning energy and readiness (energy-gain activities before energy-drain activities).
- Every activity has a rationale note explaining why it's in this position and how it contributes to energy optimization.

---

### Phase 6: Redesign Evening Routine

**Entry Criteria:**
- Micro-habits are prioritized.
- User constraints and negotiated constraints are known.
- Energy analysis includes sleep-quality assessment.

**Actions:**

1. Start with the user's current evening routine and constraints (e.g., family dinner at 6:30 PM, work until 6 PM, must be in bed by 11 PM, children's bedtime 8 PM).
2. Reorder activities to support sleep quality:
   - Remove or defer energy-draining activities (work, stressful news, difficult decisions) to earlier in the evening (before 7 PM if possible).
   - Introduce wind-down activities (reduced light, reduced stimulation, relaxation) 30-60 min before bed. Wind-down activities include: dim lights, no screens, reading, journaling, breathing exercises, gentle stretching, herbal tea.
   - Eliminate sleep saboteurs: screens 30-60 min before bed, caffeine after 2 PM, intense exercise within 3 hours of bed, stimulating content (news, social media, work).
   - Group similar activities to reduce transition friction (e.g., all family time together, all personal time together).
3. Integrate starter-set micro-habits into the routine:
   - Attach each micro-habit to an existing activity as a trigger (e.g., "After dinner, take a 10-min walk").
   - Ensure total routine duration is realistic (typically 30-120 min from work end to sleep). If exceeds available time, prioritize activities by impact.
   - Ensure micro-habits are distributed throughout the evening (not all clustered at one time).
4. Create a detailed timeline with activities, timings, micro-habits, and rationale:
   ```
   6:00 PM - Arrive home, change clothes (transition activity)
   6:15 PM - Dinner with family (no work talk, no screens)
   7:00 PM - 15-min walk (micro-habit: movement trigger, stress relief, energy drain mitigation)
   7:20 PM - Tidy up (micro-habit: environment reset trigger)
   7:45 PM - Personal time (reading, hobby, not screens)
   8:30 PM - Prepare for bed (dim lights, no screens, set environment for sleep)
   8:45 PM - Bedtime routine (journaling, breathing, micro-habit: reflection trigger)
   9:00 PM - Sleep
   ```
5. Validate against constraints: Does the routine fit the user's schedule and obligations? Does it honor all constraints (family dinner time, children's bedtime, work obligations, etc.)? If not, adjust.
6. Add rationale notes explaining the rationale for each change (e.g., "Screens off 1 hour before bed improves sleep quality by reducing blue light exposure and allowing melatonin production. Moved personal time from 8 PM to 7:45 PM to create screen-free buffer.").
7. Identify wind-down start time (when screens go off and relaxation begins). This should be 30-60 min before target bedtime.
8. Calculate total evening duration and verify it fits available time.

**Output:** `optimized_evening_routine` object with timeline (time, activity, duration, micro-habits, rationale), total duration, wind-down start time, and constraints_honored flag.

**Quality Gate:**
- Routine fits within user's available time (evening duration ≤ available time from work end to bedtime).
- All user constraints are honored (family dinner time, children's bedtime, work obligations, etc.).
- Sleep saboteurs are identified and removed or deferred to earlier in evening (screens, caffeine, intense exercise).
- Wind-down period is 30-60 min before bed with no screens, reduced light, and relaxation activities.
- Starter-set micro-habits are integrated without exceeding 3 min total.
- Routine is sequenced to support sleep quality and next-day readiness (energy drains early, wind-down late).
- Every activity has a rationale note explaining how it contributes to sleep quality and next-day readiness.

---

### Phase 7: Compile Optimization Report

**Entry Criteria:**
- Optimized morning and evening routines are complete.
- All analysis phases are finished.

**Actions:**

1. Create a before/after comparison:
   - **Before**: Current routine timeline (morning and evening), energy profile, identified leaks, sleep-quality issues.
   - **After**: Optimized routine timeline (morning and evening), projected energy profile, leaks addressed, sleep-quality improvements.
   - **Quantified changes**: "3 energy drains removed, 2 energy gains added, energy profile improved from 4/10 average to 6.5/10 average."
2. Summarize key changes:
   - Reordered activities (with rationale for each reorder).
   - Integrated micro-habits (with expected impact for each).
   - Removed or deferred energy drains (with explanation).
   - Added energy-gain activities (with explanation).
   - Negotiated constraints (if any) and mitigation strategies.
3. Provide implementation guidance:
   - **Week 1**: Implement starter-set micro-habits (3-5 habits, all easy). Provide daily checklist.
   - **Week 2-3**: Add 2-3 medium-difficulty micro-habits. Provide weekly reflection prompts.
   - **Week 4+**: Gradually introduce remaining habits or structural changes. Provide monthly review template.
4. Include a troubleshooting section addressing common obstacles:
   - "I don't have time for the optimized routine" → Solutions: prioritize activities by impact, reduce micro-habit count, defer lower-impact activities.
   - "I can't stick to the new routine" → Solutions: start with 1-2 micro-habits, use habit stacking, track progress daily.
   - "The routine doesn't fit my work schedule" → Solutions: adapt for travel, shift times, use flexible triggers.
   - "I don't see energy improvement" → Solutions: give it 2-3 weeks, adjust micro-habits based on trial results, revisit energy baseline.
   - "Family/work interruptions disrupt the routine" → Solutions: create a "recovery protocol" for when routine is disrupted, rebuild gradually.
5. Add a tracking template:
   - Daily checklist for morning and evening routines (checkboxes for each activity and micro-habit).
   - Energy level log (1-10 scale) at 3-4 points in the day, daily for 4 weeks.
   - Weekly reflection prompts: "Which micro-habits helped most? Which were hardest? What obstacles did you face? What adjustments would help?"
   - Monthly review template: "Overall energy improvement? Sleep quality improvement? Leaks still present? New leaks? Adjust routine?"
6. Compile into a readable report (markdown format) with sections:
   - Executive Summary (1 paragraph: key changes, expected impact, implementation timeline).
   - Current State Analysis (routine timeline, energy profile, identified leaks, sleep-quality issues).
   - Energy Leaks (ranked list with severity, addressability, and mitigation strategy).
   - Micro-Habits (starter set and full set with triggers, expected impact, difficulty).
   - Optimized Routines (morning and evening timelines with rationale).
   - Before/After Comparison (quantified changes, energy profile improvement).
   - Implementation Plan (Week 1-4 timeline, daily checklist, weekly prompts).
   - Troubleshooting (common obstacles and solutions).
   - Tracking Template (daily checklist, energy log, weekly reflection, monthly review).
7. Ensure report is <5 pages. If exceeds, move detailed micro-habit descriptions to appendix and focus report on key changes and implementation plan.

**Output:** `optimization_report` string with complete analysis, recommendations, and implementation guide in markdown format.

**Quality Gate:**
- Report is actionable (reader can implement immediately without additional guidance).
- Before/after comparison is clear and quantified (e.g., "3 energy drains removed, 2 energy gains added, average energy improved from 4/10 to 6.5/10").
- Implementation plan is realistic (starter set is achievable in 1 week, full set over 4 weeks).
- Troubleshooting addresses at least 5 common obstacles with specific solutions.
- Report is readable and well-organized (markdown with clear sections, bullet points, examples).
- Report is ≤5 pages. If longer, move appendices and focus on key changes.

---

## Exit Criteria

The skill is DONE when:
1. `clarified_routine` is complete with all morning and evening activities, timings, purposes, and transitions. No ambiguities remain.
2. `energy_analysis` assesses every activity with explicit classification (+/0/−), specific reasoning, and at least 2 sequencing effects identified.
3. `identified_leaks` ranks at least 3 addressable leaks by impact and feasibility. Structural leaks are noted with negotiation status.
4. `micro_habits_suggested` provides a starter set (3-5 easy habits, <3 min total) and full set (8-12 habits, <10 min total) with clear triggers and expected impact.
5. `optimized_morning_routine` integrates starter-set micro-habits, honors all constraints, is sequenced for maximum energy, and includes rationale for every change.
6. `optimized_evening_routine` integrates starter-set micro-habits, honors all constraints, supports sleep quality with 30-60 min wind-down, and includes rationale for every change.
7. `optimization_report` provides before/after comparison with quantified changes, implementation plan (Week 1-4), troubleshooting for 5+ obstacles, and tracking template.
8. A person unfamiliar with the user's routine could read the report and implement the optimized routines without additional guidance. Validation: report is tested with 1-2 beta users and they successfully implement Week 1 without clarification questions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Routine description is too vague (e.g., "I wake up and go to work") | **Adjust** -- Ask for more detail: specific times (6:00 AM?), activities between wake and work (shower, breakfast, commute?), pain points (rushed, tired, stressed?). Require at least 5 distinct activities. |
| Phase 1 | User has no fixed routine (e.g., "it varies every day") | **Adjust** -- Ask for a typical day or most common pattern (e.g., "What does a typical Monday look like?"). Document variations as constraints (e.g., "Monday-Friday routine differs from weekend"). Optimize for typical day first, then provide adaptation templates. |
| Phase 2 | Energy impact is ambiguous (e.g., "I don't know if exercise energizes me") | **Adjust** -- Suggest a 1-week trial: perform the activity (e.g., 10-min morning walk) and log energy level before/after daily. Use trial results to classify impact. Integrate trial into Phase 4 micro-habit selection. |
| Phase 3 | No addressable leaks are identified (routine is already optimized) | **Adjust** -- Focus on micro-habits for fine-tuning and resilience. Suggest full-set habits for gradual adoption. Provide "resilience routines" for common disruptions (travel, illness, schedule changes). |
| Phase 3.5 | User constraints conflict with optimization recommendations (e.g., "must check email first thing" but email is energy drain) | **Adjust** -- Propose mitigation strategies: time-box email (10 min only), filter to urgent only, pair with energy gain (cold water before email). Ask user to choose: accept constraint + mitigation, or negotiate constraint. Document negotiated constraint. |
| Phase 4 | User rejects all suggested micro-habits | **Adjust** -- Ask for user's preferred micro-habit types (movement, breathing, hydration, mindfulness, journaling, other?). Regenerate suggestions aligned with preferences. If user still rejects, ask: "What would make a micro-habit appealing to you?" and co-design habits. |
| Phase 5-6 | Optimized routine exceeds available time | **Adjust** -- Prioritize activities by impact on energy/sleep. Remove or defer lowest-impact activities. Reduce micro-habit count (keep only starter set). Compress activity durations (e.g., 5-min walk instead of 10-min). If still exceeds time, flag as infeasible and ask user to extend available time or accept current routine. |
| Phase 5-6 | Optimized routine violates user constraints (e.g., must leave by 8 AM but optimized routine requires 8:15 AM) | **Abort** -- Clarify constraints. Redesign routine respecting all constraints. If impossible, ask user to negotiate constraint (e.g., "Can you leave 15 min later?") or accept current routine. |
| Phase 7 | Report exceeds 5 pages | **Adjust** -- Condense analysis. Move detailed micro-habit descriptions to appendix. Focus report on: key changes, before/after comparison, Week 1 implementation plan, top 3 troubleshooting obstacles. Keep tracking template in main report. |
| Phase 7 | User cannot implement Week 1 starter set without clarification | **Adjust** -- Simplify starter set (reduce to 2-3 habits). Provide video or example of each micro-habit. Offer weekly check-in to troubleshoot obstacles. |

---

## Reference Section

### Energy Impact Framework

**Energy Gain (+):** Activities that increase alertness, motivation, well-being, or sense of control.
- Examples: sunlight exposure (within 1 hour of waking), movement/exercise (10+ min), cold water (shower or splash), healthy nutrition (protein + complex carbs), accomplishment (completing a task), social connection (conversation), nature (outdoor time).
- Timing: Place early in morning or before energy-draining activities to amplify effect. Sequencing effect: "Exercise before breakfast gains more energy than after a heavy meal."
- Expected impact: +1 to +3 energy points per activity.

**Neutral (0):** Activities that are necessary but neither drain nor gain energy.
- Examples: getting dressed, commuting, routine tasks, hygiene, administrative work.
- Timing: Can be scheduled flexibly; use as transitions between high-impact activities.
- Expected impact: 0 energy points.

**Energy Drain (−):** Activities that deplete focus, motivation, well-being, or sense of control.
- Examples: decision fatigue (too many choices), email/notifications (interruptions), news (negative content), rushed transitions (stress), screen time before bed (blue light), unpleasant tasks (procrastination), social conflict.
- Timing: Defer to later in day when possible, or batch to minimize context switching. Sequencing effect: "Email check after coffee is less draining than before coffee."
- Expected impact: −1 to −3 energy points per activity.

### Micro-Habit Design Principles

1. **Atomic**: One small, concrete action (not a vague goal like "be healthier"). Example: "Drink 8 oz water" not "Stay hydrated."
2. **Triggerable**: Attached to an existing routine activity ("After I pour coffee, I drink water"). Trigger must be specific and already in the routine.
3. **Low-friction**: Requires minimal willpower or setup (no special equipment, <3 min, no decision-making).
4. **Evidence-based**: Grounded in behavioral science or user's stated preferences. Example: "Hydration improves cognitive function within 5 minutes" or "User stated preference for movement-based habits."
5. **Measurable**: Observable and trackable (e.g., "drink 8 oz water" not "stay hydrated").

### Micro-Habit Stacking Guide

Micro-habit stacking reduces total time by combining micro-habits with existing activities or with each other:
- **Activity stacking**: "While brushing teeth, do 10 calf raises" (combines hygiene + movement).
- **Micro-habit stacking**: "Drink water while stretching" (combines hydration + movement).
- **Trigger stacking**: "After pouring coffee, drink water, then do 5 stretches" (chains micro-habits with one trigger).

Benefit: Reduces total time from 3 separate 1-min habits to 2-3 min combined. Use stacking when user reports time constraints.

### Common Energy Leaks and Micro-Habit Solutions

| Leak | Micro-Habit | Trigger | Duration | Expected Impact |
|---|---|---|---|---|
| No morning hydration | Drink 8 oz water | After waking, before coffee | 1 min | +1 energy |
| No morning movement | 5-min stretch or walk | After breakfast | 5 min | +2 energy |
| Decision fatigue at breakfast | Prep 3 breakfast options night before | During evening routine | 2 min prep | +1 energy (next day) |
| Email overwhelm | Batch email check (2x/day, not continuous) | After morning routine, after lunch | 10 min | +1 energy |
| No sunlight exposure | 5-min outdoor time | During morning routine | 5 min | +2 energy |
| Evening screen time | Set phone away 1 hour before bed | After dinner | 1 min (setup) | +2 sleep quality |
| No reflection/journaling | 3-min evening reflection | Before bed | 3 min | +1 energy (next day) |
| Rushed transitions | 2-min buffer between activities | Built into timeline | 2 min | +1 energy (reduced stress) |
| No stress relief | 10-min walk or breathing | After work | 10 min | +2 energy |
| Poor sleep quality | Wind-down routine (dim lights, no screens) | 1 hour before bed | 30-60 min | +2 sleep quality |

### Sleep Quality Checklist

- [ ] No screens 30-60 min before bed (blue light suppresses melatonin).
- [ ] Bedroom is cool (65-68°F), dark, quiet (optimal sleep environment).
- [ ] No caffeine after 2 PM (caffeine half-life is 5-6 hours).
- [ ] No intense exercise within 3 hours of bed (raises core temperature).
- [ ] Wind-down routine is 30-60 min before bed (allows nervous system to relax).
- [ ] Bedtime is consistent (within 30 min) every night (regulates circadian rhythm).
- [ ] Morning sunlight exposure within 1 hour of waking (sets circadian rhythm, improves sleep quality).

### Implementation Checklist

- [ ] Week 1: Implement 3-5 starter-set micro-habits (all easy difficulty).
- [ ] Week 1: Track energy level daily (1-10 scale) and note obstacles.
- [ ] Week 1: Complete daily checklist for morning and evening routines.
- [ ] Week 2: Review tracking data. Which micro-habits helped most? Which were hardest? What obstacles did you face?
- [ ] Week 2-3: Add 2-3 medium-difficulty micro-habits based on Week 1 learning.
- [ ] Week 3: Complete weekly reflection prompts.
- [ ] Week 4+: Gradually introduce remaining habits or structural changes.
- [ ] Week 4: Complete monthly review template. Are leaks addressed? Any new leaks? Adjust routine?

### Routine Adaptation Templates

**Travel (1-2 weeks):**
- Maintain morning routine core (wake time, hydration, movement, breakfast) even if location changes.
- Adapt evening routine to new environment (find local park for walk, adjust bedtime for time zone).
- Use "recovery protocol" when returning home: 2-3 days to re-establish full routine.

**Seasonal Changes:**
- Winter: Add light therapy (10-30 min bright light in morning) to compensate for reduced sunlight. Adjust outdoor activity duration.
- Summer: Shift morning routine earlier to avoid heat. Adjust evening routine for later sunset.

**New Job or Schedule Change:**
- Identify new constraints (work start time, commute duration, lunch time).
- Redesign morning routine to fit new work start time.
- Redesign evening routine to fit new work end time.
- Maintain micro-habits; adjust triggers if needed.

**Parenthood or Family Changes:**
- Identify new constraints (children's bedtime, school drop-off time, family obligations).
- Redesign routines to honor new constraints.
- Reduce micro-habit count if time is limited (keep only highest-impact habits).
- Use "micro-habit stacking" to combine habits and reduce total time.

**Illness or Disruption:**
- Create a "recovery protocol": when routine is disrupted (illness, emergency, travel), implement minimal routine (2-3 core activities only).
- Rebuild gradually: Week 1 minimal routine, Week 2 add 2-3 activities, Week 3+ return to full routine.
- Don't abandon routine; adapt it.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.