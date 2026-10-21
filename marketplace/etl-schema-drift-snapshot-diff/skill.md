# ETL Schema Drift Snapshot and Diff

**One-line description:** Snapshots the source tables' `information_schema.columns` into a versioned JSON file on every run, diffs it against the previous snapshot with `jq`, and classifies each change (added column, dropped column, type change, nullability change, rename) as additive or breaking so the pipeline fails before a breaking change corrupts the target.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_connection` (object, required): Read-only source connection.
- `data_contract` (object, required): Output of `etl-target-schema-contract`; its `columns[].source` lists the source columns the pipeline depends on.
- `project_dir` (string, required): Pipeline repository root; snapshots live in `<project_dir>/schema_snapshots/`.

---

## Outputs

- `schema_snapshot` (string): Path of the snapshot file written this run, `schema_snapshots/<schema>.<table>/<UTC timestamp>.json`.
- `schema_change_report` (object): Each change with `kind` (`column_added`, `column_dropped`, `type_changed`, `nullability_changed`, `possible_rename`), `column`, `before`, `after`, `classification` (`additive`, `breaking`, `breaking_unused`), and `action` (`continue`, `fail_run`).

---

## Phase 1: Write the Snapshot

### Entry Criteria
- `project_dir` exists and is a git repository (`git -C <project_dir> rev-parse --is-inside-work-tree` prints `true`).

### Actions
1. Query the columns in a stable order so diffs are clean:
   ```sql
   SELECT table_schema, table_name, column_name, data_type,
          character_maximum_length, numeric_precision, numeric_scale,
          is_nullable, ordinal_position
   FROM information_schema.columns
   WHERE table_schema = '<schema>' AND table_name = '<table>'
   ORDER BY column_name;
   ```
   Order by `column_name`, not `ordinal_position`, so a column reorder does not show up as a change of every row.
2. Export as JSON. Postgres example, using `psql` with tuples-only, unaligned output:
   ```bash
   psql "$SOURCE_DSN" -At -c "SELECT json_agg(t ORDER BY column_name) FROM (<query above>) t;" \
     > schema_snapshots/sales.orders/$(date -u +%Y%m%dT%H%M%SZ).json
   ```
   Snowflake: `snowsql -q "<query>" -o output_format=json -o friendly=false -o header=false -o timing=false`. BigQuery: `bq query --format=json --use_legacy_sql=false '<query>'`.
3. Normalize the file so formatting never causes a diff: `jq -S . file.json > file.tmp && mv file.tmp file.json`.

### Output
`schema_snapshot`.

### Quality Gate
- `jq length <schema_snapshot>` prints the same column count as `SELECT COUNT(*) FROM information_schema.columns WHERE ...`.

---

## Phase 2: Diff Against the Previous Snapshot

### Entry Criteria
- A previous snapshot exists. If this is the first run, record "baseline" and stop with `schema_change_report` empty.

### Actions
1. Find the previous file: `ls schema_snapshots/sales.orders/*.json | sort | tail -n 2 | head -n 1`.
2. Produce column-keyed maps and diff them:
   ```bash
   jq 'map({(.column_name): {data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable}}) | add' prev.json > prev.map.json
   jq 'map({(.column_name): {data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable}}) | add' curr.json > curr.map.json
   jq -n --slurpfile a prev.map.json --slurpfile b curr.map.json '
     ($a[0]|keys) as $ka | ($b[0]|keys) as $kb |
     {added: ($kb - $ka), dropped: ($ka - $kb),
      changed: [ ($ka - ($ka - $kb))[] as $k | select($a[0][$k] != $b[0][$k]) | {column:$k, before:$a[0][$k], after:$b[0][$k]} ]}'
   ```
3. Mark `possible_rename` when one column is dropped and one is added in the same diff with the same type. Never auto-map a rename; a human confirms.

### Output
Raw diff with `added`, `dropped`, `changed`.

### Quality Gate
- The diff command exits 0, and its output is saved next to the snapshot as `<timestamp>.diff.json`.

---

## Phase 3: Classify and Decide

### Entry Criteria
- Raw diff exists.

### Actions
1. Classify each change with this table. "Used" means the column appears in `data_contract.columns[].source`.
   | Change | Used by contract | Classification | Action |
   |---|---|---|---|
   | column added | n/a | `additive` | `continue`; log it; add to contract only by a contract version bump |
   | column dropped | yes | `breaking` | `fail_run` |
   | column dropped | no | `breaking_unused` | `continue`; log it |
   | type widened (larger varchar length, larger numeric precision with same scale, int to bigint) | yes | `additive` | `continue` |
   | type narrowed or changed family (numeric to text, timestamp to date, scale change) | yes | `breaking` | `fail_run` |
   | nullable `NO` to `YES` | yes, and contract says `nullable: false` | `breaking` | `fail_run` |
   | nullable `YES` to `NO` | any | `additive` | `continue` |
   | possible rename | yes | `breaking` | `fail_run` until confirmed |
2. Wire the decision into the run: the pipeline's first task runs this diff and exits non-zero when any change has `action = fail_run`. Example guard:
   ```bash
   jq -e '[.[] | select(.action=="fail_run")] | length == 0' schema_change_report.json
   ```
   `jq -e` sets exit status 1 when the expression is `false`.
3. Map to tool settings so the warehouse side matches the decision: dbt incremental `on_schema_change` accepts `ignore` (default), `fail`, `append_new_columns`, `sync_all_columns`; Delta Lake writes accept `.option("mergeSchema", "true")` for additive columns only.
4. Commit the snapshot and diff: `git add schema_snapshots && git commit -m "schema snapshot sales.orders <timestamp>"`.

### Output
`schema_change_report`.

### Quality Gate
- `jq -e` guard returns exit 1 on a test report containing one `fail_run` entry and exit 0 on an empty report (run both to prove the guard works).

---

## Worked Example

Illustrative. Yesterday's snapshot vs today's for `sales.orders`:
```
{"added":["promo_code"],"dropped":[],"changed":[{"column":"amount",
 "before":{"data_type":"numeric","numeric_precision":12,"numeric_scale":2,...},
 "after":{"data_type":"numeric","numeric_precision":14,"numeric_scale":2,...}}]}
```
Phase 3: `promo_code` added, `additive`, continue. `amount` precision 12 to 14 with same scale: widened, `additive`, continue. Guard:
```
$ jq -e '[.[] | select(.action=="fail_run")] | length == 0' schema_change_report.json
true
$ echo $?
0
```

---

## Exit Criteria

DONE when a normalized snapshot is committed, the diff is saved, every change is classified by the table, and the guard command has been shown to fail on a breaking change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `information_schema` hides columns because of grants | **Stop**: request column-level SELECT on the catalog; a partial snapshot reports false drops. |
| Phase 2 | Every column shows as changed | **Adjust**: the export format changed; rerun `jq -S` normalization on both files. |
| Phase 3 | Breaking change on a used column | **Return**: fail the run, notify the owner in `data_contract.alert_destination`, and update the contract with a version bump before resuming. |
| Phase 3 | Rename suspected | **Stop**: ask the source owner; never map by guess. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
