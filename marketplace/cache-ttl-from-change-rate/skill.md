# Cache TTL From Change Rate

**One-line description:** Sets the TTL for each cached entry type from two measured or stated quantities, the user's maximum tolerated staleness and the data's measured change rate, computes the expected stale-read fraction for the chosen TTL, and adds expiry jitter so keys written together do not expire together.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cache_plan` (object[], required): Locations per hotspot from `cache-location-decide`.
- `staleness_tolerance` (object, required): Per entry type, the longest time a reader may see old data, stated by the product owner (for example `product: 300s`, `price: 30s`). This is a business input, never derived by the model.
- `db_engine` (string, optional): Database engine and version, used to write the change-rate query.

---

## Outputs

- `ttl_table` (object[]): One row per entry type: measured change rate (changes per key per second), staleness tolerance, chosen TTL, expected stale-read fraction, jitter range, negative-result TTL placeholder, and the query used to measure the rate.

---

## Phase 1: Measure Change Rate

### Entry Criteria
- `staleness_tolerance` has a value for every entry type in `cache_plan`.

### Actions
1. Find how changes are recorded for each entity, in this order of preference: an audit or history table, a CDC topic, an `updated_at` column. If only `updated_at` exists, it shows only the latest change per row, so it undercounts frequently changed rows; note this in the row.
2. With an audit table (Postgres example): `SELECT count(*)::float / (count(DISTINCT entity_id) * EXTRACT(EPOCH FROM interval '7 days')) AS changes_per_key_per_sec FROM product_audit WHERE changed_at > now() - interval '7 days';`
3. With only `updated_at`: `SELECT count(*) FILTER (WHERE updated_at > now() - interval '1 day')::float / count(*) AS frac_changed_last_day FROM products;`. Convert: if a fraction f of keys changed in a window of W seconds, a lower bound for the per-key rate is `-ln(1 - f) / W` (assumes independent random changes).
4. Also record whether changes are bursty (for example a nightly price import). Run: `SELECT date_trunc('hour', changed_at) h, count(*) FROM product_audit GROUP BY 1 ORDER BY 1 DESC LIMIT 48;`. A spike at one hour means event-based invalidation at that time beats any TTL (hand that to `cache-invalidation-strategy-select`).

### Output
Per entry type: change rate lambda (per key per second), method, and burst pattern.

### Quality Gate
- Every lambda value has the exact SQL that produced it next to it.
- Every row states which method (audit, CDC, updated_at lower bound) was used.

---

## Phase 2: Choose TTL

### Entry Criteria
- Change rates exist.

### Actions
1. Start from the hard ceiling: `TTL <= staleness_tolerance`. When writes in this service delete the key (cache-aside with invalidation), the TTL only bounds staleness from missed invalidations and from writes made outside the service. When nothing invalidates, the TTL is the staleness bound.
2. Compute the expected fraction of reads that return stale data, for TTL-only expiry, assuming changes arrive randomly at rate lambda and reads are spread evenly over the entry's life:
   `stale_fraction = 1 - (1 - exp(-lambda * TTL)) / (lambda * TTL)`
   Python one-liner: `python -c "import math;l=2e-5;T=300;print(1-(1-math.exp(-l*T))/(l*T))"`.
3. Decide with this table:

   | Condition | TTL |
   |---|---|
   | Writes invalidate the key, and all writers are in code you control | `staleness_tolerance` (the TTL is a safety net) |
   | No invalidation, and `stale_fraction` at `staleness_tolerance` is acceptable to the product owner | `staleness_tolerance` |
   | No invalidation, and the product owner rejects that `stale_fraction` | lower TTL until they accept the value; report each TTL tried with its fraction |
   | Data never changes after creation (immutable rows) | longest TTL the memory budget allows; eviction handles the rest |

4. Show the product owner the `stale_fraction` number; do not decide on their behalf.

### Output
Chosen TTL and stale fraction per row.

### Quality Gate
- No TTL exceeds its row's `staleness_tolerance`.
- Each `stale_fraction` is printed by the formula with the row's lambda and TTL, and the command is recorded.

---

## Phase 3: Add Jitter and Record

### Entry Criteria
- TTLs chosen.

### Actions
1. Keys filled at the same moment (after a deploy, a cache flush, or a bulk warm-up) expire at the same moment and send a wave of misses to the database. Spread them: store each key with `TTL - random_uniform(0, J)` (only subtract, so the staleness ceiling still holds).
2. J is a user input. If none is given, record J as an open question in the row and use J = 0 for now. Do not pick a percentage by habit.
3. Leave a `negative_ttl` field empty; `cache-negative-result-caching` fills it.
4. Write `ttl_table`.

### Output
`ttl_table`.

### Quality Gate
- Every row has TTL, lambda, stale_fraction, J (or the words "open question"), and the measuring SQL.
- `TTL - J > 0` for every row.

---

## Worked Example

Illustrative. Entry `product`, `staleness_tolerance` = 300 s, no invalidation planned yet.

Phase 1: audit table shows 1,210,000 changes over 7 days across 100,000 products: lambda = 1210000 / (100000 x 604800) = 2.0e-5 per key per second. Hourly counts are flat.

Phase 2: `python -c "import math;l=2e-5;T=300;print(1-(1-math.exp(-l*T))/(l*T))"` prints `0.0029910...`, so about 0.3 percent of reads would be stale. The product owner accepts. TTL = 300 s.

Phase 3: user gives J = 30 s, so keys are written with `EX` between 270 and 300.

---

## Exit Criteria

DONE when every entry type has a TTL no greater than its staleness tolerance, a computed stale fraction, and a jitter value or an open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No audit, CDC or `updated_at` exists | **Return**: lambda unknown; set TTL = `staleness_tolerance` and flag the row. |
| Phase 1 | `staleness_tolerance` missing for a row | **Stop**: ask the product owner; never invent it. |
| Phase 2 | Product owner rejects every TTL above zero | **Adjust**: mark the entry for event-based invalidation in `cache-invalidation-strategy-select`. |
| Phase 3 | J not provided | **Adjust**: J = 0 and list it as an open question. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
