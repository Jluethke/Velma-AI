# Daily Planner

Builds an optimized, energy-aware daily schedule by classifying tasks through the Eisenhower matrix, mapping them to peak/trough energy windows, and producing a time-blocked plan with built-in buffers and evening review prompts.

## Execution Pattern: ORPA Loop

## Inputs
- calendar_events: array -- Fixed commitments with start/end times (meetings, appointments, deadlines)
- task_list: array -- Tasks to schedule, each with estimated duration and category (deep work, admin, creative, communication)
- energy_profile: object -- User's energy curve (peak hours, trough hours, recovery patterns). Defaults to morning-peak if not provided.
- goals: array -- Active goals with priority ranking (weekly/monthly objectives this day should advance)
- deadlines: array -- Hard deadlines with dates and consequences of missing them

## Outputs
- time_blocked_schedule: object -- Hour-by-hour schedule with task assignments, buffer blocks, and break periods
- top_priorities: array -- The 3 tasks that matter most today with rationale for each
- evening_review_prompts: array -- Reflection questions for end-of-day review and next-day prep

## Execution

### OBSERVE: Gather and Inventory
**Entry criteria:** At least one task or calendar event exists for the day.
**Actions:**
1. Collect all calendar events and extract available time blocks (gaps between fixed commitments).
2. Inventory all tasks with estimated durations. Apply historical multiplier if completion data exists (default: 1.3x for new users to counter planning fallacy).
3. Read energy profile -- identify peak hours (highest cognitive capacity), maintenance hours (moderate), and trough hours (lowest).
4. Pull active goals and map each task to the goal it advances. Flag orphan tasks (tasks that advance no active goal).
5. Check deadlines -- identify anything due today or overdue.

**Output:** Structured inventory: available time slots, adjusted task durations, energy map, goal-task linkages, deadline flags.
**Quality gate:** Total estimated task time calculated. If it exceeds available time by >30%, flag overcommitment before proceeding.

### REASON: Classify and Prioritize
**Entry criteria:** Inventory complete with adjusted durations and energy map.
**Actions:**
1. Classify every task into Eisenhower quadrants:
   - **Q1 (Urgent + Important):** Due today/overdue, high-consequence if missed. DO FIRST.
   - **Q2 (Important + Not Urgent):** Advances key goals, no immediate deadline. SCHEDULE for peak energy.
   - **Q3 (Urgent + Not Important):** Someone else needs it, low personal value. DELEGATE or batch.
   - **Q4 (Not Urgent + Not Important):** No goal linkage, no deadline. ELIMINATE or defer.
2. Estimate cognitive load per task: deep (90+ min focus), moderate (30-60 min), light (<30 min, interruptible).
3. Calculate energy cost: map cognitive load to energy requirements. Deep work requires peak energy. Light tasks fit trough hours.
4. Identify task dependencies -- what must finish before something else can start.
5. Select top 3 priorities: the tasks that, if completed, make the day a success regardless of what else happens.

**Output:** Prioritized task list with quadrant assignments, cognitive load ratings, energy cost estimates, dependency graph, top 3 priorities.
**Quality gate:** Every task has a quadrant assignment. Top 3 priorities are from Q1 or Q2 only. No Q4 tasks are scheduled in peak hours.

### PLAN: Build the Schedule
**Entry criteria:** Prioritized task list with energy mappings exists.
**Actions:**
1. Place fixed calendar events first (immovable anchors).
2. Assign Q1 tasks to the earliest available slots (urgent = do first).
3. Assign Q2 deep work to peak energy windows. Protect these blocks -- no meetings, no interruptions, minimum 90-minute chunks.
4. Batch Q3 tasks into a single "admin block" during trough hours (email, messages, small requests).
5. Add transition buffers between context switches (10-15 min between unrelated tasks).
6. Insert breaks: 5-min break every 50 min, 15-30 min break every 2-3 hours, lunch break.
7. Add a 15-min "overflow buffer" after every 2-hour block for tasks that run long.
8. Schedule evening review (15 min at end of day).
9. If overcommitted: move Q3/Q4 tasks to tomorrow, split large tasks into sub-tasks, or reduce scope.

**Output:** Time-blocked schedule with all tasks placed, buffers included, breaks scheduled.
**Quality gate:** No time block conflicts. Deep work in peak hours only. Total scheduled time does not exceed available time. At least one break every 2 hours.

### ACT: Deliver and Prepare Review
**Entry criteria:** Valid time-blocked schedule with no conflicts.
**Actions:**
1. Format the final schedule as a clean, scannable document:
   - Time | Task | Category | Energy Level | Notes
2. Highlight the top 3 priorities with clear rationale ("This is priority #1 because it advances [goal] and is due [deadline]").
3. Generate evening review prompts:
   - "Which of the top 3 priorities did you complete?"
   - "What took longer than expected and why?"
   - "What did you skip, and does it need to be rescheduled?"
   - "What was your energy level at each block -- does your profile need updating?"
   - "What one thing would you do differently tomorrow?"
4. If state persistence is available: record today's plan for later comparison against actual completion.

**Output:** Final deliverable: time-blocked schedule, top 3 priorities with rationale, evening review prompts.
**Quality gate:** Schedule is internally consistent (no overlaps, no impossible sequences). All top 3 priorities have assigned time blocks.

## Exit Criteria
The skill is complete when: (1) a conflict-free time-blocked schedule is produced, (2) exactly 3 priorities are identified with rationale, (3) evening review prompts are generated, and (4) any overcommitment has been resolved by deferring or eliminating tasks.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No tasks or calendar provided | Abort -- request minimum inputs (at least 1 task) |
| OBSERVE | Energy profile missing | Adjust -- use default morning-peak profile, note assumption |
| REASON | All tasks classified as Q1 (everything urgent) | Escalate -- ask user to force-rank by consequence of delay |
| PLAN | Overcommitted by >50% | Adjust -- eliminate Q4, defer Q3, split Q2 tasks across days |
| PLAN | No peak hours available (all meetings) | Adjust -- identify "best available" slots, recommend rescheduling one meeting |
| ACT | State persistence unavailable | Skip -- deliver schedule without historical tracking |
| ACT | User rejects final output | **Targeted revision** -- ask which time block, task priority, or scheduling decision fell short and rerun only that section. Do not regenerate the full day plan. |

## State Persistence

- Plan completion history (which tasks were completed, skipped, or deferred per day)
- Duration accuracy (estimated vs actual time per task category -- used to improve the planning fallacy multiplier)
- Energy profile calibration (actual performance per time block vs predicted energy level -- refines the energy curve)
- Recurring task patterns (tasks that appear repeatedly, with completion rates and optimal scheduling slots)
- Habit streaks (consecutive days of completing top priorities)
- Deferral patterns (which Q2 tasks consistently get pushed -- signals goal misalignment or avoidance)
- Schedule adherence rate (percentage of planned blocks that executed as scheduled per day)

## Reference

### Eisenhower Matrix
Developed by Dwight D. Eisenhower: "What is important is seldom urgent and what is urgent is seldom important." The matrix forces explicit classification rather than treating everything as equally important.

- **Q1 (Do):** Crisis, deadlines, urgent problems. Minimize time here through better Q2 planning.
- **Q2 (Schedule):** Strategic work, relationship building, learning, prevention. This is where life quality improves.
- **Q3 (Delegate):** Interruptions, most emails, some meetings. Feels urgent but doesn't advance your goals.
- **Q4 (Eliminate):** Time wasters, busywork, pleasant but unproductive activities.

### Energy Management Principles
- Cognitive capacity follows a circadian curve. Most people peak 2-4 hours after waking.
- Deep work (complex problem solving, creative work, strategic thinking) requires peak energy.
- Administrative tasks (email, scheduling, routine communication) require minimal cognitive energy.
- Context switching costs 15-25 minutes of productive time per switch.
- Decision fatigue accumulates -- schedule important decisions early.

### Time Blocking Best Practices
- Minimum block size: 25 minutes (Pomodoro) for light tasks, 90 minutes for deep work.
- Maximum continuous work: 2-3 hours before a meaningful break.
- Buffer ratio: add 30% to estimated durations for new/unfamiliar tasks.
- "Maker's schedule vs. manager's schedule" (Paul Graham): protect contiguous deep work blocks.

### Planning Fallacy Correction
People systematically underestimate task duration. Correction strategies:
- Track actual vs. estimated time for 2 weeks to calculate personal multiplier.
- Use "reference class forecasting" -- how long did similar tasks take before?
- Default multiplier: 1.3x for familiar tasks, 1.5x for unfamiliar, 2x for novel.

### State Learning
Over time, the skill should accumulate:
- Actual completion rates per task category (to improve duration estimates)
- Peak energy window accuracy (does the user actually perform best when they think they do?)
- Which Q2 tasks consistently get deferred (signals goal misalignment or avoidance)
- Schedule adherence patterns (where do plans break down?)
