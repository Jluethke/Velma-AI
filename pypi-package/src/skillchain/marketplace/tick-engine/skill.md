# Tick Engine -- Discrete-Time Event Loop

Design and build a non-blocking, thread-safe discrete-time loop that drives a system through sequential ticks with pluggable hooks, evaluators, and observers.

## Execution Pattern: Phase Pipeline

```
PHASE 1: REQUIREMENTS  --> Identify tick rate, evaluators needed, governance hooks
PHASE 2: DESIGN        --> Define pre-hooks, task evaluator, post-hooks, observer pattern
PHASE 3: IMPLEMENT     --> Build tick loop with thread safety, background evaluation
PHASE 4: VALIDATE      --> Test timing, verify non-blocking, check governance integration
PHASE 5: MONITOR       --> Add statistics, tick latency tracking, health indicators
```

## Inputs

- **tick_rate**: float -- Seconds between ticks (e.g., 30.0 for 30-second ticks)
- **evaluators**: list[string] -- Which evaluators to wire (task, governance, resource)
- **hook_requirements**: list[object] (optional) -- Pre-tick and post-tick hooks to register
- **observer_count**: int (optional) -- Expected number of tick observers

## Outputs

- **tick_engine**: object -- Configured engine with hooks, evaluators, and observers
- **tick_snapshot**: object -- Per-tick state snapshot broadcast to all observers
- **statistics**: object -- Tick count, latency, evaluator timing, error counts

## Execution

### Phase 1: REQUIREMENTS -- Identify Needs
**Entry criteria:** A system needs a central heartbeat for multi-agent or multi-subsystem coordination.
**Actions:**
1. Determine tick rate based on system requirements:
   - Fast (1-5s): real-time monitoring, trading systems
   - Medium (10-30s): agent coordination, training loops
   - Slow (60s+): maintenance, health checks
2. Identify which evaluators are needed:
   - Task evaluator: dispatches work from the task planner (runs in background thread)
   - Governance evaluator: checks trust/phase transitions (runs inline, must be fast)
   - Resource metrics: CPU/memory utilization collection
3. Identify pre-tick hooks (state preparation, cache refresh, memory priming)
4. Identify post-tick hooks (learning loops, disk I/O, memory queries)
5. Count expected observers (subsystems that need tick snapshots)
**Output:** Tick rate, evaluator list, hook list, observer requirements.
**Quality gate:** Tick rate is finite and positive. At least one evaluator or hook is defined. Heavy operations assigned to post-tick hooks (outside lock).

### Phase 2: DESIGN -- Define Architecture
**Entry criteria:** Requirements identified with tick rate and evaluator list.
**Actions:**
1. Define the tick sequence:
   ```
   tick():
       acquire _tick_lock:
           for hook in pre_tick_hooks:  try: hook()
           if task_evaluator:
               Thread(target=task_evaluator, daemon=True).start()  # non-blocking
           if governance_evaluator:
               governance_evaluator()  # fast, inline
           update_resource_metrics()
           snapshot = advance_tick()
       release _tick_lock
       # Outside lock:
       for hook in post_tick_hooks:  try: hook(snapshot)
       for observer in observers:   try: observer(snapshot)
       return snapshot
   ```
2. Design thread safety: `_tick_lock` protects core steps (1-5), post-tick hooks and observers run outside the lock
3. Design background ticking: daemon thread with `Event.wait(timeout=tick_rate)` for clean shutdown signaling (NOT `time.sleep()`)
4. Design pluggability: `set_task_evaluator()` and `set_governance_evaluator()` setter methods
5. Define snapshot structure (tick count, timestamp, resource metrics, evaluator results)
**Output:** Tick architecture specification with sequence, threading model, and snapshot format.
**Quality gate:** LLM calls are in background threads (never block the tick). Lock scope is minimal. Shutdown uses Event signaling, not sleep.

### Phase 3: IMPLEMENT -- Build the Engine
**Entry criteria:** Architecture specification complete.
**Actions:**
1. Implement the core tick method with `_tick_lock`:
   - Pre-tick hooks run under lock (fast operations only)
   - Task evaluator launches in daemon thread (non-blocking)
   - Governance evaluator runs inline under lock (must be fast)
   - Resource metrics collected under lock
   - Tick counter advanced, snapshot created
2. Implement post-tick processing outside the lock:
   - Post-tick hooks receive snapshot (can do slow operations)
   - Observers broadcast (any number of callbacks)
3. Implement background ticking:
   - Daemon thread with configurable interval
   - `Event.wait(timeout=)` for clean shutdown
   - Start/stop lifecycle methods
4. Implement pluggable setters:
   - `set_task_evaluator(callback)` -- typically the coordinator's dispatch_cycle
   - `set_governance_evaluator(callback)` -- typically the governor's evaluate method
   - `add_pre_tick_hook(callback)`, `add_post_tick_hook(callback)`
   - `add_observer(callback)`
5. Implement error isolation: each hook/observer wrapped in try/except, errors logged but never propagate
**Output:** Working tick engine with all components implemented.
**Quality gate:** Tick executes without blocking on LLM calls. Error in one hook doesn't crash the engine. Shutdown is clean (no orphaned threads).

### Phase 4: VALIDATE -- Test Behavior
**Entry criteria:** Tick engine implemented with hooks and evaluators.
**Actions:**
1. Test timing accuracy: verify ticks fire at configured interval (+/- acceptable jitter)
2. Test non-blocking behavior: simulate slow task evaluator, verify tick doesn't wait for it
3. Test error isolation: throw exception in a hook, verify other hooks still execute
4. Test governance integration: verify governance evaluator runs inline and affects tick state
5. Test observer notification: all registered observers receive snapshot after each tick
6. Test shutdown: verify `Event.wait()` allows clean exit without hanging threads
7. Test concurrent access: multiple threads calling tick-related methods simultaneously
**Output:** Test results confirming timing, non-blocking, error isolation, and shutdown behavior.
**Quality gate:** Ticks fire on schedule. Slow evaluators don't block. Hook errors are contained. Shutdown completes in < 5 seconds.

### Phase 5: MONITOR -- Statistics & Health
**Entry criteria:** All validation tests passing.
**Actions:**
1. Add tick statistics tracking:
   - Total tick count
   - Average tick latency (time from tick start to snapshot creation)
   - Max tick latency (detect outliers)
   - Pre-hook execution time
   - Post-hook execution time
   - Observer notification time
2. Add evaluator timing:
   - Governance evaluator duration (should stay < 50ms)
   - Task evaluator launch frequency
3. Add error tracking:
   - Errors per hook
   - Errors per observer
   - Consecutive error count (for health alerting)
4. Add health indicators:
   - Tick regularity (actual interval vs configured interval)
   - Lock contention detection
   - Memory growth per tick
**Output:** Monitoring dashboard data with tick statistics, evaluator timing, and health indicators.
**Quality gate:** All statistics are being collected. Health indicators have thresholds for alerting. No memory leaks detected across 1000+ ticks.

## Exit Criteria

- Tick engine fires at configured interval with acceptable jitter
- Task evaluator runs in background thread (never blocks the tick)
- Governance evaluator runs inline and is fast (< 50ms)
- Error isolation prevents hook/observer failures from crashing the engine
- Clean shutdown via Event signaling
- Statistics tracking operational (tick count, latency, errors)
- All observers receive snapshots after each tick

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| REQUIREMENTS | Tick rate too fast for system load | **Adjust** -- increase tick interval, move work to post-tick hooks |
| DESIGN | Lock scope too wide (includes slow operations) | **Adjust** -- move slow operations outside the lock |
| IMPLEMENT | Background thread doesn't stop on shutdown | **Abort** -- redesign shutdown signaling, use daemon threads |
| VALIDATE | Tick latency exceeds interval | **Adjust** -- profile hooks, move heavy ones to post-tick |
| MONITOR | Statistics collection itself slows ticks | **Adjust** -- use atomic counters, sample instead of tracking every tick |

## State Persistence

- Tick counter (monotonically increasing across engine restarts if persisted)
- Statistics snapshots (for trend analysis)
- Hook registry (which hooks are active, their error counts)

## Reference

### Core Concept

The tick engine is the heartbeat of a runtime system. Instead of reacting to events as they arrive (event-driven), it pulls the world forward in discrete steps. Each tick follows a fixed sequence:

1. **Pre-tick hooks** -- prepare state, refresh caches, prime working memory
2. **Task evaluation** -- dispatched to a background thread (never blocks the tick for LLM calls)
3. **Governance evaluation** -- fast inline check (trust/phase transitions)
4. **Resource metrics** -- collect CPU/memory utilization
5. **Advance tick** -- increment counter, create snapshot
6. **Post-tick hooks** -- run outside the lock so slow operations don't block
7. **Notify observers** -- broadcast the tick snapshot to all registered listeners

### Key Design Decisions

- **Thread safety via `_tick_lock`**: Only the core steps (1-5) run under the lock. Post-tick hooks and observers run outside it.
- **LLM in background threads**: Task evaluation launches in a daemon thread. The tick engine must never wait on an LLM call.
- **Pluggable via setters**: External modules hook in without subclassing.
- **Background ticking**: Daemon thread uses `Event.wait(timeout=)` for clean shutdown signaling.
- **Observer pattern**: Any number of callbacks receive the tick snapshot after each cycle.

### Integration Points

- **Event Bus**: Tick observers can emit CognitiveEvents onto the bus. The bus is the fan-out mechanism; the tick engine is the clock.
- **Task Decomposition**: The task evaluator callback is typically the TaskPlanner's dispatch loop.
- **Reward Signals**: Post-tick hooks are where the learning loop applies reward signals from completed tasks.
