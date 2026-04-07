# Task Decomposition -- ORPA Hierarchical Task Planning

Break complex goals into trackable subtask trees with priority-based dispatch, automatic parent completion, failure propagation, and governance gating.

## Execution Pattern: Phase Pipeline

```
PHASE 1: CAPTURE       --> Define root task, identify subtask candidates
PHASE 2: DECOMPOSE     --> Break into ORPA subtasks with dependencies
PHASE 3: PRIORITIZE    --> Assign priorities, resolve dependency order
PHASE 4: DISPATCH      --> Route tasks to appropriate handlers/agents
PHASE 5: TRACK         --> Monitor completion, propagate failures to parents
```

## Inputs

- **root_task**: object -- The top-level task to decompose (description, domain, initial priority)
- **governor**: object (optional) -- SystemGovernor for phase-based gating
- **max_depth**: int (optional) -- Maximum decomposition depth (default: 3 levels)

## Outputs

- **task_tree**: object -- Hierarchical task structure with parent-child links
- **dispatch_order**: list[object] -- Tasks sorted by priority for sequential dispatch
- **completion_status**: object -- Final status of root task (propagated from children)

## Execution

### Phase 1: CAPTURE -- Define Root Task
**Entry criteria:** A goal or task description exists that may benefit from decomposition.
**Actions:**
1. Create the root task as a frozen dataclass:
   - task_id, description, domain, priority, status=PENDING
   - parent_task_id=None (root has no parent)
   - subtask_ids=[] (populated during decomposition)
2. Apply governance gating if governor is wired:
   - Only NOMINAL and DEGRADED phases allow new task submissions
   - Higher severity phases block work intake
   - Denied submissions are counted for diagnostics
3. Map confidence to priority:
   - confidence >= 0.8 -> HIGH
   - confidence >= 0.5 -> MEDIUM
   - else -> LOW
4. Identify subtask candidates by analyzing the task description for decomposable elements
**Output:** Root task registered with task_id, or empty string if governance denied submission.
**Quality gate:** Root task has a valid task_id. Governance gate checked. Priority assigned based on confidence mapping.

### Phase 2: DECOMPOSE -- Break into Subtasks
**Entry criteria:** Root task registered successfully (governance allowed submission).
**Actions:**
1. Analyze the root task for decomposable subtasks using ORPA reasoning:
   - **Observe**: What does this task require?
   - **Reason**: What are the independent sub-problems?
   - **Plan**: What order must they execute in?
   - **Act**: Create the subtask definitions
2. Call `decompose(parent_task_id, subtask_descriptions)`:
   - Each subtask gets: description, priority, domain (inherited from parent)
   - Each subtask linked to parent via parent_task_id
   - Parent gets subtask_ids list populated
   - Parent status set to RUNNING
3. Respect max_depth -- do not decompose beyond configured depth
4. Each subtask is itself a frozen dataclass (immutable, audit-friendly)
**Output:** Subtask tree with parent-child links. Parent status set to RUNNING.
**Quality gate:** All subtasks have valid parent links. Parent has all subtask_ids. Depth does not exceed max_depth. All tasks are frozen dataclasses (no mutation bugs).

### Phase 3: PRIORITIZE -- Assign Order
**Entry criteria:** Subtask tree created with all parent-child links.
**Actions:**
1. Assign priorities using PRIORITY_VALUES:
   ```python
   PRIORITY_VALUES = {
       TaskPriority.CRITICAL: 5,
       TaskPriority.HIGH: 4,
       TaskPriority.MEDIUM: 3,
       TaskPriority.LOW: 2,
       TaskPriority.BACKGROUND: 1,
   }
   ```
2. Sort by priority descending (CRITICAL first), then FIFO within same priority level
3. Resolve dependency order:
   - Tasks with subtask_ids (parents waiting on children) are NOT dispatchable
   - Only leaf tasks (no subtask_ids) are dispatchable
4. Build the dispatch order: `get_next_dispatchable(domain="")` returns highest-priority PENDING task without unresolved subtasks
**Output:** Prioritized dispatch order with dependency resolution.
**Quality gate:** No parent task appears before its children in dispatch order. FIFO ordering preserved within priority tiers. Only leaf tasks are marked dispatchable.

### Phase 4: DISPATCH -- Route to Handlers
**Entry criteria:** Dispatch order computed with all dependencies resolved.
**Actions:**
1. For each dispatchable task in priority order:
   - Re-check governance gate (phase may have changed since submission)
   - Route to appropriate handler/agent (domain match -> capability match -> idle -> any)
   - Mark task as RUNNING, assign handler
2. Execute the task via the assigned handler
3. On completion: call `complete(task_id)`, set status=COMPLETED
4. On failure: call `fail(task_id)`, set status=FAILED with error details
5. Emit events for observability:
   - TASK_DISPATCHED when assigned
   - TASK_COMPLETED when finished successfully
   - TASK_FAILED when failed
**Output:** Tasks dispatched and executed with completion/failure status recorded.
**Quality gate:** Every dispatched task has an assigned handler. Events emitted for all state transitions. Failed tasks have error details recorded.

### Phase 5: TRACK -- Monitor & Propagate
**Entry criteria:** Tasks are being dispatched and completing/failing.
**Actions:**
1. Monitor subtask completion for each parent:
   ```python
   check_parent_completion(parent_id):
       if all subtasks in (COMPLETED, FAILED, CANCELLED):
           if any FAILED: fail(parent_id)
           else: complete(parent_id)
   ```
2. Propagate failures upward:
   - Any subtask failed -> parent auto-fails with "One or more subtasks failed"
   - This cascades up through the tree to the root
3. Propagate completion upward:
   - All subtasks completed -> parent auto-completes
   - Root task completion = entire decomposition succeeded
4. Track metrics:
   - Tasks submitted, completed, failed, denied by governance
   - Average completion time per priority level
   - Decomposition depth statistics
**Output:** Root task with final completion/failure status propagated from all children.
**Quality gate:** No orphaned tasks (every task has a terminal status or is still running). Root task status accurately reflects the outcome of all its children. Metrics collected.

## Exit Criteria

- Root task has a terminal status (COMPLETED or FAILED)
- All subtasks have terminal statuses
- Parent-child completion propagation is correct (all children done -> parent done)
- Failure propagation is correct (any child failed -> parent failed)
- All task state transitions emitted as events
- Governance gate respected throughout execution

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| CAPTURE | Governance denies submission | **Skip** -- return empty task_id, increment denied counter, wait for governance phase change |
| DECOMPOSE | Task is atomic (cannot decompose further) | **Skip** -- treat as leaf task, dispatch directly without children |
| PRIORITIZE | All tasks same priority (no differentiation) | **Skip** -- use FIFO ordering (insertion order) |
| DISPATCH | No handler/agent available for task domain | **Retry** -- keep task in queue, increment no_agent_found counter, try next tick |
| TRACK | Parent completion check finds inconsistent state | **Escalate** -- log inconsistency, flag for human review |

## State Persistence

- Task tree (all tasks with statuses, parent-child links, results)
- Insertion order list (for FIFO within priority tiers)
- Governance denial counter (diagnostics)
- Completion metrics (per priority level timing)

## Reference

### ORPA Cognitive Framework

ORPA = **Observe, Reason, Plan, Act**

1. **Observe**: Receive a structured intent or task description
2. **Reason**: Evaluate feasibility, map confidence to priority
3. **Plan**: Decompose into subtasks with parent/child links
4. **Act**: Dispatch the highest-priority pending task to an appropriate agent

### The Algorithm

```
submit(task):
    if governor and not governor.can_accept_tasks():
        deny and count; return ""
    store task; append to insertion-order list
    return task_id

decompose(parent_id, subtasks):
    for each (description, priority) in subtasks:
        create child task with parent_task_id = parent_id
    set parent status to RUNNING
    return subtask_ids

get_next_dispatchable(domain=""):
    candidates = [t for t in tasks
                  if t.status == PENDING
                  and (no domain filter or t.domain matches)
                  and t has no subtask_ids]
    sort by PRIORITY_VALUES desc, then FIFO
    return candidates[0]

complete(task_id):
    set status = COMPLETED
    if task has parent:
        check_parent_completion(parent_id)

check_parent_completion(parent_id):
    if all subtasks in (COMPLETED, FAILED, CANCELLED):
        if any FAILED: fail(parent_id)
        else: complete(parent_id)
```

### Key Design Decisions

- **Governance gating**: Only NOMINAL and DEGRADED phases allow new task submissions.
- **Priority dispatch**: CRITICAL > HIGH > MEDIUM > LOW > BACKGROUND, then FIFO within tier.
- **Automatic parent completion**: When all subtasks done, parent auto-completes or auto-fails.
- **Immutable task records**: Frozen dataclasses. Updates create new instances (audit-friendly).
- **Intent-to-task mapping**: confidence >= 0.8 -> HIGH, >= 0.5 -> MEDIUM, else LOW.

### Integration Points

- **Tick Engine**: The planner's dispatch loop is wired as the tick engine's task evaluator. Runs in background thread.
- **Event Bus**: Task completion/failure emits events for audit trails and learning triggers.
- **Reward Signals**: Completed tasks feed the reward computation with priority and outcome data.
