# Skill from Workflow

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Takes a plain-English description of something you do repeatedly — a workflow, a routine, a process you always follow — and converts it into a publishable SkillChain skill with proper ORPA structure, inputs/outputs, quality gates, and error handling. Different from prompt-to-skill-converter: this works from workflow descriptions, not existing prompts. "I always check my email, then prioritize my tasks, then block my calendar" becomes a structured skill.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ELICIT     --> Collect the workflow description and clarify steps
PHASE 2: DECOMPOSE  --> Break the workflow into discrete, ordered operations
PHASE 3: FORMALIZE  --> Map operations to ORPA or Phase Pipeline structure
PHASE 4: GENERATE   --> Produce a complete skill.md with all required sections
```

## Inputs

- `workflow_description`: string -- Plain-English description of the workflow. Can be conversational, bullet points, or stream-of-consciousness.
- `workflow_frequency`: string (optional) -- How often this workflow runs (daily, weekly, per-project, ad-hoc).
- `workflow_context`: string (optional) -- Who performs this workflow, what role, what domain.
- `known_edge_cases`: string[] (optional) -- Things that sometimes go wrong or vary.

## Outputs

- `clarified_steps`: object[] -- The workflow broken into numbered, unambiguous steps with inputs and outputs per step.
- `execution_pattern`: string -- ORPA or Phase Pipeline recommendation with justification.
- `generated_skill`: string -- Complete skill.md content ready for publishing.
- `improvement_notes`: string[] -- Suggestions for making the workflow more robust.

---

## Execution

### Phase 1: ELICIT -- Collect and Clarify the Workflow

**Entry criteria:** A workflow description is provided in any format.

**Actions:**

1. Read the workflow description end to end. Identify every action verb — these are candidate steps.
2. For each candidate step, determine: what triggers it? What does it consume (input)? What does it produce (output)? What decision, if any, does it involve?
3. Identify implicit steps the user skipped. Workflows described from memory always omit "obvious" steps. Look for gaps: "I check email then block my calendar" omits the prioritization step between them.
4. Identify branching: any "if X then Y, otherwise Z" logic. These become conditional paths or error handling.
5. Identify the termination condition: how does the user know the workflow is done?

**Output:** A numbered list of clarified steps, each with: action, input, output, decision (if any).

**Quality gate:** Every step has a defined input and output. No step says "handle it" or "deal with it" without specifics. The workflow has a clear start trigger and end condition.

---

### Phase 2: DECOMPOSE -- Map Steps to Skill Operations

**Entry criteria:** Clarified steps are complete.

**Actions:**

1. Group related steps into phases (3-6 phases ideal). Steps that share a purpose or operate on the same data belong together.
2. For each phase, define: entry criteria (what must be true before starting), actions (the steps), exit criteria (what must be true to proceed).
3. Identify which steps are sequential (must run in order) vs. parallelizable (could run simultaneously).
4. Determine the execution pattern: if the workflow reacts to discovered state and loops (ORPA), or follows a fixed sequence (Phase Pipeline).
5. Extract all domain knowledge embedded in the workflow — rules of thumb, thresholds, criteria the user applies intuitively.

**Output:** Phase map with grouped steps, execution pattern recommendation, and extracted domain knowledge.

**Quality gate:** Each phase has 2-5 concrete actions. No phase is a single vague step. Domain knowledge is explicit, not assumed.

---

### Phase 3: FORMALIZE -- Build Skill Structure

**Entry criteria:** Phase map and execution pattern are determined.

**Actions:**

1. Define formal inputs: extract every piece of information the workflow needs to start. Type each input (string, array, object, number). Mark required vs. optional.
2. Define formal outputs: extract every artifact the workflow produces. Be specific about structure.
3. Write each phase with full structure: entry criteria, numbered actions, output, quality gate.
4. Design error handling for each phase: what fails? What is the recovery? Use the table format: Phase | Failure Mode | Response (Retry/Adjust/Abort).
5. Write exit criteria: concrete, testable conditions that mean the skill is done.
6. Add a reference section with any domain knowledge, checklists, or decision criteria extracted in Phase 2.

**Output:** Complete skill skeleton with all sections populated.

**Quality gate:** Every input feeds into at least one phase action. Every output is produced by a phase. Error handling covers at least one failure mode per phase. Exit criteria are testable, not subjective.

---

### Phase 4: GENERATE -- Produce the Final Skill

**Entry criteria:** Skill skeleton is complete and passes quality checks.

**Actions:**

1. Assemble the skill.md following SkillChain format: title, one-line description, execution pattern declaration, inputs, outputs, execution phases, exit criteria, error handling, reference section.
2. Review the generated skill against the original workflow description. Every step the user described must appear somewhere in the skill. Flag any that were intentionally omitted (with justification).
3. Generate 2-3 improvement notes: ways the workflow could be made more robust, edge cases to handle, automation opportunities.
4. Add state persistence section if the workflow benefits from memory between runs (e.g., tracking patterns over time, remembering past decisions).

**Output:** Complete skill.md content and improvement notes.

**Quality gate:** The skill follows SkillChain execution standard format. A reader unfamiliar with the workflow could execute it from the skill alone. No steps reference "you know what I mean" or assume context.

---

## Exit Criteria

The skill is DONE when:
- Every step from the original workflow appears in the generated skill
- The execution pattern is justified
- All phases have entry criteria, actions, outputs, and quality gates
- Error handling covers at least one failure mode per phase
- A person unfamiliar with the workflow could follow the skill and produce the same result

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| ELICIT | Workflow description is a single sentence with no actionable steps | **Abort** -- ask for a more detailed description with at least 3 steps |
| ELICIT | Workflow has circular dependencies (step A needs step B which needs step A) | **Adjust** -- identify the bootstrap condition and add an initialization phase |
| DECOMPOSE | Cannot identify more than 2 phases | **Adjust** -- the workflow may be too simple for a skill; suggest keeping it as a checklist instead |
| FORMALIZE | Domain knowledge is too specialized to capture in text | **Adjust** -- add a "requires expertise in X" note and document what can be captured |
| GENERATE | Generated skill exceeds 200 lines | **Adjust** -- split into a primary skill and one or more sub-skills linked by composition |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
