# SkillChain Graduation Pipeline Specification

This document specifies the graduation pipeline through which knowledge progresses from raw experience to deployed, composable skills. It also covers the reward signal system, experience replay engine, contradiction detection, and self-training loop.

---

## 1. Pipeline Overview

```
Episode -> Pattern (3x, 75%) -> Rule -> Skill -> Graduated (80%, 5+) -> Composite (chain up to 4)
```

Each transition is gated by measurable criteria. No stage can be skipped.

---

## 2. Stage Definitions

### 2.1 Episode — Raw Experience

Every task execution produces an episode containing: task description, result, success/failure, domain, reasoning source, timestamp, and importance score. All outcomes are stored, successful or not.

### 2.2 Pattern — Repeated Task Detection

The PatternTracker identifies recurring task patterns via fuzzy key matching.

**Key computation:**
```python
words = sorted(set(description.lower().split()))
significant = [w for w in words if len(w) > 3][:5]
key = "|".join(significant)
```

**Promotion gate:** 3+ occurrences with >= 75% success rate.

**Bounds:** 500 patterns max (evicts lowest-count on overflow), 10 descriptions per pattern.

### 2.3 Rule — Semantic Knowledge

When a cluster of 5+ related episodes forms, the LLM Consolidator generates a semantic rule stored with domain, tags, and importance.

### 2.4 Skill — Executable Procedure

Extracted from promoted patterns and registered in the SkillLibrary. Contains: name, description, steps (from recent pattern descriptions), tags, domain. Starts with 0 executions.

### 2.5 Graduated — Governance-Gated Deployment

All of the following must be true:
- Trust score >= 0.70 (earned, not assumed)
- System phase == NOMINAL
- Success rate >= 80% (stricter than promotion's 75%)
- Minimum 5 executions (more than promotion's 3)

On graduation: LLM generates a standalone Python module from the skill's steps, deployed to the correct subdirectory, logged in the SHA-256 audit trail.

### 2.6 Composite — Chained Skills

The SkillCompositionEngine chains related graduated skills.
- Match threshold: 75% tag overlap across 5+ executions
- Maximum chain length: 4 skills

---

## 3. Reward Signal System

After every task, the pipeline computes a scalar reward in [-1, 1] and applies it to contributing memories.

### 3.1 Reward Formula

**Success:**
```
reward = base_reward * confidence * priority_multiplier + source_bonus
```

**Failure:**
```
reward = -(base_penalty * (0.5 + 0.5 * confidence) * priority_multiplier) - source_bonus
```

Clamped to [-1.0, 1.0].

### 3.2 Constants

**Base values:** base_reward = 0.3, base_penalty = 0.2

**Priority multipliers:**

| Priority | Multiplier |
|----------|------------|
| critical | 1.5x |
| high | 1.2x |
| medium | 1.0x |
| low | 0.7x |
| background | 0.5x |

**Source bonuses:**

| Source | Bonus |
|--------|-------|
| memory | +0.10 |
| skill | +0.10 |
| hybrid | +0.05 |
| agentic | +0.05 |
| llm | +0.00 |

Memory and skill sources get the highest bonus because success via internal knowledge is more valuable than success via external LLM.

### 3.3 Reward Application

Rewards are applied to all memory_ids that contributed to the outcome:
- Positive reward: reinforce_importance (memory becomes more prominent)
- Negative reward: penalize_importance (memory fades)

### 3.4 Custom Reward Functions

RewardConfig accepts a `custom_fn(success, confidence, priority, source) -> float` that overrides the default formula, with fallback to default on error.

---

## 4. Autonomy Updates

The pipeline modifies autonomy based on outcomes:

```python
# Success via memory or skill: +0.02
# Success via hybrid: +0.01
# Failure via memory or skill: -0.03 (asymmetric — 1.5x harder)

# Domain expertise (independent):
expertise[domain] += 0.05 if success else -0.02
```

---

## 5. Contradiction Detection

Epistemic hygiene for the knowledge base. Scans semantic entries for pairs discussing the same topic with opposing claims.

**Algorithm:**
1. Group entries by first tag (category)
2. Compare pairs within each group (max 200 comparisons)
3. Keyword overlap must be >= 40% to be considered related
4. Check for negation markers (asymmetric presence signals contradiction)
5. Check for antonym pairs across entries (+0.3 per match)
6. Combine similarity, negation, and antonym scores

**Negation markers:** not, never, no, neither, nor, incorrect, wrong, false, invalid, unlike, opposite, contrary, avoid, don't, doesn't, shouldn't, can't, cannot, instead, rather

**Antonym pairs:** increase/decrease, positive/negative, bullish/bearish, always/never, buy/sell, long/short, high/low, strong/weak, safe/dangerous, correct/incorrect, true/false, success/failure, rising/falling, above/below

---

## 6. Experience Replay

Periodic batch re-analysis of episodic memories. Runs during maintenance cycles (~10 min cadence).

### 6.1 Configuration

```python
replay_window_days = 30
batch_size = 100
tag_similarity_threshold = 0.4
min_cluster_size = 3
consolidation_threshold = 5
skill_success_rate = 0.75
skill_min_occurrences = 3
prune_max_age_days = 90
prune_importance_floor = 0.1
prune_max_per_cycle = 50
```

### 6.2 Pipeline

1. **Select** — Priority-weighted selection: `score = importance * 0.6 + recency * 0.3 + access_bonus * 0.1` where recency = `exp(-0.05 * days_ago)`
2. **Cluster** — Group by domain + tag similarity (Jaccard threshold 0.4). Min cluster size = 3.
3. **Consolidate** — Clusters >= 5 entries get LLM-extracted rules stored as semantic memories
4. **Extract** — Clusters with 75%+ success and 3+ occurrences promote to skills
5. **Prune** — Delete episodic memories older than 90 days with importance < 0.1 and access_count == 0. Max 50 per cycle.

---

## 7. Self-Training (AutoSkillEngine)

When idle, the system enters a self-training loop:

1. **Inventory** current skills and identify gaps
2. **Generate** training exercises from templates (domain-specific, tool-using)
3. **Execute** exercises against real subsystems
4. **Record** outcomes in the pipeline (building patterns)
5. **Promote** — when patterns hit threshold, new learned skills emerge
6. **Consolidate** memory, reinforce important knowledge

**Exercise design:** every exercise must USE TOOLS (shell, read_file, run_python, store_skill, web_search). Exercises should DO something practical. Templates span domains: web_intel, content, financial, system ops, research. Difficulty ranges from 0.3 to 0.8.

Training state persists to disk across restarts.

---

## 8. Key Design Principles

1. **Graceful degradation** — works with or without any individual component
2. **Bounded growth** — patterns capped at 500, descriptions at 10, replay batch at 100, comparisons at 200
3. **Asymmetric feedback** — failures punish harder than successes reward
4. **The LLM is bootstrapping** — it provides initial capability, but persistent knowledge eventually replaces it
5. **Everything is auditable** — deployments logged in SHA-256 chain, rewards tracked, patterns inspectable
6. **Practical exercises only** — self-training uses real tools, not theoretical self-reflection
