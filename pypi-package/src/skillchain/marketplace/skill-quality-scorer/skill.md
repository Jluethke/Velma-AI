# Skill Quality Scorer

Reads a SkillChain skill definition and evaluates it against the Execution Standard, producing a 0-100 quality score across eight dimensions with severity-ranked issues and specific, actionable improvement suggestions.

## Execution Pattern: ORPA Loop

## Inputs
- skill_md_content: string -- Full text of the skill.md file to evaluate
- manifest_json: object -- The skill's manifest.json for cross-validation

## Outputs
- quality_score: object -- Overall score (0-100) with per-dimension breakdown
- issues_list: array -- Specific issues found, ranked by severity (critical > major > minor)
- improvement_suggestions: array -- Actionable fixes for each issue, prioritized by impact on score

## Execution

### OBSERVE: Parse and Extract
**Entry criteria:** skill.md content provided.
**Actions:**
1. Parse the skill.md for all Execution Standard elements:
   - Execution pattern declaration (ORPA or Phase Pipeline)
   - Input definitions (name, type, description, constraints)
   - Output definitions (name, type, description, specificity)
   - Phase/cycle definitions (entry criteria, actions, output, quality gate per phase)
   - Quality gates between phases
   - Exit criteria
   - Error handling table
   - Reference section
2. Cross-validate with manifest.json:
   - Does the execution_pattern field match the skill.md declaration?
   - Are all manifest inputs referenced in skill.md?
   - Are all manifest outputs produced by at least one phase?
3. Check for structural completeness: count how many of the 7 required elements (per Execution Standard) are present, partially present, or missing.

**Output:** Extraction report: elements found/missing/partial, cross-validation results.
**Quality gate:** skill.md has been fully parsed. All 7 required element categories have been checked.

### REASON: Score Each Dimension
**Entry criteria:** Extraction report complete.
**Actions:**
1. Score across 8 quality dimensions:

**Dimension 1: Execution Pattern (0-10 pts)**
- 0: No pattern declared
- 5: Pattern named but not followed (claims ORPA but phases don't match ORPA structure)
- 10: Pattern declared and consistently followed throughout

**Dimension 2: Input Definition (0-10 pts)**
- 0: No inputs listed
- 3: Inputs named only ("task_list")
- 6: Inputs with types ("task_list: array")
- 10: Inputs with types, descriptions, and constraints ("task_list: array -- Tasks with estimated duration in minutes, minimum 1 task required")

**Dimension 3: Output Definition (0-15 pts)**
- 0: No outputs listed
- 5: Vague outputs ("a report," "analysis results")
- 10: Named and typed outputs ("quality_score: number, issues_list: array")
- 15: Concrete, specific outputs with structure ("quality_score: object containing overall score 0-100, per-dimension breakdown with points and rationale, and letter grade")

**Dimension 4: Phase Definitions (0-20 pts)**
- 0: No phases defined
- 5: Phases named but actions are vague ("analyze the input")
- 10: Phases with specific actions listed
- 15: Phases with entry criteria, specific actions, AND defined output
- 20: All of the above PLUS quality gate per phase with testable condition

**Dimension 5: Quality Gates (0-15 pts)**
- 0: No quality gates
- 5: Generic gates ("output is valid")
- 10: Specific gates ("every task has a quadrant assignment")
- 15: Specific, testable gates with failure responses ("if coverage score < 50%, retry generation targeting uncovered elements")

**Dimension 6: Exit Criteria (0-10 pts)**
- 0: No exit criteria
- 3: Vague ("when the task is complete")
- 7: Specific but not fully testable ("when the report is generated")
- 10: Concrete and testable ("when all identified issues have severity ratings AND remediation recommendations AND the coverage score exceeds 80%")

**Dimension 7: Error Handling (0-10 pts)**
- 0: No error handling section
- 3: Generic error handling ("retry if error occurs")
- 6: Phase-specific failure modes identified
- 10: Phase-specific failure modes with specific responses (retry/adjust/skip/abort/escalate) and clear triggers

**Dimension 8: Reference Depth (0-10 pts)**
- 0: No reference section
- 3: Brief mentions of concepts
- 6: Frameworks, lists, or tables with actionable content
- 10: Deep domain knowledge with formulas, decision trees, checklists, or code patterns that the execution phases draw on

2. Calculate total score: sum of all dimensions (0-100).
3. Assign letter grade: A (90+), B (75-89), C (60-74), D (45-59), F (<45).

**Output:** Per-dimension scores with rationale, total score, letter grade.
**Quality gate:** All 8 dimensions have a score. Rationale cites specific evidence from the skill.md (quotes or references to specific sections).

### PLAN: Rank Issues and Prioritize Fixes
**Entry criteria:** All dimensions scored with rationale.
**Actions:**
1. Compile all identified issues and classify by severity:
   - **Critical (blocks validation):** Missing execution pattern, no phases defined, no outputs defined. These must be fixed first.
   - **Major (reduces validation success):** Vague phase actions, missing quality gates, no exit criteria. These significantly impact consistency.
   - **Minor (polish):** Missing error handling for edge cases, reference section could be deeper, input constraints not specified. Nice to have but skill can function without.
2. For each issue, generate a specific improvement suggestion:
   - Bad: "Add quality gates." (Too vague.)
   - Good: "Add a quality gate after Phase 2 (REASON): 'Every task has been classified into exactly one Eisenhower quadrant AND the top 3 priorities are identified.' This gate prevents Phase 3 from building a schedule without classified tasks."
3. Rank suggestions by "score impact per effort":
   - Adding concrete exit criteria: +7 pts, 10 min effort = high ROI
   - Adding error handling for every phase: +10 pts, 30 min effort = good ROI
   - Rewriting all phase actions to be specific: +15 pts, 60 min effort = moderate ROI
   - Deep reference section: +7 pts, 60 min effort = lower ROI (but valuable for long term)

**Output:** Severity-ranked issue list, specific improvement suggestions, prioritized fix plan.
**Quality gate:** Every scored deduction (where the skill lost points) has a corresponding improvement suggestion. Suggestions are specific enough to implement without further guidance.

### ACT: Deliver Quality Report
**Entry criteria:** Issues ranked and suggestions generated.
**Actions:**
1. Format the quality report:
   - **Score summary:** Total score, letter grade, one-line verdict
   - **Dimension breakdown:** Table with dimension, score, max, and key finding
   - **Issues:** Ranked list with severity, description, and fix
   - **Quick wins:** Top 3 changes that would most improve the score
   - **Benchmark comparison:** How this skill compares to the median quality on SkillChain (if data available)
2. If re-entering the ORPA loop (scoring an updated version):
   - Compare to previous score: which dimensions improved? Which declined?
   - Track quality trajectory over versions

**Output:** Formatted quality report with score, issues, suggestions, and quick wins.
**Quality gate:** Report contains all four sections (summary, breakdown, issues, quick wins). Every issue has a specific fix. Quick wins are the highest-ROI items.

## Exit Criteria
Complete when the quality report is delivered with a numerical score, per-dimension breakdown, severity-ranked issues, and specific improvement suggestions. On re-entry, complete when the comparison to previous version is included.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | skill.md is empty or has no recognizable structure | Abort -- return score of 0 with message "skill.md does not follow any recognized format" |
| OBSERVE | manifest.json missing | Adjust -- score based on skill.md alone, note that cross-validation was skipped |
| REASON | Skill uses a non-standard execution pattern (not ORPA or Phase Pipeline) | Adjust -- evaluate against general principles (defined phases, quality gates, etc.) but flag pattern non-compliance |
| PLAN | All dimensions scored perfectly (no issues) | Skip improvement suggestions -- congratulate, recommend maintaining quality as skill evolves |
| ACT | No previous version data for comparison | Skip comparison -- deliver standalone report |

## Reference

### The 7 Required Elements (Execution Standard v1.0)
1. Execution Pattern Declaration
2. Inputs (with types)
3. Outputs (with descriptions)
4. Phase/Cycle Definitions (with entry criteria, actions, output, quality gate)
5. Quality Gates (between phases)
6. Exit Criteria (concrete, testable)
7. Error Handling (per phase, with response type)

### Quality Score Interpretation
| Range | Grade | Meaning | Shadow Validation Prediction |
|---|---|---|---|
| 90-100 | A | Excellent -- production ready | 85-95% success |
| 75-89 | B | Good -- minor improvements recommended | 65-80% success |
| 60-74 | C | Adequate -- noticeable gaps affect consistency | 45-65% success |
| 45-59 | D | Below standard -- significant rework needed | 25-45% success |
| 0-44 | F | Failing -- fundamental structure missing | <25% success |

### Common Anti-Patterns in Skill Design
1. **The Knowledge Dump:** Lots of reference material but no execution structure. The skill knows things but doesn't DO things consistently.
2. **The Vague Commander:** Phases say "analyze the input" and "generate output" without specifying HOW.
3. **The Happy Path Only:** Works perfectly on ideal inputs, crashes or produces garbage on edge cases.
4. **The No-Gate Pipeline:** Phases flow without checkpoints, so errors in early phases corrupt all downstream outputs.
5. **The Eternal Loop:** ORPA skill with no exit criteria -- keeps looping without a clear completion condition.

### Scoring Calibration Examples
- **10/10 input definition:** "calendar_events: array -- Fixed commitments with start/end times (ISO 8601 format), minimum 0, each event must have title and time range"
- **3/10 input definition:** "events: the calendar events"
- **15/15 output definition:** "time_blocked_schedule: object -- Hour-by-hour schedule containing: time slot (HH:MM-HH:MM), assigned task name, task category (deep_work|admin|communication|break), energy level required (peak|moderate|trough), and optional notes"
- **5/15 output definition:** "schedule: the daily schedule"

### State Persistence
Tracks over time:
- Quality scores per skill per version (trend analysis)
- Most common issues by domain (are "meta" skills better structured than "productivity" skills?)
- Which improvement suggestions led to score increases (feedback loop on suggestion quality)
- Average quality score across the marketplace (benchmark data)
