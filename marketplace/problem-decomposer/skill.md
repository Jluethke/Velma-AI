# Problem Decomposer

Break a vague or complex problem into structured sub-problems using MECE decomposition, sequence them by dependencies, generate an execution roadmap, and validate completeness.

## Execution Pattern: Phase Pipeline

```
PHASE 1: CAPTURE    --> Accept vague problem statement, clarify scope and constraints
PHASE 2: DECOMPOSE  --> Break into sub-problems using MECE (mutually exclusive, collectively exhaustive)
PHASE 3: SEQUENCE   --> Order sub-problems by dependencies, identify critical path
PHASE 4: PLAN       --> Generate execution roadmap with milestones, owners, estimates
PHASE 5: VALIDATE   --> Verify completeness (do sub-problems cover the whole problem?)
```

## Inputs

- `problem_statement`: string -- The problem to decompose. Can be vague ("our users are unhappy") or specific ("migrate from MongoDB to PostgreSQL without downtime")
- `constraints`: list[string] -- Hard constraints: budget, timeline, team size, technology requirements, regulatory limits
- `stakeholders`: list[object] -- People affected: `{name, role, concerns, authority_level}`
- `context`: string -- Background information, what has been tried, why this matters now
- `known_sub_problems`: list[string] -- Sub-problems already identified (partial decomposition to build on)

## Outputs

- `decomposition_tree`: object -- Hierarchical tree of sub-problems with MECE validation markers
- `dependency_graph`: object -- Directed graph of sub-problem dependencies (what must happen before what)
- `critical_path`: list[object] -- The longest dependency chain (determines minimum time to completion)
- `execution_roadmap`: object -- Phased plan with milestones, owners, time estimates, and risk flags
- `completeness_validation`: object -- Evidence that sub-problems cover the entire original problem

---

## Execution

### Phase 1: CAPTURE -- Clarify the Problem

**Entry criteria:** A problem statement is provided.

**Actions:**

1. **Apply the 5 Whys.** Take the stated problem and ask "Why?" five times to find the root cause:
   ```
   Problem: "Our API is slow."
   Why? -> Response times exceed 2 seconds for 30% of requests
   Why? -> The database query for user profiles is unoptimized
   Why? -> We added 12 new fields last quarter without updating indexes
   Why? -> No one owns database performance
   Why? -> Performance is not in any team's OKRs
   ```
   The 5 Whys often reveals that the stated problem is a symptom, not the cause. The real problem may be at level 3, 4, or 5.

2. **First principles decomposition.** Strip away assumptions:
   - What are the fundamental truths about this problem?
   - What assumptions are we making that might not be true?
   - If we were starting from scratch with no legacy, how would we approach this?
   - What would Elon Musk's "idiot index" say? (ratio of actual cost to raw material cost -- how much complexity overhead are we carrying?)

3. **Define scope boundaries.** Explicitly state:
   - **In scope**: What this decomposition will cover
   - **Out of scope**: What this decomposition will NOT cover
   - **Boundary conditions**: Where in-scope meets out-of-scope, and how they interact
   - Scope creep is the #1 killer of problem-solving efforts. Explicit boundaries are prophylactic.

4. **Identify success criteria.** How will we know the problem is solved? Criteria must be:
   - **Specific**: Not "improve performance" but "p95 latency < 200ms"
   - **Measurable**: Can be quantified or objectively assessed
   - **Time-bound**: By when must this be achieved?

5. **Classify the problem type:**
   - **Convergent** (one right answer): Optimization, debugging, compliance. Decompose into steps to find the answer.
   - **Divergent** (many possible answers): Design, strategy, innovation. Decompose into option-generating sub-problems.
   - **Wicked** (problem definition shifts as you solve it): Organizational change, market entry, culture. Decompose iteratively -- expect the decomposition to change.

**Output:** Clarified problem statement, root cause analysis (5 Whys), scope boundaries, success criteria, problem type classification.

**Quality gate:** Problem statement is specific enough to decompose. Scope boundaries are explicit. At least 2 measurable success criteria exist.

---

### Phase 2: DECOMPOSE -- Break into MECE Sub-Problems

**Entry criteria:** Problem is clarified with scope and success criteria.

**Actions:**

1. **Apply MECE decomposition.** MECE = Mutually Exclusive, Collectively Exhaustive:
   - **Mutually Exclusive**: No overlap between sub-problems. If two sub-problems cover the same ground, solving one would partially solve the other, creating confusion about responsibility and progress.
   - **Collectively Exhaustive**: Sub-problems cover the entire original problem. If all sub-problems are solved, the original problem is solved. No gaps.

2. **Choose a decomposition framework.** Different frameworks produce different decompositions:

   **By component**: Break into structural parts
   ```
   "Improve website performance"
   ├── Frontend performance (rendering, bundle size, images)
   ├── Backend performance (API response times, caching)
   ├── Database performance (queries, indexes, connection pooling)
   └── Infrastructure performance (CDN, load balancing, auto-scaling)
   ```

   **By process**: Break into sequential steps
   ```
   "Launch a new product"
   ├── Market research (demand validation)
   ├── Product design (MVP definition)
   ├── Development (build the thing)
   ├── Testing (QA, beta users)
   └── Go-to-market (launch, marketing, sales)
   ```

   **By stakeholder**: Break by who is affected
   ```
   "Improve customer satisfaction"
   ├── New customer experience (onboarding, first value)
   ├── Power user experience (advanced features, performance)
   ├── Enterprise customer experience (compliance, SLAs, support)
   └── Churned customer recovery (win-back, exit surveys)
   ```

   **By hypothesis**: Break into testable hypotheses (McKinsey-style)
   ```
   "Revenue is declining"
   ├── H1: We are losing customers (churn analysis)
   ├── H2: Customers are spending less (ARPU analysis)
   ├── H3: We are acquiring fewer new customers (funnel analysis)
   └── H4: Pricing is misaligned with value (willingness-to-pay analysis)
   ```

3. **Build the issue tree.** Structure sub-problems hierarchically. Each level should be MECE. Typical depth: 2-4 levels.
   - Level 0: Original problem
   - Level 1: Major sub-problems (3-7 items, MECE)
   - Level 2: Sub-sub-problems (2-5 per parent, MECE within parent)
   - Level 3: Leaf-level tasks (actionable, estimable)

4. **MECE validation check.** For each level:
   - **Mutual exclusivity test**: For each pair of siblings, ask: "Could solving sub-problem A partially solve sub-problem B?" If yes, they overlap -- redefine boundaries.
   - **Exhaustiveness test**: Ask: "If ALL these sub-problems are solved, is the original problem fully solved?" If no, something is missing -- identify the gap.

5. **Tag each leaf node** with:
   - Estimated effort (hours/days/weeks)
   - Required skills/expertise
   - Known risks or uncertainties
   - Priority (must-have vs. nice-to-have)

**Output:** Hierarchical decomposition tree with MECE validation at each level, leaf nodes tagged with effort/skills/risks.

**Quality gate:** At least 3 sub-problems at level 1. MECE validation passes at every level. Every leaf node has an effort estimate. No sub-problem is larger than 30% of the total effort (otherwise it needs further decomposition).

---

### Phase 3: SEQUENCE -- Map Dependencies and Critical Path

**Entry criteria:** MECE decomposition tree is complete with leaf-level tasks.

**Actions:**

1. **Identify dependencies.** For each leaf-level sub-problem, ask:
   - What must be DONE before this can start? (predecessors)
   - What does this ENABLE? (successors)
   - What can run in PARALLEL with this? (independent tasks)

   Dependency types:
   - **Finish-to-Start (FS)**: B cannot start until A finishes (most common)
   - **Start-to-Start (SS)**: B can start when A starts (parallel with shared trigger)
   - **Finish-to-Finish (FF)**: B cannot finish until A finishes (parallel with shared completion)

2. **Build the dependency graph.** Represent as a directed acyclic graph (DAG). If you find a cycle (A depends on B, B depends on C, C depends on A), the decomposition is wrong -- break the cycle by:
   - Splitting one sub-problem into independent phases
   - Identifying the actual dependency (often it's partial, not total)

3. **Compute the critical path.** The critical path is the longest chain of dependent tasks from start to finish. It determines the minimum possible completion time.
   ```
   Critical Path: A (2 weeks) -> C (1 week) -> F (3 weeks) -> G (1 week) = 7 weeks minimum
   Parallel work: B (3 weeks), D (2 weeks), E (1 week) -- these fit within the 7-week window
   ```
   Tasks ON the critical path have zero slack. Any delay on these delays the entire project.
   Tasks OFF the critical path have slack (float). They can be delayed without delaying the project.

4. **Identify parallelization opportunities.** Which sub-problems can be worked on simultaneously?
   - Maximum parallelism = number of independent task chains
   - Resource constraints may limit actual parallelism (only 3 developers, not 10)

5. **Flag bottlenecks.** A bottleneck is a task where multiple dependency chains converge:
   - Multiple downstream tasks depend on it
   - It sits on the critical path
   - It requires specialized expertise or resources
   - Bottlenecks deserve extra attention: earlier start, more resources, risk mitigation

**Output:** Dependency graph (DAG), critical path with durations, parallel work opportunities, bottleneck flags.

**Quality gate:** No cycles in the dependency graph. Critical path identified with total duration. Every dependency is justified (not just assumed).

---

### Phase 4: PLAN -- Generate the Execution Roadmap

**Entry criteria:** Dependencies and critical path are mapped.

**Actions:**

1. **Phase the work.** Group tasks into execution phases based on dependencies:
   - Phase 1: Tasks with no predecessors (can start immediately)
   - Phase 2: Tasks whose predecessors are all in Phase 1
   - Phase N: Tasks whose predecessors are all in Phase N-1 or earlier

2. **Assign milestones.** For each phase, define:
   - **Entry milestone**: What must be true to start this phase
   - **Exit milestone**: What must be true to declare this phase complete
   - **Deliverable**: What tangible artifact does this phase produce

3. **Estimate timelines.** For each task:
   - Best case (everything goes right): multiply effort by 0.7
   - Expected case (normal conditions): use the effort estimate as-is
   - Worst case (things go wrong): multiply effort by 1.5-2.5
   - Report the expected case as the plan, but flag tasks where worst case would blow the timeline

4. **Assign ownership.** For each task:
   - Who has the skills to do this?
   - Who has the capacity?
   - Who is accountable for completion?
   - If no owner is available, flag as a resource gap

5. **Risk-tag critical path items.** For each critical path task:
   - What could go wrong?
   - What is the mitigation plan?
   - What is the contingency if mitigation fails?
   - Can the critical path be shortened? (fast-tracking, crashing, scope reduction)

**Output:** Phased execution roadmap with milestones, timelines (expected + worst case), ownership, risk flags.

**Quality gate:** Every task has an owner (or is flagged as unowned). Every phase has entry/exit milestones. Critical path tasks have risk mitigations. Total timeline matches or exceeds critical path duration.

---

### Phase 5: VALIDATE -- Verify Completeness

**Entry criteria:** Execution roadmap is complete.

**Actions:**

1. **Completeness check.** Re-examine the original problem statement and success criteria:
   - For each success criterion, trace which sub-problems contribute to achieving it
   - If any success criterion has no sub-problems mapped to it, the decomposition has a gap
   - If any sub-problem doesn't map to any success criterion, it may be unnecessary (or the criteria are incomplete)

2. **MECE re-validation.** Review the decomposition with fresh eyes:
   - Are there overlaps that became visible only after sequencing?
   - Are there gaps that the dependency analysis revealed?
   - Has scope crept during the decomposition process?

3. **Stakeholder coverage check.** For each stakeholder:
   - Are their concerns addressed by at least one sub-problem?
   - Were any stakeholders discovered during decomposition that weren't in the original input?

4. **Sanity checks:**
   - **Effort check**: Does total estimated effort seem reasonable for the problem scope?
   - **Resource check**: Does the plan require resources that don't exist?
   - **Timeline check**: Is the expected completion date acceptable given constraints?
   - **Risk check**: Are there single points of failure that could collapse the entire plan?

5. **Document assumptions.** Every decomposition embeds assumptions. Make them explicit:
   - "We assume the database team has capacity in Q3"
   - "We assume the API contract won't change"
   - "We assume regulatory approval takes 6 weeks"
   - Assumptions are risks. Each assumption should have a validation plan.

**Output:** Completeness validation report: success criteria coverage, MECE re-validation results, stakeholder coverage, sanity check results, documented assumptions.

**Quality gate:** Every success criterion maps to at least one sub-problem. No MECE violations found. All major assumptions documented. Stakeholder concerns are covered.

## Exit Criteria

The skill is DONE when:
1. The decomposition tree passes MECE validation at all levels
2. The critical path is identified with total duration
3. Every leaf-level task has effort, owner, and priority
4. Completeness validation shows no gaps in success criteria coverage
5. All assumptions are documented

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| CAPTURE | Problem statement is too vague even after 5 Whys | Escalate -- ask stakeholders for specific examples, symptoms, or metrics |
| CAPTURE | Problem is "wicked" (definition shifts during analysis) | Adjust -- decompose iteratively, accept that the tree will evolve, version the decomposition |
| DECOMPOSE | Cannot achieve MECE (inherent overlap) | Adjust -- assign overlap to one sub-problem explicitly, document the boundary decision |
| DECOMPOSE | Decomposition produces 20+ leaf nodes | Adjust -- increase hierarchy depth, group related leaves under new intermediate nodes |
| SEQUENCE | Circular dependency detected | Adjust -- split one of the tasks into independent phases to break the cycle |
| PLAN | No owner available for critical path task | Escalate -- flag as blocking resource gap, recommend hire/contract/reassignment |
| VALIDATE | Success criterion has no mapped sub-problem | Retry -- return to DECOMPOSE phase with the gap identified |
| VALIDATE | User rejects final output | **Targeted revision** -- ask which sub-problem, root cause, or sequencing fell short and rerun only that decomposition phase. Do not restart the full problem tree. |

## State Persistence

- Decomposition templates (successful MECE decompositions by problem type -- reusable starting points for similar problems)
- Effort estimation calibration (estimated vs actual effort per sub-problem category -- improves future estimates)
- Complexity indicators (which problem characteristics predicted high complexity -- refines classification heuristics)
- Common sub-problem patterns (recurring leaf-level tasks that appear across multiple decompositions)
- Critical path accuracy (predicted vs actual critical path durations -- calibrates timeline estimates)
- Assumption validation log (which assumptions proved true or false -- builds an institutional knowledge base of reliable vs unreliable assumptions)

---

## Reference

### MECE Decomposition (McKinsey Method)

MECE (pronounced "me-see") is the foundation of structured problem-solving, developed at McKinsey & Company. The principle is simple: when you break a problem into parts, the parts must not overlap (mutually exclusive) and must cover everything (collectively exhaustive).

**Why MECE matters:**
- Without mutual exclusivity: double-counting effort, unclear ownership, conflicting solutions
- Without collective exhaustiveness: gaps in the solution, blind spots, surprised stakeholders

**Common MECE frameworks:**

| Framework | Use When | Example |
|---|---|---|
| Profit = Revenue - Cost | Financial problems | Why is profit declining? Revenue problem or cost problem? |
| Internal vs. External | Diagnostic problems | Is the issue within our control or market-driven? |
| Current vs. Future | Strategic problems | Optimize what we have vs. build what we need |
| Build vs. Buy vs. Partner | Technology decisions | In-house development vs. vendor vs. partnership |
| People, Process, Technology | Organizational problems | Which lever needs to change? |

### Issue Trees

An issue tree is the visual representation of MECE decomposition. It looks like an org chart, but for problems:

```
Root Problem
├── Branch A (30% of problem)
│   ├── Leaf A1 (task)
│   ├── Leaf A2 (task)
│   └── Leaf A3 (task)
├── Branch B (50% of problem)
│   ├── Leaf B1 (task)
│   └── Leaf B2 (task)
└── Branch C (20% of problem)
    ├── Leaf C1 (task)
    └── Leaf C2 (task)
```

**Rules for good issue trees:**
1. Every node must be MECE with its siblings
2. Maximum 7 children per node (cognitive limit)
3. Maximum 4 levels deep (beyond that, you lose the forest for the trees)
4. Leaf nodes must be actionable (can assign to a person)
5. Branch percentages should roughly sum to 100% (effort allocation guide)

### Hypothesis-Driven Structuring

Instead of decomposing into "investigate areas," decompose into testable hypotheses. This is faster because you can disconfirm hypotheses quickly:

```
Instead of: "Investigate why users are churning"
Do: "H1: Users churn because onboarding is too complex (test: compare churn rate for users who completed onboarding vs. didn't)"
```

Each hypothesis should be:
- **Specific**: Identifies a cause and mechanism
- **Testable**: Can be confirmed or disconfirmed with available data
- **Actionable**: If true, implies a specific solution

### 5 Whys Protocol

Originally from Toyota Production System. Rules for effective 5 Whys:
1. Start with a specific, observable problem (not a vague complaint)
2. Each "Why?" answer must be factual, not speculative
3. If a "Why?" has multiple answers, branch the tree (each answer gets its own chain)
4. Stop when you reach something you can control or change (the root cause)
5. The answer at level 5 is often organizational or procedural, not technical

**Common mistake:** Stopping at the technical cause when the root cause is process or culture. "The server crashed because we didn't test the new code" -- why didn't we test? "Because there's no CI/CD pipeline" -- that's the actionable root cause.

### First Principles Thinking

Strip away analogies and conventions. Ask: "What do we know to be absolutely true about this problem?" Build up from there.

**Procedure:**
1. Identify the assumptions embedded in the current approach
2. Challenge each assumption: "Is this necessarily true, or is it convention?"
3. List the fundamental truths (physics, math, human nature, economics)
4. Reconstruct a solution from only the fundamental truths

**When to use first principles vs. analogy:**
- Use analogy when the problem is well-understood and solutions exist (most problems)
- Use first principles when the problem is novel, existing solutions are failing, or costs must be reduced by 10x (not 10%)

### Critical Path Method (CPM)

Developed in the 1950s for managing complex projects. The critical path determines the minimum project duration.

**Calculating CPM:**
1. List all tasks with durations
2. Map dependencies (DAG)
3. Forward pass: compute earliest start (ES) and earliest finish (EF) for each task
4. Backward pass: compute latest start (LS) and latest finish (LF) for each task
5. Float = LS - ES (zero float = critical path)

**Using CPM:**
- Critical path tasks get priority attention, resources, and risk mitigation
- Non-critical tasks can be delayed up to their float without affecting the project end date
- To shorten the project, you must shorten the critical path (shortening non-critical tasks does nothing)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
