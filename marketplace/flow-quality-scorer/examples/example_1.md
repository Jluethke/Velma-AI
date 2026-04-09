# Example: Scoring a Mediocre "project-planning" Skill

## Input
```
skill_md_content: |
  # Project Planning
  
  Helps plan software projects.
  
  ## Execution Pattern: Phase Pipeline
  
  ## Inputs
  - requirements: the project requirements
  - timeline: how long the project should take
  
  ## Outputs
  - project plan: a comprehensive project plan
  - timeline: the project timeline
  
  ## Execution
  
  ### Phase 1: Gather Requirements
  Collect all the requirements from stakeholders and organize them.
  
  ### Phase 2: Break Down Work
  Decompose the requirements into tasks and estimate effort.
  
  ### Phase 3: Create Schedule
  Organize tasks into a timeline with dependencies and milestones.
  
  ### Phase 4: Review
  Review the plan for completeness and feasibility.
  
  ## Reference
  Use agile or waterfall methodology depending on context.

manifest_json: { "name": "project-planning", "execution_pattern": "phase_pipeline", "inputs": ["requirements", "timeline"], "outputs": ["project_plan", "timeline"] }
```

## OBSERVE Output

**Elements found:**
- Execution pattern: YES (Phase Pipeline declared)
- Inputs: PARTIAL (named but no types, no constraints)
- Outputs: PARTIAL (named but vague -- "a comprehensive project plan")
- Phase definitions: PARTIAL (4 phases named with brief descriptions, but no entry criteria, no quality gates, no per-phase outputs)
- Quality gates: MISSING
- Exit criteria: MISSING
- Error handling: MISSING
- Reference: MINIMAL (one sentence)

**Cross-validation:** Manifest matches skill.md pattern. Inputs/outputs align by name.

## REASON Output: Score Breakdown

| Dimension | Score | Max | Rationale |
|---|---|---|---|
| Execution Pattern | 10 | 10 | Correctly declared and followed (4 sequential phases) |
| Input Definition | 3 | 10 | Named only, no types or constraints ("the project requirements" is not typed) |
| Output Definition | 5 | 15 | Vague ("a comprehensive project plan" -- what structure? what fields?) |
| Phase Definitions | 5 | 20 | Phases named with 1-sentence descriptions, but no entry criteria, no specific actions, no per-phase outputs |
| Quality Gates | 0 | 15 | None present |
| Exit Criteria | 0 | 10 | None defined |
| Error Handling | 0 | 10 | No error handling section |
| Reference Depth | 3 | 10 | Single sentence mentioning agile/waterfall without substance |

**Total: 26/100 -- Grade F**

## PLAN Output: Ranked Issues and Fixes

### Critical Issues
1. **No quality gates (0/15):** Add testable gates between phases. Example: "After Phase 1, quality gate: all requirements are prioritized by MoSCoW method AND total count is documented. If fewer than 3 requirements gathered, abort -- insufficient scope."
2. **No exit criteria (0/10):** Add: "Complete when: (1) all requirements have task decomposition, (2) all tasks have effort estimates, (3) schedule has no unresolved dependency conflicts, (4) critical path is identified."
3. **No error handling (0/10):** Add a table with at least one failure mode per phase. Example: "Phase 2 | Estimation impossible (novel technology) | Escalate -- add spike/research task before estimation."

### Major Issues
4. **Vague phase definitions (5/20):** Each phase needs: entry criteria, 3-5 specific actions, defined output, quality gate. Example for Phase 2: "Actions: (1) Use WBS to decompose each requirement into tasks <8 hours, (2) Estimate using three-point estimation (optimistic, likely, pessimistic), (3) Identify dependencies between tasks, (4) Flag any task >40 hours for further decomposition."
5. **Vague outputs (5/15):** Define structure. Example: "project_plan: object containing: requirements_list (array of {id, description, priority, status}), task_breakdown (array of {id, requirement_id, description, estimate_hours, dependencies}), schedule (Gantt-compatible array of {task_id, start_date, end_date, assignee}), critical_path (array of task_ids), risk_register (array of {risk, probability, impact, mitigation})."

### Minor Issues
6. **Inputs not typed (3/10):** Change to "requirements: array -- Stakeholder requirements with descriptions and priority (MoSCoW). Minimum 3 requirements." and "timeline: object -- Target end date and any fixed milestones."
7. **Reference too shallow (3/10):** Add WBS methodology, three-point estimation formula, critical path method, MoSCoW prioritization, common project risk categories.

### Quick Wins (highest ROI)
1. **Add exit criteria** (+7 pts, 5 min effort) -- single paragraph defining completion
2. **Add error handling table** (+7 pts, 15 min effort) -- one row per phase
3. **Add quality gates** (+10 pts, 20 min effort) -- one gate per phase

**Implementing all three quick wins would raise the score from 26 to ~50 (Grade D).**
Full rework of phases, outputs, and reference would bring it to 75+ (Grade B).
