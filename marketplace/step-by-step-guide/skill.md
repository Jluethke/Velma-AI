# Step-by-Step Guide Generator

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for turning any process into a clear, numbered how-to guide. Takes a task description, skill level of the audience, and constraints, then produces a structured guide with prerequisites, steps, common mistakes, troubleshooting, and completion criteria. Fork this to create domain-specific guide generators (recipe writers, DIY tutorials, onboarding docs, assembly instructions, setup guides, etc.).

## Execution Pattern: ORPA Loop

```
OBSERVE --> Understand the task, audience skill level, and constraints
REASON  --> Decompose into ordered steps, identify prerequisites and pitfalls
PLAN    --> Structure the guide with steps, warnings, and checkpoints
ACT     --> Output the complete guide with troubleshooting appendix
     \                                                              /
      +--- Missing step or unclear instruction --- loop OBSERVE ---+
```

## Inputs

- `task_description`: string -- What the guide should teach someone to do
- `audience_level`: string -- Skill level: "beginner" (explain everything), "intermediate" (skip basics), "expert" (concise, no hand-holding)
- `constraints`: list[string] -- Limitations: tools available, time budget, environment restrictions
- `desired_outcome`: string -- What "done" looks like. The clearer this is, the better the guide.

## Outputs

- `guide`: object -- The structured guide with title, prerequisites, steps, and completion criteria
- `common_mistakes`: list[object] -- Frequent errors with symptoms and fixes
- `troubleshooting`: list[object] -- "If X happens, do Y" entries for when things go wrong
- `time_estimate`: string -- Approximate time to complete the guide

---

## Execution

### OBSERVE: Understand the Task

**Entry criteria:** A task description is provided.

**Actions:**
1. Parse the task into its core goal. Strip away context to find the atomic objective: "Install PostgreSQL on Ubuntu" not "I need a database for my app and was thinking about PostgreSQL."
2. Assess audience level. Beginner: define all terms, explain why each step matters, include screenshots/examples. Intermediate: skip setup basics, focus on the task-specific steps. Expert: just the commands/actions, no explanations unless non-obvious.
3. Identify the scope boundary. What is in-scope (this guide covers) vs. out-of-scope (assumed done or covered elsewhere). Explicit scope prevents guides from ballooning.
4. Inventory prerequisites. What must be true before step 1? Software installed, accounts created, files downloaded, permissions granted, knowledge assumed.

**Output:** Core goal statement, audience calibration, scope boundary, prerequisite list.

**Quality gate:** Goal is a single clear sentence. Prerequisites are concrete and verifiable (not "some experience with X" but "Python 3.8+ installed and on PATH").

---

### REASON: Decompose into Steps

**Entry criteria:** Goal, audience, and prerequisites are defined.

**Actions:**
1. Break the task into sequential steps. Each step should be one action that produces a visible result. A step is too big if it contains "and" -- split it. A step is too small if it has no observable output -- merge it with the next step.
2. For each step, define: the action (imperative verb: "Install", "Configure", "Run", "Verify"), the expected result (what should happen if done correctly), and the verification method (how to confirm it worked).
3. Identify decision points. Where does the user need to choose between options? Provide guidance: "If you're on Windows, do A. If macOS, do B." Never leave a fork without direction.
4. Flag danger zones. Steps where a mistake could cause data loss, security issues, or hard-to-reverse consequences. These get explicit warnings.
5. Estimate time. Add a rough time estimate per step. Sum for total. Pad by 50% for beginners, 20% for intermediates.

**Output:** Ordered step list with actions, expected results, verifications, decision points, and danger flags.

**Quality gate:** Every step has an imperative verb. Every step has a verification. Danger zones are flagged. No step contains "and" joining two distinct actions.

---

### PLAN: Structure the Guide

**Entry criteria:** Steps are decomposed and ordered.

**Actions:**
1. Write the guide header: title, one-line description, time estimate, difficulty level.
2. Write the prerequisites section. Bulleted list with verification commands where applicable ("Run `python --version` to confirm").
3. Write each step with: step number, action title, detailed instruction (calibrated to audience level), expected result, and a checkpoint ("You should now see X").
4. Insert warnings before danger-zone steps. Format: a clear caution statement explaining what could go wrong and how to avoid it.
5. Write the "You're Done When" section. 2-3 concrete criteria that confirm successful completion.
6. Compile common mistakes from the danger zones and decision points. Each: mistake description, symptoms, fix.
7. Compile troubleshooting. For each step that could fail, an "If X, then Y" entry.

**Output:** Complete structured guide document.

**Quality gate:** Every step has a checkpoint. Every danger zone has a warning. "You're Done When" criteria are concrete and testable.

---

### ACT: Deliver the Guide

**Entry criteria:** Guide is fully structured.

**Actions:**
1. Output the guide in clean, readable format. Use numbered steps, bold action titles, and indented details.
2. Output common_mistakes as a separate section.
3. Output troubleshooting as an appendix.
4. Include time_estimate at the top.
5. Check for loop trigger: does re-reading the guide reveal a missing step, an unclear instruction, or an assumed prerequisite? If so, loop back to OBSERVE.

**Output:** Final guide, common mistakes, troubleshooting appendix, time estimate.

**Quality gate:** A person at the stated audience level could follow this guide without external help. No step assumes knowledge not covered in prerequisites.

## Exit Criteria

The skill is DONE when:
1. All steps are numbered with clear imperative actions
2. Every step has a verification checkpoint
3. Prerequisites are listed and verifiable
4. "You're Done When" criteria are concrete
5. Common mistakes and troubleshooting are included

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Task description too vague | **Escalate** -- ask for the specific desired outcome |
| OBSERVE | Audience level unclear | **Adjust** -- default to intermediate, note assumptions |
| REASON | Task cannot be broken into sequential steps (parallel work required) | **Adjust** -- use grouped steps with a "do these in any order" note |
| REASON | A step requires tools/access the user may not have | **Flag** -- add to prerequisites with acquisition instructions |
| PLAN | Guide exceeds 20 steps | **Adjust** -- group related steps into sections with section headers |
| ACT | User rejects final output | **Targeted revision** -- ask which step is unclear or missing and rerun only that step's REASON-PLAN phases. Do not regenerate the full guide. |

## State Persistence

Between runs, this skill accumulates:
- **Step libraries**: reusable step sequences for common sub-tasks (e.g., "set up a virtual environment" appears in many guides)
- **Audience calibration**: what level of detail each audience level actually needs, refined by feedback
- **Mistake patterns**: frequently encountered errors per domain, improving the common mistakes section over time

---

## Reference

### Step Granularity Rules

| Signal | Action |
|---|---|
| Step contains "and" joining two distinct actions | Split into two steps |
| Step has no observable output | Merge with the next step |
| Step requires a decision ("if X, do Y") | Add a decision point with both paths |
| Step could cause data loss or security issues | Add an explicit WARNING before the step |

### Audience Level Calibration

| Level | What to Include | What to Skip |
|---|---|---|
| Beginner | Define all terms; explain why each step matters; include examples | Nothing — assume no prior knowledge |
| Intermediate | Task-specific steps; skip setup basics | Basic installation, environment setup |
| Expert | Commands/actions only; no explanations unless non-obvious | Everything obvious to the domain |

### Time Estimate Padding Rules

- Beginner audience: multiply raw estimate by 1.5
- Intermediate audience: multiply by 1.2
- Expert audience: use raw estimate

### Verification Checkpoint Formula

"After completing this step, you should see/have/be able to [specific observable result]. If you see [error symptom] instead, see Troubleshooting step N."

### Common Mistakes Structure

| Field | Content |
|---|---|
| Mistake | What the person did wrong |
| Symptom | What they observe as a result |
| Fix | Exact corrective action |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
