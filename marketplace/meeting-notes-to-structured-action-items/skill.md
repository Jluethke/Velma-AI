# Meeting Notes to Structured Action Items

**One-line description:** Convert meeting notes into structured action items with assigned owners, deadlines, and follow-up reminders, flagging any ambiguities for review.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `meeting_notes` (string, required): Raw meeting notes in any text format (plain text, markdown, or structured). Should include attendees, decisions, and discussions.
- `attendee_list` (array of strings, optional): List of meeting attendee names in format ["FirstName LastName", ...]. If not provided, will be extracted from notes.
- `default_reminder_days_before` (number, optional, default: 1): Number of days before deadline to trigger reminder. Must be >= 0.
- `timezone` (string, optional, default: "UTC"): IANA timezone identifier (e.g., "America/New_York", "Europe/London") for deadline interpretation and conversion.

## Outputs

- `action_items` (array of objects): Structured action items, each containing:
  - `id` (string): Unique identifier in format "ACTION-NNN"
  - `description` (string): Clear, specific description of the action (imperative verb + object)
  - `owner` (string): Assigned owner name or "unassigned" if not determinable
  - `deadline` (string): ISO 8601 date (YYYY-MM-DD) or relative timeframe (e.g., "next Friday")
  - `reminder_date` (string or null): ISO 8601 date when reminder should trigger, or null if deadline is ambiguous
  - `priority` (string): "high", "medium", "low", or "requires_clarification"
  - `ambiguity_flags` (array of strings): List of flagged ambiguities (see Reference section for categories)
- `ambiguities_summary` (object): Aggregated ambiguity data:
  - `total_flagged_items` (number): Count of action items with at least one flag
  - `by_type` (object): Count of each ambiguity type (e.g., {"missing_owner": 2, "ambiguous_deadline": 1})
  - `items_requiring_clarification` (array of strings): IDs of action items marked "requires_clarification"
- `processing_notes` (string): Summary of processing decisions, assumptions made, and any notes on ambiguity resolution

---

## Execution Phases

### Phase 1: Parse and Validate Meeting Notes

**Entry Criteria:**
- Meeting notes are provided as a non-empty string
- Notes are in a readable text format (plain text, markdown, or structured)

**Actions:**
1. Read the full meeting notes text and verify it is not empty or corrupted
2. If attendee_list is not provided, scan notes for person names and extract candidate attendees
3. Segment notes into logical sections by identifying structural markers (headers, line breaks, bullet points, or topic transitions)
4. Verify that notes contain at least one sentence with action-oriented language ("will", "should", "must", "needs to", "action", "task")

**Output:**
- Parsed meeting structure with identified sections and extracted attendee list
- Validation status: "pass" or "fail" with reason

**Quality Gate:**
- Validation status is "pass" (notes are legible and contain at least one action-oriented statement)
- Attendee list is non-empty (either provided or extracted)
- Parsed sections are identifiable and non-empty

---

### Phase 2: Extract Candidate Action Items

**Entry Criteria:**
- Meeting notes have passed validation in Phase 1
- Attendee list is available

**Actions:**
1. Scan notes for action-oriented language patterns: "will", "should", "must", "needs to", "to do", "action", "task", "assigned"
2. For each match, extract the complete sentence or phrase containing the action verb
3. Preserve original wording and note the source location (section, line reference) to enable traceability
4. Exclude meta-statements (e.g., "we discussed the timeline") unless they contain an explicit action verb
5. If no action items are found, record this as a processing note and continue with empty list

**Output:**
- List of raw action item candidates (unstructured phrases or sentences)
- Source references (section and line numbers) for each candidate

**Quality Gate:**
- Each candidate is a complete phrase or sentence containing an action verb
- Source references are accurate and traceable
- If no candidates found, this is recorded explicitly (not treated as failure)

---

### Phase 3: Assign Owners

**Entry Criteria:**
- Candidate action items are extracted
- Attendee list is available

**Actions:**
1. For each action item, examine the surrounding context (same sentence, previous sentence, same paragraph) for owner indicators
2. Apply owner assignment rules in order of precedence:
   - **Explicit assignment:** "John will X" or "assigned to Sarah" → owner = John or Sarah
   - **Role-based assignment:** "The PM should X" → resolve to specific PM name if known; otherwise flag as ambiguous
   - **Collective assignment:** "We need to X" or "The team should X" → flag as ambiguous, record the collective reference
   - **No assignment:** If no owner mentioned → mark as "unassigned" and flag
3. Match owner names against the attendee list; if name is not in list, flag as "unclear_owner"
4. Record the assignment method (explicit/role-based/collective/none) for reference

**Output:**
- Action items with assigned owner field (name, "unassigned", or role reference)
- Ambiguity flags for unclear or missing owners
- Assignment method metadata for each item

**Quality Gate:**
- Every action item has an owner field (either a name, role reference, or "unassigned")
- All ambiguous assignments are flagged with specific reason
- Assignment method is recorded for traceability

---

### Phase 4: Extract and Infer Deadlines

**Entry Criteria:**
- Action items have assigned owners

**Actions:**
1. For each action item, scan the item text and surrounding context (same paragraph, next sentence) for deadline indicators
2. Classify deadline mentions into categories:
   - **Absolute dates:** "2024-01-15", "January 15", "next Friday", "end of month"
   - **Relative timeframes:** "in 3 days", "next week", "by EOD"
   - **Implicit deadlines:** "before the next meeting" (calculate from meeting schedule if available)
   - **Vague timeframes:** "soon", "ASAP", "later", "when possible"
3. For absolute and relative dates, convert to ISO 8601 format (YYYY-MM-DD) using the provided timezone and meeting date as reference point
4. For implicit deadlines, use the next meeting date if available; otherwise flag as ambiguous
5. For vague timeframes, flag as "ambiguous_deadline" and record the original phrase
6. If no deadline is mentioned, flag as "missing_deadline"

**Output:**
- Action items with deadline field (ISO 8601 date string or relative timeframe)
- Ambiguity flags for missing or vague deadlines
- Deadline classification metadata (absolute/relative/implicit/vague)

**Quality Gate:**
- Every action item has a deadline field (either a date, relative timeframe, or null with flag)
- All vague or missing deadlines are flagged with specific reason
- Deadline classification is recorded for reference

---

### Phase 5: Determine Reminder Schedule

**Entry Criteria:**
- Action items have deadlines

**Actions:**
1. For each action item with a valid, unambiguous deadline (ISO 8601 date):
   - Calculate reminder date by subtracting `default_reminder_days_before` from the deadline
   - Ensure reminder date is in the future (after current date)
   - If reminder date is in the past, set reminder_date to null and flag as "reminder_cannot_be_scheduled"
2. If the action item text explicitly mentions a reminder preference ("remind me 2 days before", "check in on Monday"), use that interval instead of the default
3. For action items with ambiguous or missing deadlines, set reminder_date to null (do not calculate)
4. Record the reminder calculation method (default/explicit preference) for reference

**Output:**
- Action items with reminder_date field (ISO 8601 date or null)
- Flags for items where reminder cannot be scheduled
- Reminder calculation metadata

**Quality Gate:**
- All valid, unambiguous deadlines have a corresponding reminder_date in the future
- All reminder dates are before their corresponding deadlines
- Items with ambiguous deadlines have reminder_date set to null

---

### Phase 6: Flag Ambiguities and Assess Priority

**Entry Criteria:**
- All action items have owners, deadlines, and reminders

**Actions:**
1. Compile all ambiguity flags from previous phases into the ambiguity_flags array for each item. Recognized categories:
   - `missing_owner`: No owner assigned
   - `unclear_owner`: Owner name not in attendee list
   - `missing_deadline`: No deadline mentioned
   - `ambiguous_deadline`: Vague timeframe ("soon", "ASAP", etc.)
   - `unclear_scope`: Action description is vague or incomplete
   - `past_deadline`: Deadline is before meeting date
   - `unparseable_deadline`: Deadline format cannot be interpreted
   - `reminder_cannot_be_scheduled`: Calculated reminder date is in the past
2. Infer priority level for each action item based on context:
   - **High:** Item is mentioned multiple times in notes, explicitly marked as urgent, has deadline < 3 days, or is blocking other work
   - **Medium:** Standard action item with clear deadline (3-14 days), clear owner, and clear scope
   - **Low:** Nice-to-have item, deadline > 14 days, or explicitly marked as non-urgent
   - **Requires_clarification:** Item has 2 or more critical ambiguities (missing owner, missing deadline, unclear scope)
3. Create ambiguities_summary object with total_flagged_items count, by_type breakdown, and list of items requiring clarification

**Output:**
- Action items with priority field and complete ambiguity_flags array
- ambiguities_summary object with counts and lists

**Quality Gate:**
- Every action item has a priority level
- All ambiguities from previous phases are documented in ambiguity_flags
- ambiguities_summary counts match the flagged items in the array

---

### Phase 7: Format and Output Structured Action Items

**Entry Criteria:**
- All action items are complete with owners, deadlines, reminders, priorities, and flags

**Actions:**
1. Assign unique IDs to each action item in sequence: "ACTION-001", "ACTION-002", etc.
2. Validate each action item against the output schema:
   - id: non-empty string matching pattern "ACTION-NNN"
   - description: non-empty string with imperative verb
   - owner: non-empty string (name, role, or "unassigned")
   - deadline: non-empty string (ISO 8601 date or relative timeframe)
   - reminder_date: ISO 8601 date or null
   - priority: one of ["high", "medium", "low", "requires_clarification"]
   - ambiguity_flags: array of strings from recognized categories
3. Format action items as a JSON array
4. Create processing_notes summary documenting:
   - Total number of action items extracted
   - Meeting date (if determinable from notes)
   - Timezone used for deadline conversion
   - Default reminder days applied
   - Any assumptions made (e.g., attendee list extracted from notes)
   - Summary of ambiguity resolution approach
5. Verify output is valid JSON and all required fields are present

**Output:**
- `action_items` array (JSON, sorted by deadline then priority)
- `ambiguities_summary` object
- `processing_notes` string

**Quality Gate:**
- Output is valid JSON parseable by standard JSON parsers
- All required fields are present in each action item
- ambiguities_summary.by_type counts match actual flags in action_items
- ambiguities_summary.items_requiring_clarification IDs match items with priority="requires_clarification"

---

## Exit Criteria

The skill is complete when:
1. All action items identifiable in the meeting notes have been extracted and structured (completeness verified by: no additional action verbs found in unprocessed sections)
2. Each action item has all required fields: id, description, owner, deadline, reminder_date, priority, ambiguity_flags
3. All ambiguities have been flagged and documented in ambiguity_flags arrays
4. Output is formatted as valid JSON with all required fields present
5. A person unfamiliar with the original meeting could review the structured output and understand all action items, their owners, deadlines, and any ambiguities requiring clarification
6. ambiguities_summary accurately reflects all flagged items and provides actionable guidance for follow-up

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Meeting notes are empty or unreadable (corrupted encoding, binary data) | **Abort** -- return error message: "Input is not valid meeting notes. Please provide readable text, markdown, or structured format." |
| Phase 1 | Attendee list cannot be extracted and not provided as input | **Adjust** -- proceed with empty attendee list, flag all owners as "unclear_owner" in Phase 3, note assumption in processing_notes |
| Phase 1 | Notes do not contain any action-oriented language | **Adjust** -- return empty action_items array with processing_notes: "No action items identified in meeting notes. Verify notes contain decisions or assignments." |
| Phase 2 | No action items can be extracted despite action-oriented language present | **Adjust** -- return empty action_items array, note in processing_notes that action verb detection may need manual review |
| Phase 3 | Owner name does not match attendee list | **Adjust** -- assign owner to stated name, flag as "unclear_owner", include in ambiguities_summary |
| Phase 3 | Multiple owners mentioned for single action (e.g., "John and Sarah will...") | **Adjust** -- assign to first mentioned owner, flag as "unclear_owner", note in ambiguity_flags: "multiple_owners_mentioned" |
| Phase 4 | Deadline is in the past (before meeting date) | **Adjust** -- flag as "past_deadline", set priority to "requires_clarification", include in ambiguities_summary |
| Phase 4 | Deadline format is non-standard (e.g., "Q2 2024", "fiscal year end") | **Adjust** -- attempt to parse using common business date formats; if unsuccessful, flag as "unparseable_deadline", record original phrase |
| Phase 5 | Calculated reminder date is in the past | **Adjust** -- set reminder_date to null, flag as "reminder_cannot_be_scheduled", note in processing_notes |
| Phase 6 | Action item has 2+ critical ambiguities (missing owner AND missing deadline) | **Adjust** -- mark priority as "requires_clarification", include all flags, add to items_requiring_clarification list |
| Phase 7 | Output exceeds reasonable size (more than 50 action items) | **Adjust** -- include all items in output, add note to processing_notes: "Large number of action items detected. Consider splitting into multiple meetings or grouping by owner for clarity." |
| Phase 7 | JSON validation fails (malformed output structure) | **Abort** -- return error message with validation details; do not return partial output |
| Phase 7 | User rejects final output | **Targeted revision** -- ask which action item, owner assignment, or deadline fell short and rerun only that extraction phase. Do not re-process the full meeting notes. |

---

## Reference Section: Domain Knowledge and Decision Criteria

### Owner Assignment Rules

| Pattern | Example | Action | Flag? |
|---------|---------|--------|-------|
| Explicit assignment | "John will X" or "assigned to Sarah" | owner = John or Sarah | No, unless name not in attendee list |
| Role-based assignment | "The PM should X" or "Engineering lead needs to" | Resolve to specific person if known; otherwise owner = role reference | Yes if cannot resolve to person |
| Collective assignment | "We need to X" or "The team should X" | owner = "unassigned" or record collective reference | Yes, always flag as ambiguous |
| Implicit assignment | "This needs to be done" (no owner mentioned) | owner = "unassigned" | Yes, always flag as missing_owner |
| Conditional assignment | "John or Sarah should X" | owner = first mentioned person | Yes, flag as unclear_owner |

### Deadline Interpretation

| Category | Example | Conversion | Flag? |
|----------|---------|-----------|-------|
| Absolute dates | "2024-01-15", "January 15" | Convert to ISO 8601 (YYYY-MM-DD) | No, unless date is in past |
| Relative dates | "next Friday", "in 3 days" | Calculate from meeting date using timezone | No, unless result is in past |
| Implicit deadlines | "before the next meeting" | Use next meeting date if available | Yes, if next meeting date unknown |
| Business timeframes | "end of month", "end of quarter" | Calculate last day of period | No, unless result is in past |
| Vague timeframes | "soon", "ASAP", "later", "when possible" | Do not convert; flag as ambiguous | Yes, always flag as ambiguous_deadline |
| No deadline mentioned | (none) | Set to null | Yes, always flag as missing_deadline |

### Priority Inference Rules

| Priority | Criteria | Examples |
|----------|----------|----------|
| High | Mentioned 2+ times in notes, OR explicitly marked urgent, OR deadline < 3 days, OR blocks other work | "Critical bug fix needed ASAP", "Blocker for launch", "Due tomorrow" |
| Medium | Clear deadline (3-14 days), clear owner, clear scope, standard action item | "Review proposal by Friday", "Send report next week" |
| Low | Nice-to-have, deadline > 14 days, explicitly marked non-urgent | "Consider for next quarter", "Nice to have by end of month" |
| Requires_clarification | 2+ critical ambiguities (missing owner, missing deadline, unclear scope) | "Someone should look into the database issue sometime" |

### Ambiguity Categories

| Category | Definition | Example | Resolution |
|----------|-----------|---------|------------|
| `missing_owner` | No owner assigned or only collective reference | "We need to fix the bug" | Clarify with meeting organizer |
| `unclear_owner` | Owner name not in attendee list | "John will do it" (John not in attendees) | Verify name spelling or attendee list |
| `missing_deadline` | No deadline mentioned | "John will review the proposal" | Suggest default deadline (e.g., 1 week) |
| `ambiguous_deadline` | Vague timeframe without specific date | "Review soon", "ASAP" | Request specific date from owner |
| `unclear_scope` | Action description is vague or incomplete | "Improve performance" | Request specific success criteria |
| `past_deadline` | Deadline is before meeting date | "Due yesterday" | Clarify intended deadline |
| `unparseable_deadline` | Deadline format cannot be interpreted | "Q2 2024", "fiscal year end" | Request ISO 8601 date or relative timeframe |
| `reminder_cannot_be_scheduled` | Calculated reminder date is in the past | Deadline is tomorrow, reminder would be today (past) | Adjust reminder days or deadline |
| `multiple_owners_mentioned` | Multiple people mentioned for single action | "John and Sarah should review" | Clarify primary owner |

### Default Assumptions

- **Timezone:** If not provided, assume UTC. All deadline conversions use this timezone.
- **Reminder timing:** If not specified, remind 1 day before deadline. If deadline is < 1 day away, set reminder_date to null and flag.
- **Priority:** If no context clues, assign "medium" priority.
- **Attendee list:** If not provided, extract from notes by identifying capitalized names. If extraction fails, proceed with empty list and flag all owners as "unclear_owner".
- **Meeting date:** If not explicitly stated in notes, use current date as reference for relative deadline calculations. Document this assumption in processing_notes.
- **Action verb detection:** Recognize: will, should, must, needs to, to do, action, task, assigned, responsible for, owner, due, deadline, complete, finish, deliver, send, create, review, approve, update, fix, implement, plan, schedule, coordinate, communicate, document, analyze, evaluate, test, deploy, release, launch, monitor, track, report, follow up.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.