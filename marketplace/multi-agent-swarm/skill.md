# Multi-Agent Swarm Coordination

Design and build self-recursive multi-agent systems with goal-driven task generation, priority-based dispatch, specialist spawning, and trust-bounded execution.

## Execution Pattern: Phase Pipeline

```
PHASE 1: DEFINE        --> Define agents, roles, capabilities, domains
PHASE 2: COORDINATE    --> Design routing, trust inheritance, concurrency limits
PHASE 3: IMPLEMENT     --> Build agent lifecycle, task planner, dispatch loop
PHASE 4: VALIDATE      --> Test agent interactions, verify trust propagation
PHASE 5: OPTIMIZE      --> Performance tuning, goal evolution, self-directed learning
```

## Inputs

- **agent_definitions**: list[object] -- Agent roles, domains, and capabilities to implement
- **task_types**: list[string] -- Types of tasks the swarm will handle
- **governance_config**: object (optional) -- Trust levels, phase gating, constraint enforcement
- **concurrency_limits**: object (optional) -- Max workers, specialists, subtasks per specialist

## Outputs

- **agent_registry**: object -- Registered agents with descriptors, domains, and capabilities
- **dispatch_system**: object -- Task planner + coordinator with routing algorithm
- **lifecycle_manager**: object -- Agent state machine with governance gating
- **swarm_config**: object -- All parameters, limits, and integration points

## Execution

### Phase 1: DEFINE -- Agents, Roles, Capabilities
**Entry criteria:** A multi-agent need has been identified with at least 2 distinct agent roles.
**Actions:**
1. Define each agent using the AgentProtocol interface (PEP 544):
   ```python
   @runtime_checkable
   class AgentProtocol(Protocol):
       @property
       def descriptor(self) -> AgentDescriptor: ...
       @property
       def state(self) -> AgentState: ...
       def execute(self, task: Task) -> Task: ...
       def heartbeat(self) -> bool: ...
   ```
2. Assign domains and capabilities to each agent
3. Implement BaseAgent pattern for each concrete agent:
   - Override `execute_task(task) -> Task` with domain logic
   - Base `execute()` handles: terminated check, governance gate, state transitions, performance counters, exception handling
4. Define the agent state machine:
   ```
   IDLE -> ACTIVE -> IDLE (success/failure)
   IDLE -> SUSPENDED -> IDLE (resume)
   ACTIVE -> SUSPENDED (pause mid-work)
   Any -> TERMINATED (irreversible)
   ```
**Output:** Agent definitions with descriptors, domain mappings, and concrete implementations.
**Quality gate:** Every agent implements AgentProtocol. Every agent has at least one domain or capability. State machine transitions are valid (no TERMINATED -> anything).

### Phase 2: COORDINATE -- Routing & Trust
**Entry criteria:** Agent definitions complete with domains and capabilities.
**Actions:**
1. Design the task routing algorithm (priority cascade, first match wins):
   ```
   1. Domain match:     registry.find_by_domain(task.domain)
   2. Capability match: registry.find_by_capability(task.domain)
   3. Idle fallback:    registry.find_idle()
   4. Any available:    all non-terminated agents
   ```
   Within each tier, select agent with highest `success_rate`.
2. Define trust inheritance rules:
   ```python
   trust_ceiling = min(config.parent_trust, identity.autonomy)
   # Trust flows DOWN, never UP
   ```
3. Configure specialist spawning limits:
   - MAX_ACTIVE_SPECIALISTS: 4 concurrent
   - MAX_SUBTASKS_PER_SPECIALIST: 3 per specialist
   - Timeout: 10-600 seconds (configurable, default 300)
4. Design agent-to-agent task creation:
   ```python
   task_id = coordinator.submit_from_agent(agent_id, description, domain, priority, parent_task_id)
   ```
5. Set concurrency parameters: `max_per_tick=1`, `max_workers=4`
**Output:** Routing algorithm, trust inheritance rules, specialist config, concurrency parameters.
**Quality gate:** Routing has a fallback for every scenario (no task gets permanently stuck). Trust can never flow upward. Specialist limits are finite.

### Phase 3: IMPLEMENT -- Lifecycle & Dispatch
**Entry criteria:** Routing algorithm and trust rules defined.
**Actions:**
1. Build the TaskPlanner with governance gating:
   - `submit(task)`: Governance gate (only NOMINAL and DEGRADED allow submissions)
   - `decompose(parent_id, subtasks)`: Break parent into children with links
   - `get_next_dispatchable(domain)`: Highest-priority PENDING task without unresolved subtasks
   - Priority sorting: CRITICAL > HIGH > MEDIUM > LOW > BACKGROUND, FIFO within tier
2. Build the SwarmCoordinator dispatch cycle:
   ```
   dispatch_cycle():
     1. Governor gate (skip entire tick if can't accept tasks)
     2. Pull next task from planner
     3. Self-recursive generation if queue empty (create exercises from goals)
     4. Route to best agent via cascade algorithm
     5. Dispatch: assign task, execute, process result
     6. Learning feedback: LearningLoop + GoalManager + RewardLoop
   ```
3. Implement parent-child auto-completion:
   - All subtasks completed -> parent auto-completes
   - Any subtask failed -> parent auto-fails
4. Build specialist spawning:
   ```
   spawn(config) -> SpecialistAgent -> ThreadPoolExecutor -> background execution -> result -> learning
   ```
5. Wire event bus integration (TASK_DISPATCHED, TASK_COMPLETED, TASK_FAILED, GOAL_EVOLVED, SPECIALIST_SPAWNED, SPECIALIST_COMPLETED)
**Output:** Working task planner, coordinator, specialist spawner, and event integration.
**Quality gate:** Governance gate blocks tasks in restricted phases. Priority dispatch is deterministic. Parent-child completion propagates correctly. Events fire on all state transitions.

### Phase 4: VALIDATE -- Test Interactions
**Entry criteria:** All components implemented and wired.
**Actions:**
1. Test agent state transitions:
   - IDLE -> ACTIVE -> IDLE on success
   - IDLE -> ACTIVE -> IDLE on failure (agent survives, not terminated)
   - TERMINATED agent rejects all tasks immediately
2. Test routing cascade:
   - Domain-matched agent receives task first
   - Falls back correctly through capability -> idle -> any
   - No agent found -> task stays in queue, counter increments
3. Test trust propagation:
   - Specialist trust never exceeds parent trust
   - Specialist trust never exceeds system autonomy
4. Test parent-child task completion:
   - All children done -> parent completes
   - One child fails -> parent fails
5. Test governance gating:
   - NOMINAL/DEGRADED: tasks accepted
   - FROZEN/higher: tasks denied, counter increments
6. Test self-recursive generation:
   - Queue empty -> exercises generated from goals -> queue has tasks
**Output:** Test results confirming all interactions work correctly.
**Quality gate:** All state transitions valid. Routing never hangs. Trust never flows upward. Parent completion is deterministic. Governance gate blocks appropriately.

### Phase 5: OPTIMIZE -- Performance & Evolution
**Entry criteria:** All tests passing, basic swarm operational.
**Actions:**
1. Tune dispatch parameters:
   - `exercises_per_empty_tick`: 2 (exercises generated when queue empty)
   - `goal_evolution_interval`: 25 (completed exercises before goals can evolve)
   - `max_per_tick`: 1 (tasks dispatched per tick cycle)
2. Wire goal evolution:
   ```python
   # Every 25 exercises: check if goals should evolve
   if exercises_generated % 25 == 0:
       new_goals = goal_manager.maybe_evolve_goals()
   ```
3. Wire learning feedback loop:
   ```python
   learning_loop.learn_from_task(description, result, success, domain, reasoning_source="swarm", confidence)
   goal_manager.update_from_learning(domain, success)
   exercise_generator.record_completion(exercise)
   ```
4. Add performance tracking: success_rate per agent, no_agent_found counter, dispatch latency
5. Connect to TickEngine: `engine.set_task_evaluator(coordinator.dispatch_cycle)`
**Output:** Optimized swarm with self-directed learning, goal evolution, and performance metrics.
**Quality gate:** Learning loop closes (task outcomes feed back into goal evolution). Performance metrics are being collected. TickEngine drives the dispatch cycle.

## Exit Criteria

- All agents registered with valid descriptors, domains, and capabilities
- Routing cascade handles all scenarios (match, fallback, no agent)
- Trust inheritance enforced (never flows upward)
- Governance gating blocks tasks in restricted phases
- Parent-child completion propagates correctly
- Self-recursive generation produces tasks when queue is empty
- Learning feedback closes the loop (outcomes -> goals -> exercises -> tasks)

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| DEFINE | Agent doesn't implement AgentProtocol | **Abort** -- protocol compliance is mandatory |
| COORDINATE | No routing path for a task domain | **Adjust** -- add fallback to idle/any agent tier |
| IMPLEMENT | Governance gate blocks all work | **Skip** -- wait for governance phase to allow tasks |
| VALIDATE | Trust leaks upward in specialist chain | **Abort** -- trust violation is a security issue, fix before proceeding |
| OPTIMIZE | Goal evolution produces degenerate goals | **Adjust** -- reset goals to defaults, increase evolution interval |
| OPTIMIZE | User rejects final output | **Targeted revision** -- ask which agent role, routing logic, or coordination pattern fell short and rerun only that design phase. Do not redesign the full swarm. |

## State Persistence

- Agent registry (agent descriptors, domains, capabilities, performance counters)
- Task planner state (pending/running/completed tasks, parent-child links)
- Goal manager state (active goals, progress counters, evolution history)
- Specialist results (completed specialist outputs for learning)

## Reference

### The Self-Recursive Loop

```
GoalManager.active_goals()
  -> ExerciseGenerator.generate_batch(N)
  -> TaskPlanner.submit(task)
  -> SwarmCoordinator.dispatch_cycle()
  -> Agent.execute(task)
  -> RewardLoop.evaluate(completed_task)
  -> LearningLoop.learn_from_task()
  -> GoalManager.update_from_learning(domain, success)
  -> GoalManager.maybe_evolve_goals()  [every 25 exercises]
  -> (next tick, queue empty) -> GoalManager.active_goals() ...
```

### Key Parameters

- `exercises_per_empty_tick`: 2
- `goal_evolution_interval`: 25
- `max_per_tick`: 1
- `max_workers`: 4
- MAX_ACTIVE_SPECIALISTS: 4
- MAX_SUBTASKS_PER_SPECIALIST: 3
- Specialist timeout: 10-600 seconds (default 300)

### Priority Mapping

```python
PRIORITY_VALUES = {
    TaskPriority.CRITICAL: 5,
    TaskPriority.HIGH: 4,
    TaskPriority.MEDIUM: 3,
    TaskPriority.LOW: 2,
    TaskPriority.BACKGROUND: 1,
}

# Exercise difficulty -> task priority:
difficulty >= 0.7 -> HIGH
difficulty >= 0.4 -> MEDIUM
else             -> LOW
```

### Implementation Checklist

1. Define AgentProtocol -- descriptor, state, execute(task), heartbeat()
2. Implement BaseAgent -- override execute_task() with domain logic
3. Create AgentRegistry -- find_by_domain(), find_by_capability(), find_idle(), all_agents()
4. Build TaskPlanner -- submit(), decompose(), get_next_dispatchable(), complete(), fail()
5. Wire SwarmCoordinator -- registry + planner + reward_loop + event_bus
6. Optional: GoalManager + ExerciseGenerator for self-recursive autonomy
7. Optional: SpecialistSpawner for multi-domain decomposition
8. Optional: SystemGovernor for governance gating
9. Connect to TickEngine -- engine.set_task_evaluator(coordinator.dispatch_cycle)
