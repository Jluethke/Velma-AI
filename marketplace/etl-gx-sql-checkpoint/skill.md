# ETL Great Expectations Checkpoint on a SQL Table

**One-line description:** Validates a loaded warehouse table against the data contract with Great Expectations (GX Core 1.x): a file-backed context, a SQL data source and table asset, an Expectation Suite built only from contract facts, a Validation Definition and a Checkpoint whose result fails the pipeline run with a non-zero exit code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_contract` (object, required): Output of `etl-target-schema-contract`.
- `project_dir` (string, required): Repository root; the GX project lives in `<project_dir>/gx/`.

---

## Outputs

- `gx_checkpoint` (string): Path to `pipelines/quality/<table>_gx.py`, which builds or loads the suite and runs the checkpoint, and the `gx/` directory.
- `validation_result` (object): Checkpoint `success` flag and per expectation: type, column, `success`, `unexpected_count`, `unexpected_percent`, partial unexpected values.

---

## Phase 1: Create the Context and Data Source

### Entry Criteria
- `python -c "import great_expectations as gx; print(gx.__version__)"` prints `1.x`. If it prints `0.x`, stop: the 0.x API (`get_validator`, `add_or_update_expectation_suite`, `SimpleCheckpoint`) is different; upgrade per the GX migration guide or use the 0.x docs.
- A connection string is in an environment variable (for example `WAREHOUSE_URL`), never in code.

### Actions
1. Edit ONE file, `pipelines/quality/orders_gx.py`:
   ```python
   import sys
   import great_expectations as gx

   context = gx.get_context(mode="file", project_root_dir=".")
   ds = context.data_sources.add_postgres(
       name="warehouse", connection_string="${WAREHOUSE_URL}")
   asset = ds.add_table_asset(name="fct_orders", table_name="fct_orders", schema_name="analytics")
   batch_def = asset.add_batch_definition_whole_table("whole_table")
   ```
   `${WAREHOUSE_URL}` is substituted by GX from the environment. Other SQL sources: `context.data_sources.add_snowflake(...)`, `add_sqlite(...)`, or the generic `add_sql(...)` with a SQLAlchemy URL; check the GX "Connect to SQL data" page for the exact arguments of each.
2. On reruns, `add_*` raises because the object already exists. Use `context.data_sources.get("warehouse")`, `ds.get_asset("fct_orders")`, `asset.get_batch_definition("whole_table")` in an `except` branch, or check the GX docs for the update method in your version. Do not delete the `gx/` folder to get around it.
3. For large tables, validate only the run's slice: `asset.add_batch_definition_daily(name="daily", column="updated_at")` and pass `batch_parameters={"year": 2026, "month": 10, "day": 20}` at run time.

### Output
Context with data source, asset and batch definition.

### Quality Gate
- `python pipelines/quality/orders_gx.py` runs to this point twice in a row without an exception (proves the rerun path works).

---

## Phase 2: Build the Suite from the Contract

### Entry Criteria
- Batch definition exists.

### Actions
1. Map each contract fact to one expectation. Use only these real class names:
   | Contract fact | Expectation |
   |---|---|
   | exact column list | `gx.expectations.ExpectTableColumnsToMatchSet(column_set=[...], exact_match=True)` |
   | `nullable: false` | `gx.expectations.ExpectColumnValuesToNotBeNull(column=...)` |
   | single-column key | `gx.expectations.ExpectColumnValuesToBeUnique(column=...)` |
   | composite key | `gx.expectations.ExpectCompoundColumnsToBeUnique(column_list=[...])` |
   | `accepted_values` | `gx.expectations.ExpectColumnValuesToBeInSet(column=..., value_set=[...])` |
   | numeric range stated by the consumer | `gx.expectations.ExpectColumnValuesToBeBetween(column=..., min_value=..., max_value=...)` |
2. Do not add expectations from the profiler or from guesses. A range without a consumer statement is an open question, not an expectation.
3. Create the suite:
   ```python
   suite = context.suites.add(gx.ExpectationSuite(name="fct_orders_contract"))
   suite.add_expectation(gx.expectations.ExpectColumnValuesToNotBeNull(column="order_id"))
   suite.add_expectation(gx.expectations.ExpectColumnValuesToBeUnique(column="order_id"))
   suite.add_expectation(gx.expectations.ExpectColumnValuesToBeInSet(
       column="status", value_set=["placed", "shipped", "cancelled"]))
   ```
   On rerun use `context.suites.get("fct_orders_contract")`.

### Output
Suite with one expectation per contract fact.

### Quality Gate
- `len(suite.expectations)` printed by the script equals the number of contract facts in the table above.

---

## Phase 3: Run the Checkpoint and Fail the Run

### Entry Criteria
- Suite built.

### Actions
1. Add the validation definition and checkpoint:
   ```python
   vd = context.validation_definitions.add(
       gx.ValidationDefinition(name="fct_orders_vd", data=batch_def, suite=suite))
   cp = context.checkpoints.add(gx.Checkpoint(
       name="fct_orders_cp", validation_definitions=[vd],
       result_format={"result_format": "SUMMARY"}))
   result = cp.run()
   print(result.describe())
   sys.exit(0 if result.success else 1)
   ```
2. The exit code is the contract with the orchestrator: non-zero fails the task, which triggers retries and alerting. Never wrap `cp.run()` in a `try/except` that exits 0.
3. Read `result.describe()`: for each failed expectation note `expectation_type`, `kwargs.column`, `result.unexpected_count` and `partial_unexpected_list`.
4. Commit `gx/` config files (not `gx/uncommitted/`, which holds local data docs and secrets).

### Output
`gx_checkpoint`, `validation_result`.

### Quality Gate
- `python pipelines/quality/orders_gx.py; echo $?` prints `0` on clean data.
- Inserting one null `order_id` row on a dev copy makes the same command print `1`.

---

## Worked Example

Illustrative. Postgres warehouse, GX 1.x.
```
$ python pipelines/quality/orders_gx.py; echo $?
{"success": false, "statistics": {"evaluated_expectations": 3, "successful_expectations": 2, ...},
 "expectations": [{"expectation_type": "expect_column_values_to_be_in_set",
   "success": false, "kwargs": {"column": "status", ...},
   "result": {"unexpected_count": 41, "partial_unexpected_list": ["refunded", "refunded", ...]}}, ...]}
1
```
New status `refunded` appeared at the source. Response: report to the owner; the contract gets a version bump if `refunded` is valid. The expectation is not removed.

---

## Exit Criteria

DONE when the script runs idempotently, the suite holds exactly the contract's facts, and the exit code is 0 on clean data and 1 on a seeded violation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `AttributeError` on `data_sources` | **Stop**: GX is 0.x; upgrade or follow 0.x docs. |
| Phase 1 | Connection fails | **Return**: check the environment variable and SQLAlchemy driver package (for example `psycopg2-binary`). |
| Phase 2 | Expectation class not found | **Adjust**: check the class name in the GX Expectations gallery; never invent one. |
| Phase 3 | Validation fails | **Return**: report failures to the owner; do not remove or loosen the expectation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
