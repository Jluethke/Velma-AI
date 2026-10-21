# ETL Python Transform with Polars

**One-line description:** Writes a batch transform as a pure Polars LazyFrame function (scan, strict casts to the contract schema, deterministic latest-per-key dedup, joins with `validate=`), asserts the output schema with `collect_schema()`, and tests it with `polars.testing.assert_frame_equal` under pytest.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_contract` (object, required): Output of `etl-target-schema-contract` (column names, types, key, accepted values).
- `project_dir` (string, required): Repository root with a Python package, for example `pipelines/transform/`.

---

## Outputs

- `transform_module` (string): Path to `pipelines/transform/<table>.py` exposing `def transform(raw: pl.LazyFrame, <dims>: pl.LazyFrame) -> pl.LazyFrame` and a `SCHEMA` dict.
- `transform_tests` (string): Path to `tests/transform/test_<table>.py` and the pytest result line.

---

## Phase 1: Encode the Contract Schema

### Entry Criteria
- `python -c "import polars; polars.show_versions()"` runs. Record the Polars version; APIs below are from Polars 1.x. If the version is 0.x, check each method in the API reference before use.

### Actions
1. Create `pipelines/transform/orders.py` with the target schema as a constant, mapping contract types to Polars dtypes:
   ```python
   import polars as pl

   SCHEMA: dict[str, pl.DataType] = {
       "order_id": pl.Int64,
       "customer_id": pl.Int64,
       "status": pl.Utf8,
       "amount": pl.Decimal(precision=12, scale=2),
       "updated_at": pl.Datetime(time_unit="us", time_zone="UTC"),
   }
   ```
   Money uses `pl.Decimal`, never `pl.Float64`.
2. Do NOT infer types from data (`infer_schema_length`) for production code; CSV inference changes when a new file has different values.

### Output
`SCHEMA` constant.

### Quality Gate
- `python -c "from pipelines.transform.orders import SCHEMA; print(SCHEMA)"` prints every contract column.

---

## Phase 2: Write the Transform Function

### Entry Criteria
- `SCHEMA` exists.

### Actions
1. Add one pure function. It takes LazyFrames and returns a LazyFrame; it does no I/O, so it is testable:
   ```python
   def transform(raw: pl.LazyFrame, customers: pl.LazyFrame) -> pl.LazyFrame:
       typed = raw.with_columns(
           pl.col("order_id").cast(pl.Int64, strict=True),
           pl.col("customer_id").cast(pl.Int64, strict=True),
           pl.col("status").str.to_lowercase(),
           pl.col("amount").cast(pl.Decimal(precision=12, scale=2), strict=True),
           pl.col("updated_at").str.to_datetime(format="%Y-%m-%dT%H:%M:%S%.f%z", strict=True)
                                .dt.convert_time_zone("UTC"),
       )
       latest = (
           typed.sort(["order_id", "updated_at"])
                .unique(subset=["order_id"], keep="last", maintain_order=True)
       )
       joined = latest.join(
           customers.select("customer_id", "segment"),
           on="customer_id", how="left", validate="m:1",
       )
       return joined.select(list(SCHEMA) + ["segment"])
   ```
   - `strict=True` makes a bad value raise instead of becoming null silently.
   - `unique(..., keep="last", maintain_order=True)` after sorting is deterministic; `keep="any"` (the default in recent versions) is not.
   - `validate="m:1"` raises if the dimension has duplicate keys, which would otherwise multiply fact rows.
   - Use `how="left"` for fact-to-dimension joins; an inner join drops facts with late dimensions. Null join keys do not match by default.
   - Compare to null with `.is_null()`, never `== None`.
2. Add a separate I/O wrapper `run(in_path, out_path)` that does `pl.scan_parquet(in_path)`, calls `transform`, and writes with `.sink_parquet(out_path)` (streaming) or `.collect().write_parquet(out_path)`. Write to a temp path and rename at the end.
3. Add a schema assertion in `run`, before writing:
   ```python
   got = result.collect_schema()
   expected = {k: v for k, v in SCHEMA.items()}
   assert all(got[k] == v for k, v in expected.items()), f"schema mismatch: {got}"
   ```
4. Inspect the plan once: `print(result.explain())`. Confirm filters and column selection are pushed into the `Parquet SCAN` node (projection/selection pushdown).

### Output
`transform_module`.

### Quality Gate
- `python -m py_compile pipelines/transform/orders.py` exits 0 and `ruff check pipelines/transform/orders.py` (if ruff is configured in the repo) exits 0.

---

## Phase 3: Test the Transform

### Entry Criteria
- Module compiles.

### Actions
1. Write `tests/transform/test_orders.py` with small in-memory frames:
   ```python
   import polars as pl
   from polars.testing import assert_frame_equal
   from pipelines.transform.orders import transform

   def test_latest_version_wins():
       raw = pl.LazyFrame({
           "order_id": ["1", "1"], "customer_id": ["7", "7"], "status": ["PLACED", "SHIPPED"],
           "amount": ["10.00", "10.00"],
           "updated_at": ["2026-10-19T01:00:00.000+0000", "2026-10-20T01:00:00.000+0000"]})
       cust = pl.LazyFrame({"customer_id": [7], "segment": ["smb"]})
       out = transform(raw, cust).collect()
       assert out.height == 1
       assert out["status"].to_list() == ["shipped"]

   def test_duplicate_dimension_key_raises():
       ...  # customers with two rows for 7 must raise a Polars error from validate="m:1"

   def test_bad_amount_raises():
       ...  # amount "abc" must raise, not become null
   ```
   Use `assert_frame_equal(out, expected)` when comparing whole frames; it checks dtypes too.
2. Run `pytest -q tests/transform/test_orders.py`. Do not delete, skip or loosen a failing test.
3. Run `run()` once on a real landed file and print `out.height` and `out.null_count()`.

### Output
`transform_tests`.

### Quality Gate
- `pytest -q` prints `3 passed` (or more) and nothing failed.
- The real-file run prints a null count of 0 for every `nullable: false` column.

---

## Worked Example

Illustrative.
```
$ pytest -q tests/transform/test_orders.py
...                                                          [100%]
3 passed in 0.41s
$ python -c "from pipelines.transform.orders import run; run('landing/orders/run_id=2026-10-20T0300/part-000.parquet','out/orders.parquet')"
rows=18101
shape: (1, 6)
order_id customer_id status amount updated_at segment
0        0           0      0      0          12
```
`segment` has 12 nulls: customers not yet loaded. That is the unknown-member case; it is reported, not dropped.

---

## Exit Criteria

DONE when the transform is a pure LazyFrame function with strict casts and validated joins, the output schema is asserted before writing, and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Polars 0.x method missing | **Adjust**: look up the 0.x name in the API reference for the installed version; do not guess. |
| Phase 2 | `InvalidOperationError` on strict cast | **Return**: report the bad values with a `filter` on the failing column; fix upstream or get the owner's rule. |
| Phase 2 | Join validation error | **Return**: the dimension has duplicate keys; fix the dimension. |
| Phase 3 | Test fails | **Adjust**: fix the function; never edit the expected values to match. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
