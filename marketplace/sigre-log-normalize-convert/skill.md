# Normalize CAN Logs to candump Format with Segment Index

**One-line description:** Converts every capture (can-utils, python-can or SavvyCAN output) into one candump log format with epoch timestamps, and builds a `segments.tsv` index of labeled start and end times from `actions.tsv`, so every later analysis step reads one format.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_plan` (object, required): Output of `sigre-capture-plan-labeled-actions`.
- `candump_logs` (object[], optional): Output of `sigre-linux-candump-capture`.
- `python_can_logs` (object[], optional): Output of `sigre-py-python-can-capture`.
- `savvycan_logs` (object[], optional): Output of `sigre-savvycan-capture-save`.

---

## Outputs

- `capture_logs` (object): List of normalized files `norm/<name>.log` (candump log format, epoch seconds, one bus), plus `norm/segments.tsv` with columns `file<TAB>label<TAB>t_start<TAB>t_end`, and per-file frame counts before and after conversion.

---

## Phase 1: Inventory and Pick a Converter

### Entry Criteria
- At least one of `candump_logs`, `python_can_logs`, `savvycan_logs` is present.

### Actions
1. Make `norm/` next to the raw files. Never write into or overwrite a raw file.
2. Choose the converter per file:

| Source format | Converter |
|---|---|
| candump log `.log` (can-utils or python-can) | Copy unchanged: `cp raw.log norm/raw.log` |
| Vector `.asc` or `.blf` | `python -m can.logconvert raw.asc norm/raw.log` (check `python -m can.logconvert --help` for your version) |
| GVRET CSV from SavvyCAN | The script in Phase 2 |

3. Record the raw frame count of each file (`wc -l` for text formats, `can.LogReader` count for `.blf`).

### Output
Converter choice per file.

### Quality Gate
- Every raw file has a converter assigned and a recorded raw count.
- No command in this phase writes to a raw file path.

---

## Phase 2: Convert and Fix Timestamps

### Entry Criteria
- Converters chosen.

### Actions
1. For GVRET CSV, read the header line first. Save this as `~/canre/gvret2log.py` (outside the marketplace) and set the column names to match the header you read:
   ```
   import csv, sys
   src, dst, t0 = sys.argv[1], sys.argv[2], float(sys.argv[3])
   with open(src, newline="") as f, open(dst, "w") as o:
       r = csv.DictReader(f)
       for row in r:
           t = t0 + int(row["Time Stamp"]) / 1e6
           n = int(row["LEN"])
           data = "".join("%02X" % int(row["D%d" % (i + 1)], 16) for i in range(n))
           cid = int(row["ID"], 16)
           ext = row["Extended"].strip().lower() in ("true", "1")
           ids = ("%08X" if ext else "%03X") % cid
           o.write("(%.6f) can0 %s#%s\n" % (t, ids, data))
   ```
   GVRET CSV timestamps are commonly microseconds; confirm against the file's duration and SavvyCAN's capture time before trusting the divisor.
2. Run with `t0` = the epoch time of the `clear_<group>` marker for relative files, or `0` when timestamps are already epoch microseconds.
3. For `.asc` files with relative timestamps, after `logconvert`, shift times by the same `t0` using `awk '{gsub(/[()]/,"",$1); printf("(%.6f) %s %s\n",$1+T0,$2,$3)}' T0=<t0> in.log > out.log`.
4. If the capture has more than one bus channel, split by channel field into separate files; the analysis assumes one bus per file.

### Output
Normalized files in `norm/`.

### Quality Gate
- `grep -vcE '^\([0-9]+\.[0-9]{6}\) \S+ [0-9A-F]{3,8}#[0-9A-F]*$' norm/*.log` prints 0 for every file (every line well formed).
- Normalized count equals raw count for every file.

---

## Phase 3: Build the Segment Index

### Entry Criteria
- Normalized files exist.

### Actions
1. Pair each `<label>_start_<n>` with the next `<label>_end_<n>` in `actions.tsv`. Use `_fix` lines in place of the line they correct.
2. For each pair, find the normalized file whose first and last timestamps contain both times. Write `file label_n t_start t_end` into `norm/segments.tsv`.
3. Add the baseline row `baseline_idle` and one `rest_<n>` row per rest gap between an end marker and the next start marker.
4. Emit `capture_logs`.

### Output
`capture_logs`.

### Quality Gate
- Every planned repetition has exactly one row in `segments.tsv`.
- For every row `t_start < t_end` and both lie inside the named file's time range.

---

## Worked Example

Illustrative only.

```
$ python -m can.logconvert 20261021_parked.asc norm/20261021_parked.log
$ awk '...' T0=1729505699.80 norm/20261021_parked.log > norm/p.log && mv norm/p.log norm/20261021_parked.log
$ head -2 norm/20261021_parked.log
(1729505699.800412) can0 1A0#0000003C0000007E
(1729505699.801001) can0 2C4#0FA0000000001234
$ head -3 norm/segments.tsv
20261021_parked.log	baseline_idle	1729505700.10	1729505820.12
20261021_parked.log	brake_1	1729505830.40	1729505832.99
20261021_parked.log	rest_1	1729505832.99	1729505840.11
```

---

## Exit Criteria

DONE when every capture exists as a well-formed, epoch-timestamped candump log in `norm/` with matching frame counts, and `segments.tsv` indexes every labeled repetition and rest.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No input logs at all | **Return**: run the capture flow for the chosen stack. |
| Phase 2 | GVRET header column names differ from the script | **Adjust**: edit the column names in the script to match the header exactly; do not guess positions. |
| Phase 2 | Count mismatch after conversion | **Stop**: find the dropped lines with `diff`; do not continue with a lossy file. |
| Phase 3 | Start marker with no end marker | **Adjust**: drop that repetition from the index and record it as missing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
