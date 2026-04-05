# Event Bus -- Quick Start

```python
from event_bus import EventBus, EventCorrelator, Event, EventType

bus = EventBus()
correlator = EventCorrelator(window_seconds=30.0, min_events=2)

# Subscribe to specific event types
bus.subscribe(EventType.TASK_COMPLETED, lambda e: print(f"Task done: {e.event_id}"))
bus.subscribe(EventType.HEALTH_DEGRADED, lambda e: alert_ops(e.payload))

# Wildcard subscriber for audit logging
bus.subscribe_all(lambda e: audit_log.append(e))

# Set up a correlation rule: detect cascading failures
correlator.add_rule(
    "cascading_failure",
    (EventType.HEALTH_DEGRADED, EventType.TASK_FAILED),
    lambda name, matched: escalate_to_governance(matched)
)
bus.attach_correlator(correlator)

# Emit events from anywhere in the system
bus.emit(Event(event_type=EventType.TASK_COMPLETED, event_id="t-42",
               source="planner", payload={"result": "success"}))

print(bus.stats)  # {"emitted": 1, "delivered": 3, "errors": 0}
```
