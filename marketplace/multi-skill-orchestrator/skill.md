# Multi-Skill Orchestrator

Decomposes compound tasks that require multiple skills into an ordered execution plan, maps data dependencies between skills (output of A feeds input of B), orchestrates execution in dependency-correct order (sequential and parallel where possible), pipes data between skills, and synthesizes all outputs into a unified deliverable.

## Execution Pattern: Phase Pipeline

## Inputs
- compound_task: string -- Description of the larger goal that requires multiple skills (e.g., "Launch a side business while maintaining my fitness and managing my time")
- available_skills: array -- Skills available for orchestration, with their manifest data (inputs, outputs, domain)
- constraints: object -- Time constraints, budget, priority ordering, resource limits

## Outputs
- skill_chain: array -- Ordered list of skills to execute with rationale for each
- data_flow_map: object -- DAG (directed acyclic graph) showing which skill outputs feed which skill inputs
- execution_plan: object -- Step-by-step execution sequence with parallel/sequential groupings and timing
- unified_deliverable: object -- Merged output from all skills, organized by theme with cross-references

## Execution

### Phase 1: GOAL -- Define the Compound Task
**Entry criteria:** Compound task description provided.
**Actions:**
1. Parse the compound task into distinct sub-objectives:
   - What are the concrete outcomes the user wants? (Not "be healthier" but "lose 10 lbs, exercise 4x/week, eat 2000 cal/day")
   - What domains are involved? (productivity, health, business, learning, etc.)
   - What is the time horizon? (this week, 30 days, 6 months, ongoing)
2. Identify implicit requirements not stated:
   - "Launch a business" implies planning, research, MVP definition, go-to-market
   - "Stay healthy" implies fitness and nutrition are both needed
   - "Manage my time" implies scheduling across all activities
3. Prioritize sub-objectives:
   - Which are prerequisites for others? (Research before MVP, nutrition targets before meal plan)
   - Which are most time-sensitive?
   - Which are independent (can run in parallel)?

**Output:** Decomposed task: sub-objectives with priority, domain, time horizon, and implicit requirements.
**Quality gate:** At least 2 distinct sub-objectives identified. Each sub-objective is concrete enough to match to a skill. Priorities are assigned.

### Phase 2: DECOMPOSE -- Map Tasks to Skills
**Entry criteria:** Sub-objectives defined.
**Actions:**
1. For each sub-objective, search available skills for the best match:
   - Match by domain (health sub-objective -> health-domain skills)
   - Match by input/output compatibility (does the skill accept what we have and produce what we need?)
   - Match by execution pattern suitability (generative task -> Phase Pipeline skill, reactive/monitoring -> ORPA skill)
2. Identify gaps: sub-objectives with no matching skill:
   - Can an existing skill be stretched (used in a slightly non-standard way)?
   - Should the user acquire/create the missing skill?
   - Can the sub-objective be simplified to fit available skills?
3. For each selected skill, identify:
   - Required inputs: what data does this skill need to start?
   - Produced outputs: what data does this skill produce?
   - Input source: does this come from the user, from another skill's output, or from persistent state?
4. Build the skill roster: the list of skills that will execute, with their roles.

**Output:** Skill roster with role assignments, gap analysis, input source mapping.
**Quality gate:** Every sub-objective has at least one assigned skill. Input sources are identified for every skill (no skill has orphan inputs). Gaps are flagged with alternatives.

### Phase 3: SEQUENCE -- Build the Execution DAG
**Entry criteria:** Skill roster with input/output mappings complete.
**Actions:**
1. Build the data dependency graph (DAG):
   - Nodes = skills
   - Edges = data flow (output of skill A is input to skill B)
   - Direction = upstream -> downstream
2. Validate the DAG:
   - No cycles (skill A depends on B which depends on A -- impossible to execute)
   - All inputs have sources (no dangling inputs)
   - All outputs have consumers or are final deliverables
3. Determine execution order:
   - **Sequential:** Skills with direct dependencies must execute in order (upstream before downstream)
   - **Parallel:** Skills with no mutual dependencies can execute simultaneously
   - **Group by wave:** Wave 1 = skills with no upstream dependencies, Wave 2 = skills depending only on Wave 1, etc.
4. Estimate total execution time:
   - Sequential path: sum of skill execution times on the critical path
   - Parallel execution: time of longest parallel group per wave
5. Identify the critical path: the sequence of dependent skills that determines minimum total time.

**Output:** Execution DAG with waves, parallel/sequential groupings, critical path, estimated total time.
**Quality gate:** DAG has no cycles. Every skill appears in exactly one wave. Critical path is identified. All data flows are typed-compatible (output type matches expected input type).

### Phase 4: EXECUTE -- Run the Skill Chain
**Entry criteria:** Valid DAG with execution order defined.
**Actions:**
1. Execute Wave 1 skills (those with no upstream dependencies):
   - Provide user-supplied inputs
   - Collect outputs and validate against expected output types
2. For each subsequent wave:
   - Transform upstream outputs into downstream inputs:
     - Direct piping: output field X of skill A maps directly to input field Y of skill B
     - Aggregation: multiple upstream outputs are merged into a single input
     - Filtering: only relevant portions of upstream output are passed downstream
   - Execute all skills in the wave (parallel where possible)
   - Validate outputs
3. Handle execution failures:
   - If a skill fails and has no downstream dependents: skip it, note in report
   - If a skill fails and has downstream dependents: attempt retry, if still fails, mark all downstream skills as blocked
   - Present partial results with clear indication of what was completed and what was blocked
4. Log execution telemetry: skill name, execution time, success/failure, data transformations applied.

**Output:** Individual skill outputs, execution log, any failures or blocked skills.
**Quality gate:** All Wave 1 skills have executed. Data transformations between waves are verified (downstream skills received correct inputs). Failures are logged with reason.

### Phase 5: SYNTHESIZE -- Merge into Unified Deliverable
**Entry criteria:** All executable skills have produced outputs.
**Actions:**
1. Organize outputs by theme/domain:
   - Group related outputs (all health-related together, all business-related together)
   - Identify cross-domain connections ("your workout schedule is blocked in your daily plan from 7-8 AM")
2. Resolve conflicts between skill outputs:
   - Time conflicts: two skills recommend activities for the same time slot -> apply priority ordering
   - Resource conflicts: budget allocated by one skill exceeds what another skill assumed available -> flag for user decision
   - Recommendation conflicts: one skill says "eat more carbs for training" while nutrition skill says "reduce carbs for cutting" -> present trade-off explicitly
3. Generate the unified deliverable:
   - Executive summary: what was accomplished across all skills
   - Per-skill section: key outputs and recommendations
   - Integration section: how the outputs work together, cross-references, conflicts resolved
   - Action items: consolidated list of all recommended actions, deduplicated and ordered
4. Record successful chain patterns for reuse: "The chain [nutrition-optimizer -> workout-planner -> daily-planner] successfully served the goal 'optimize health and schedule.'"

**Output:** Unified deliverable with executive summary, per-skill results, integration analysis, consolidated action items.
**Quality gate:** All skill outputs are represented. Conflicts are identified and resolved (or flagged). Action items are deduplicated. The deliverable reads as a coherent document, not a collection of fragments.

## Exit Criteria
Complete when: (1) all skills in the chain have executed (or been marked as blocked with explanation), (2) outputs are synthesized into a unified deliverable, (3) conflicts are resolved or flagged, (4) consolidated action items are produced.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| GOAL | Task is too vague to decompose | Abort -- request specific sub-objectives from user |
| DECOMPOSE | No matching skill for a critical sub-objective | Escalate -- present gap to user, suggest manual execution or skill acquisition |
| SEQUENCE | Circular dependency detected | Abort -- present the cycle, suggest restructuring one skill to break it |
| EXECUTE | Upstream skill fails, blocking downstream chain | Adjust -- attempt with default/placeholder data for the blocked input, flag results as degraded |
| EXECUTE | All skills succeed but with low-quality outputs | Adjust -- re-run with refined inputs based on first-pass outputs (second iteration) |
| SYNTHESIZE | Irreconcilable conflicts between skill outputs | Escalate -- present both options with trade-off analysis, ask user to decide |

## Reference

### DAG (Directed Acyclic Graph) Principles
A DAG is a graph with directed edges and no cycles. In skill orchestration:
- Nodes are skills
- Edges represent data dependencies (output -> input)
- No cycles means the chain can always be executed in a defined order
- The topological sort of a DAG gives a valid execution order

### Execution Patterns for Skill Chains
1. **Linear chain:** A -> B -> C. Simple, each skill feeds the next. Easy to debug, slow to execute.
2. **Fan-out:** A -> [B, C, D]. One skill's output feeds multiple downstream skills in parallel.
3. **Fan-in:** [A, B, C] -> D. Multiple skills' outputs are merged as input to one skill.
4. **Diamond:** A -> [B, C] -> D. Fan-out followed by fan-in. Common in practice (assess, then plan in parallel, then synthesize).

### Data Transformation Between Skills
- **Direct mapping:** Output field name matches input field name. No transformation needed.
- **Rename:** Output field "daily_calories" maps to input "caloric_target." Same data, different name.
- **Extract:** Output is a complex object, input needs a specific sub-field. Extract and pass.
- **Aggregate:** Multiple outputs are combined into a single input (e.g., combining schedules from fitness and work planning into a unified calendar).
- **Transform:** Output format doesn't match input format (e.g., output is Markdown, input expects JSON). Convert.

### Conflict Resolution Strategies
1. **Priority-based:** Higher-priority skill's recommendation wins. (User defines priority.)
2. **Constraint-based:** Both recommendations are honored but one becomes a constraint on the other. ("You must exercise AND eat at deficit -- workout timing adjusts to fit both.")
3. **User-choice:** Present both options with clear trade-offs. ("You can optimize for fat loss OR training performance. Here's what each looks like.")
4. **Compromise:** Find a middle ground that partially satisfies both. ("Moderate deficit + moderate training intensity instead of aggressive cut + heavy training.")

### Composition Limits
- **Maximum chain depth:** 4 skills (beyond this, data quality degrades through too many transformations)
- **Maximum parallel width:** No hard limit, but more than 5 parallel skills produces an unwieldy unified deliverable
- **Best practice:** chains of 2-3 skills with clear data flow are the most reliable and useful

### State Persistence
Tracks over time:
- Successful skill chain patterns (which combinations work well together)
- Common data transformations between specific skill pairs
- Execution times per skill (for better time estimates)
- Conflict patterns (which skill combinations commonly conflict and how conflicts were resolved)
- Chain failure points (which skills most often block downstream execution)
