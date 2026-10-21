# ETL Late-Arriving Data Policy

**One-line description:** Measures how late records actually arrive (gap between event time and the time the row became visible in the source) with percentile SQL, then sets a lookback window, a reprocessing rule for event-time partitions, and an unknown-member rule for facts that arrive before their dimension rows.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_connection` (object, required): Read-only source connection.
- `data_contract` (object, required): Output of `etl-target-schema-contract` (needs `partition_column`, `watermark_column`).
- `extraction_keys` (object[], required): Output of `etl-source-key-watermark-discovery`.

---

## Outputs

- `lateness_profile` (object): Per table: the event-time column, the arrival column, the measured lateness at the 50th, 95th, 99th percentile and maximum over the measured window, and the query used.
- `late_data_policy` (object): `lookback` (an interval the user approved), `reprocess_partitions` rule, `watermark_overlap` for extraction, `unknown_member_key` rule for dimensions, and `max_lateness_accepted` with what happens to rows beyond it.

---

## Phase 1: Measure Lateness

### Entry Criteria
- The source table has an event-time column (when the thing happened, for example `order_date`, `event_ts`) and an arrival column (when the row became visible, for example `created_at`, `inserted_at`, `_ingested_at`). If there is no arrival column, go to Error Handling.

### Actions
1. Run a percentile query over a recent window the user picks (do not choose it yourself):
   - Postgres:
     ```sql
     SELECT
       percentile_cont(0.50) WITHIN GROUP (ORDER BY created_at - event_ts) AS p50,
       percentile_cont(0.95) WITHIN GROUP (ORDER BY created_at - event_ts) AS p95,
       percentile_cont(0.99) WITHIN GROUP (ORDER BY created_at - event_ts) AS p99,
       MAX(created_at - event_ts) AS max_late
     FROM events
     WHERE created_at >= now() - interval '<user window>';
     ```
   - Snowflake: `APPROX_PERCENTILE(DATEDIFF('second', event_ts, created_at), 0.95)`; exact: `PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY DATEDIFF('second', event_ts, created_at))`.
   - BigQuery: `APPROX_QUANTILES(TIMESTAMP_DIFF(created_at, event_ts, SECOND), 100)[OFFSET(95)]`.
   - MySQL 8.0 has no `percentile_cont`; use `PERCENT_RANK()` over `TIMESTAMPDIFF(SECOND, event_ts, created_at)` in a subquery and take the first row with rank >= 0.95.
2. Count negative lateness (`created_at < event_ts`). Negative values mean clock skew between producers or a wrong time zone; report the count.
3. Build a histogram by day of lateness to see the tail: `SELECT (created_at::date - event_ts::date) AS days_late, COUNT(*) FROM events WHERE ... GROUP BY 1 ORDER BY 1;`

### Output
`lateness_profile`.

### Quality Gate
- `lateness_profile` has p50, p95, p99 and max values copied from query output, plus the negative-lateness count and the query text.

---

## Phase 2: Set the Policy

### Entry Criteria
- `lateness_profile` complete.

### Actions
1. Present the percentiles to the user and ask which percentile the lookback must cover. Do not pick one. Record their answer and the matching interval as `lookback`.
2. Set `watermark_overlap` for extraction: the extract predicate becomes `updated_at >= last_watermark - <watermark_overlap>`. Use `lookback` when the watermark column is an arrival column; use the source column's precision step (for example 1 second for MySQL `TIMESTAMP` without fractional seconds) when the watermark is DB-maintained and committed in order. Overlap duplicates are safe only because loads are idempotent merges.
3. Set `reprocess_partitions`: every run rebuilds all event-time partitions in `[run_date - lookback, run_date]`. With dbt this becomes the `is_incremental()` filter; with partition overwrite it is the partition list.
4. Rows later than `max_lateness_accepted` (a user-given value): choose with the user between (a) land them and trigger a targeted backfill of their partition, or (b) land them into a quarantine table `<table>__late` and alert. Never silently drop them.
5. Unknown-member rule for late dimensions: when a fact row references a dimension key not yet loaded, load the fact with the dimension surrogate key set to an inferred member row (insert a placeholder dimension row with the natural key and `is_inferred = true`), and let the next dimension load overwrite its attributes. Do NOT inner-join facts to dimensions in the load step; that drops the fact.
6. Write `late_data_policy`.

### Output
`late_data_policy`.

### Quality Gate
- `lookback` and `max_lateness_accepted` are user-supplied values with the user's words recorded.
- The policy names exactly one handling path for rows beyond `max_lateness_accepted`.

---

## Phase 3: Prove the Policy Covers the Data

### Entry Criteria
- `late_data_policy` written.

### Actions
1. Count rows the policy would miss over the measured window:
   ```sql
   SELECT COUNT(*) FROM events
   WHERE created_at >= now() - interval '<user window>'
     AND created_at - event_ts > interval '<lookback>';
   ```
2. Report that count and its share of the window's rows. The user accepts it or widens `lookback`.

### Output
Coverage count attached to `late_data_policy`.

### Quality Gate
- The coverage count is reported with its query, and the user's acceptance is recorded.

---

## Worked Example

Illustrative. Mobile app events in Postgres; event time `event_ts` (device clock), arrival `created_at`.

Phase 1 output:
```
   p50    |   p95    |   p99    |    max_late
----------+----------+----------+-----------------
 00:00:04 | 00:21:10 | 1 day 02:13:00 | 41 days 03:00:00
negative lateness rows: 312
```
Phase 2: user chooses to cover p99 and sets `lookback = 3 days`, `max_lateness_accepted = 30 days`, beyond that quarantine and alert. Negative rows: user confirms device clock skew; kept as is.
Phase 3: 1,904 rows of 18.2 million in the window arrive later than 3 days; user accepts, and those rows are picked up by a weekly targeted backfill.

---

## Exit Criteria

DONE when `late_data_policy` has a user-approved lookback backed by measured percentiles, a coverage count, and an explicit path for very late rows and for facts with missing dimensions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No arrival column exists | **Adjust**: measure lateness at the target after a few runs using `_loaded_at - event_ts`; until then use a user-given lookback marked provisional. |
| Phase 1 | Large negative lateness | **Stop**: confirm time zones of both columns with the source owner before setting any policy. |
| Phase 2 | User declines to choose a percentile | **Return**: record lookback as `OPEN_QUESTION`; downstream flows must not invent one. |
| Phase 3 | Missed-row count is higher than the user accepts | **Retry**: widen `lookback` with the user and rerun Phase 3. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
