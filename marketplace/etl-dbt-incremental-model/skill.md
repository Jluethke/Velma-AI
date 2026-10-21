# ETL dbt Incremental Model

**One-line description:** Builds a dbt incremental model with the correct `incremental_strategy` for the adapter (merge, delete+insert, insert_overwrite, microbatch), a `unique_key` from the proven source key, an `is_incremental()` filter with the approved lookback, and an explicit `on_schema_change`, then proves that an incremental run equals a full refresh.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `staging_models` (string[], required): Output of `etl-dbt-sources-staging`.
- `data_contract` (object, required): Output of `etl-target-schema-contract`.
- `extraction_keys` (object[], required): Supplies the proven `primary_key`.
- `late_data_policy` (object, required): Output of `etl-late-arriving-data-policy`; supplies `lookback`.
- `project_dir` (string, required): dbt project root.

---

## Outputs

- `incremental_model` (string): Path to `models/marts/<model>.sql` with its YAML, plus the equality check query result.

---

## Phase 1: Pick the Strategy

### Entry Criteria
- `dbt --version` shows the adapter (for example `snowflake`, `bigquery`, `postgres`, `databricks`).

### Actions
1. Choose with this table. Strategies and defaults come from the dbt docs for each adapter; confirm against "Incremental strategy" in your adapter's docs page.
   | Adapter | Rows updated by key | Whole days recomputed | Notes |
   |---|---|---|---|
   | Snowflake | `merge` (default) | `delete+insert` or `microbatch` | Snowflake `insert_overwrite` replaces the ENTIRE table, not partitions; do not use it for partial loads. |
   | BigQuery | `merge` (default) | `insert_overwrite` with `partition_by`, or `microbatch` | `insert_overwrite` replaces only partitions present in the new data. |
   | Postgres | `merge` (dbt-postgres 1.6+ on PostgreSQL 15+) or `delete+insert` | `delete+insert` or `microbatch` | default is `append`, which duplicates on rerun. |
   | Databricks | `merge` (default on Delta) | `replace_where` or `insert_overwrite` or `microbatch` | |
2. `microbatch` (dbt 1.9 and later) needs `event_time`, `batch_size`, `begin`, and `event_time` configured on upstream models so dbt can filter them. It does not use `is_incremental()`.
3. Never use `append` for a table with a `primary_key`; reruns and overlaps duplicate rows.

### Output
Strategy recorded with the docs row that supports it.

### Quality Gate
- The chosen strategy appears in the table row for your adapter.

---

## Phase 2: Write the Model

### Entry Criteria
- Strategy chosen.

### Actions
1. Edit ONE new file, `models/marts/fct_orders.sql` (merge example):
   ```sql
   {{ config(
       materialized = 'incremental',
       unique_key = 'order_id',
       incremental_strategy = 'merge',
       on_schema_change = 'append_new_columns'
   ) }}

   select order_id, status, amount, updated_at, _loaded_at
   from {{ ref('stg_shop__orders') }}

   {% if is_incremental() %}
   where _loaded_at >= (
       select {{ dbt.dateadd('hour', -1 * var('lookback_hours'), 'max(_loaded_at)') }}
       from {{ this }}
   )
   {% endif %}
   ```
   - `lookback_hours` comes from `late_data_policy.lookback`, set in `dbt_project.yml` under `vars:`; do not hardcode a number.
   - Filter on the load timestamp `_loaded_at` (what is new to the warehouse), not `updated_at`, unless the policy says the source timestamp is reliable.
   - `{{ this }}` is the existing target; the subquery returns null on an empty table only when `is_incremental()` is false, which it is on the first run.
2. `on_schema_change` values: `ignore` (default: new columns are silently not added), `fail`, `append_new_columns`, `sync_all_columns` (also drops removed columns). Pick using the schema drift policy: additive changes continue, breaking changes fail.
3. Composite key: `unique_key = ['order_id', 'line_number']`. Every key column must be not null; merges never match null keys and insert duplicates.
4. Microbatch variant:
   ```sql
   {{ config(materialized='incremental', incremental_strategy='microbatch',
             event_time='event_ts', batch_size='day', begin='<first date from user>',
             lookback=var('lookback_batches'), unique_key='event_id') }}
   select * from {{ ref('stg_app__events') }}
   ```
5. Compile and read the generated SQL: `dbt compile --select fct_orders` then open `target/compiled/<project>/models/marts/fct_orders.sql`.

### Output
Model file and YAML with `unique` and `not_null` tests on the key.

### Quality Gate
- `dbt compile --select fct_orders` exits 0 and the compiled file contains the `where _loaded_at >=` filter only after an incremental run (check `target/run/.../fct_orders.sql` after Phase 3 step 2).

---

## Phase 3: Prove Incremental Equals Full Refresh

### Entry Criteria
- Model compiles.

### Actions
1. `dbt build --select fct_orders --full-refresh` (first build).
2. Load a new batch into raw (or wait for one), then `dbt build --select fct_orders`. Read `target/run/<project>/models/marts/fct_orders.sql` to confirm a MERGE (or the chosen strategy's statement) ran.
3. Build a full-refresh copy to compare without touching production: `dbt build --select fct_orders --full-refresh --target ci` (a target pointing at a scratch schema), or create the comparison with the `audit_helper` package's `compare_relations` macro.
4. Compare: rows in one and not the other, both directions:
   ```sql
   select count(*) from (select * from prod.fct_orders except select * from ci.fct_orders) a;
   select count(*) from (select * from ci.fct_orders except select * from prod.fct_orders) b;
   ```
   Exclude `_loaded_at` from the comparison column list; it differs by design. (`except` is `EXCEPT DISTINCT` on BigQuery and `MINUS` also works on Snowflake.)
5. Both counts must be 0. If not, the filter misses late rows or the key is wrong; fix the model, not the comparison.

### Output
`incremental_model` with the comparison result.

### Quality Gate
- Both `except` counts are 0, and `dbt build --select fct_orders` shows `ERROR=0` with the key tests passing.

---

## Worked Example

Illustrative. Snowflake, `lookback_hours: 72` from the policy.
```
$ dbt build --select fct_orders --full-refresh
1 of 3 OK created sql incremental model analytics.fct_orders ...... [SUCCESS 4812240 in 38.20s]
$ dbt build --select fct_orders
1 of 3 OK created sql incremental model analytics.fct_orders ...... [SUCCESS 18101 in 6.44s]
2 of 3 PASS unique_fct_orders_order_id ............................ [PASS in 2.10s]
3 of 3 PASS not_null_fct_orders_order_id .......................... [PASS in 1.31s]
$ grep -c "merge into" target/run/shop/models/marts/fct_orders.sql
1
except counts: 0 and 0
```

---

## Exit Criteria

DONE when the model uses a strategy the adapter documents for the data shape, the key and lookback come from upstream flows, and an incremental build equals a full refresh by a two-way `except`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Strategy not supported by adapter (`Invalid incremental strategy`) | **Adjust**: pick from the adapter's documented list. |
| Phase 2 | `unique_key` test fails | **Return**: key not unique in the staging data; go back to key discovery. |
| Phase 3 | `except` counts non-zero | **Adjust**: widen the lookback via the late data policy or fix the key; never delete the comparison. |
| Phase 3 | New source column missing in target | **Adjust**: `on_schema_change` is `ignore`; set it per the drift policy and run once with `--full-refresh` if required. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
