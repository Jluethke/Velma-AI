# Task Decomposition -- Quick Start

```python
from task_decomposition import TaskPlanner, Task, TaskPriority

planner = TaskPlanner(governor=my_governor)

# Submit a top-level task
parent = Task(task_id="t-1", description="Deploy new model",
              priority=TaskPriority.HIGH, domain="ml-ops")
planner.submit(parent)

# Decompose into subtasks
subtask_ids = planner.decompose("t-1", [
    ("Run validation suite", TaskPriority.HIGH),
    ("Update config files", TaskPriority.MEDIUM),
    ("Notify stakeholders", TaskPriority.LOW),
])

# Dispatch highest-priority pending task
next_task = planner.get_next(domain="ml-ops")
print(next_task.description)  # "Run validation suite"

# Complete subtasks -- parent auto-completes when all children finish
planner.complete("task-1", result="All tests passed")
planner.complete("task-2", result="Config updated")
planner.complete("task-3", result="Slack notified")
# Parent "t-1" is now auto-completed
```
