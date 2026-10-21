# Cache Invalidation Strategy Select

**One-line description:** Chooses cache-aside with delete-on-write, write-through, write-behind, event-based invalidation or TTL-only for each cached entry type by tracing every writer of the underlying data, and fixes the ordering rule (delete after commit) that every strategy must follow.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cache_plan` (object[], required): Locations per hotspot from `cache-location-decide`.
- `ttl_table` (object[], required): TTLs and change rates from `cache-ttl-from-change-rate`.
- `consistency_requirement` (string, required): Per entry type: `read-your-writes`, `bounded-staleness` or `eventual`.

---

## Outputs

- `invalidation_plan` (object[]): One row per entry type: strategy, list of every writer with file and line or job name, the write-path action (delete or set), when it runs (after commit), the flags `uses_event_based` and `uses_write_behind`, and the decision table row used.

---

## Phase 1: Find Every Writer

### Entry Criteria
- `cache_plan` and `ttl_table` cover the same entry types.

### Actions
1. For each entry type, list every place that changes the underlying rows. Search the repo for the table name with write verbs, for example: `grep -rniE "(insert into|update|delete from) +products" .` and ORM writes such as `grep -rnE "Product\.(objects\.(create|update|bulk_create|filter\(.*\)\.update)|save\()" .`.
2. Also list writers outside this repo: other services, cron jobs, admin consoles, data imports, manual SQL, database triggers. Ask the user for these; the repo cannot show them. Record "none known" only if the user confirms.
3. Classify each writer: `in-service` (code you will change in this task) or `external`.

### Output
Writer list per entry type with file and line, or the external system name.

### Quality Gate
- Every in-service writer has a file and line that `grep -n` reproduces.
- The external writer list is either filled or confirmed empty by the user, with the confirmation recorded.

---

## Phase 2: Apply the Strategy Table

### Entry Criteria
- Writer lists exist.

### Actions
1. Take the FIRST matching row:

   | Row | Condition | Strategy |
   |---|---|---|
   | 1 | Any `external` writer exists and the data is `read-your-writes` or the TTL is longer than the staleness tolerance allows for those writes | `event-based` (CDC or outbox, see `cache-event-invalidation-pubsub`) plus cache-aside on reads |
   | 2 | Writes are high-frequency increments or appends that can be merged (counters, view counts, last-seen timestamps), and losing the unflushed buffer on a crash is acceptable to the product owner | `write-behind` (see `cache-write-behind-buffer`) |
   | 3 | All writers are `in-service`, and data is usually read right after it is written | `write-through`: after commit, write the new value into the cache |
   | 4 | All writers are `in-service` | `cache-aside` with delete-on-write |
   | 5 | No writer can be hooked and the TTL meets the staleness tolerance | `ttl-only` |

2. Delete or set on write. Default to delete. Two concurrent writers that each SET can finish in the opposite order of their database commits and leave the older value in the cache; two DELETEs cannot. Use SET (write-through) only when the value written is the committed row read back inside the same transaction, or when a version check guards it (see `cache-stale-set-race-fix`).
3. Ordering rule for every strategy: change the cache only AFTER the database transaction commits. Deleting before commit lets a concurrent reader re-fill the cache with the old row before the commit lands. Hooks that run after commit:
   - Django: `transaction.on_commit(lambda: cache.delete(key))`
   - SQLAlchemy: listen to the session `after_commit` event
   - Spring: `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`, or a transaction-aware cache manager
   - Plain code: call delete on the line after `commit()` returns, never inside the transaction block
4. Set `uses_event_based` and `uses_write_behind` flags on the plan.

### Output
Strategy per entry type with the row number.

### Quality Gate
- Every entry type has one strategy and one row number.
- Every in-service writer has its after-commit hook named (function or listener) in the plan.

---

## Phase 3: Record Residual Staleness

### Entry Criteria
- Strategies chosen.

### Actions
1. For each strategy, write the remaining window where a reader can see old data:
   - cache-aside delete-on-write: the stale-set race (a reader that read the old row before the commit sets it after the delete). Bounded by TTL; closed by `cache-stale-set-race-fix`.
   - write-through: concurrent writers racing on SET unless version-checked.
   - event-based: the CDC or outbox lag, which you must measure in `cache-event-invalidation-pubsub`.
   - write-behind: the database lags the cache by up to one flush interval; database readers that skip the cache see old data.
   - ttl-only: up to TTL.
2. If a window violates `consistency_requirement`, go back to Phase 2 and take the next applicable row, or report it as an open question.
3. Write `invalidation_plan`.

### Output
`invalidation_plan`.

### Quality Gate
- Every row names its residual staleness window and the flow or measurement that bounds it.
- No `read-your-writes` row uses `ttl-only`.

---

## Worked Example

Illustrative. Entry `product`, `read-your-writes` for the admin who edits it, TTL 300 s.

Phase 1: in-service writers `catalog/admin.py:88` (`product.save()`) and `catalog/api.py:140`. External: the user confirms a nightly price import job in another repo.

Phase 2: row 1 matches (external writer exists): `event-based` via outbox, plus cache-aside on reads. In-service writers also delete through `transaction.on_commit`. `uses_event_based` = true, `uses_write_behind` = false.

Phase 3: residual windows: stale-set race (bounded by 300 s TTL until fixed) and outbox relay lag (to be measured).

---

## Exit Criteria

DONE when every entry type has a strategy from the table, every writer is listed with its after-commit invalidation point, and the residual staleness window of each strategy is written down.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User cannot say whether external writers exist | **Adjust**: assume they exist and choose row 1 or row 5; never assume a clean world. |
| Phase 2 | Write-behind proposed but product owner refuses data loss | **Adjust**: take the next matching row. |
| Phase 2 | Writer is inside a transaction you cannot hook | **Adjust**: emit an outbox row inside the transaction and invalidate from the relay (event-based). |
| Phase 3 | Residual window violates the requirement and no row fixes it | **Return**: report it as an open question with the measured window. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
