# Checklist Builder

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for generating comprehensive checklists from a goal or event description. Takes the what and when, produces an ordered checklist with categories, deadlines, dependencies, and "don't forget" items sourced from common mistakes. The difference between a list and a good checklist is structure: categories, ordering, dependencies, and the items nobody thinks of until it's too late. Fork this for: event checklists, launch checklists, compliance checklists, safety checklists, QA checklists, travel packing lists, moving checklists, etc.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Understand the goal/event, timeline, constraints, past experience
REASON  --> Generate items, categorize, identify dependencies and deadlines
PLAN    --> Order items, add "don't forget" items, assign deadlines
ACT     --> Output the structured checklist with categories and timeline
     \                                                              /
      +--- Missing category or dependency found --- loop OBSERVE --+
```

## Inputs

- `goal_or_event`: string -- What the checklist is for ("Launch product X", "Move to a new apartment", "Host a wedding")
- `deadline`: string -- When it needs to be done (ISO date or relative: "in 3 weeks")
- `constraints`: list[string] -- Budget limits, team size, tool restrictions, regulatory requirements
- `experience_level`: string -- "first_time" (add extra detail and warnings) or "experienced" (concise)

## Outputs

- `checklist`: object -- Structured checklist with categories, items, deadlines, and dependencies
- `timeline`: list[object] -- Items organized by when they should be done (reverse-planned from deadline)
- `dont_forget`: list[string] -- Commonly overlooked items specific to this type of goal/event
- `dependencies`: list[object] -- Items that must be completed before other items can start

---

## Execution

### OBSERVE: Understand the Goal

**Entry criteria:** A goal or event is described.

**Actions:**
1. Parse the goal into its core deliverable. What does "done" look like? A product launched means: deployed, tested, announced, support ready. A move completed means: old place empty, new place set up, addresses updated. Make the end state concrete.
2. Identify the major workstreams. Every goal decomposes into 3-7 categories of work. A product launch has: engineering, marketing, legal, operations, support. A wedding has: venue, catering, attire, invitations, logistics. Find the natural groupings.
3. Assess the timeline. How much time is available? Work backward from the deadline: what must be done in the final week? Final month? What has the longest lead time and must start first?
4. Note constraints. Budget, team size, dependencies on external parties (vendors, approvals, deliveries), regulatory deadlines that cannot move.

**Output:** End state definition, category list, timeline assessment, constraint inventory.

**Quality gate:** End state is concrete and testable. At least 3 categories identified. Timeline has a clear deadline.

---

### REASON: Generate and Categorize Items

**Entry criteria:** Goal, categories, and timeline are defined.

**Actions:**
1. Generate items per category. For each category, brainstorm all tasks needed. Each item should be: actionable (starts with a verb), specific (not "handle marketing" but "write launch blog post"), and completable (has a clear done state).
2. Identify dependencies. Which items cannot start until another item is finished? Map these as: `{item, blocked_by, reason}`. Common dependency patterns: approvals before execution, purchases before setup, content before design, testing before launch.
3. Estimate effort per item. Quick (< 1 hour), medium (1-4 hours), large (1+ days). This helps with scheduling.
4. Generate "don't forget" items. These are the items people consistently miss for this type of goal. Sources: post-mortems from similar projects, common failure patterns, "the thing nobody thinks about until the day before." Examples: test the backup plan, update the DNS TTL a week before migration, buy extra extension cords for the event.
5. Flag critical-path items. Items where a delay directly delays the deadline. These get priority scheduling and should have buffer time.

**Output:** Categorized item list with dependencies, effort estimates, "don't forget" items, and critical-path flags.

**Quality gate:** Every item is actionable and specific. Dependencies are mapped. At least 3 "don't forget" items generated. Critical path identified.

---

### PLAN: Order and Schedule

**Entry criteria:** Items are generated with dependencies and effort estimates.

**Actions:**
1. Reverse-plan from the deadline. Start from the end state and work backward. What must be done in the last 24 hours? Last week? Last month? Place items in time buckets.
2. Respect dependencies. An item cannot be scheduled before its dependencies. If a dependency chain pushes items past the deadline, flag it immediately.
3. Add buffer. Pad critical-path items by 20-50% depending on experience level. First-timers need more buffer. External dependencies (vendor deliveries, approvals) get extra buffer because you do not control them.
4. Assign deadlines to each item. Not just the final deadline -- intermediate deadlines that keep the project on track. Format: "Do by [date] to stay on track."
5. Mark checkpoint items. Every 3-5 items, insert a checkpoint: "Stop and verify: Is everything up to this point actually done, or did you skip something?" Checklists fail when people check boxes without doing the work.

**Output:** Time-ordered checklist with deadlines, buffer, and checkpoints.

**Quality gate:** No item is scheduled before its dependencies. Critical-path items have buffer. Checkpoints are inserted every 3-5 items.

---

### ACT: Deliver the Checklist

**Entry criteria:** Checklist is ordered and scheduled.

**Actions:**
1. Output the checklist grouped by category, with items ordered by deadline within each category.
2. Output the timeline view: items organized by when they should be done (this week, next week, 2+ weeks out, etc.).
3. Output the "don't forget" section prominently -- these are the highest-value items.
4. Output the dependency map for items that are blocked.
5. Add a header with: goal, deadline, total items, estimated total effort.
6. Check for loop trigger: does the completed checklist reveal a missing category or a dependency that was not considered? If so, loop back to OBSERVE.

**Output:** Complete checklist with categories, timeline, "don't forget" section, and dependencies.

**Quality gate:** Every item has a deadline. Dependencies are respected in the ordering. "Don't forget" items are included. Checkpoints are present.

## Exit Criteria

The skill is DONE when:
1. All categories have actionable, specific items
2. Items are ordered by deadline with dependencies respected
3. "Don't forget" items are included
4. Critical-path items are identified with buffer
5. Checkpoints are inserted for progress verification

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Goal is too vague ("plan my life") | **Escalate** -- ask for a specific deliverable and deadline |
| OBSERVE | No deadline provided | **Adjust** -- ask for one, or generate a reasonable default based on scope |
| REASON | Dependency chain exceeds available time | **Flag** -- highlight the conflict, suggest items to cut, parallelize, or delegate |
| REASON | Cannot generate "don't forget" items (unfamiliar domain) | **Adjust** -- use generic "don't forget" patterns: test the plan, have a backup, communicate to stakeholders, document what you did |
| PLAN | Too many items (50+) | **Adjust** -- group into phases, deliver phase 1 checklist first with a note about subsequent phases |
| ACT | User rejects the checklist or requests significant changes | **Adjust** -- incorporate specific feedback (e.g., wrong categories, missing items, unrealistic deadlines), update the affected sections, and regenerate the timeline and ordering; do not restart from OBSERVE unless the goal or deadline fundamentally changed |
| ACT | User rejects final output | **Targeted revision** -- ask which checklist section, dependency, or deadline fell short and rerun only that section. Do not regenerate the full checklist. |

## Reference

### Checklist Item Quality Criteria

A well-formed checklist item must be:
- **Actionable**: starts with an imperative verb (Book, Write, Send, Confirm, Test, Buy, Schedule)
- **Specific**: names the exact thing to do, not a category ("Book the caterer" not "Handle catering")
- **Completable**: has an unambiguous done state that any reviewer could verify

**Red flag phrases**: "handle X", "deal with Y", "make sure Z" — these are not items, they are categories. Break them down.

### Dependency Pattern Library

Common dependency structures by goal type:

| Goal Type | Typical Dependency Chain |
|---|---|
| Product launch | Build → Test → Fix → Document → Announce |
| Event | Book venue → Confirm catering → Send invitations → Confirm RSVPs → Prepare materials |
| Move | Book movers → Pack → Transfer utilities → Update addresses → Clean old place |
| Hiring | Write job description → Post → Screen → Interview → Reference check → Offer |

### Buffer Time Guidelines

| Item Type | Recommended Buffer |
|---|---|
| External vendor or approval (you don't control) | +50–100% |
| Critical-path item (delay = project delay) | +30–50% |
| Internal task (familiar work) | +20% |
| Internal task (unfamiliar work) | +40% |
| First-time experience overall | Add 1 full category of buffer time at the end |

### Checkpoint Insertion Rule

Insert a checkpoint after every 3–5 items AND after any critical milestone. A checkpoint is:
"Stop here. Verify that everything above is actually done — not just checked, but done. Only proceed when confirmed."

## State Persistence

Between runs, this skill accumulates:
- **Category templates**: reusable category structures per goal type (launch checklists, event checklists, etc.)
- **"Don't forget" libraries**: commonly missed items per domain, growing with each use
- **Effort calibration**: actual time vs. estimated time, improving future estimates

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
