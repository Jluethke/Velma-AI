# RUM p75 Analysis

**One-line description:** Aggregates exported web-vitals beacons into p75 per metric, page template and device class with SQL (Postgres, BigQuery or DuckDB), drops groups under the sample floor, and ranks the attribution targets (LCP element, interaction target, shift target, LoAF script) that drive each failing p75.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rum_data_export` (string, required): A table name (Postgres or BigQuery) or a file path (CSV, Parquet or NDJSON) holding raw beacons from `cwv-rum-web-vitals-setup`.
- `rum_attribution_schema` (object, required): Field names the beacons carry, from `cwv-rum-web-vitals-setup`.
- `rum_min_samples` (integer, optional): The minimum number of beacons a group needs before its p75 is reported. No standard sets this; when not given, report it as an open question and show sample counts beside every p75.

---

## Outputs

- `rum_p75_report` (object[]): Rows of (metric, page_template, device_class, n, p75, band) plus the attribution sub-part p75s for LCP and INP.
- `top_offenders` (object[]): For each failing (metric, template, device) group, the attribution targets ranked by count among beacons above the "good" threshold.

---

## Phase 1: Load and Normalize

### Entry Criteria
- `rum_data_export` is reachable and the user has stated the date range it covers (record the range in the report; CrUX uses 28-day windows, so a 28-day range compares most directly).

### Actions
1. Pick the engine:
   | Data location | Engine | Load command |
   |---|---|---|
   | Postgres table | `psql` | none |
   | BigQuery table | `bq query --use_legacy_sql=false` | none |
   | CSV / Parquet / NDJSON file | DuckDB CLI | `duckdb vitals.db "CREATE TABLE beacons AS SELECT * FROM read_json_auto('beacons.ndjson')"` (use `read_csv_auto` or `read_parquet` for the others) |
2. Print the columns and 5 rows (`\d beacons` in psql, `DESCRIBE beacons` in DuckDB). Confirm the names match `rum_attribution_schema`. Do not query a column you have not seen in this output.
3. Map `page` paths to templates with a CASE expression written from the real path patterns, for example:
   ```sql
   CASE WHEN page = '/' THEN 'home'
        WHEN page LIKE '/p/%' THEN 'product'
        WHEN page LIKE '/c/%' THEN 'category'
        ELSE 'other' END AS page_template
   ```
4. Derive `device_class`. If the beacon has a user-agent or `navigator.userAgentData.mobile` field, map to `mobile` / `desktop`. If neither exists, report one class `all` and note the gap.
5. Remove duplicates: one row per (`id`, `name`) keeping the last value. The `web-vitals` `id` is unique per metric instance per page load.

### Output
A normalized view `v` with metric, value, page_template, device_class and attribution columns.

### Quality Gate
- `SELECT name, count(*) FROM v GROUP BY name` returns rows for LCP, INP, CLS (and FCP, TTFB when sent).
- Duplicate check returns zero: `SELECT id, name, count(*) FROM v GROUP BY 1,2 HAVING count(*) > 1`.

---

## Phase 2: Compute p75 per Group

### Entry Criteria
- View `v` exists.

### Actions
1. Use the engine's percentile function (do not average):
   - Postgres / DuckDB: `percentile_cont(0.75) WITHIN GROUP (ORDER BY value)`
   - BigQuery: `APPROX_QUANTILES(value, 100)[OFFSET(75)]`
   ```sql
   SELECT name, page_template, device_class, count(*) AS n,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75
   FROM v GROUP BY 1,2,3 ORDER BY 1,2,3;
   ```
2. Classify each p75 with the Google thresholds used in `cwv-field-crux-baseline` (LCP 2500/4000 ms, INP 200/500 ms, CLS 0.1/0.25, FCP 1800/3000 ms, TTFB 800/1800 ms).
3. Apply the sample floor: if `rum_min_samples` is given, mark rows with `n` below it as "insufficient" and exclude them from offender ranking. If it is not given, keep all rows, show `n`, and list "sample floor" as an open question.
4. For LCP rows, also compute p75 of `ttfb`, `resourceLoadDelay`, `resourceLoadDuration`, `elementRenderDelay`. For INP rows, p75 of `inputDelay`, `processingDuration`, `presentationDelay`. Note: sub-part p75s do not sum to the metric p75; compare them to each other, not to the total.

### Output
`rum_p75_report`.

### Quality Gate
- Every row shows `n` beside `p75`.
- The SQL used is saved alongside the report so the numbers can be recomputed.

---

## Phase 3: Rank Attribution Targets

### Entry Criteria
- At least one group is not "good".

### Actions
1. For each failing group, count targets among beacons above the good threshold:
   ```sql
   SELECT lcpTarget, count(*) AS slow_n
   FROM v WHERE name='LCP' AND page_template='product' AND device_class='mobile' AND value > 2500
   GROUP BY 1 ORDER BY 2 DESC LIMIT 10;
   ```
   Use `interactionTarget` (INP, threshold 200), `largestShiftTarget` (CLS, threshold 0.1).
2. For INP, also rank LoAF scripts if `loafScripts` exists: unnest the array (`jsonb_array_elements` in Postgres, `UNNEST` in BigQuery and DuckDB) and sum `duration` per `sourceURL`.
3. Record each offender with its share of slow beacons in the group.

### Output
`top_offenders`.

### Quality Gate
- Each offender row carries `slow_n` and the group it belongs to.
- The offender lists are produced by saved SQL, not by reading rows by eye.

---

## Worked Example

Illustrative only. DuckDB over `beacons.ndjson`, `rum_min_samples` not given.

```text
$ duckdb vitals.db "SELECT name, page_template, device_class, count(*) n, round(percentile_cont(0.75) WITHIN GROUP (ORDER BY value)) p75 FROM v GROUP BY 1,2,3 ORDER BY 1,2,3"
| name | page_template | device_class | n    | p75  |
| INP  | product       | mobile       | 4210 | 312  |
| LCP  | product       | mobile       | 5980 | 3380 |
| LCP  | home          | mobile       | 7710 | 2210 |
```
Product/mobile LCP sub-part p75s: ttfb 610, resourceLoadDelay 1490, resourceLoadDuration 420, elementRenderDelay 230. Offenders for product/mobile LCP: `main>div.gallery>img` in 81 percent of slow beacons. INP offender: `button#add-to-cart`; LoAF top script `cart-4f1a.js`. Open question recorded: sample floor not set.

---

## Exit Criteria

DONE when every (metric, template, device) group has n, p75 and band from saved SQL, sub-part p75s exist for LCP and INP, and each failing group has ranked offenders.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Column names differ from `rum_attribution_schema` | **Adjust**: use the real column names from DESCRIBE; record the mismatch. |
| Phase 1 | No device signal in beacons | **Adjust**: report `all`; return to `cwv-rum-web-vitals-setup` to add one. |
| Phase 2 | A group has very few beacons | **Adjust**: mark it per `rum_min_samples`, or flag the open question; never drop it silently. |
| Phase 3 | Target column mostly null | **Return**: the attribution build is not in use; go back to `cwv-rum-web-vitals-setup` Phase 2. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
