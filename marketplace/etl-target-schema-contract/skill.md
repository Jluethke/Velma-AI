# ETL Target Schema and Data Contract

**One-line description:** Writes the target table's data contract as a YAML file (grain, primary key, column names, warehouse types, nullability, allowed values, freshness and ownership) derived from the measured source profile and the consumer's stated needs, so loads, tests and alerts all read one source of truth.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_profile` (object[], required): Output of `etl-source-profile-sql`.
- `extraction_keys` (object[], required): Output of `etl-source-key-watermark-discovery`.
- `consumer_requirements` (object, required): From the people who read the target: target warehouse, target schema and table names, the grain in words ("one row per order line"), required columns, the freshness they need (for example "loaded data no older than N hours", with N given by them), owner name or team, and an alert destination.

---

## Outputs

- `data_contract` (object): The contract written to `contracts/<target_table>.yml`, with keys `table`, `grain`, `primary_key`, `columns` (name, type, nullable, description, accepted_values when known, source column), `partition_column` (or null), `watermark_column`, `delete_mode`, `freshness` (`loaded_at_column`, `warn_after`, `error_after` as given by the consumer), `owner`, `alert_destination`, `version`.

---

## Phase 1: Fix Grain and Key

### Entry Criteria
- `extraction_keys` has a proven `primary_key` for each source table feeding the target.

### Actions
1. Write the grain as one sentence of the form "one row per <entity> per <time or version>". If the consumer's grain differs from the source key, list the aggregation or join that changes it.
2. Set `primary_key` to the columns that make the grain unique. If the target grain equals the source grain, copy the proven source key. Otherwise the key is the group-by columns of the aggregation.
3. Choose `partition_column` with this table:
   | Condition | `partition_column` |
   |---|---|
   | Target is an append-heavy event or fact table and the warehouse supports partitioning (BigQuery, Databricks/Delta, Snowflake clustering, Postgres declarative partitioning) | the event date column (`DATE` type) |
   | Dimension or small reference table | `null` |
   | Consumer names a column | that column |

### Output
Grain, key and partition decision.

### Quality Gate
- The grain sentence names every `primary_key` column.

---

## Phase 2: Map Columns and Types

### Entry Criteria
- Grain fixed.

### Actions
1. For each column the consumer requires, find its source column in `source_profile`. A column with no source must be marked `derived` with the expression written out.
2. Map types with this table; never widen to `STRING`/`TEXT` to dodge a cast failure:
   | Source fact | Target type (Postgres / Snowflake / BigQuery / Databricks) |
   |---|---|
   | integer id | `bigint` / `NUMBER(38,0)` / `INT64` / `BIGINT` |
   | money with fixed scale | `numeric(p,s)` / `NUMBER(p,s)` / `NUMERIC(p,s)` or `BIGNUMERIC` / `DECIMAL(p,s)`; take p and s from the source declared type |
   | timestamp with zone or known UTC | `timestamptz` / `TIMESTAMP_TZ` or `TIMESTAMP_NTZ` stored as UTC / `TIMESTAMP` / `TIMESTAMP` |
   | timestamp without zone, zone unknown | ask the source owner; record as open question |
   | date | `date` / `DATE` / `DATE` / `DATE` |
   | text flagged `stringly_typed` date/number | the real type, cast in staging |
   | text | `text` / `VARCHAR` / `STRING` / `STRING` |
   Never map money to floating point (`double`, `FLOAT64`, `FLOAT`).
3. Set `nullable: false` only when the profile shows `null_count == 0` AND the consumer requires the column. If the profile shows nulls in a column the consumer says is required, record it as an open question; do not set `nullable: false` and hope.
4. Fill `accepted_values` only from an enumerated source (a check constraint, an enum type, a lookup table) or the consumer's list. Postgres enum: `SELECT enum_range(NULL::<type>);`.

### Output
Column list with types and nullability.

### Quality Gate
- Every required column has a source column or a written `derived` expression.
- No money column has a floating point type.

---

## Phase 3: Write and Lint the Contract File

### Entry Criteria
- Column list complete.

### Actions
1. Write `contracts/<target_table>.yml`:
   ```yaml
   version: 1
   table: analytics.fct_orders
   grain: one row per order_id
   primary_key: [order_id]
   partition_column: order_date
   watermark_column: updated_at
   delete_mode: hard_delete
   owner: sales-analytics
   alert_destination: "<from consumer_requirements>"
   freshness:
     loaded_at_column: _loaded_at
     warn_after: "<from consumer_requirements>"
     error_after: "<from consumer_requirements>"
   columns:
     - name: order_id
       type: bigint
       nullable: false
       source: sales.orders.order_id
     - name: status
       type: text
       nullable: false
       accepted_values: [placed, shipped, cancelled]
       source: sales.orders.status
   ```
2. Always add a `_loaded_at` column (load timestamp set by the pipeline). Freshness checks need it; the source `updated_at` measures source activity, not pipeline health.
3. Parse the file to catch YAML errors: `python -c "import yaml,sys; yaml.safe_load(open(sys.argv[1]))" contracts/fct_orders.yml` (requires PyYAML) or `yq '.' contracts/fct_orders.yml`.
4. Bump `version` whenever a column is removed or its type narrows; that is a breaking change.

### Output
`data_contract`.

### Quality Gate
- The YAML parse command exits 0.
- `freshness.warn_after` and `error_after` are values supplied by the consumer, or the literal string `OPEN_QUESTION`.

---

## Worked Example

Illustrative. Consumer: "Snowflake, ANALYTICS.FCT_ORDERS, one row per order, freshness: warn after 6 hours, error after 12 hours (our SLA)".

Phase 1: grain "one row per order_id"; partition column none (Snowflake: the consumer may request clustering later).
Phase 2: `amount` source type `numeric(12,2)` maps to `NUMBER(12,2)`; `status` source is a Postgres enum, `SELECT enum_range(NULL::order_status);` returns `{placed,shipped,cancelled}`.
Phase 3:
```
$ python -c "import yaml,sys; yaml.safe_load(open(sys.argv[1]))" contracts/fct_orders.yml
$ echo $?
0
```

---

## Exit Criteria

DONE when `contracts/<target_table>.yml` parses, every column has a type from the mapping table, and every unknown is written as `OPEN_QUESTION` rather than guessed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Consumer grain cannot be made unique by any key | **Return**: show duplicate examples and ask the consumer to restate the grain. |
| Phase 2 | Timestamp zone unknown | **Stop**: ask the source owner; a wrong zone silently shifts every row. |
| Phase 2 | Consumer wants NOT NULL on a column with nulls | **Return**: report counts; the consumer chooses a default, a filter, or nullable. |
| Phase 3 | YAML parse fails | **Retry**: fix indentation or quoting, rerun the parse command. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
