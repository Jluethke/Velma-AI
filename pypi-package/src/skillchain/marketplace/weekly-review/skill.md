# Weekly Review

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for a structured weekly reflection. Takes last week's goals, what actually happened, wins, frustrations, and next week's priorities, then produces: achievement summary, lessons learned, pattern detection, energy audit, and next week's top 3 priorities with rationale. Fork this for: team retros, sprint reviews, personal journals, project post-mortems.

## Execution Pattern: ORPA Loop

```
OBSERVE  --> Collect what happened this week (facts, not feelings yet)
REASON   --> Analyze patterns, gaps, and energy signals
PLAN     --> Define next week's priorities based on the analysis
ACT      --> Produce the review document and commitment list
LOOP     --> Weekly cadence; each review references the prior week's plan
```

## Inputs

- `last_week_goals`: string[] -- What you planned to accomplish last week (from previous review if available).
- `what_happened`: string -- Free-form description of what you actually did, key events, surprises.
- `wins`: string[] -- Things that went well, accomplishments, progress.
- `frustrations`: string[] -- Things that went poorly, blockers, annoyances.
- `energy_notes`: string (optional) -- What energized you vs. drained you this week.
- `prior_review`: object (optional) -- Last week's review output for pattern tracking.
- `context`: string (optional) -- Role, current projects, time horizon for goals.

## Outputs

- `achievement_summary`: string -- 3-5 sentence highlight reel of the week.
- `goal_scorecard`: object[] -- Each planned goal with status: completed, partial, missed, pivoted.
- `lessons_learned`: string[] -- 2-4 specific takeaways from this week's experience.
- `pattern_report`: object -- Recurring themes across this and prior reviews (if prior_review provided).
- `energy_audit`: object -- What drained vs. energized, with trend over time.
- `next_week_priorities`: object[] -- Top 3 priorities with rationale, success criteria, and estimated effort.
- `commitment_statement`: string -- One sentence: "This week I will focus on X because Y."

---

## Execution

### OBSERVE -- Gather the Facts

**Actions:**

1. List every planned goal from last_week_goals. For each, determine status:
   - **Completed**: fully done, deliverable shipped or objective met.
   - **Partial**: started but not finished. Note what remains.
   - **Missed**: not started. Identify why (deprioritized, blocked, forgot, overwhelmed).
   - **Pivoted**: replaced by something more important. Note what replaced it and why.
2. From what_happened, extract concrete events and outcomes. Strip adjectives — focus on what was done, not how it felt.
3. From wins, identify the root cause of each win: was it skill, effort, luck, or teamwork? This determines if it is repeatable.
4. From frustrations, identify the root cause of each frustration: was it within your control, partially within your control, or external?

**Output:** Goal scorecard with statuses, event timeline, win analysis, frustration analysis.

**Quality gate:** Every goal has a status. Every win and frustration has a root cause classification. Events are factual, not emotional.

---

### REASON -- Find the Patterns

**Actions:**

1. **Goal completion rate**: what percentage of planned goals were completed? Compare to prior weeks if prior_review is available. Is the trend improving, stable, or declining?
2. **Miss pattern analysis**: are the same types of goals being missed repeatedly? (e.g., always missing deep work goals because meetings take over). If prior_review is available, compare miss reasons.
3. **Energy audit**: from energy_notes and frustrations, categorize activities as:
   - **Energizing**: activities that left you more motivated after doing them.
   - **Draining**: activities that depleted your motivation or focus.
   - **Neutral**: necessary but neither energizing nor draining.
   - Calculate the ratio. A week below 30% energizing is unsustainable.
4. **Insight extraction**: from wins and frustrations, identify 2-4 lessons learned. A lesson is actionable: "I learned X, so next time I will Y." Not: "Things were hard."
5. **Trend detection**: if prior_review exists, identify themes that appear 2+ weeks in a row. Flag them as systemic (needs a structural fix, not more willpower).

**Output:** Completion rate with trend, miss patterns, energy audit with ratio, lessons learned, trend flags.

**Quality gate:** Lessons are actionable (each contains "so I will" or equivalent). Energy ratio is calculated. If prior_review exists, at least one trend is identified or explicitly noted as "no recurring patterns."

---

### PLAN -- Set Next Week's Priorities

**Actions:**

1. Review lessons learned and pattern flags. Any structural issue identified should have a priority addressing it.
2. Select the top 3 priorities for next week. Each priority has:
   - **What**: specific, concrete outcome (not "work on project X" but "ship the login flow and write tests").
   - **Why**: connects to a larger goal, addresses a pattern, or capitalizes on momentum.
   - **Success criteria**: how you know it is done. Binary, not subjective.
   - **Estimated effort**: hours or percentage of the week.
   - **Risk**: what could prevent completion and the mitigation plan.
3. Validate capacity: do the 3 priorities fit within the available time? Account for recurring commitments (meetings, admin, standup). If total estimated effort exceeds 60% of available hours, cut the lowest priority or reduce scope.
4. Identify one thing to STOP doing: based on the energy audit and pattern analysis, name one activity to eliminate, delegate, or reduce next week.
5. Write the commitment statement: "This week I will focus on [top priority] because [reason from analysis]."

**Output:** Top 3 priorities with full structure, one thing to stop, commitment statement.

**Quality gate:** Priorities have success criteria, not vague descriptions. Total effort does not exceed 60% of available time. The "stop doing" item is specific and actionable.

---

### ACT -- Produce the Review

**Actions:**

1. Write the achievement summary: 3-5 sentences capturing the week's highlights. Lead with the best win. Mention the completion rate. End with the forward-looking commitment.
2. Assemble the full review document in order: achievement summary, goal scorecard, lessons learned, pattern report, energy audit, next week priorities, commitment statement.
3. If prior_review was provided, update the running pattern tracker: add this week's data to the trend analysis.
4. Format for readability: use bullet points for lists, bold for priority names, and keep the total review under 500 words.

**Output:** Complete weekly review document, updated pattern tracker.

**Quality gate:** Review is under 500 words. All sections are present. Commitment statement is a single sentence. Priorities are forward-looking, not rehashed goals from last week (unless explicitly carried over with justification).

---

## Exit Criteria

The skill is DONE when:
- Every planned goal has a status (completed, partial, missed, pivoted)
- 2-4 actionable lessons are documented
- Energy audit ratio is calculated
- Top 3 next-week priorities have success criteria and effort estimates
- A commitment statement is written
- The full review is under 500 words

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No last_week_goals provided (first-ever review) | **Adjust** -- skip goal scorecard, focus on wins/frustrations analysis, set baseline priorities |
| OBSERVE | Wins and frustrations lists are both empty | **Adjust** -- extract events from what_happened and classify them as wins or frustrations |
| REASON | Prior review not available for pattern detection | **Adjust** -- skip trend analysis, note that patterns will emerge after 3+ consecutive reviews |
| PLAN | All 3 priorities are carryovers from last week | **Adjust** -- flag this as a "stuck" pattern, suggest reducing scope or eliminating blockers before re-committing |
| ACT | Review exceeds 500 words | **Adjust** -- cut the least actionable lessons and merge overlapping priorities |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
