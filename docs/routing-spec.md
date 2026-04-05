# SkillChain Strategy Routing Specification

This document specifies the adaptive reasoning router — the system that decides how to handle each incoming task by selecting from a chain of strategies, calibrating thresholds from observed outcomes, and growing autonomy over time.

---

## 1. The Autonomy Scale

Autonomy is a float in [0.0, 1.0] that modulates routing between external reasoning (LLM) and internal knowledge (memory + skills).

| Range | Mode | Behavior |
|-------|------|----------|
| 0.0 - 0.3 | LLM Dependent | Always use LLM. Memories provide context only. |
| 0.3 - 0.6 | Hybrid | Try memory first, LLM fallback. |
| 0.6 - 0.8 | Memory Primary | Memory drives most decisions. LLM only for novel domains. |
| 0.8 - 1.0 | Self-Directed | LLM is emergency fallback only. |

**Autonomy adjustments:**
- Success via memory/skill: +0.02
- Success via hybrid: +0.01
- Failure via memory/skill: -0.03 (asymmetric)
- Domain expertise tracks separately: +0.05 on success, -0.02 on failure

---

## 2. Strategy Chain

An ordered list of reasoning strategies evaluated in priority order. The first strategy whose `can_handle()` returns True wins.

### 2.1 Strategy Types

| Strategy | Name | Description |
|----------|------|-------------|
| AgenticStrategy | `agentic` | Multi-step tool-calling loop for web search, file ops, multi-step reasoning |
| HybridStrategy | `hybrid` | Memory + LLM augmentation. Stored memories as context for the LLM |
| LLMTeacherStrategy | `llm_teacher` | Pure LLM reasoning without memory. Fallback when no relevant memories exist |
| MemoryOnlyStrategy | `memory_only` | Reason entirely from NeuroFS memories. No LLM call. Requires autonomy >= 0.3, 3+ memories, relevance >= 0.65 |
| MemoryVerificationStrategy | `memory_verified` | Memory reasons, then Claude validates. For confidence band 0.4-0.65 |
| BuiltinSkillStrategy | `skill_builtin` | Execute a registered built-in skill. Direct command matching |
| LearnedSkillStrategy | `skill_learned` | Execute a previously learned procedure from the skill library |
| FallbackMemoryStrategy | `fallback_memory` | Last resort memory-based response |

### 2.2 Chain Order by Input Type

**Command-like input** (short, imperative, matches a skill pattern):
```
BuiltinSkill -> LearnedSkill -> Agentic -> Hybrid -> LLMTeacher -> MemoryOnly -> MemoryVerified -> Fallback
```

**Conversational input** (questions, greetings, long requests, ends with `?`):
```
Agentic -> Hybrid -> LLMTeacher -> MemoryOnly -> MemoryVerified -> BuiltinSkill -> LearnedSkill -> Fallback
```

Conversational detection triggers on: short greetings, question patterns, ends with `?`, long requests (>6 words).

---

## 3. Memory Thresholds

```python
MEMORY_SUFFICIENT_THRESHOLD = 0.65   # Min avg relevance to skip LLM
SKILL_SUFFICIENT_THRESHOLD = 0.70    # Min skill success rate
MIN_MEMORIES_FOR_REASONING = 3       # Min relevant memories needed
```

**MemoryOnly requires ALL of:**
- autonomy >= 0.3
- len(memories) >= 3
- avg_relevance >= 0.65

**MemoryVerification requires:**
- autonomy >= 0.3
- len(memories) >= 2
- avg_relevance in [0.4, 0.65)

**Skill matching:** new skills (<3 executions) get a chance; only filter out skills with 3+ executions AND success rate below 0.70.

---

## 4. Self-Calibration via Routing Telemetry

The system logs every routing decision and auto-adjusts thresholds. Runs on ~10 minute cadence.

### 4.1 Recorded Data

Every routing decision captures: task hash (privacy-preserving), domain, route chosen, confidence, success/failure outcome, latency, and token usage.

### 4.2 Calibration Rules

```python
# Memory threshold adjustment
if memory_only.success_rate >= 0.8 (over 10+ samples):
    LOWER relevance threshold -> route MORE through memory
    new_threshold = max(0.40, 0.65 - (success_rate - 0.8) * 0.5)

if memory_only.success_rate < 0.5 (over 10+ samples):
    RAISE relevance threshold -> force LLM fallback
    new_threshold = min(0.90, 0.65 + (0.5 - success_rate) * 0.5)

# Skill threshold adjustment (same pattern)
if skill.success_rate >= 0.7: lower threshold (min 0.40)
if skill.success_rate < 0.5:  raise threshold (max 0.90)

# LLM over-reliance detection
if llm_routes / total_routes > 0.8 (over 20+ decisions):
    Flag "escalation_bias: too_high"
```

### 4.3 Persistence

Telemetry persists to disk between sessions. Rolling window of 1000 records prevents unbounded growth.

---

## 5. Key Design Principles

1. **Every strategy is independently testable** — extracted into its own class with clear `can_handle()` and `execute()` interfaces
2. **Routing logic is separate from execution logic** — `reason()` selects, strategies execute
3. **New reasoning paths can be added** without touching the core router
4. **Calibration is conservative** — small adjustments based on 10+ samples
5. **Graceful degradation** — works with or without any individual component
6. **The LLM is training wheels** — every interaction builds memories and skills, shifting the system toward self-reliance
