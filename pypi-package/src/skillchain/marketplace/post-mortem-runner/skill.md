# Post-Mortem Runner

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for running a structured post-mortem on anything that went wrong (or right). Takes the incident/event description, timeline, people involved, and outcome, then produces: root cause analysis (5 whys), contributing factors, what worked well, what failed, action items with owners, and a one-paragraph stakeholder summary. Blameless by design. Fork this for: incident response, project failures, lost deals, product launches, event reviews.

## Execution Pattern: Phase Pipeline

```
PHASE 1: GATHER     --> Collect the facts and build the timeline
PHASE 2: ANALYZE    --> Identify root causes and contributing factors
PHASE 3: EXTRACT    --> Determine what worked, what failed, and lessons learned
PHASE 4: COMMIT     --> Produce action items, stakeholder summary, and the final report
```

## Inputs

- `event_description`: string -- What happened, in plain language. Can be an incident, a project outcome, a lost deal, a launch, or any significant event.
- `event_outcome`: string -- The result: what was the actual outcome vs. the expected outcome?
- `timeline`: object[] (optional) -- Chronological events: { timestamp, description, actor }. If not provided, the skill will construct one from the description.
- `people_involved`: string[] (optional) -- Names or roles of people involved (for assigning action items, not for blame).
- `severity`: string (optional) -- "low", "medium", "high", "critical" (default: inferred from outcome).
- `event_type`: string (optional) -- "incident", "project", "deal", "launch", "event", "process_failure" (default: inferred).

## Outputs

- `post_mortem_report`: object -- Complete report with all sections.
- `root_cause_chain`: object[] -- The 5 Whys chain from symptom to root cause.
- `action_items`: object[] -- Each with: description, owner, deadline, priority.
- `stakeholder_summary`: string -- One paragraph suitable for executive communication.
- `prevention_checklist`: string[] -- Steps to prevent recurrence.

---

## Execution

### Phase 1: GATHER -- Build the Factual Record

**Entry criteria:** Event description and outcome are provided.

**Actions:**

1. Establish the timeline. If provided, validate it for completeness. If not provided, extract chronological events from the description:
   - **Detection**: when was the problem/event first noticed? By whom?
   - **Escalation**: when were additional people brought in?
   - **Response**: what actions were taken and when?
   - **Resolution**: when was the situation resolved or the outcome finalized?
   - **Duration**: total time from detection to resolution.

2. Identify the gap between expected and actual outcome. Quantify it if possible (e.g., "expected 99.9% uptime, actual was 94.2%" or "expected to close the deal, lost to competitor on price").

3. List all people involved and their roles during the event. Note: this is NOT about who is to blame — it is about understanding who had what information and what authority at each point.

4. Classify the severity if not provided:
   - **Critical**: customer-facing impact, data loss, financial loss, safety risk.
   - **High**: significant delay, major rework, lost opportunity.
   - **Medium**: noticeable impact, workaround available.
   - **Low**: minor inconvenience, cosmetic issue.

5. Set the blameless tone: document facts and decisions, not judgments. "The deployment was pushed at 4 PM on Friday" is a fact. "The deployment was irresponsibly pushed" is a judgment. Facts only.

**Output:** Validated timeline, outcome gap, people/roles map, severity classification.

**Quality gate:** Timeline has at least 4 entries (detection, escalation, response, resolution). Outcome gap is quantified or clearly described. All entries are factual, not judgmental.

---

### Phase 2: ANALYZE -- Find Root Causes

**Entry criteria:** Factual record is complete.

**Actions:**

1. Run the **5 Whys** from the outcome gap:
   - Why 1: Why did the [negative outcome] happen? Answer with the most direct cause.
   - Why 2: Why did [Why 1 answer] happen?
   - Why 3: Why did [Why 2 answer] happen?
   - Why 4: Why did [Why 3 answer] happen?
   - Why 5: Why did [Why 4 answer] happen?
   - The root cause is typically at Why 3-5. If you reach Why 5 and the answer is still a symptom, continue.
   - If the chain branches (multiple causes at any level), follow each branch.

2. Identify **contributing factors**: things that did not directly cause the event but made it worse or more likely. Categories:
   - **Process**: missing checklist, no review step, unclear ownership.
   - **Communication**: information not shared, wrong person notified, delayed escalation.
   - **Tooling**: monitoring gap, no alerts, inadequate testing.
   - **Knowledge**: undocumented procedure, tribal knowledge, training gap.
   - **Environment**: timing (Friday deploy, holiday weekend), resource constraints, external pressure.

3. For each contributing factor, assess: was this a one-time issue or a systemic pattern? Systemic factors are higher priority to fix.

4. Distinguish between **proximate cause** (the thing that triggered the event) and **root cause** (the underlying condition that allowed the trigger to cause harm).

**Output:** 5 Whys chain, contributing factors list with categories and systemic flags, proximate vs. root cause distinction.

**Quality gate:** 5 Whys chain reaches at least Why 3. At least 3 contributing factors identified. Root cause is distinct from proximate cause. No "why" answer assigns blame to a person.

---

### Phase 3: EXTRACT -- Lessons Learned

**Entry criteria:** Root cause analysis is complete.

**Actions:**

1. **What worked well**: identify 2-4 things that went RIGHT during the event. Even in failures, something worked — fast detection, good communication, effective workaround, calm response. Acknowledge these explicitly.

2. **What failed**: identify 3-5 things that went WRONG, tied to the root causes and contributing factors. Be specific: not "communication was bad" but "the on-call engineer was not notified for 45 minutes because the escalation path was outdated."

3. **What was lucky**: identify anything where the outcome could have been worse but was not, due to luck rather than design. Lucky breaks mask future risk — they need to be addressed so that luck is not required next time.

4. **Lessons learned**: for each failure point, write a concrete lesson. Format: "We learned that [observation], so we will [specific change]." Each lesson must be actionable and preventive, not just observational.

5. **Pattern check**: has this type of event happened before? If so, why did previous corrective actions not prevent this recurrence? This identifies action items that need teeth.

**Output:** What worked, what failed, what was lucky, lessons learned, pattern check.

**Quality gate:** At least 2 "worked well" items (blameless means acknowledging good too). Each "what failed" ties to a root cause or contributing factor. Every lesson contains a "so we will" action. Lucky items are identified as risk gaps.

---

### Phase 4: COMMIT -- Produce Deliverables

**Entry criteria:** Lessons are extracted.

**Actions:**

1. **Action items**: for each lesson learned, create an action item with:
   - **Description**: specific, concrete task.
   - **Owner**: person or team responsible (from people_involved or by role).
   - **Deadline**: when it must be done. Critical actions within 1 week, others within 30 days.
   - **Priority**: Critical (must happen before next similar event), High (within the sprint), Medium (within the quarter).
   - **Verification**: how to confirm the action was completed and effective.

2. **Prevention checklist**: distill the action items into a reusable checklist that can be run before similar events in the future. Format as yes/no questions: "Is the escalation path current? Have we tested the rollback procedure?"

3. **Stakeholder summary**: one paragraph, under 100 words, suitable for executive communication. Structure: what happened, what the impact was, what the root cause was, what is being done about it. No jargon. No blame.

4. **Full post-mortem report**: assemble all sections in order:
   - Event summary and severity
   - Timeline
   - Root cause analysis (5 Whys)
   - Contributing factors
   - What worked / what failed / what was lucky
   - Lessons learned
   - Action items table
   - Prevention checklist
   - Stakeholder summary

**Output:** Action items with owners, prevention checklist, stakeholder summary, full report.

**Quality gate:** Every lesson has a corresponding action item. Stakeholder summary is under 100 words. Action items have owners and deadlines. Prevention checklist is reusable (not event-specific).

---

## Exit Criteria

The skill is DONE when:
- A factual timeline is constructed with at least 4 entries
- The 5 Whys chain identifies a root cause distinct from the proximate cause
- At least 3 contributing factors are documented
- What worked, what failed, and what was lucky are all documented
- Every lesson has a corresponding action item with an owner and deadline
- A prevention checklist is produced
- A stakeholder summary is under 100 words
- The full report is blameless throughout

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| GATHER | No timeline provided and description lacks chronological detail | **Adjust** -- construct a minimal timeline with detection and resolution only, note gaps |
| GATHER | Blame language appears in the inputs | **Adjust** -- rewrite factual statements, strip judgmental adjectives, note the reframing |
| ANALYZE | 5 Whys chain loops back to an earlier answer | **Adjust** -- the loop indicates a systemic cycle; document it as a reinforcing pattern and address the cycle itself |
| ANALYZE | Root cause is "human error" | **Adjust** -- "human error" is never a root cause. Ask: why was the human able to make that error? What system allowed it? Dig deeper. |
| EXTRACT | Team cannot identify anything that worked well | **Adjust** -- the fact that the event was detected and is being reviewed is itself something that worked. Start there. |
| COMMIT | No people_involved provided for action item ownership | **Adjust** -- assign by role ("engineering lead", "ops team") and note that names need to be filled in |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
