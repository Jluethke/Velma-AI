# ETL dbt Tests, Model Contracts and Unit Tests

**One-line description:** Turns the data contract into enforced dbt checks: an enforced model contract (`contract: {enforced: true}` with `data_type` per column), generic data tests (`unique`, `not_null`, `accepted_values`, `relationships`, `dbt_utils.unique_combination_of_columns`), a unit test for the incremental branch, and reads failures from `target/run_results.json`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incremental_model` (string, required): Output of `etl-dbt-incremental-model`.
- `data_contract` (object, required): Output of `etl-target-schema-contract`.
- `project_dir` (string, required): dbt project root.

---

## Outputs

- `dbt_test_config` (string): Path to `models/marts/_marts__models.yml` with the contract, data tests and unit tests.
- `dbt_build_result` (object): Parsed `target/run_results.json`: each node's `unique_id`, `status`, `failures`, and the stored-failures table for any failing test.

---

## Phase 1: Enforce the Model Contract

### Entry Criteria
- `dbt build --select <model>` already succeeds without a contract.

### Actions
1. In `models/marts/_marts__models.yml`, declare every column with its warehouse type from `data_contract`:
   ```yaml
   models:
     - name: fct_orders
       config:
         contract: {enforced: true}
       columns:
         - name: order_id
           data_type: number(38,0)
           constraints:
             - type: not_null
         - name: status
           data_type: varchar
         - name: amount
           data_type: number(12,2)
         - name: updated_at
           data_type: timestamp_tz
         - name: _loaded_at
           data_type: timestamp_tz
   ```
2. With an enforced contract, dbt checks column names and types before building and fails with a table of mismatches. Every column in the model's SELECT must be listed.
3. Constraint enforcement depends on the platform: `not_null` is enforced on Snowflake, BigQuery, Postgres and Databricks; `primary_key` and `unique` are NOT enforced on Snowflake or BigQuery (metadata only). Keep data tests for them (Phase 2). Check the "Model contracts / constraints" docs page for your adapter.
4. Incremental models with an enforced contract require `on_schema_change` set to `append_new_columns`, `sync_all_columns` or `fail` (dbt rejects `ignore` with an enforced contract in recent versions; confirm with `dbt build`).

### Output
Contract in YAML.

### Quality Gate
- `dbt build --select fct_orders` passes the contract check (no `This model has an enforced contract that failed` message).

---

## Phase 2: Add Data Tests

### Entry Criteria
- Contract enforced.

### Actions
1. Map each contract fact to exactly one test:
   | Contract fact | Test |
   |---|---|
   | single-column `primary_key` | `unique` + `not_null` on the column |
   | composite `primary_key` | `dbt_utils.unique_combination_of_columns` with `combination_of_columns:` (needs `dbt-utils` in `packages.yml`) |
   | `nullable: false` | `not_null` |
   | `accepted_values` | `accepted_values` with `values: [...]` |
   | foreign key to a dimension | `relationships` with `to: ref('dim_customers')` and `field: customer_id` |
   | business rule ("amount >= 0") stated by the consumer | `dbt_utils.expression_is_true` with `expression: "amount >= 0"` |
2. YAML key is `data_tests:` from dbt 1.8. dbt 1.10 prefers test arguments nested under `arguments:` and warns otherwise; follow the form your version documents.
3. Severity: default is `error`. Use `config: {severity: warn}` only when the consumer explicitly says a failure must not stop the pipeline; record their words. Never lower severity to make a run green.
4. Add `config: {store_failures: true}` to the key tests so failing rows land in an audit table (default schema suffix `dbt_test__audit`) for diagnosis.

### Output
Data tests in YAML.

### Quality Gate
- Every `primary_key` and `nullable: false` column in `data_contract` has a matching test in the YAML (check by listing: `dbt ls --select fct_orders --resource-type test`).

---

## Phase 3: Unit Test the Incremental Branch and Read Results

### Entry Criteria
- dbt 1.8 or later for unit tests (`dbt --version`). On older versions skip steps 1 and 2 and record it.

### Actions
1. Add a unit test that forces the incremental branch:
   ```yaml
   unit_tests:
     - name: fct_orders_incremental_keeps_late_rows
       model: fct_orders
       overrides:
         macros:
           is_incremental: true
       given:
         - input: ref('stg_shop__orders')
           rows:
             - {order_id: 1, status: shipped, amount: 10.00, updated_at: "2026-10-20 01:00:00", _loaded_at: "2026-10-20 02:00:00"}
         - input: this
           rows:
             - {order_id: 1, status: placed, amount: 10.00, updated_at: "2026-10-19 01:00:00", _loaded_at: "2026-10-19 02:00:00"}
       expect:
         rows:
           - {order_id: 1, status: shipped}
   ```
2. Run unit tests alone: `dbt test --select "fct_orders,test_type:unit"`.
3. Run everything: `dbt build --select fct_orders`.
4. Read results, never just the console tail:
   ```bash
   jq -r '.results[] | select(.status != "pass" and .status != "success") | [.unique_id, .status, .failures] | @tsv' target/run_results.json
   ```
   Empty output means no failures, warnings or errors.
5. For a failing test, query its stored failures: the table name is printed in the log line for that test.

### Output
`dbt_test_config`, `dbt_build_result`.

### Quality Gate
- The `jq` command prints nothing, and `dbt build` ends with `ERROR=0`.

---

## Worked Example

Illustrative.
```
$ dbt build --select fct_orders
1 of 6 START unit_test fct_orders::fct_orders_incremental_keeps_late_rows ... [RUN]
1 of 6 PASS fct_orders::fct_orders_incremental_keeps_late_rows ............. [PASS in 1.4s]
2 of 6 OK created sql incremental model analytics.fct_orders ............... [SUCCESS 18101 in 6.1s]
3 of 6 PASS accepted_values_fct_orders_status__placed__shipped__cancelled .. [PASS in 1.2s]
4 of 6 FAIL 3 not_null_fct_orders_amount .................................... [FAIL 3 in 1.1s]
...
Done. PASS=5 WARN=0 ERROR=1 SKIP=0 TOTAL=6
$ jq -r '.results[] | select(.status != "pass" and .status != "success") | [.unique_id, .status, .failures] | @tsv' target/run_results.json
test.shop.not_null_fct_orders_amount.4c1f	fail	3
```
Action: query the stored failures, find 3 orders with null amount in the source, report to the owner. The test stays at `error`.

---

## Exit Criteria

DONE when the model contract is enforced, every contract fact has its test, the incremental unit test passes, and `run_results.json` shows no non-passing node.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Contract mismatch table printed | **Adjust**: cast in the model to the declared type; do not change the declared type to match a wrong cast. |
| Phase 2 | `relationships` test fails | **Return**: orphan keys; apply the unknown-member rule from the late data policy. |
| Phase 3 | Unit test fails | **Adjust**: fix model logic; never edit `expect` rows to match wrong output. |
| Phase 3 | Weak model wants to delete a failing test | **Stop**: deleting or weakening tests is forbidden; report the failure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
