# Tick Engine -- Quick Start

```python
from tick_engine import TickEngine

engine = TickEngine()

# Wire in a governance check (runs inline, must be fast)
engine.set_governance_evaluator(lambda: check_system_health())

# Wire in a task evaluator (runs in background thread)
engine.set_task_evaluator(lambda: planner.dispatch_next())

# Add a post-tick hook for logging (runs outside lock)
engine.add_post_hook(lambda snap: print(f"Tick {snap.tick_id} at {snap.timestamp}"))

# Add an observer that emits events
engine.add_observer(lambda snap: event_bus.emit(tick_completed_event(snap)))

# Boot and run in background at 5-second intervals
engine.boot()
engine.start_background(interval=5.0)

# Later: clean shutdown
engine.shutdown()
```
