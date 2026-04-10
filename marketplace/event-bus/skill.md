# Event Bus -- Typed Pub-Sub with Correlation

Design and build a synchronous, typed event bus with frozen dataclass events, wildcard subscribers, error isolation, and temporal pattern detection via an EventCorrelator.

## Execution Pattern: Phase Pipeline

```
PHASE 1: EVENTS        --> Define event types as frozen dataclasses
PHASE 2: SUBSCRIBERS   --> Register handlers, set up wildcard listeners
PHASE 3: CORRELATION   --> Define correlation rules (temporal windows, event patterns)
PHASE 4: IMPLEMENT     --> Build bus with error isolation, statistics tracking
PHASE 5: VALIDATE      --> Test event delivery, handler failures, correlation detection
```

## Inputs

- **event_types**: list[string] -- Event type names the system will emit (e.g., TASK_COMPLETED, TASK_FAILED)
- **subscriber_map**: dict[string, list[callable]] (optional) -- Pre-registered type-to-handler mappings
- **correlation_rules**: list[object] (optional) -- Temporal patterns to detect across event types
- **window_seconds**: float (optional) -- Sliding window for correlation detection (default: 30s)

## Outputs

- **event_bus**: object -- Configured bus with type subscriptions, wildcard listeners, and error isolation
- **correlator**: object -- EventCorrelator with registered rules and sliding window buffer
- **statistics**: object -- Events emitted, delivered, handler errors, correlation matches

## Execution

### Phase 1: EVENTS -- Define Event Types
**Entry criteria:** System has identified at least one state change that needs to be communicated between decoupled subsystems.
**Actions:**
1. Define event types as frozen dataclasses:
   - Each event carries: event_id, timestamp, source, domain, importance, payload
   - Payload is a tuple of key-value pairs (immutable)
   - Events observe mutations that already happened -- they are NOT commands
2. Catalog all event types the system will emit:
   - TASK_DISPATCHED -- task assigned to agent
   - TASK_COMPLETED -- task finished successfully
   - TASK_FAILED -- task failed
   - GOAL_EVOLVED -- goals changed after evolution check
   - SPECIALIST_SPAWNED -- new specialist created
   - SPECIALIST_COMPLETED -- specialist finished
   - (Add domain-specific event types as needed)
3. Define event importance levels for filtering
4. Establish the contract: `Intent -> Runtime -> Store (write) -> CognitiveEvent emitted`
**Output:** Event type catalog with dataclass definitions, field types, and importance levels.
**Quality gate:** All event types are frozen dataclasses. Payloads are immutable (tuples, not dicts). Event IDs are unique. Every event has a source field.

### Phase 2: SUBSCRIBERS -- Register Handlers
**Entry criteria:** Event types defined with clear semantics.
**Actions:**
1. Register type-specific subscribers:
   - `subscribe(event_type, handler)` -- handler receives only matching events
   - Multiple handlers per event type allowed
   - Handler signature: `(event: CognitiveEvent) -> None`
2. Register wildcard subscribers:
   - `subscribe_all(handler)` -- receives every event regardless of type
   - Used by: EventCorrelator, audit loggers, telemetry collectors
3. Define handler contracts:
   - Handlers must be synchronous (emit blocks until all handlers complete)
   - Handlers must not raise unhandled exceptions to the caller
   - Handlers must not modify the event (frozen dataclass enforces this)
4. Plan handler ordering (registration order = execution order)
**Output:** Subscriber registry with type-specific and wildcard handlers registered.
**Quality gate:** At least one handler registered for each event type that needs processing. Wildcard subscriber registered for audit logging. No circular handler dependencies.

### Phase 3: CORRELATION -- Define Temporal Patterns
**Entry criteria:** Subscribers registered, event types cataloged.
**Actions:**
1. Define correlation rules:
   - Each rule specifies a set of required event types
   - Each rule specifies `min_events` threshold
   - Each rule has a handler that fires when the pattern is detected
2. Configure the sliding window:
   - Default: 30 seconds
   - Events buffered as `(monotonic_timestamp, event_type, source, event_id)`
   - Buffer pruned to window on every event
3. Define pattern matching logic:
   - When buffer contains all required types with >= min_events matches, rule fires
   - Rule handler receives the matched events
4. Plan correlation use cases:
   - Multiple task failures in window -> system degradation alert
   - Task completed + goal evolved -> learning breakthrough
   - Specialist spawned + specialist completed in rapid succession -> specialist efficiency metric
**Output:** Correlation rules with required event types, thresholds, and handlers.
**Quality gate:** All rules have finite min_events thresholds. Window size is reasonable (not so large it buffers thousands of events). Rule handlers are defined.

### Phase 4: IMPLEMENT -- Build the Bus
**Entry criteria:** Event types, subscribers, and correlation rules all defined.
**Actions:**
1. Implement synchronous dispatch:
   - `emit(event)` blocks until all handlers complete
   - No queues, no async -- pure callback delivery
   - Ordering is deterministic (registration order)
2. Implement error isolation:
   - Each subscriber's exception is caught and logged
   - One bad subscriber never kills the emitter or other subscribers
   - Error count tracked per subscriber for diagnostics
3. Implement statistics tracking:
   - Events emitted (total count)
   - Events delivered (per handler count)
   - Handler errors (per handler count)
   - Correlation matches (per rule count)
4. Wire EventCorrelator as a wildcard subscriber:
   - Receives every event
   - Buffers within sliding window
   - Checks rules on every event
   - Fires rule handlers when patterns match
5. Implement `subscribe()`, `subscribe_all()`, `emit()`, `get_statistics()`
**Output:** Working event bus with error isolation, statistics, and correlation detection.
**Quality gate:** emit() delivers to all handlers even if one throws. Statistics are accurate. Correlator fires on matching patterns. No memory leak in event buffer (pruned to window).

### Phase 5: VALIDATE -- Test Everything
**Entry criteria:** Event bus implemented with all features.
**Actions:**
1. Test event delivery:
   - Type-specific subscriber receives only matching events
   - Wildcard subscriber receives all events
   - Multiple subscribers all receive the same event
2. Test error isolation:
   - Handler throws exception -> other handlers still execute
   - Error is logged and counted in statistics
   - Emitter is not affected by handler failures
3. Test correlation detection:
   - Emit events matching a rule's required types within the window -> rule fires
   - Emit events outside the window -> rule does not fire
   - Emit partial pattern (missing one required type) -> rule does not fire
4. Test statistics accuracy:
   - Emitted count matches actual emissions
   - Delivered count matches actual deliveries
   - Error count matches actual errors
5. Test buffer management:
   - Buffer does not grow unbounded
   - Old events are pruned when outside the window
**Output:** Test results confirming delivery, isolation, correlation, and statistics.
**Quality gate:** All delivery tests pass. Error isolation verified. Correlation fires correctly. No memory leaks. Statistics accurate.

## Exit Criteria

- All event types defined as frozen dataclasses with unique IDs
- Type-specific and wildcard subscribers registered and receiving events
- Error isolation prevents handler failures from affecting other handlers or emitters
- EventCorrelator detects temporal patterns within the sliding window
- Statistics tracking is accurate (emitted, delivered, errors, correlations)
- No memory leaks in event buffer

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| EVENTS | Event type collision (duplicate names) | **Abort** -- event types must be unique |
| SUBSCRIBERS | Handler has side effects that modify shared state unsafely | **Escalate** -- flag for review, handlers should be idempotent |
| CORRELATION | Window too large, buffer grows unbounded | **Adjust** -- reduce window size, add max buffer cap |
| IMPLEMENT | Synchronous dispatch blocks too long (slow handler) | **Adjust** -- move slow handler to post-tick hook instead |
| VALIDATE | Correlation fires false positives | **Adjust** -- increase min_events threshold or reduce window |
| VALIDATE | User rejects final output | **Targeted revision** -- ask which event schema, subscriber handler, or correlation rule fell short and rerun only that design phase. Do not regenerate the full event bus design. |

## State Persistence

- Event statistics (cumulative counts across bus restarts)
- Correlation rule matches (history of detected patterns)
- Subscriber registry (which handlers are active)

## Reference

### Core Concept

The event bus carries typed state-change notifications between decoupled subsystems. It is **not** an inter-agent message queue -- it observes mutations that already happened. The contract:

```
Intent -> Runtime -> Store (write) -> CognitiveEvent emitted
Subscribers observe events, not state.
```

### Key Design Decisions

- **Synchronous dispatch**: `emit()` blocks until all handlers complete. No queues, no async -- pure callback delivery. This keeps ordering deterministic.
- **Error isolation**: One subscriber's exception is caught and logged. It never kills the emitter or other subscribers.
- **Type-based subscription**: Subscribe to specific event types for focused handling.
- **Wildcard subscription**: `subscribe_all()` receives every event -- used by the EventCorrelator and audit loggers.
- **Statistics tracking**: Counts events emitted, delivered, and handler errors for diagnostics.

### EventCorrelator -- Temporal Pattern Detection

1. Every event is buffered as `(monotonic_timestamp, event_type, source, event_id)`
2. Buffer is pruned to the sliding window (default 30s)
3. Each rule specifies a set of required event types
4. When the buffer contains all required types with >= `min_events` matches, the rule fires
5. Rule handler receives the matched events

### Integration Points

- **Tick Engine**: The tick engine's observers can emit events onto the bus. The tick is the clock; the bus is the nervous system.
- **Task Decomposition**: Task completion/failure emits events that trigger learning loops and parent-completion checks.
- **Reward Signals**: TASK_COMPLETED and TASK_FAILED events carry the outcome data needed for reward computation.
