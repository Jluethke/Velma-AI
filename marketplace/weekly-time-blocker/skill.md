# Weekly Time Blocker

**One-line description:** Transforms a user's week-ahead description into a balanced, time-blocked calendar with protected deep work, meetings, and recovery time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `week_description` (string, required): User's verbal or written description of the week ahead. Include meetings, deadlines, priorities, personal commitments, and any constraints (e.g., "I have a 2-hour client call Tuesday, a project due Friday, and I need 3 deep work blocks").
- `work_hours_start` (string, optional, default: "08:00"): Start of typical work day in HH:MM format.
- `work_hours_end` (string, optional, default: "18:00"): End of typical work day in HH:MM format.
- `recovery_ratio` (number, optional, default: 0.33): Fraction of meeting time to allocate as recovery/buffer (e.g., 0.33 = 1 hour recovery per 3 hours of meetings).
- `deep_work_preference` (string, optional, default: "morning"): Preferred time for deep work blocks (morning, afternoon, flexible).
- `calendar_format` (string, optional, default: "json"): Output format (json, ics, or both).
- `existing_events` (array of objects, optional): Existing calendar events to avoid double-booking. Each object has: title (string), start_datetime (ISO 8601), end_datetime (ISO 8601).

---

## Outputs

- `clarified_week_summary` (object): Structured summary with fields:
  - `meetings` (array of objects): Each with title, duration_minutes, day, time_locked (boolean), flexibility_notes
  - `deadlines` (array of objects): Each with task, due_date, estimated_hours
  - `personal_commitments` (array of objects): Each with description, day, duration_minutes
  - `top_priorities` (array of strings): Up to 3 priority statements
  - `energy_pattern` (string): User's peak productivity times (e.g., "morning peak, afternoon dip")
  - `constraints` (array of strings): Any hard constraints (e.g., "no meetings after 5pm", "must have lunch 12-1pm")
  - `assumptions_made` (array of strings): Documented assumptions for missing or ambiguous information

- `deep_work_blocks` (array of objects): Each with:
  - `task_name` (string)
  - `estimated_duration_hours` (number)
  - `deadline` (string, ISO date)
  - `focus_level` (number, 1-5)
  - `preferred_time` (string)
  - `minimum_block_duration_hours` (number)

- `recovery_allocation` (object):
  - `total_meeting_hours` (number)
  - `allocated_recovery_hours` (number)
  - `break_duration_minutes` (number, between meetings)
  - `end_of_day_buffer_minutes` (number)
  - `lunch_block_minutes` (number)
  - `wellness_time_minutes` (number)

- `time_blocked_schedule` (array of objects): Each block with:
  - `day` (string, Mon-Fri)
  - `start_time` (string, HH:MM)
  - `end_time` (string, HH:MM)
  - `category` (string: meeting, deep_work, recovery, personal, lunch)
  - `title` (string)
  - `notes` (string, optional)
  - `color_code` (string, hex or name)

- `validation_report` (object):
  - `conflicts_found` (array of strings, or empty)
  - `recovery_time_percentage` (number, 0-100)
  - `deep_work_hours_allocated` (number)
  - `meeting_density_by_day` (object, e.g., {"Mon": 4, "Tue": 6, ...})
  - `schedule_feasibility` (string: feasible, overloaded, or underutilized)
  - `feasibility_details` (object): {overbook_percentage, recovery_shortfall_hours, deep_work_shortfall_hours}
  - `notes` (array of strings)

- `optimized_schedule` (array of objects): Same structure as time_blocked_schedule, with adjustments applied.

- `optimization_notes` (array of strings): Specific changes made during optimization (e.g., "Moved Tuesday 2pm meeting to Wednesday 10am", "Consolidated two 1-hour deep work blocks into one 2-hour block").

- `calendar_output` (string or object, depending on format):
  - If format is "json": array of calendar event objects
  - If format is "ics": valid iCalendar format string
  - If format is "both": object with keys `json` and `ics`

---

## Execution Phases

### Phase 1: Elicit and Clarify Week Overview

**Entry Criteria:**
- `week_description` is provided and contains at least 3 distinct time commitments or constraints.

**Actions:**
1. Parse the week description to identify all action items: meetings, deadlines, personal commitments, constraints.
2. For each meeting mentioned, extract: title, estimated duration, day/time (if specified), flexibility (fixed or moveable).
3. For each deadline, extract: task name, due date, estimated effort hours.
4. For each personal commitment, extract: description, day, duration.
5. Identify the user's stated priorities (top 3 if possible).
6. Identify energy patterns or productivity preferences mentioned (e.g., "I'm a morning person", "I crash after 3pm").
7. Identify hard constraints (e.g., "no meetings after 5pm", "must have Wednesday afternoon free").
8. For any missing or ambiguous information, document the assumption made (e.g., "Assumed 1-hour duration for unspecified meetings").
9. Compile into `clarified_week_summary` object.

**Output:**
- `clarified_week_summary` (object, as defined in Outputs section)

**Quality Gate:**
- Every meeting, deadline, and commitment mentioned in the input is captured in the summary.
- Every field in `clarified_week_summary` has a value; if information is missing, an assumption is documented in `assumptions_made`.
- Assumptions are specific and testable (e.g., "Assumed 1-hour duration" not "Assumed reasonable duration").

---

### Phase 2: Extract and Categorize Commitments

**Entry Criteria:**
- `clarified_week_summary` is complete.

**Actions:**
1. Create four lists: fixed_meetings, flexible_meetings, deep_work_needed, personal_commitments.
2. For each meeting in `clarified_week_summary.meetings`, classify as fixed (time-locked, non-negotiable) or flexible (moveable, time-negotiable). Use the `time_locked` field.
3. For each deadline in `clarified_week_summary.deadlines`, determine if it requires a deep work block. If yes, add to deep_work_needed with estimated hours and deadline.
4. For each personal commitment, note day and duration.
5. Calculate total hours for each category: fixed_meeting_hours, flexible_meeting_hours, deep_work_hours, personal_hours.
6. Calculate total available work hours: (work_hours_end - work_hours_start) × 5 days.
7. Calculate overbook percentage: (fixed_meeting_hours + deep_work_hours + personal_hours) / total_available_hours × 100.
8. Identify any obvious conflicts (e.g., two meetings at the same time, deadline before week starts).
9. If overbook percentage > 100%, flag as "overbooked" in conflict list with specific percentage.

**Output:**
- Categorized commitments (internal, used in Phase 3)
- Conflict list (if any)
- Overbook assessment (percentage, or "not overbooked")

**Quality Gate:**
- Every commitment is categorized and counted.
- Overbook percentage is calculated explicitly.
- If overbooked, the percentage is documented and conflicts are flagged.

---

### Phase 3: Identify Deep Work Requirements

**Entry Criteria:**
- Categorized commitments from Phase 2.
- `deep_work_preference` input is provided.

**Actions:**
1. For each deadline and priority, determine the deep work block needed: task name, duration, deadline, focus level (1-5, where 5 is maximum focus required).
2. Assign preferred time based on `deep_work_preference` and user's energy pattern from Phase 1.
3. Determine minimum contiguous block duration for each task (e.g., "needs at least 2 hours uninterrupted").
4. Rank deep work blocks by deadline urgency (earliest first) and focus level (highest first).
5. Compile into `deep_work_blocks` array, sorted by deadline.

**Output:**
- `deep_work_blocks` (array of objects, as defined in Outputs section, sorted by deadline)

**Quality Gate:**
- Each deep work block has a realistic duration estimate (minimum 1 hour, maximum 4 hours per block).
- Preferred times align with user's stated energy pattern (morning, afternoon, or flexible).
- Total deep work hours are documented for validation in Phase 6.

---

### Phase 4: Calculate Recovery and Buffer Time

**Entry Criteria:**
- Total meeting hours from Phase 2.
- Total deep work hours from Phase 3.
- `recovery_ratio` input.

**Actions:**
1. Calculate total meeting hours from fixed_meetings and flexible_meetings.
2. Calculate allocated recovery time: meeting_hours × recovery_ratio.
3. Allocate recovery time as:
   - Break between meetings: 15-30 minutes (default 20 min).
   - End-of-day buffer: 30 minutes (to decompress, plan next day).
   - Lunch block: 60 minutes (default, adjustable).
   - Wellness time: 30 minutes (exercise, walk, meditation; optional but recommended).
4. Distribute recovery time across the week to avoid clustering all breaks on one day.
5. Compile into `recovery_allocation` object.

**Output:**
- `recovery_allocation` (object, as defined in Outputs section)

**Quality Gate:**
- Total allocated recovery time ≥ calculated recovery time.
- Recovery time is distributed across all 5 work days (no day has zero recovery).
- Lunch block is protected (not overwritten by meetings).

---

### Phase 5a: Place Fixed Commitments and Lunch

**Entry Criteria:**
- Fixed meetings from Phase 2.
- Work hours and preferences from inputs.

**Actions:**
1. Initialize a 5-day calendar (Mon-Fri) with work_hours_start to work_hours_end.
2. Check `existing_events` input; mark those time slots as unavailable.
3. Place all fixed meetings first (non-negotiable time slots). If a fixed meeting conflicts with existing events, flag as conflict and note in validation report.
4. Place lunch blocks (typically 12:00-13:00, adjustable per constraints).
5. Verify no double-bookings between fixed meetings and lunch.
6. Compile into draft_schedule.

**Output:**
- draft_schedule (internal, used in Phase 5b)
- Fixed placement conflicts (if any)

**Quality Gate:**
- All fixed meetings are placed without overlap.
- Lunch is protected on all 5 days.
- No conflicts with existing_events (or conflicts are documented).

---

### Phase 5b: Place Deep Work, Recovery, and Flexible Meetings

**Entry Criteria:**
- draft_schedule from Phase 5a.
- Deep work blocks from Phase 3.
- Recovery allocation from Phase 4.

**Actions:**
1. Place deep work blocks in preferred times, respecting minimum contiguous duration and avoiding fragmentation.
2. Place recovery breaks (15-30 min) between meetings and after deep work blocks.
3. Place end-of-day buffers (30 min before work_hours_end).
4. Place wellness time (30 min, flexible placement, e.g., 3-4pm or 5-6pm).
5. Place flexible meetings in remaining slots, balancing daily load (target: ≤6 hours meetings per day).
6. Assign color codes: meeting=blue, deep_work=green, recovery=yellow, personal=purple, lunch=orange.
7. Compile into `time_blocked_schedule` array.

**Output:**
- `time_blocked_schedule` (array of objects, as defined in Outputs section)

**Quality Gate:**
- No time slot is double-booked.
- All fixed meetings and deep work blocks are placed (or flagged as impossible to fit).
- Lunch is protected.
- Recovery time is present on all days.
- Daily schedule does not exceed work_hours_end.

---

### Phase 6: Validate Schedule Against Constraints

**Entry Criteria:**
- `time_blocked_schedule` from Phase 5b.
- Original constraints from Phase 1.
- Overbook assessment from Phase 2.

**Actions:**
1. Check for conflicts: any overlapping blocks? Flag if found.
2. Calculate recovery time percentage: (total recovery minutes / total work minutes) × 100.
3. Calculate deep work hours allocated: sum of all deep_work blocks.
4. Calculate meeting density per day: count of meeting blocks per day.
5. Assess feasibility using explicit criteria:
   - **Feasible:** No conflicts, recovery ≥20%, deep work ≥80% of estimated need, all constraints satisfied.
   - **Overloaded:** Recovery <20% OR conflicts exist OR deep work <50% of estimated need OR any day >6 hours meetings.
   - **Underutilized:** Available hours >20% unused AND no constraints require this.
6. Calculate feasibility details:
   - overbook_percentage: (total scheduled hours / total available hours) × 100.
   - recovery_shortfall_hours: max(0, required_recovery - allocated_recovery).
   - deep_work_shortfall_hours: max(0, estimated_deep_work - allocated_deep_work).
7. Check against hard constraints from Phase 1 (e.g., "no meetings after 5pm", "Wednesday afternoon free").
8. Compile into `validation_report` object.

**Output:**
- `validation_report` (object, as defined in Outputs section)

**Quality Gate:**
- All constraints are checked and results documented.
- Feasibility is categorized as feasible, overloaded, or underutilized with specific metrics.
- Any conflicts or shortfalls are documented with quantified impact.

---

### Phase 7: Optimize and Rebalance

**Entry Criteria:**
- `validation_report` from Phase 6 indicates issues (conflicts, overload, shortfall) OR schedule is already feasible.

**Actions:**
1. If no issues found, proceed to Phase 8 with current schedule.
2. If conflicts exist: resolve by moving flexible meetings to available slots or adjusting deep work block times. Document each move in optimization_notes.
3. If overloaded days (>6 hours meetings): move flexible meetings to lighter days or extend across multiple days. Document in optimization_notes.
4. If insufficient recovery (<20%): reduce meeting duration (if negotiable) or extend deep work blocks into fewer, longer sessions. Document in optimization_notes.
5. If deep work shortfall (>20% of estimated need unallocated): consolidate meetings, reduce meeting count, or extend week scope. If impossible, flag as "requires scope adjustment" in optimization_notes.
6. If any constraint is violated: adjust schedule to restore compliance. Document in optimization_notes.
7. After each adjustment, re-validate using Phase 6 logic.
8. Perform up to 2 optimization passes. After pass 2, if feasibility is still <80% (i.e., overloaded or shortfall remains), flag as "requires scope negotiation" and proceed to Phase 8 with best feasible schedule.
9. Compile into `optimized_schedule` array and `optimization_notes` array.

**Output:**
- `optimized_schedule` (array of objects, same structure as time_blocked_schedule)
- `optimization_notes` (array of strings, documenting specific changes made)

**Quality Gate:**
- `optimized_schedule` passes all validation checks from Phase 6 (feasible category) OR is flagged as "requires scope negotiation" with specific reasons.
- All hard constraints are satisfied.
- Recovery time percentage ≥20% OR is documented as impossible without scope reduction.
- Deep work hours ≥80% of estimated need OR is documented as impossible without scope reduction.
- Every optimization change is documented in optimization_notes.

---

### Phase 8: Generate Calendar-Ready Output

**Entry Criteria:**
- `optimized_schedule` from Phase 7 (feasible or flagged as requiring scope negotiation).
- `calendar_format` input is specified.

**Actions:**
1. Transform `optimized_schedule` into calendar event objects:
   - For JSON format: array of objects with title, start_datetime (ISO 8601), end_datetime, category, description, color.
   - For ICS format: generate valid iCalendar format (RFC 5545) with VEVENT entries.
2. Add metadata to each event:
   - Description: include task name, focus level (if deep work), or meeting notes.
   - Color: use color_code from optimized_schedule.
   - Category: use CATEGORIES field (ICS) or category field (JSON).
3. Validate JSON output: all required fields present, datetimes in ISO 8601 format, no overlapping events.
4. Validate ICS output: RFC 5545 compliance (VEVENT structure, DTSTART/DTEND format, proper escaping).
5. If format is "both": generate both JSON and ICS, return as object with keys `json` and `ics`.
6. If validation fails on both formats, return JSON as fallback and include error_log.
7. Compile into `calendar_output`.

**Output:**
- `calendar_output` (string or object, depending on format)
- `validation_errors` (array of strings, if any)

**Quality Gate:**
- Output is valid JSON or ICS (or both).
- All events from `optimized_schedule` are present.
- Datetimes are correctly formatted and non-overlapping.
- Output can be imported into standard calendar applications (Google Calendar, Outlook, Apple Calendar).
- If validation fails, fallback format is provided with error documentation.

---

## Exit Criteria

The skill is DONE when:
1. `clarified_week_summary` captures all meetings, deadlines, and constraints from the input, with assumptions documented.
2. `deep_work_blocks` are identified, ranked by deadline, and total hours are calculated.
3. `recovery_allocation` is calculated and distributed across the week.
4. `validation_report` categorizes schedule as feasible, overloaded, or underutilized with specific metrics (recovery %, deep work hours, meeting density).
5. `optimized_schedule` is generated and either passes all validation checks (feasible) or is flagged as "requires scope negotiation" with documented reasons.
6. `calendar_output` is generated in the requested format and is valid for import into standard calendar applications.
7. `optimization_notes` documents all changes made during optimization (or is empty if no changes were needed).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Week description is too vague (e.g., "I have a busy week") | **Adjust** -- ask for specific meetings, deadlines, and time estimates. Provide a template: "List each meeting (title, duration, day), each deadline (task, due date, hours needed), and top 3 priorities." |
| Phase 2 | Identified commitments exceed available work hours by >50% (overbook >150%) | **Adjust** -- flag as "overbooked week" and ask user to prioritize or defer tasks. Generate a "minimum viable schedule" with only fixed meetings and top-priority deep work. |
| Phase 3 | Deep work blocks cannot fit within the week (total deep work hours > available hours after meetings) | **Adjust** -- reduce deep work duration estimates, extend deep work into fewer, longer blocks, or suggest deferring lower-priority tasks to next week. |
| Phase 4 | Recovery time calculation results in <10% of work hours | **Adjust** -- increase recovery_ratio or reduce meeting hours. Flag as "unsustainable" and recommend renegotiating meeting load. |
| Phase 5a | Fixed meetings conflict with existing_events | **Adjust** -- ask user to confirm meeting times or mark some as flexible. Generate alternative schedule with conflicting meetings flagged for rescheduling. |
| Phase 6 | Validation fails on multiple fronts (conflicts, overload, shortfall) | **Adjust** -- generate a "trade-off analysis" showing 3 alternative schedules: (a) all meetings, minimal deep work (show recovery %, deep work hours, constraint violations); (b) deep work protected, some meetings deferred (show same metrics); (c) recovery prioritized, aggressive meeting density (show same metrics). Ask user to choose. |
| Phase 7 | Optimization cannot resolve conflicts after 2 iterations (feasibility <80%) | **Adjust** -- flag as "requires scope negotiation" and return the best feasible schedule with a note: "This week cannot accommodate all requested meetings and deep work. Recommend deferring [task] or rescheduling [meeting]." Include specific suggestions. |
| Phase 8 | Calendar output format is invalid (JSON parse error or ICS RFC violation) | **Retry** -- regenerate with stricter validation: validate JSON against schema (all required fields, correct types, ISO 8601 datetimes); validate ICS against RFC 5545 (VEVENT structure, proper escaping). If both fail, return JSON as fallback with error_log documenting validation failures. |

---

## Reference Section

### Domain Knowledge: Time Blocking Principles

**Deep Work Protection:**
- Deep work blocks should be ≥90 minutes for meaningful progress (Csikszentmihalyi, flow state).
- Optimal deep work times vary by individual; respect user's stated preference (morning, afternoon, flexible).
- Avoid fragmenting deep work into multiple short blocks; consolidate into fewer, longer sessions.

**Meeting Density Heuristic:**
- Days with >6 hours of meetings are high-density and leave little room for deep work or recovery.
- Ideal meeting load: 3-4 hours per day, leaving 4-5 hours for deep work and recovery.
- Cluster meetings on specific days (e.g., "meeting days" Mon/Wed/Fri) to protect deep work time on other days.

**Recovery Ratio:**
- Default recovery_ratio of 0.33 (1 hour recovery per 3 hours of meetings) is evidence-based (Loehr & Schwartz, "The Power of Full Engagement").
- Adjust upward for high-stress weeks or roles requiring sustained focus.
- Recovery includes: breaks between meetings, lunch, end-of-day buffer, and wellness time.

**Constraint Hierarchy:**
1. Hard constraints (non-negotiable): fixed meetings, deadlines, personal commitments.
2. Soft constraints (negotiable): preferred deep work times, recovery time, meeting clustering.
3. Optimization goals: balance daily load, protect deep work, maximize recovery.

**Calendar Color Coding:**
- Blue: meetings (external or internal, synchronous).
- Green: deep work (focus time, no interruptions).
- Yellow: recovery (breaks, buffers, transitions).
- Purple: personal commitments (appointments, errands, family time).
- Orange: meals (lunch, breakfast if blocked).

### Decision Criteria: When to Flag as Overbooked

- Total meeting hours + deep work hours + personal hours > available work hours → overbooked.
- Overbook percentage > 100% → flag as overbooked with specific percentage.
- Any day with >7 hours of scheduled time (excluding lunch) → overloaded.
- Deep work hours < 50% of estimated need → deep work shortfall.
- Recovery time < 20% of total work time → insufficient recovery.

### Optimization Strategies

1. **Meeting Consolidation:** Group multiple short meetings into a single "meeting block" (e.g., 2-3 back-to-back meetings with 5-min breaks).
2. **Deep Work Consolidation:** Merge two 1-hour deep work blocks into one 2-hour block (reduces context-switching overhead).
3. **Meeting Deferral:** Move flexible meetings to the following week if current week is overbooked.
4. **Scope Reduction:** Reduce estimated hours for lower-priority tasks.
5. **Constraint Relaxation:** Ask user to confirm whether certain meetings are truly fixed or can be rescheduled.

### Checklist: Before Finalizing Schedule

- [ ] All fixed meetings are placed and non-overlapping.
- [ ] All deadlines have corresponding deep work blocks (or are flagged as impossible).
- [ ] Lunch is protected (60 min, typically 12-1pm).
- [ ] Recovery time is ≥20% of total work time.
- [ ] Deep work blocks are ≥90 minutes and in preferred time slots.
- [ ] No day exceeds work_hours_end.
- [ ] All hard constraints are satisfied.
- [ ] Daily meeting density is ≤6 hours (or flagged as high-density).
- [ ] Calendar output is valid and importable.
- [ ] Optimization notes document all changes made.

---

**Version:** 1.1
**Last Updated:** 2024
**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.