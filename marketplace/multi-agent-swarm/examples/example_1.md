# Multi-Agent Swarm Example: Spawning a Specialist Agent

## Define and Spawn
```python
from neuros.agent_stack.specialist_spawner import SpecialistSpawner, SpecialistConfig

config = SpecialistConfig(
    name="data_analyst",
    domain="analytics",
    task_description="Analyze Q1 sales trends and identify top 3 anomalies",
    parent_trust=0.7,
    max_subtasks=3,
    timeout_seconds=120,
    model_preference="cloud",
)

spawner = SpecialistSpawner(cognitive_core=core, learning_loop=loop)
specialist_id = spawner.spawn(config)
# Returns: "spec-analytics-a1b2c3d4"
```

## Trust Inheritance Rule
```python
# Specialist trust is capped at parent level
trust_ceiling = min(config.parent_trust, identity.autonomy)
# A specialist can NEVER exceed Velma's current trust level
```

## Dispatch Cycle (Self-Recursive)
```python
# When task queue empties, the coordinator auto-generates exercises
if task is None and can_generate():
    generate_from_goals()  # Creates 2 exercises from active goals
    task = planner.get_next_dispatchable()
```

## Key Points
- Max 4 concurrent specialists, each limited to 3 subtasks
- Trust flows DOWN, never UP -- specialists cannot escalate privileges
- Failed agents return to IDLE, not TERMINATED (resilient by default)
