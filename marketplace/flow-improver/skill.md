# Flow Improver

> **Starter Flow** — Free to use. Royalties to original creator on derivatives. Build on this.

Takes an existing flow.md and makes it better. Identifies weak quality gates, missing error handling, vague instructions, untested edge cases, and overly complex phases. Produces a revised flow.md with specific improvements and a before/after comparison. Fork this to create domain-specific flow auditors.

## Execution Pattern: ORPA Loop

```
OBSERVE  --> Read the flow and catalog every section
REASON   --> Score each section against quality criteria
PLAN     --> Prioritize improvements by impact
ACT      --> Rewrite weak sections and produce the improved flow
LOOP     --> Re-score to confirm improvement; exit when all sections pass
```

## Inputs

- `skill_md`: string -- The complete contents of the flow.md to improve.
- `improvement_focus`: string (optional) -- Specific area to prioritize: "quality_gates", "error_handling", "clarity", "completeness", or "all" (default: "all").
- `domain_context`: string (optional) -- Domain the flow operates in, for domain-specific quality checks.

## Outputs

- `audit_report`: object -- Section-by-section scoring with specific issues found.
- `improved_skill`: string -- The revised flow.md with all improvements applied.
- `change_log`: object[] -- List of changes made, each with: section, issue, fix applied, before snippet, after snippet.
- `score_comparison`: object -- Before and after scores across all quality dimensions.

---

## Execution

### OBSERVE -- Catalog the Flow

**Actions:**

1. Parse the flow.md into sections: title, description, execution pattern, inputs, outputs, phases, exit criteria, error handling, reference, state persistence.
2. For each section, record: present (yes/no), line count, specificity level (vague/moderate/precise).
3. Count total phases, total quality gates, total error handlers, total inputs, total outputs.
4. Identify any non-standard sections or deviations from SkillChain execution standard format.

**Output:** Section inventory with presence, size, and specificity metadata.

**Quality gate:** Every standard section is accounted for (present or noted as missing).

---

### REASON -- Score Each Section

**Actions:**

1. **Description quality (0-10):** Does the one-liner describe a concrete procedure? Does it say what the flow DOES, not what it IS? Deduct for: passive voice (-1), no action verb (-2), longer than 2 sentences (-1), uses "helps" or "assists" (-2).

2. **Input quality (0-10):** Every input has name, type, description, required/optional. Deduct for: missing types (-2 each), vague descriptions like "the data" (-1 each), no optional inputs (-1), more than 8 inputs without grouping (-2).

3. **Output quality (0-10):** Every output has name, type, description. Outputs are specific artifacts, not vague "results." Deduct for: outputs named "result" or "output" (-2 each), missing types (-2 each), outputs not produced by any phase (-3 each).

4. **Phase quality (0-10 per phase):** Each phase has entry criteria, numbered actions, output, quality gate. Actions use imperative verbs. Quality gates are testable. Deduct for: missing entry criteria (-2), actions that say "ensure" without saying how (-1 each), quality gates using "good" or "appropriate" (-3), phases with more than 8 actions (-1).

5. **Quality gate strength (0-10):** Gates are binary (pass/fail), measurable, and specific. Deduct for: gates with no measurable condition (-3 each), gates that duplicate the phase output (-2), no gate between phases (-3 per gap).

6. **Error handling coverage (0-10):** At least one failure mode per phase. Each has a response strategy (Retry/Adjust/Abort). Deduct for: missing error handling section (-5), phases with no failure modes (-2 each), responses that say "handle appropriately" (-2 each).

7. **Exit criteria clarity (0-10):** Exit criteria are concrete and testable. The flow is unambiguously DONE when criteria are met. Deduct for: criteria using "complete" without definition (-2), fewer than 3 exit criteria (-1 per missing), criteria that mirror a single phase gate (-1).

**Output:** Score card with 0-10 per dimension, total score out of 70, specific deductions noted.

**Quality gate:** Every dimension is scored. Every deduction cites the specific text that triggered it.

---

### PLAN -- Prioritize Improvements

**Actions:**

1. Rank all identified issues by impact: missing sections > vague quality gates > weak error handling > unclear actions > style issues.
2. Group issues by section so rewrites are efficient.
3. For each issue, draft the specific fix: what the text should say instead.
4. Estimate the score improvement each fix would produce.

**Output:** Prioritized fix list with drafted replacements and expected score impact.

**Quality gate:** At least the top 5 issues have concrete fix drafts. No fix is "make it better" — every fix is a specific text replacement.

---

### ACT -- Apply Improvements

**Actions:**

1. Rewrite each section with fixes applied, preserving the original structure and intent.
2. For missing sections: generate them from context in existing sections.
3. For vague quality gates: replace with measurable conditions using the pattern "X meets condition Y, verified by Z."
4. For weak error handling: add failure modes based on what could go wrong at each phase, with concrete recovery strategies.
5. Build the change log: for each change, record section, issue found, fix applied, before text, after text.
6. Assemble the complete improved flow.md.

**Output:** Improved flow.md and detailed change log.

**Quality gate:** Every issue from the PLAN phase has a corresponding entry in the change log. The improved flow.md parses into valid sections.

---

### LOOP -- Verify Improvement

Re-run the REASON scoring on the improved flow.md. Compare before and after scores. If any dimension is still below 6/10, loop back to PLAN for that dimension. Exit when all dimensions score 6+ or two improvement loops have been completed.

---

## Exit Criteria

The flow is DONE when:
- All 7 quality dimensions score at least 6/10 on the improved version
- Every change is documented in the change log with before/after text
- The improved flow.md follows SkillChain execution standard format
- Score comparison shows measurable improvement over the original

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Input is not valid flow.md format (no recognizable sections) | **Abort** -- the input is not a flow. Suggest using flow-from-workflow or prompt-to-flow-converter first |
| REASON | Flow scores 9+ on all dimensions already | **Abort** -- flow is already high quality. Return the audit report with a note that no improvements are needed |
| PLAN | More than 20 issues identified | **Adjust** -- focus on the top 10 highest-impact issues only to avoid a complete rewrite |
| ACT | Rewriting a section changes the flow's fundamental purpose | **Adjust** -- flag the section as needing author review rather than rewriting it |
| ACT | User rejects final output | **Targeted revision** -- ask which section of the improved flow still falls short (specific quality gate, error handler, or phase) and rerun only that section's improvement. Do not restart the full audit. |

## Reference

### Quality Dimension Scoring Cheat Sheet

| Dimension | Passing Score (6+) | Common Failure |
|---|---|---|
| Description | One-liner says what it DOES with an action verb | Uses "helps" or "assists"; passive voice |
| Inputs | All have name, type, required/optional flag | Missing types; vague "the data" |
| Outputs | Specific artifacts named, not "result" | Outputs named "output" or "result" |
| Phase quality | Entry criteria + numbered actions + output + quality gate | Missing entry criteria; actions say "ensure" without how |
| Quality gate strength | Binary, measurable, specific condition with verification | Uses "good," "appropriate," or "complete" without a test |
| Error handling | One failure mode per phase with Retry/Adjust/Abort | Missing section; responses say "handle appropriately" |
| Exit criteria | 3+ concrete, testable conditions | Uses "complete" without definition; mirrors single phase gate |

### Quality Gate Rewrite Formula

Before: "Output is complete and accurate"
After: "[Specific artifact] contains [minimum N items / passes condition Y] -- verified by: [specific check]"

### Improvement Priority Ranking

1. Missing sections (no error handling, no exit criteria, no quality gates)
2. Vague quality gates (cannot determine pass/fail without subjective judgment)
3. Weak error handling (responses say "handle appropriately" or "deal with it")
4. Unclear actions (say "ensure" or "check" without specifying how)
5. Style issues (passive voice, inconsistent formatting)

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
