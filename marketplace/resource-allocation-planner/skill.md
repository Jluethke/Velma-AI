# Resource Allocation Planner

Optimally matches available resources (energy, water, materials, labor, budget) to competing needs under real-world constraints, identifies bottlenecks and surpluses, minimizes waste, and produces actionable allocation plans with efficiency metrics and rebalancing recommendations.

## Execution Pattern: ORPA Loop

## Inputs
- resources: array -- Available resources with quantities and units (e.g., 500 labor-hours/month, 10,000 gallons water/week, $50,000 budget)
- needs: array -- Competing demands with resource requirements per unit of output (e.g., "Product A requires 2 labor-hours + $50 materials + 3 gallons water per unit")
- constraints: array -- Hard limits (budget ceiling, environmental regulations, minimum production quotas, contractual obligations)
- optimization_goal: string -- What to maximize: "total_output," "revenue," "efficiency," "equity," "sustainability"

## Outputs
- allocation_plan: object -- Resource assignment per need with quantities, utilization rates, and justification
- efficiency_metrics: object -- Output per unit of each resource, waste percentage, utilization rates
- bottleneck_analysis: object -- Identification of the binding constraint(s) and their impact on total output
- rebalancing_recommendations: array -- Specific changes to improve allocation efficiency

## Execution

### OBSERVE: Inventory Resources and Demands
**Entry criteria:** At least one resource and two competing needs defined.
**Actions:**
1. Catalog all resources with available quantities, replenishment rates (renewable vs. finite), and costs:
   - **Renewable resources:** labor (renews weekly), solar energy (daily), water (seasonal)
   - **Finite resources:** budget (period-fixed), materials inventory, machine lifetime
   - **Fungible resources:** money (can substitute for others), general labor
   - **Non-fungible resources:** specialized skills, specific equipment, permits
2. Catalog all demands with per-unit resource requirements:
   - Build a "resource consumption matrix": rows = needs, columns = resources, cells = units consumed per output
   - Include minimum viable allocation (below which the need produces zero value)
   - Include diminishing returns threshold (above which additional resources yield less per unit)
3. Catalog all constraints:
   - **Hard constraints:** cannot be violated (budget ceiling, safety limits, legal requirements)
   - **Soft constraints:** should be met but can flex (preferred timelines, quality targets, stakeholder expectations)
4. Identify the optimization goal and any secondary objectives (e.g., maximize revenue BUT maintain minimum equity across stakeholders).

**Output:** Resource inventory, demand matrix, constraint catalog, optimization objective hierarchy.
**Quality gate:** Every demand has quantified resource requirements. Every resource has a measured available quantity. At least one hard constraint exists. The optimization goal is explicit.

### REASON: Analyze Constraints and Identify Bottlenecks
**Entry criteria:** Complete resource and demand inventory.
**Actions:**
1. Calculate total demand vs total supply for each resource:
   - If total demand < supply: resource has surplus (slack). Not a bottleneck.
   - If total demand > supply: resource is oversubscribed. Potential bottleneck.
   - If total demand = supply: resource is fully utilized. Binding constraint.
2. Apply the Theory of Constraints: identify the single most binding resource.
   - The bottleneck resource determines maximum system throughput.
   - All other resources are secondary until the bottleneck is addressed.
   - Calculate: "If I had 10% more of this resource, how much more output could the system produce?" The resource with the highest answer is the bottleneck.
3. Calculate efficiency ratios per need:
   - Output value per unit of bottleneck resource consumed
   - Output value per dollar of total resource cost
   - Rank needs by "value per bottleneck unit" -- this is the core allocation heuristic.
4. Identify waste patterns:
   - Resources allocated but not used (idle capacity)
   - Over-allocation beyond diminishing returns thresholds
   - Mismatched allocation (high-value resources used for low-value needs)
5. Check for Pareto improvements: can any reallocation make at least one need better off without making any other worse off? If yes, the current allocation is not Pareto-optimal.

**Output:** Bottleneck identification, efficiency rankings per need, waste analysis, Pareto improvement opportunities.
**Quality gate:** The primary bottleneck is identified with quantified impact. Needs are ranked by value per bottleneck unit. Any existing waste is quantified (not just "some waste exists" but "X units of Y resource are idle in Z context").

### PLAN: Generate Optimal Allocation
**Entry criteria:** Bottleneck and efficiency rankings identified.
**Actions:**
1. Apply simplified linear programming logic:
   - **Objective function:** Maximize total value = sum of (output_per_need x value_per_output)
   - **Subject to:** resource constraints (for each resource: total allocated <= available)
   - **Subject to:** demand constraints (for each need: allocation >= minimum viable, <= maximum useful)
2. Greedy allocation algorithm (practical approximation when LP solver is unavailable):
   a. Sort needs by "value per bottleneck unit" (highest first)
   b. Allocate maximum feasible resources to the highest-ranked need
   c. Update remaining resource pools
   d. Move to next-ranked need, allocate maximum feasible from remaining
   e. Continue until all resources are allocated or all needs are satisfied
   f. Check: does any low-ranked need fall below its minimum viable allocation? If yes, pull resources from the marginal units of higher-ranked needs.
3. Handle multi-objective optimization:
   - If goals conflict (e.g., maximize revenue vs. maximize equity): identify the Pareto frontier.
   - Present 2-3 allocation scenarios on the frontier: "maximum revenue," "maximum equity," "balanced."
   - Let the decision-maker choose based on values, not just numbers.
4. Stress-test the allocation:
   - What if the bottleneck resource is reduced by 20%? Which needs lose allocation first?
   - What if a new high-priority need emerges? Where do resources come from?

**Output:** Optimal allocation plan with quantities per need, expected output, utilization rates, and sensitivity analysis.
**Quality gate:** No hard constraint is violated. Total allocated does not exceed available for any resource. The allocation is Pareto-optimal (no free improvements exist). Sensitivity analysis identifies the most fragile allocations.

### ACT: Deliver and Recommend
**Entry criteria:** Allocation plan generated and validated.
**Actions:**
1. Format the allocation plan as an actionable document:
   - Per-need allocation table: Need | Resource A allocated | Resource B allocated | Expected output | Value
   - Utilization dashboard: Resource | Available | Allocated | Idle | Utilization %
   - Bottleneck summary: what's constraining total output and by how much
2. Generate rebalancing recommendations:
   - If bottleneck exists: "Increasing [resource] by [amount] would increase total output by [amount]. Cost: [estimate]. ROI: [ratio]."
   - If waste exists: "Reducing allocation to [need] by [amount] frees [resource] for [alternative] without reducing output."
   - If equity is a concern: "Current allocation gives [need A] 3x the resources per unit as [need B]. Rebalancing to equal per-unit would reduce total output by [X%] but improve equity score from [Y] to [Z]."
3. On re-entry (conditions change):
   - Detect changes: new resources, new demands, changed constraints.
   - Recalculate and present delta: "Reallocation needed. Changes: [list]. Net impact: [positive/negative]."

**Output:** Formatted allocation plan, utilization dashboard, bottleneck report, rebalancing recommendations.
**Quality gate:** Every recommendation is quantified (specific amounts, not vague). Trade-offs between competing objectives are explicit. The plan is implementable (no vague "optimize" instructions -- specific resource moves with quantities).

## Exit Criteria
Complete when an allocation plan is delivered with utilization metrics and specific rebalancing recommendations. On re-entry, complete when the delta analysis and updated allocation are delivered.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Resource quantities unknown (qualitative only: "we have some water") | Abort -- request quantified measurements. Qualitative allocation is guesswork, not optimization |
| OBSERVE | Demand requirements unknown ("we need Product A but don't know the resource cost") | Adjust -- estimate from similar products or industry benchmarks, flag estimates explicitly |
| REASON | All resources are bottlenecks simultaneously | Escalate -- system is fundamentally under-resourced. Recommend reducing number of needs or acquiring more resources before attempting allocation |
| PLAN | Hard constraints make all demands infeasible simultaneously | Adjust -- identify which constraints can be relaxed (with stakeholder approval) or which demands can be deferred |
| ACT | Stakeholders reject the optimal allocation on equity grounds | Adjust -- present Pareto frontier scenarios that balance efficiency and equity |
| ACT | User rejects final output | **Targeted revision** -- ask which allocation decision, bottleneck analysis, or constraint trade-off fell short and rerun only that section. Do not re-optimize the full allocation. |

## Reference

### Theory of Constraints (Eliyahu Goldratt)
The throughput of any system is limited by its single most binding constraint. Optimizing non-constraint resources does not improve system output. The five focusing steps:
1. **Identify** the constraint
2. **Exploit** the constraint (maximize its utilization)
3. **Subordinate** everything else to the constraint (don't overproduce elsewhere)
4. **Elevate** the constraint (invest to increase its capacity)
5. **Repeat** (once elevated, a new resource becomes the constraint)

### Pareto Efficiency
An allocation is Pareto-efficient when no reallocation can make any party better off without making another worse off. The Pareto frontier shows all efficient allocations -- they differ in how they trade off between competing objectives. Choosing a point on the frontier is a values decision, not a math problem.

### Simplified Linear Programming
For resource allocation with linear relationships:
- **Decision variables:** how much of each resource to allocate to each need
- **Objective function:** maximize (or minimize) a linear combination of outputs
- **Constraints:** linear inequalities (resource limits, minimum allocations)
- **Solution:** the allocation that maximizes the objective while satisfying all constraints
- In practice: the "greedy by value-per-bottleneck-unit" heuristic produces near-optimal results for most small-to-medium allocation problems.

### Efficiency Metrics
- **Utilization rate:** allocated / available x 100%. Target: 75-90% (100% = no buffer for variability).
- **Output per unit:** value produced / resource consumed. The core efficiency measure.
- **Waste rate:** (allocated - actually used) / allocated x 100%. Target: <10%.
- **Marginal return:** additional output from one more unit of resource. Declines as allocation increases (diminishing returns).

### Common Allocation Mistakes
1. **Equal allocation:** Splitting resources equally regardless of need efficiency. Fair but usually highly inefficient.
2. **Historical allocation:** "We've always given 40% to X." Past allocation may not reflect current value.
3. **Squeaky wheel allocation:** Resources go to whoever complains loudest, not highest value.
4. **Ignoring diminishing returns:** Giving the top priority everything, when the last 20% of allocation produces only 5% of value.
5. **Not measuring:** Allocating without tracking actual utilization or output. No feedback loop = no improvement.

### State Persistence
Tracks over time:
- Allocation history (what was planned vs what was actually used)
- Utilization rates per resource per period
- Bottleneck shifts (which resource is the constraint and when it changes)
- Waste patterns and trends
- Output per unit trends (is efficiency improving?)
