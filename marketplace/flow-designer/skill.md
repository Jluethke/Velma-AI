# Chain Designer

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Takes a complex goal and a list of available skills, then designs an optimal chain (DAG pipeline) connecting them. Identifies which skills to chain, what order to run them, what data flows between steps, and where parallel execution is possible. Outputs a .chain.json definition ready to execute. The meta-skill for building new chains.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INTAKE      --> Parse the goal and inventory available skills
PHASE 2: MAP         --> Match goal requirements to skill capabilities
PHASE 3: CONNECT     --> Design the data flow graph between skills
PHASE 4: OPTIMIZE    --> Identify parallel paths and eliminate redundancy
PHASE 5: EXPORT      --> Produce the .chain.json definition
```

## Inputs

- `goal`: string -- The complex goal to achieve, described in plain English.
- `available_skills`: object[] -- List of available skills, each with: name, inputs, outputs, description.
- `constraints`: object (optional) -- Execution constraints: max_steps, max_parallel, timeout_per_step, required_skills, excluded_skills.
- `existing_data`: object (optional) -- Data already available that can serve as input to any step (skip skills that would produce it).

## Outputs

- `chain_definition`: object -- The .chain.json file: steps, edges, data mappings, parallel groups.
- `coverage_report`: object -- Which goal requirements are covered by which skills, and any gaps.
- `execution_plan`: object -- Human-readable execution order with estimated cost and parallelism diagram.
- `missing_skills`: string[] -- Skills that would be needed but are not in the available list.

---

## Execution

### Phase 1: INTAKE -- Parse Goal and Inventory Skills

**Entry criteria:** A goal and at least 3 available skills are provided.

**Actions:**

1. Decompose the goal into discrete requirements. A requirement is a specific thing that must be true or produced for the goal to be met. Example: "Launch a product" decomposes into: market research done, positioning defined, landing page built, pricing set, launch plan written.
2. For each requirement, identify the type: research (needs information gathered), creation (needs artifact produced), analysis (needs evaluation performed), decision (needs choice made).
3. Inventory each available skill: list its inputs (what it needs), outputs (what it produces), and domain (what it's for). Build a capability map.
4. Identify data types in play: what kinds of data flow through this system? (e.g., "customer persona," "risk register," "content draft").

**Output:** Requirements list with types, skill capability map, data type inventory.

**Quality gate:** Every requirement has a type. Every skill has inputs and outputs cataloged. At least one skill matches at least one requirement.

---

### Phase 2: MAP -- Match Requirements to Skills

**Entry criteria:** Requirements and skill capabilities are cataloged.

**Actions:**

1. For each requirement, find skills whose outputs satisfy it. A skill satisfies a requirement if its output type matches what the requirement needs.
2. For each match, assess fit: does the skill fully satisfy the requirement, or only partially? Partial matches need supplementation.
3. Identify requirements with no matching skill. These are gaps — report them as missing_skills.
4. Identify skills that satisfy multiple requirements (high-value nodes in the chain).
5. Identify skills whose outputs serve as inputs to other skills (natural chain links).
6. If existing_data is provided, mark any requirements already satisfied and skip the skills that would produce that data.

**Output:** Requirement-to-skill mapping, gap list, multi-use skill identification.

**Quality gate:** Every requirement is either mapped to a skill, partially mapped with gap noted, or flagged as unmet. No requirement is silently ignored.

---

### Phase 3: CONNECT -- Design the Data Flow Graph

**Entry criteria:** Requirement-to-skill mapping is complete.

**Actions:**

1. Build the DAG: each skill is a node. Draw an edge from skill A to skill B when A's output is B's input. Label each edge with the data type flowing through it.
2. Identify the entry nodes: skills that require only the initial inputs (goal description, existing data) and no output from other skills.
3. Identify the terminal nodes: skills whose outputs are final deliverables, not consumed by other skills.
4. For each edge, define the data mapping: which specific output field from skill A maps to which specific input field of skill B. If the types do not match exactly, note a transform step.
5. Validate the graph: no cycles (it must be a DAG). Every node is reachable from an entry node. Every terminal node produces a goal requirement.
6. Handle partial matches from Phase 2: insert transform steps or manual review gates where skill outputs need adaptation before feeding the next skill.

**Output:** DAG definition with nodes, edges, data mappings, and transform steps.

**Quality gate:** The graph is acyclic. Every non-entry node has at least one incoming edge. Every non-terminal node has at least one outgoing edge. All data mappings specify field-level connections.

---

### Phase 4: OPTIMIZE -- Parallelize and Simplify

**Entry criteria:** DAG is valid and complete.

**Actions:**

1. Identify parallel groups: skills with no dependency between them that can run simultaneously. Group them into parallel execution layers.
2. Calculate the critical path: the longest chain of sequential dependencies. This determines minimum execution time.
3. Check for redundancy: are any two skills producing the same output? If so, keep the one with fewer dependencies and remove the other.
4. Apply constraints: if max_parallel is set, split parallel groups to respect it. If max_steps is set, identify skills to merge or drop (lowest priority first).
5. Estimate cost: sum the credit cost of all skills in the chain. Note which skills are the most expensive.
6. Draw the execution plan: layer-by-layer diagram showing what runs in parallel and what runs sequentially, with estimated time per layer.

**Output:** Optimized DAG, parallel groups, critical path, cost estimate, execution diagram.

**Quality gate:** No constraint is violated. Parallel groups contain only independent skills. Critical path is correctly identified (longest sequential chain).

---

### Phase 5: EXPORT -- Produce .chain.json

**Entry criteria:** Optimized DAG passes all checks.

**Actions:**

1. Generate the .chain.json with this structure:
   - `name`: chain name derived from the goal
   - `description`: one-line summary of what the chain achieves
   - `steps`: array of { id, skill_name, inputs (mapped), outputs (mapped), parallel_group }
   - `edges`: array of { from_step, to_step, data_type, field_mapping }
   - `entry_inputs`: data required to start the chain
   - `terminal_outputs`: final deliverables produced
   - `parallel_groups`: array of step ID arrays that can run simultaneously
   - `estimated_cost`: total credits
   - `critical_path`: ordered step IDs on the longest sequential path
2. Generate the human-readable execution plan as a companion document.
3. List missing skills with descriptions of what they would need to do, so the user can find or build them.

**Output:** .chain.json definition, execution plan document, missing skills list.

**Quality gate:** .chain.json references only skills from the available_skills input. Every step has valid input/output mappings. The chain achieves the stated goal (all non-gap requirements are covered).

---

## Exit Criteria

The skill is DONE when:
- A valid .chain.json is produced with no cyclic dependencies
- Every goal requirement is either covered by a skill in the chain or listed as a gap
- Data mappings between skills are field-level specific
- Parallel execution opportunities are identified
- The execution plan is readable by a non-technical user

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| INTAKE | Fewer than 3 skills provided | **Adjust** -- proceed but warn that the chain will likely have gaps |
| MAP | More than 50% of requirements have no matching skill | **Abort** -- the available skill set is insufficient. List what is missing so the user can acquire or build them |
| CONNECT | Cycle detected in the graph | **Adjust** -- identify the cycle, break it at the weakest edge (least critical data dependency), insert a manual checkpoint |
| OPTIMIZE | Constraints make the chain infeasible (e.g., max_steps < critical path length) | **Adjust** -- relax constraints and note which ones were violated, or merge skills to reduce step count |
| EXPORT | A skill referenced in the chain has been removed from available_skills | **Retry** -- re-run from Phase 2 with the updated skill list |
| ACT | User rejects the chain definition or requests significant structural changes | **Adjust** -- incorporate specific feedback (e.g., wrong skill order, missing parallel path, incorrect data mapping), update the affected DAG edges and execution plan, and regenerate the .chain.json; do not restart from Phase 1 unless the goal itself has changed |
| ACT | User rejects final output | **Targeted revision** -- ask which skill connection, data mapping, or parallel path fell short and regenerate only the affected chain sections. Do not restart from Phase 1. |

---

## Reference

### DAG Validity Rules

A valid chain graph must satisfy all of the following:
1. **No cycles** — every path through the graph has a definite end; no skill can depend on its own output (directly or transitively)
2. **Reachable nodes** — every skill is reachable from at least one entry node
3. **Productive terminal nodes** — every terminal (no outgoing edges) produces at least one goal requirement
4. **Complete data mappings** — every edge specifies which output field from the source skill maps to which input field of the target skill

### Parallelism Decision Rule

Two skills can run in parallel if and only if:
- Neither skill's input depends on the other skill's output (no edge between them in either direction)
- They do not share a mutable state resource (e.g., both writing to the same file)

### Critical Path Calculation

The critical path is the longest chain of sequential dependencies from any entry node to any terminal node. Minimum execution time = sum of latencies along the critical path (not the sum of all skills).

### Skill Compatibility Matrix

When connecting two skills, verify:
| Check | Pass Condition |
|---|---|
| Output type → Input type | Types match (or a transform step is inserted) |
| Cardinality | Skill A produces one object; Skill B expects one object (not an array) |
| Required fields | All required input fields of Skill B are produced by Skill A or already in existing_data |
| Optional fields | Optional fields that improve Skill B's output are noted but not blocking |

### Gap Severity Classification

| Gap Type | Severity | Action |
|---|---|---|
| Requirement has no matching skill | Critical | List in missing_skills; block chain export |
| Requirement partially covered (skill covers 60-80% of need) | Major | Note in coverage_report; add manual review gate |
| Data transform needed between skills | Minor | Insert transform step; document in execution plan |
| Skill exists but is lower confidence | Low | Include with confidence note |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
