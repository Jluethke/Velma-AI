# Multi-Flow Orchestrator

Decomposes compound tasks that require multiple flows into an ordered execution plan, maps data dependencies between flows (output of A feeds input of B), orchestrates execution in dependency-correct order (sequential and parallel where possible), pipes data between flows, and synthesizes all outputs into a unified deliverable.

## Execution Pattern: Phase Pipeline

## Inputs
- compound_task: string -- Description of the larger goal that requires multiple flows (e.g., "Launch a side business while maintaining my fitness and managing my time")
- available_skills: array -- Flows available for orchestration, with their manifest data (inputs, outputs, domain)
- constraints: object -- Time constraints, budget, priority ordering, resource limits

## Outputs
- skill_chain: array -- Ordered list of flows to execute with rationale for each
- data_flow_map: object -- DAG (directed acyclic graph) showing which flow outputs feed which flow inputs
- execution_plan: object -- Step-by-step execution sequence with parallel/sequential groupings and timing
- unified_deliverable: object -- Merged output from all flows, organized by theme with cross-references

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
**Quality gate:** At least 2 distinct sub-objectives identified. Each sub-objective is concrete enough to match to a flow. Priorities are assigned.

### Phase 2: DECOMPOSE -- Map Tasks to Flows
**Entry criteria:** Sub-objectives defined.
**Actions:**
1. For each sub-objective, search available flows for the best match:
   - Match by domain (health sub-objective -> health-domain flows)
   - Match by input/output compatibility (does the flow accept what we have and produce what we need?)
   - Match by execution pattern suitability (generative task -> Phase Pipeline flow, reactive/monitoring -> ORPA flow)
2. Identify gaps: sub-objectives with no matching flow:
   - Can an existing flow be stretched (used in a slightly non-standard way)?
   - Should the user acquire/create the missing flow?
   - Can the sub-objective be simplified to fit available flows?
3. For each selected flow, identify:
   - Required inputs: what data does this flow need to start?
   - Produced outputs: what data does this flow produce?
   - Input source: does this come from the user, from another flow's output, or from persistent state?
4. Build the flow roster: the list of flows that will execute, with their roles.

**Output:** Flow roster with role assignments, gap analysis, input source mapping.
**Quality gate:** Every sub-objective has at least one assigned flow. Input sources are identified for every flow (no flow has orphan inputs). Gaps are flagged with alternatives.

### Phase 3: SEQUENCE -- Build the Execution DAG
**Entry criteria:** Flow roster with input/output mappings complete.
**Actions:**
1. Build the data dependency graph (DAG):
   - Nodes = flows
   - Edges = data flow (output of flow A is input to flow B)
   - Direction = upstream -> downstream
2. Validate the DAG:
   - No cycles (flow A depends on B which depends on A -- impossible to execute)
   - All inputs have sources (no dangling inputs)
   - All outputs have consumers or are final deliverables
3. Determine execution order:
   - **Sequential:** Flows with direct dependencies must execute in order (upstream before downstream)
   - **Parallel:** Flows with no mutual dependencies can execute simultaneously
   - **Group by wave:** Wave 1 = flows with no upstream dependencies, Wave 2 = flows depending only on Wave 1, etc.
4. Estimate total execution time:
   - Sequential path: sum of flow execution times on the critical path
   - Parallel execution: time of longest parallel group per wave
5. Identify the critical path: the sequence of dependent flows that determines minimum total time.

**Output:** Execution DAG with waves, parallel/sequential groupings, critical path, estimated total time.
**Quality gate:** DAG has no cycles. Every flow appears in exactly one wave. Critical path is identified. All data flows are typed-compatible (output type matches expected input type).

### Phase 4: EXECUTE -- Run the Flow Chain
**Entry criteria:** Valid DAG with execution order defined.
**Actions:**
1. Execute Wave 1 flows (those with no upstream dependencies):
   - Provide user-supplied inputs
   - Collect outputs and validate against expected output types
2. For each subsequent wave:
   - Transform upstream outputs into downstream inputs:
     - Direct piping: output field X of flow A maps directly to input field Y of flow B
     - Aggregation: multiple upstream outputs are merged into a single input
     - Filtering: only relevant portions of upstream output are passed downstream
   - Execute all flows in the wave (parallel where possible)
   - Validate outputs
3. Handle execution failures:
   - If a flow fails and has no downstream dependents: skip it, note in report
   - If a flow fails and has downstream dependents: attempt retry, if still fails, mark all downstream flows as blocked
   - Present partial results with clear indication of what was completed and what was blocked
4. Log execution telemetry: flow name, execution time, success/failure, data transformations applied.

**Output:** Individual flow outputs, execution log, any failures or blocked flows.
**Quality gate:** All Wave 1 flows have executed. Data transformations between waves are verified (downstream flows received correct inputs). Failures are logged with reason.

### Phase 5: SYNTHESIZE -- Merge into Unified Deliverable
**Entry criteria:** All executable flows have produced outputs.
**Actions:**
1. Organize outputs by theme/domain:
   - Group related outputs (all health-related together, all business-related together)
   - Identify cross-domain connections ("your workout schedule is blocked in your daily plan from 7-8 AM")
2. Resolve conflicts between flow outputs:
   - Time conflicts: two flows recommend activities for the same time slot -> apply priority ordering
   - Resource conflicts: budget allocated by one flow exceeds what another flow assumed available -> flag for user decision
   - Recommendation conflicts: one flow says "eat more carbs for training" while nutrition flow says "reduce carbs for cutting" -> present trade-off explicitly
3. Generate the unified deliverable:
   - Executive summary: what was accomplished across all flows
   - Per-flow section: key outputs and recommendations
   - Integration section: how the outputs work together, cross-references, conflicts resolved
   - Action items: consolidated list of all recommended actions, deduplicated and ordered
4. Record successful chain patterns for reuse: "The chain [nutrition-optimizer -> workout-planner -> daily-planner] successfully served the goal 'optimize health and schedule.'"

**Output:** Unified deliverable with executive summary, per-flow results, integration analysis, consolidated action items.
**Quality gate:** All flow outputs are represented. Conflicts are identified and resolved (or flagged). Action items are deduplicated. The deliverable reads as a coherent document, not a collection of fragments.

## Exit Criteria
Complete when: (1) all flows in the chain have executed (or been marked as blocked with explanation), (2) outputs are synthesized into a unified deliverable, (3) conflicts are resolved or flagged, (4) consolidated action items are produced.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| GOAL | Task is too vague to decompose | Abort -- request specific sub-objectives from user |
| DECOMPOSE | No matching flow for a critical sub-objective | Escalate -- present gap to user, suggest manual execution or flow acquisition |
| SEQUENCE | Circular dependency detected | Abort -- present the cycle, suggest restructuring one flow to break it |
| EXECUTE | Upstream flow fails, blocking downstream chain | Adjust -- attempt with default/placeholder data for the blocked input, flag results as degraded |
| EXECUTE | All flows succeed but with low-quality outputs | Adjust -- re-run with refined inputs based on first-pass outputs (second iteration) |
| SYNTHESIZE | Irreconcilable conflicts between flow outputs | Escalate -- present both options with trade-off analysis, ask user to decide |
| SYNTHESIZE | User rejects final output | **Targeted revision** -- ask which sub-flow result, integration point, or synthesized conclusion fell short and rerun only that section. Do not re-orchestrate the full flow chain. |

## Reference

### DAG (Directed Acyclic Graph) Principles
A DAG is a graph with directed edges and no cycles. In flow orchestration:
- Nodes are flows
- Edges represent data dependencies (output -> input)
- No cycles means the chain can always be executed in a defined order
- The topological sort of a DAG gives a valid execution order

### Execution Patterns for Flow Chains
1. **Linear chain:** A -> B -> C. Simple, each flow feeds the next. Easy to debug, slow to execute.
2. **Fan-out:** A -> [B, C, D]. One flow's output feeds multiple downstream flows in parallel.
3. **Fan-in:** [A, B, C] -> D. Multiple flows' outputs are merged as input to one flow.
4. **Diamond:** A -> [B, C] -> D. Fan-out followed by fan-in. Common in practice (assess, then plan in parallel, then synthesize).

### Data Transformation Between Flows
- **Direct mapping:** Output field name matches input field name. No transformation needed.
- **Rename:** Output field "daily_calories" maps to input "caloric_target." Same data, different name.
- **Extract:** Output is a complex object, input needs a specific sub-field. Extract and pass.
- **Aggregate:** Multiple outputs are combined into a single input (e.g., combining schedules from fitness and work planning into a unified calendar).
- **Transform:** Output format doesn't match input format (e.g., output is Markdown, input expects JSON). Convert.

### Conflict Resolution Strategies
1. **Priority-based:** Higher-priority flow's recommendation wins. (User defines priority.)
2. **Constraint-based:** Both recommendations are honored but one becomes a constraint on the other. ("You must exercise AND eat at deficit -- workout timing adjusts to fit both.")
3. **User-choice:** Present both options with clear trade-offs. ("You can optimize for fat loss OR training performance. Here's what each looks like.")
4. **Compromise:** Find a middle ground that partially satisfies both. ("Moderate deficit + moderate training intensity instead of aggressive cut + heavy training.")

### Composition Limits
- **Maximum chain depth:** 4 flows (beyond this, data quality degrades through too many transformations)
- **Maximum parallel width:** No hard limit, but more than 5 parallel flows produces an unwieldy unified deliverable
- **Best practice:** chains of 2-3 flows with clear data flow are the most reliable and useful

### State Persistence
Tracks over time:
- Successful flow chain patterns (which combinations work well together)
- Common data transformations between specific flow pairs
- Execution times per flow (for better time estimates)
- Conflict patterns (which flow combinations commonly conflict and how conflicts were resolved)
- Chain failure points (which flows most often block downstream execution)
