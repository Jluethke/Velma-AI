# ETL dbt Snapshot for SCD Type 2 History

**One-line description:** Captures row history (slowly changing dimension type 2) with a dbt snapshot: chooses the `timestamp` or `check` strategy from the watermark evidence, configures hard-delete handling, runs `dbt snapshot`, and tests that every key has exactly one current row and no overlapping validity windows.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `staging_models` (string[], required): Output of `etl-dbt-sources-staging`; the snapshot reads a staging model.
- `data_contract` (object, required): Output of `etl-target-schema-contract` (key, `watermark_column`, `delete_mode`).
- `project_dir` (string, required): dbt project root.

---

## Outputs

- `snapshot_config` (string): Path to `snapshots/<name>.yml` (or `snapshots/<name>.sql` on dbt older than 1.9), plus the results of the two history tests.

---

## Phase 1: Choose Strategy and Delete Handling

### Entry Criteria
- The consumer needs history ("what was the status on date X"). If not, stop; use the incremental model.

### Actions
1. Choose the strategy:
   | Evidence from key and watermark discovery | Strategy | Config |
   |---|---|---|
   | `watermark_type = timestamp`, DB-maintained, updates move it | `timestamp` | `updated_at: <column>` |
   | No reliable timestamp | `check` | `check_cols: [<columns whose change matters>]` (listing columns is cheaper and clearer than `all`) |
2. Choose hard-delete handling from `data_contract.delete_mode`:
   | `delete_mode` | dbt 1.9+ `hard_deletes` | dbt older than 1.9 |
   |---|---|---|
   | `hard_delete` and history must show the deletion | `invalidate` (closes the current row) or `new_record` (adds a row flagged deleted) | `invalidate_hard_deletes: true` |
   | soft delete column | `ignore` (default); the flag column change is captured as a normal update | default |
3. Snapshot the staging model (renamed and cast, no business logic). Snapshotting a transformed mart makes history change whenever logic changes.

### Output
Strategy and delete setting.

### Quality Gate
- The chosen row in each table matches `data_contract.watermark_column` and `delete_mode` exactly.

---

## Phase 2: Write and Run the Snapshot

### Entry Criteria
- `dbt --version` recorded.

### Actions
1. dbt 1.9 and later, YAML in `snapshots/orders_snapshot.yml`:
   ```yaml
   snapshots:
     - name: orders_snapshot
       relation: ref('stg_shop__orders')
       config:
         schema: snapshots
         unique_key: order_id
         strategy: timestamp
         updated_at: updated_at
         hard_deletes: invalidate
   ```
2. Older dbt, Jinja block in `snapshots/orders_snapshot.sql`:
   ```sql
   {% snapshot orders_snapshot %}
   {{ config(target_schema='snapshots', unique_key='order_id',
             strategy='timestamp', updated_at='updated_at',
             invalidate_hard_deletes=True) }}
   select * from {{ ref('stg_shop__orders') }}
   {% endsnapshot %}
   ```
3. Run `dbt snapshot --select orders_snapshot`. The table gains `dbt_scd_id`, `dbt_updated_at`, `dbt_valid_from`, `dbt_valid_to`. Current rows have `dbt_valid_to` null (unless `dbt_valid_to_current` is configured in 1.9+).
4. Schedule `dbt snapshot` at least as often as the source changes you need to see; changes between two runs collapse into one version. State this to the user.
5. NEVER drop or recreate the snapshot table to "fix" it: it is the only copy of history. There is no `--full-refresh` for snapshots.

### Output
Snapshot table populated.

### Quality Gate
- `dbt snapshot --select orders_snapshot` output ends with `ERROR=0`.

---

## Phase 3: Test History Integrity

### Entry Criteria
- Snapshot ran at least twice, with at least one source change between runs (make one on dev if needed).

### Actions
1. One current row per key (save as a singular test `tests/assert_orders_snapshot_one_current.sql`):
   ```sql
   select order_id, count(*) as n
   from {{ ref('orders_snapshot') }}
   where dbt_valid_to is null
   group by order_id
   having count(*) > 1
   ```
2. No overlapping windows (`tests/assert_orders_snapshot_no_overlap.sql`):
   ```sql
   select a.order_id
   from {{ ref('orders_snapshot') }} a
   join {{ ref('orders_snapshot') }} b
     on a.order_id = b.order_id and a.dbt_scd_id <> b.dbt_scd_id
    and a.dbt_valid_from < coalesce(b.dbt_valid_to, {{ dbt.current_timestamp() }})
    and b.dbt_valid_from < coalesce(a.dbt_valid_to, {{ dbt.current_timestamp() }})
   ```
3. Run `dbt test --select orders_snapshot`. A singular test passes when it returns zero rows.
4. Show the history of one changed key to the user: `select * from snapshots.orders_snapshot where order_id = <id> order by dbt_valid_from;`.

### Output
`snapshot_config` with test results.

### Quality Gate
- `dbt test --select orders_snapshot` shows both singular tests `PASS`.

---

## Worked Example

Illustrative. Order 1042 changed from `placed` to `shipped` between two runs.
```
$ dbt snapshot --select orders_snapshot
1 of 1 OK snapshotted snapshots.orders_snapshot ................. [success in 3.80s]
$ dbt test --select orders_snapshot
1 of 2 PASS assert_orders_snapshot_no_overlap ................... [PASS in 1.9s]
2 of 2 PASS assert_orders_snapshot_one_current .................. [PASS in 1.2s]

order_id | status  | dbt_valid_from      | dbt_valid_to
1042     | placed  | 2026-10-19 03:00:02 | 2026-10-20 02:41:10
1042     | shipped | 2026-10-20 02:41:10 | null
```

---

## Exit Criteria

DONE when the snapshot uses the strategy and delete handling that match the source evidence, runs clean, and both integrity tests pass after at least one captured change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Timestamp strategy chosen but the column is not moved by every update | **Adjust**: switch to `check` with explicit `check_cols`. |
| Phase 2 | Snapshot fails on duplicate keys in the source query | **Return**: the key is not unique in staging; fix upstream, never add `distinct` blindly. |
| Phase 3 | Multiple current rows per key | **Stop**: usually two snapshot runs overlapped or the key changed; prevent concurrent runs in the orchestrator before repairing rows with the owner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
