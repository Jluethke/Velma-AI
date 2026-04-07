# Decision Analyzer -- Choosing a Database for a New Event Sourcing System

## Scenario

A startup needs to choose a database for their event sourcing backend. They process 10K events/sec today, expect 100K/sec in 18 months. Team of 4 engineers, 3 with PostgreSQL experience, 0 with DynamoDB experience.

## OBSERVE: Frame the Decision

**Decision question:** Should the team use PostgreSQL or DynamoDB as the primary event store for a system that must scale from 10K to 100K events/sec within 18 months?

**Options generated:**
1. PostgreSQL with partitioning and read replicas
2. DynamoDB with single-table design
3. PostgreSQL now, migrate to DynamoDB when needed (hybrid)
4. Do nothing (use current SQLite -- eliminated by constraints)

**Criteria defined:**

| Criterion | Weight | Direction |
|---|---|---|
| Write throughput at scale | 0.30 | Maximize |
| Team ramp-up time | 0.25 | Minimize |
| Operational complexity | 0.20 | Minimize |
| Cost at 100K events/sec | 0.15 | Minimize |
| Vendor lock-in risk | 0.10 | Minimize |

Weights sum to 1.0. Write throughput weighted highest because the system is write-heavy.

**Reversibility assessment:**
- PostgreSQL: Type 2 (can migrate away, data is portable, standard SQL)
- DynamoDB: Type 1.5 (migration is expensive due to single-table design lock-in, but possible)
- Hybrid: Type 2 (PostgreSQL start is reversible; decision to migrate later can be deferred)

## REASON: Score Against Criteria

| Option | Write Throughput (0.30) | Team Ramp-up (0.25) | Ops Complexity (0.20) | Cost (0.15) | Lock-in (0.10) | Weighted Total |
|---|---|---|---|---|---|---|
| PostgreSQL | 6 (1.80) | 9 (2.25) | 7 (1.40) | 7 (1.05) | 9 (0.90) | **74.0** |
| DynamoDB | 9 (2.70) | 3 (0.75) | 5 (1.00) | 5 (0.75) | 3 (0.30) | **55.0** |
| Hybrid | 6 (1.80) | 8 (2.00) | 6 (1.20) | 6 (0.90) | 7 (0.70) | **66.0** |

**Sensitivity analysis:** If "Write throughput" weight increases from 0.30 to 0.50 (and others decrease proportionally), DynamoDB rises to 65.0 and PostgreSQL drops to 68.0. The ranking holds but the gap narrows. Decision is moderately robust.

**Pre-mortem for PostgreSQL (top option):**

*It is March 2028. The PostgreSQL event store has become the team's biggest problem. At 80K events/sec, write latency spiked to 500ms despite partitioning. The team spent 3 months trying to optimize before admitting they needed to migrate to DynamoDB anyway -- but now with 2 years of accumulated data and 15 services depending on PostgreSQL-specific features. The migration took 6 months and caused 3 production outages. Total cost of the PostgreSQL detour: $400K in engineering time.*

This pre-mortem reveals the key risk: PostgreSQL might hit a scaling wall, and the migration cost would be higher than starting with DynamoDB.

## PLAN: Formulate Recommendation

**Recommendation:** PostgreSQL with explicit migration triggers.

**Confidence:** 0.65 (moderate-high). The analysis favors PostgreSQL, but the pre-mortem reveals a real scaling risk.

**Key risk:** Scaling wall at 50-80K events/sec requiring expensive migration.

**Mitigation:** Define a migration trigger NOW: "If write latency p95 exceeds 100ms at any throughput level, begin DynamoDB migration planning." Invest 2 days upfront in an abstraction layer that makes the event store swappable.

**Decision trigger:** Revisit this decision when throughput reaches 50K events/sec OR in 12 months, whichever comes first.

## ACT: Decision Matrix Output

```
RECOMMENDATION: Use PostgreSQL with partitioning as the primary event store.
CONFIDENCE: 0.65
RATIONALE: PostgreSQL scores highest on weighted criteria (74 vs 66 vs 55),
primarily due to team expertise (3/4 engineers know PostgreSQL) and lower
lock-in risk. The 19-point gap over DynamoDB is significant and robust to
moderate weight changes.

KEY RISK: Scaling wall at 50-80K events/sec. Mitigated by abstraction layer
and explicit migration trigger (p95 write latency > 100ms).

REVISIT WHEN: Throughput reaches 50K events/sec OR 12 months from now.
```

**Decision journal entry:**
```json
{
  "decision": "Which database for event sourcing: PostgreSQL vs DynamoDB?",
  "date": "2026-03-31",
  "options_considered": ["PostgreSQL", "DynamoDB", "Hybrid"],
  "chosen": "PostgreSQL with migration triggers",
  "confidence": 0.65,
  "key_criteria": ["write throughput", "team ramp-up time", "lock-in risk"],
  "predicted_outcome": "PostgreSQL handles 10-50K events/sec well. Team ships faster due to familiarity. May need to migrate at 50-80K range.",
  "revisit_trigger": "Throughput reaches 50K events/sec OR p95 write latency > 100ms",
  "actual_outcome": null
}
```
