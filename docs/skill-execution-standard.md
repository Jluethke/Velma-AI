# SkillChain Skill Execution Standard v1.0

**A skill is a PROCEDURE, not a document.** Every skill on SkillChain must define how it executes, not just what it knows.

This standard defines the two approved execution patterns for SkillChain skills. All published skills must declare and follow one of these patterns. Skills that lack a defined execution pattern produce inconsistent outputs, fail shadow validation more often, and provide less value to importers.

---

## Two Approved Execution Patterns

### Pattern A: ORPA Loop (Observe-Reason-Plan-Act)

Best for: reactive skills, analysis tasks, debugging, reviews, ongoing monitoring.

```
OBSERVE --> What data do I need? Gather inputs, scan context, read state.
REASON  --> What does this data mean? Analyze, compare, classify, evaluate.
PLAN    --> What should I do about it? Prioritize actions, identify dependencies.
ACT     --> Execute the plan. Produce outputs, make changes, report results.
         \                                                              /
          +--- Act may reveal new data --- loop back to OBSERVE -------+
```

Each cycle may loop (Act reveals new data, triggering a new Observe). Every ORPA skill must define explicit exit criteria that terminate the loop.

**Example skills using ORPA:**

| Skill | Observe | Reason | Plan | Act |
|---|---|---|---|---|
| code-review | Read PR diff, gather context | Check patterns, flag issues | Prioritize feedback by severity | Write review comments |
| debugging-strategies | Read error, inspect stack | Form hypotheses, rank likelihood | Select test strategy | Apply fix, verify |
| repo-health | Scan repo structure, metrics | Score health dimensions | Prioritize remediation | Generate health report |
| security-hardening | Scan code for vulnerabilities | Classify by severity, exploitability | Rank fixes by impact/effort | Apply mitigations |
| dependency-audit | Read lockfiles, scan CVEs | Assess risk per dependency | Prioritize upgrades | Generate update plan |

### Pattern B: Phase Pipeline (Sequential Phases)

Best for: procedural skills, generation tasks, multi-step workflows, IP work, project setup.

```
PHASE 1: INITIALIZE  --> Gather prerequisites, validate inputs, scan context
PHASE 2: ANALYZE     --> Process inputs, classify, evaluate, compare
PHASE 3: GENERATE    --> Produce primary outputs (drafts, code, configs, plans)
PHASE 4: VALIDATE    --> Check outputs against quality criteria, run tests
PHASE 5: DELIVER     --> Format final output, present results, recommend next steps
```

Phase names should be customized per skill but the structure stays: init, work, validate, deliver. Phases are sequential -- each phase must complete before the next begins.

**Example skills using Phase Pipeline:**

| Skill | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---|---|---|---|---|---|
| ip-counsel | Inventory assets | Gap analysis | Prior art research + draft | Checklist review | Filing recommendations |
| project-scaffolding | Requirements gathering | Tech stack selection | Generate scaffold | Build check + lint | Deliver with docs |
| api-design | Requirements + constraints | Resource modeling | Generate OpenAPI spec | Consistency validation | Deliver spec + examples |
| test-generation | Read source code | Identify test surfaces | Generate test cases | Run tests, check coverage | Deliver test suite |
| migration-planner | Inventory current state | Analyze dependencies | Generate migration plan | Validate rollback steps | Deliver runbook |

---

## Choosing Between Patterns

| Use ORPA When... | Use Phase Pipeline When... |
|---|---|
| Task is reactive (responding to existing state) | Task is generative (creating something new) |
| Multiple cycles may be needed | Task flows linearly start to finish |
| Output depends on iterative refinement | Output is defined upfront |
| Scope is unclear until you observe | Scope is known at the start |
| Continuous monitoring or review | One-shot production |

When in doubt, ask: "Do I know what the output looks like before I start?" If yes, use Phase Pipeline. If no, use ORPA.

---

## Required Elements in Every Skill

Every skill published to SkillChain must include these elements, regardless of which execution pattern it uses:

### 1. Execution Pattern Declaration
Declared at the top of `skill.md`. Either `ORPA Loop` or `Phase Pipeline`.

### 2. Inputs
What the skill needs to start. Listed in both `manifest.json` (the `inputs` field) and in `skill.md` (human-readable descriptions with types and constraints).

### 3. Outputs
What the skill produces at each phase or cycle. Must be concrete and specific -- not "a result" but "a JSON object containing severity-ranked findings with file paths and line numbers."

### 4. Phase/Cycle Definitions
What happens at each step. Each phase or ORPA stage must have:
- **Entry criteria** -- What must be true before this phase starts
- **Actions** -- What the phase does (specific, not vague)
- **Output** -- What this phase produces
- **Quality gate** -- How to validate the phase output before proceeding

### 5. Quality Gates
Checkpoints between phases that prevent garbage from propagating forward. A quality gate defines a testable condition. If the condition fails, the skill must handle it (retry, adjust, or abort).

### 6. Exit Criteria
When is the skill DONE? What constitutes completion? This must be a concrete, testable condition -- not "when the task is finished" but "when all identified issues have a severity rating and remediation recommendation."

### 7. Error Handling
What to do when a phase fails. Options per phase:
- **Retry** -- Run the phase again (with a max retry count)
- **Adjust** -- Modify inputs or approach and retry
- **Skip** -- Mark phase as skipped and continue (only if phase is optional)
- **Abort** -- Stop execution and report what was completed
- **Escalate** -- Flag for human review

---

## Skill.md Template

Use this template when creating a new skill. Replace bracketed content with your specifics.

```markdown
# [Skill Name]

[One-line description of what this skill does as a procedure.]

## Execution Pattern: [ORPA Loop | Phase Pipeline]

## Inputs
- [input_1]: [type] -- [description and constraints]
- [input_2]: [type] -- [description and constraints]

## Outputs
- [output_1]: [type] -- [description of what this contains]
- [output_2]: [type] -- [description of what this contains]

## Execution

### [Phase 1 / OBSERVE]: [Name]
**Entry criteria:** [what must be true to start this phase]
**Actions:**
1. [specific action]
2. [specific action]
**Output:** [what this phase produces]
**Quality gate:** [testable condition to proceed]

### [Phase 2 / REASON]: [Name]
**Entry criteria:** [what must be true to start this phase]
**Actions:**
1. [specific action]
2. [specific action]
**Output:** [what this phase produces]
**Quality gate:** [testable condition to proceed]

### [Phase 3 / PLAN]: [Name]
**Entry criteria:** [what must be true to start this phase]
**Actions:**
1. [specific action]
2. [specific action]
**Output:** [what this phase produces]
**Quality gate:** [testable condition to proceed]

### [Phase 4 / ACT]: [Name]
**Entry criteria:** [what must be true to start this phase]
**Actions:**
1. [specific action]
2. [specific action]
**Output:** [what this phase produces]
**Quality gate:** [testable condition that confirms completion]

## Exit Criteria
[Concrete, testable conditions for when this skill is DONE.]

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| [Phase 1] | [what can go wrong] | [retry / adjust / skip / abort / escalate] |
| [Phase 2] | [what can go wrong] | [retry / adjust / skip / abort / escalate] |

## Reference
[Detailed knowledge, formulas, checklists, code patterns, domain expertise.
This is the "knowledge base" section -- everything the execution phases draw on.]
```

---

## How the Execution Standard Affects Validation

Shadow validation tests the EXECUTION of a skill, not just its knowledge content. When validators run a skill through 5 independent shadow executions, they are testing whether the skill's phases produce consistent, correct outputs given the same inputs.

Skills that follow the execution standard produce more consistent outputs because:
- **Defined phases prevent skipped steps.** An unstructured skill might omit analysis on some runs and include it on others, producing wildly different outputs.
- **Quality gates catch errors mid-execution.** A structured skill that validates its intermediate outputs before proceeding produces fewer garbage final outputs.
- **Exit criteria make completion deterministic.** An unstructured skill might produce a partial result on one run and a full result on another.

Skills without a defined execution pattern fail shadow validation at a significantly higher rate. The execution standard exists to make skills reliable enough to be tradeable assets.

---

## Origin

This execution standard is derived from two battle-tested patterns in the Velma cognitive OS:

- **ORPA** comes from Velma's task decomposition system, where every cognitive task is broken into Observe-Reason-Plan-Act cycles with explicit loop termination. This pattern has executed tens of thousands of tasks in production.
- **Phase Pipeline** comes from Velma's governance framework (ALG), which processes every learning event through sequential phases (OBSERVE, ASSESS, ANTICIPATE, MODULATE, ENFORCE, AUDIT) with quality gates between each.

Both patterns enforce the same principle: structured execution produces reliable outputs. Unstructured execution produces unpredictable outputs. SkillChain skills are tradeable assets -- they must be reliable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
