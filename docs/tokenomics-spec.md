# SkillChain Token Economics Specification

This document specifies the reward computation model and experience replay economics that drive the SkillChain learning economy.

---

## 1. Reward Computation

A scalar reward in [-1, 1] is computed from each task outcome and applied to the memories that contributed.

### 1.1 Formula

**Success:**
```
reward = base_reward * confidence * priority_multiplier + source_bonus
```

**Failure:**
```
reward = -(base_penalty * (0.5 + 0.5 * confidence) * priority_multiplier) - source_bonus
```

Both are clamped to [clamp_min, clamp_max] (default [-1, 1]).

### 1.2 Priority Multipliers

How much the task's importance amplifies the reward:

| Priority | Multiplier |
|----------|------------|
| critical | 1.5 |
| high | 1.2 |
| medium | 1.0 |
| low | 0.7 |
| background | 0.5 |

### 1.3 Source Bonuses

Additive bonus for using cheaper/faster resolution paths:

| Source | Bonus |
|--------|-------|
| memory | +0.1 |
| skill | +0.1 |
| hybrid | +0.05 |
| agentic | +0.05 |
| llm | +0.0 |

The source bonus incentivizes memory and skill routes over pure LLM. On failure, the bonus becomes a penalty (subtracted).

### 1.4 Custom Reward Functions

RewardConfig accepts a `custom_fn(success, confidence, priority, source) -> float` that overrides the default formula. Falls back to default on error.

---

## 2. Experience Replay Economics

Periodic batch re-analysis runs during maintenance cycles (~10 min cadence). Five steps drive knowledge economics.

### 2.1 Selection Scoring

Priority-weighted selection from recent episodic memories:
```
score = importance * 0.6 + recency * 0.3 + access_bonus * 0.1
recency = exp(-0.05 * days_ago)
```

### 2.2 Clustering

Group by domain, then sub-cluster by tag similarity (Jaccard threshold 0.4). Minimum cluster size = 3.

### 2.3 Consolidation

Clusters >= 5 entries get LLM-extracted rules stored as semantic memories. Smaller clusters get statistical summaries.

### 2.4 Skill Promotion

If a cluster's success rate >= 75% with >= 3 successes, extract a skill and register it.

### 2.5 Pruning

Delete episodic memories older than 90 days with importance < 0.1 and access_count == 0. Max 50 pruned per cycle.

---

## 3. Configuration Defaults

```python
# Reward
base_reward = 0.3
base_penalty = 0.2
clamp_min = -1.0
clamp_max = 1.0

# Replay
window_days = 30
batch_size = 100
min_cluster = 3
consolidation_threshold = 5
skill_success_rate = 0.75
skill_min_occurrences = 3
prune_max_age_days = 90
prune_importance_floor = 0.1
prune_max_per_cycle = 50
```

---

## 4. Integration Points

- **Graduation Pipeline**: Reward signals reinforce or penalize memories that fed into task outcomes, directly influencing which patterns get promoted to skills.
- **Strategy Routing**: The `source` field comes from which strategy handled the task. Source bonuses create a feedback loop — successful memory routes get rewarded more, making the calibration system lower memory thresholds.
- **Governance**: Task priority feeds the priority multiplier. System phase can contextualize rewards (e.g., bonus for operating under pressure during degraded phases).
- **Event Bus**: TASK_COMPLETED and TASK_FAILED events carry the data needed for reward computation.

---

## 5. Key Design Principles

1. **Incentivize self-reliance** — memory and skill sources get higher bonuses than LLM
2. **Asymmetric risk** — failures via internal knowledge penalize harder than successes reward
3. **Bounded maintenance** — replay batches, cluster sizes, and prune counts are all capped
4. **Composable** — custom reward functions can override the default formula
5. **Auditable** — all reward applications are traceable through the memory system
