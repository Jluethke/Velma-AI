# Habit Builder

Designs sustainable habit formation plans using behavioral science -- cue-routine-reward loops, habit stacking, environment design, and progressive difficulty scaling -- with daily check-ins and adaptive adjustments based on actual adherence data.

## Execution Pattern: ORPA Loop

## Inputs
- target_habit: string -- The habit the user wants to build (e.g., "meditate daily," "exercise 4x/week")
- current_habits: array -- Existing daily routines and habits (used for habit stacking anchors)
- goals: array -- Why this habit matters (deeper motivation for identity-based framing)
- available_time: object -- When the habit can realistically occur (morning/evening, weekday/weekend, minutes available)
- barriers: array -- Past failure modes, obstacles, known friction points

## Outputs
- habit_stack_design: object -- The cue-routine-reward loop with environment modifications
- thirty_day_plan: object -- Progressive 30-day plan with weekly phases and micro-milestones
- daily_checkin: object -- Check-in template with completion tracking and reflection prompts
- adjustment_recommendations: array -- Adaptive changes based on adherence patterns

## Execution

### OBSERVE: Assess Current State
**Entry criteria:** Target habit is defined.
**Actions:**
1. Analyze the target habit: classify as daily vs. intermittent, time-bound vs. open-ended, physical vs. mental vs. creative.
2. Map existing habits to find stacking anchors -- established routines that happen reliably at consistent times (morning coffee, brushing teeth, commute, lunch).
3. Identify the "two-minute version" of the target habit -- the smallest possible implementation that still counts (e.g., "meditate" -> "sit and take 3 deep breaths").
4. Catalog barriers: past attempts and why they failed, environmental friction (equipment access, location, social pressure), competing commitments.
5. Extract the identity connection: who does the user want to become? (Not "I want to meditate" but "I want to be someone who is calm and present.")

**Output:** Habit profile: classified habit, stacking anchors, two-minute version, barrier map, identity statement.
**Quality gate:** At least one viable stacking anchor identified. Two-minute version is genuinely achievable in under 2 minutes.

### REASON: Design the Loop
**Entry criteria:** Habit profile complete with stacking anchors and barriers.
**Actions:**
1. Design the cue-routine-reward loop:
   - **Cue:** Select the strongest stacking anchor. The cue must be specific, visible, and unavoidable. "After I pour my morning coffee" > "in the morning."
   - **Routine:** Start with the two-minute version. This is non-negotiable for weeks 1-2.
   - **Reward:** Identify an immediate reward (not the long-term benefit). Options: checkmark on tracker, brief moment of satisfaction, small treat, social sharing.
2. Design environment modifications to reduce friction:
   - Make the habit obvious (visual cues: meditation cushion by bed, gym bag by door).
   - Make the habit easy (reduce steps to start: lay out clothes the night before, pre-load the app).
   - Remove friction for the habit, add friction for competing behaviors.
3. Design the "implementation intention": "After [CUE], I will [ROUTINE] for [MINIMUM DURATION]. My reward is [REWARD]."
4. Identify the "bright line rule" -- one simple, unambiguous rule that defines success. "Did I sit on the cushion? Yes/no." Not "Did I meditate well?"

**Output:** Complete habit loop design with cue, routine, reward, environment changes, implementation intention, bright line rule.
**Quality gate:** The implementation intention is specific enough that an observer could verify compliance. The bright line rule is binary (yes/no).

### PLAN: Build the 30-Day Progression
**Entry criteria:** Habit loop designed with implementation intention.
**Actions:**
1. **Week 1 (Days 1-7): Anchor Phase.** Goal: establish the cue-routine connection. Two-minute version only. Success = doing it at all, not doing it well. Focus on never missing.
2. **Week 2 (Days 8-14): Consistency Phase.** Goal: extend slightly. Increase to 5-minute version. Same cue, same reward. Introduce streak tracking.
3. **Week 3 (Days 15-21): Growth Phase.** Goal: approach target duration. Increase to 50-75% of target habit. Add variety if applicable. Allow one planned rest day if intermittent habit.
4. **Week 4 (Days 22-30): Identity Phase.** Goal: full target habit. 100% of target duration/intensity. Begin identifying as someone who does this ("I'm a meditator" not "I'm trying to meditate").
5. Set micro-milestones with celebrations: Day 3 (survived the start), Day 7 (first full week), Day 14 (two weeks straight), Day 21 (neurological habit formation threshold), Day 30 (one month identity).
6. Define the "miss protocol": if you miss one day, do the two-minute version the next day no matter what. Never miss twice. Missing once is an accident; missing twice is the start of a new habit.

**Output:** 30-day plan with weekly phases, daily minimums, micro-milestones, miss protocol.
**Quality gate:** Each week has a clear, measurable goal. The progression from two-minute to full habit is gradual (no more than 2x increase per week).

### ACT: Deliver and Track
**Entry criteria:** 30-day plan built.
**Actions:**
1. Output the complete habit formation package:
   - Implementation intention (printable/storable)
   - Environment modification checklist
   - 30-day plan with daily minimums
   - Streak tracker template
   - Daily check-in template: "Did I do it? How long? How did it feel? What almost stopped me?"
2. If the ORPA loop is re-entered (ongoing tracking):
   - Analyze check-in data: completion rate, average duration, common skip reasons.
   - If completion rate < 80% in any week: reduce difficulty (go back to previous week's minimum).
   - If completion rate > 90% for 2+ weeks: increase difficulty or add a companion habit.
   - If the same barrier appears 3+ times: redesign the environment modification for that specific friction point.
3. Generate adjustment recommendations based on patterns.

**Output:** Complete habit formation package, or (on re-entry) adjustment recommendations based on adherence data.
**Quality gate:** The deliverable includes all components (intention, environment changes, 30-day plan, tracker, check-in template). Adjustments are data-driven (cite specific completion rates or barrier frequencies).

## Exit Criteria
The skill is complete on initial run when the full habit formation package is delivered. On ongoing use, the loop exits when the 30-day plan is complete AND completion rate exceeds 80% in week 4.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No existing habits to stack onto | Adjust -- use time-of-day anchors instead (alarm, meal times, bedtime) |
| OBSERVE | Target habit is vague ("be healthier") | Abort -- request specific, observable behavior |
| REASON | Cannot find appropriate reward | Adjust -- default to streak tracking + checkmark satisfaction |
| PLAN | User wants to skip the two-minute phase | Escalate -- explain the science, strongly recommend compliance, but allow override |
| ACT | No check-in data for adjustment cycle | Skip -- deliver generic recommendations, request data collection |
| ACT | Completion rate below 50% for 2+ weeks | Adjust -- reduce to two-minute version, reassess barriers, consider if this is the right habit |
| ACT | User rejects final output | **Targeted revision** -- ask which habit design, cue, reward, or implementation intention fell short and rerun only that phase. Do not restart the full habit plan. |

## Reference

### The Four Laws of Behavior Change (James Clear, Atomic Habits)
1. **Make it obvious** -- Design clear cues. Use implementation intentions. Use habit stacking.
2. **Make it attractive** -- Bundle with something enjoyable. Join a culture where the habit is normal.
3. **Make it easy** -- Reduce friction. Use the two-minute rule. Optimize environment.
4. **Make it satisfying** -- Add immediate rewards. Use habit tracking. Never miss twice.

### Habit Stacking Formula
"After [CURRENT HABIT], I will [NEW HABIT]."
- The anchor habit must be something you already do daily without thinking.
- The new habit should be the two-minute version initially.
- Physical proximity matters: stack habits that happen in the same location.

### The Two-Minute Rule
Every habit can be reduced to a two-minute version:
- "Read 30 minutes before bed" -> "Read one page"
- "Run 3 miles" -> "Put on running shoes and walk to the end of the driveway"
- "Study for class" -> "Open your notes"
The point is not the two minutes. The point is becoming the type of person who shows up.

### Streak Psychology
- Missing one day has almost no impact on long-term habit formation.
- Missing two consecutive days makes it 3x more likely the habit dies.
- The "never miss twice" rule is the single most important recovery strategy.
- Streaks create psychological momentum -- but can also create fragility ("I broke my streak, why bother?"). Counter this by measuring "total days completed" alongside "current streak."

### Habit Formation Timeline
- **Days 1-7:** Requires conscious effort and willpower. Highest dropout period.
- **Days 8-21:** Becoming familiar but still requires intention. Cue-routine link strengthening.
- **Days 22-40:** Approaching automaticity for simple habits. Complex habits may take 60-90 days.
- **Day 66:** Research average for habit automaticity (Phillippa Lally, UCL). Range: 18-254 days depending on complexity.

### Common Failure Patterns
1. **Starting too big:** "I'll go to the gym for an hour every day" -> fails by day 4. Fix: two-minute rule.
2. **No specific cue:** "I'll meditate sometime today" -> never happens. Fix: implementation intention.
3. **Relying on motivation:** Motivation fluctuates. Systems beat motivation. Fix: environment design.
4. **No immediate reward:** Long-term benefits don't drive short-term behavior. Fix: add satisfying tracking.
5. **All-or-nothing thinking:** "I missed Monday so the week is ruined." Fix: never-miss-twice rule.

### State Persistence
The skill tracks over time:
- Completion rates per habit per week
- Common barriers and their frequency
- Which habit stacking anchors proved reliable
- Duration progression (did the user actually scale up as planned?)
- Streak data (current, longest, total days)
