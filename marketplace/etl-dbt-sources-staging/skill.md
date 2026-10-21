# ETL dbt Sources and Staging Models

**One-line description:** Declares landed raw tables as dbt sources with `loaded_at_field` and freshness, generates one staging model per source table (rename, cast, no joins, no filters) with the `dbt-codegen` package, and proves them with `dbt parse`, `dbt build --select` and `dbt source freshness`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_contract` (object, required): Output of `etl-target-schema-contract` (column names, target types, freshness values, `_loaded_at`).
- `project_dir` (string, required): dbt project root (contains `dbt_project.yml`).

---

## Outputs

- `sources_yml` (string): Path to `models/staging/<source>/_<source>__sources.yml`.
- `staging_models` (string[]): Paths to `models/staging/<source>/stg_<source>__<table>.sql` and their `_<source>__models.yml`.

---

## Phase 1: Declare Sources

### Entry Criteria
- `dbt debug` in `project_dir` ends with `All checks passed!`.

### Actions
1. Record the version: `dbt --version`. Freshness syntax moved between versions: dbt 1.10 and later expect `freshness` under a `config:` block on sources and warn on the older top-level placement. Use the placement your version documents; do not mix both.
2. Add codegen to `packages.yml` (version range from the dbt package hub page for your dbt version), then `dbt deps`.
3. Generate the source block instead of typing columns:
   ```bash
   dbt run-operation generate_source --args '{"schema_name": "raw_shop", "database_name": "RAW", "table_names": ["orders"], "generate_columns": true}'
   ```
   Paste the printed YAML into `models/staging/shop/_shop__sources.yml`.
4. Add `loaded_at_field` and freshness from `data_contract.freshness` (the consumer's values, never invented):
   ```yaml
   version: 2
   sources:
     - name: shop
       database: RAW
       schema: raw_shop
       tables:
         - name: orders
           loaded_at_field: _loaded_at
           freshness:
             warn_after: {count: 6, period: hour}
             error_after: {count: 12, period: hour}
           columns:
             - name: order_id
               data_tests: [unique, not_null]
   ```
   `data_tests:` is the key name from dbt 1.8 on; earlier versions use `tests:`.
5. `loaded_at_field` must be the pipeline load timestamp, not the source `updated_at`; a quiet source with a healthy pipeline is not stale.

### Output
`sources_yml`.

### Quality Gate
- `dbt parse` exits 0.
- `dbt ls --resource-type source --select source:shop` lists `source:<project>.shop.orders`.

---

## Phase 2: Generate Staging Models

### Entry Criteria
- Sources parse.

### Actions
1. Generate a base model per table:
   ```bash
   dbt run-operation generate_base_model --args '{"source_name": "shop", "table_name": "orders"}'
   ```
2. Save as `models/staging/shop/stg_shop__orders.sql` and edit ONLY to rename and cast, following the contract:
   ```sql
   with source as (
       select * from {{ source('shop', 'orders') }}
   ),
   renamed as (
       select
           order_id::bigint            as order_id,
           lower(status)               as status,
           amount::numeric(12,2)       as amount,
           updated_at::timestamp_tz    as updated_at,
           _loaded_at
       from source
   )
   select * from renamed
   ```
   Use the cast syntax of your warehouse (`cast(x as type)` is portable). Staging rules: one source table per model, no joins, no aggregations, no filters that drop rows, explicit column list in the final CTE.
3. Set materialization in `dbt_project.yml` once for the folder, not per model:
   ```yaml
   models:
     <project_name>:
       staging:
         +materialized: view
   ```
4. Create `_shop__models.yml` documenting each staging model and adding `unique` and `not_null` tests on the key.
5. Never write a raw schema name (`raw_shop.orders`) in a model; always `{{ source() }}`, or lineage breaks.

### Output
`staging_models`.

### Quality Gate
- `grep -rn "raw_shop\." models/` returns nothing.
- `dbt build --select stg_shop__orders` ends with `Completed successfully` and `ERROR=0`.

---

## Phase 3: Check Freshness

### Entry Criteria
- Staging builds.

### Actions
1. Run `dbt source freshness --select source:shop`. Read each line: `PASS`, `WARN` or `ERROR STALE` with the max loaded_at age.
2. The command writes `target/sources.json`; keep it as the artifact the alerting flow reads.
3. If the result is `ERROR STALE` on a first run, check whether the raw table has any rows with `_loaded_at` set; do not loosen thresholds to pass.

### Output
Freshness results in `target/sources.json`.

### Quality Gate
- `jq '.results[] | {unique_id, status}' target/sources.json` prints one entry per source table with status `pass` (or a `warn`/`error` reported to the user, not hidden).

---

## Worked Example

Illustrative. Snowflake, dbt-core 1.9.
```
$ dbt parse
... Performance info: target/perf_info.json
$ dbt build --select stg_shop__orders
1 of 3 START sql view model analytics_staging.stg_shop__orders ........ [RUN]
1 of 3 OK created sql view model analytics_staging.stg_shop__orders ... [SUCCESS 1 in 0.91s]
2 of 3 PASS not_null_stg_shop__orders_order_id ......................... [PASS in 1.02s]
3 of 3 PASS unique_stg_shop__orders_order_id ........................... [PASS in 1.10s]
Done. PASS=3 WARN=0 ERROR=0 SKIP=0 TOTAL=3
$ dbt source freshness --select source:shop
1 of 1 PASS freshness of shop.orders ................................... [PASS in 0.84s]
```

---

## Exit Criteria

DONE when every landed table is a declared source with freshness from the contract, each has one staging model that only renames and casts, and `dbt build` and `dbt source freshness` both run clean.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `dbt debug` fails | **Stop**: fix `profiles.yml` connection first; nothing else will run. |
| Phase 1 | Deprecation warning about freshness placement | **Adjust**: move freshness under the placement your dbt version documents. |
| Phase 2 | Cast fails on build (`Numeric value 'abc' is not recognized`) | **Return**: report the bad rows to the source owner; use a safe cast (`try_cast`) only if the contract allows nulls there. |
| Phase 3 | `ERROR STALE` | **Return**: report to the alert destination; do not raise `error_after`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
