# Baseline Idle ID Inventory

**One-line description:** From the idle baseline segment only, lists every arbitration ID with its DLC, frame count, median period and period spread, and the per-byte set of values, so later steps know which bytes are constant, which free-run (counters, checksums, clocks) and which IDs are event driven.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`, including `norm/segments.tsv`.

---

## Outputs

- `id_inventory` (object): `id_inventory.csv` with one row per ID: `id`, `ext` (11 or 29 bit), `dlc_set`, `count`, `period_median_s`, `period_p05_s`, `period_p95_s`, `kind` (periodic or event), and per byte `b0..b7` the number of distinct values in baseline plus the constant value when there is one.

---

## Phase 1: Slice the Baseline

### Entry Criteria
- `segments.tsv` has a `baseline_idle` row.

### Actions
1. Read the `baseline_idle` row's file, `t_start` and `t_end`.
2. Slice: `awk -v a=T_START -v b=T_END -F'[()]' '$2>=a && $2<=b' norm/FILE.log > work/baseline.log` (work directory outside the marketplace).
3. Count lines: `wc -l work/baseline.log`. A baseline with zero lines means the slice times are wrong.

### Output
`work/baseline.log`.

### Quality Gate
- `work/baseline.log` line count is greater than zero.
- First and last timestamps in the slice lie inside `t_start` and `t_end`.

---

## Phase 2: Compute the Inventory

### Entry Criteria
- Baseline slice exists.

### Actions
1. Save as `~/canre/inventory.py` and run `python ~/canre/inventory.py work/baseline.log > work/id_inventory.csv`:
   ```
   import re, sys, collections, numpy as np
   rx = re.compile(r"^\(([\d.]+)\) \S+ ([0-9A-F]+)#([0-9A-F]*)$")
   ts, data = collections.defaultdict(list), collections.defaultdict(list)
   for line in open(sys.argv[1]):
       m = rx.match(line.strip())
       if not m: continue
       ts[m[2]].append(float(m[1])); data[m[2]].append(bytes.fromhex(m[3]))
   print("id,ext,dlc_set,count,period_median_s,period_p05_s,period_p95_s," + ",".join("b%d" % i for i in range(8)))
   for cid in sorted(ts, key=lambda s: int(s, 16)):
       t = np.array(ts[cid]); d = np.diff(t) if len(t) > 1 else np.array([np.nan])
       dl = sorted({len(x) for x in data[cid]})
       cols = []
       for i in range(8):
           v = {x[i] for x in data[cid] if len(x) > i}
           cols.append("" if not v else ("const=%02X" % next(iter(v)) if len(v) == 1 else str(len(v))))
       print("%s,%d,%s,%d,%.6f,%.6f,%.6f,%s" % (cid, 29 if len(cid) > 3 else 11, "|".join(map(str, dl)), len(t),
             np.nanmedian(d), np.nanpercentile(d, 5), np.nanpercentile(d, 95), ",".join(cols)))
   ```
2. Do not round periods to "nice" values in this table; keep measured values. Rounding hides two IDs that share a schedule versus two that drift.

### Output
`work/id_inventory.csv`.

### Quality Gate
- Row count equals the number of distinct IDs: compare with `awk '{split($3,a,"#"); print a[1]}' work/baseline.log | sort -u | wc -l`.
- Every row has a numeric `count`.

---

## Phase 3: Classify IDs and Bytes

### Entry Criteria
- Inventory CSV exists.

### Actions
1. Set `kind` per ID with this rule: if `period_p95_s` divided by `period_median_s` is small and the ID appears through the whole baseline, mark `periodic`; otherwise `event`. Record the ratio used; it is a user judgment, so report the ratio beside the label rather than hiding it.
2. Classify each byte in the baseline:

| Baseline value | Class | Meaning for later steps |
|---|---|---|
| `const=XX` | constant | Candidate for an action-driven signal; changes later are meaningful |
| Distinct values equal to 16 or 256 cycling through each frame | free-running | Candidate counter or checksum; test in `sigre-counter-checksum-detect` |
| A few distinct values | noisy | Candidate sensor at rest (temperature, voltage); needs reference |

3. Emit `id_inventory` with the CSV path and the classification columns added.

### Output
`id_inventory`.

### Quality Gate
- Every ID has a `kind`.
- Every byte position present in the ID's DLC has a class.

---

## Worked Example

Illustrative only.

```
id,ext,dlc_set,count,period_median_s,period_p05_s,period_p95_s,b0,b1,b2,b3,b4,b5,b6,b7
1A0,11,8,12001,0.010000,0.009950,0.010060,const=00,const=00,3,const=00,const=00,const=00,16,256
2C4,11,8,6000,0.020001,0.019900,0.020110,const=0F,const=A0,const=00,const=00,const=00,const=00,const=12,const=34
3B0,11,8,1200,0.100000,0.099800,0.100200,const=01,const=00,const=00,const=00,const=00,const=00,const=00,const=00
```

Phase 3: 0x1A0 b6 free-running (16 values, counter candidate), b7 free-running (256 values, checksum candidate), b2 noisy; 0x2C4 and 0x3B0 fully constant at idle.

---

## Exit Criteria

DONE when every baseline ID has measured periods, a kind, and a class for every byte.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Empty baseline slice | **Adjust**: compare `segments.tsv` times with the file's first and last timestamps; fix the timestamp base in the normalize flow. |
| Phase 2 | Regex matches no lines | **Return**: the file is not in normalized candump format; rerun `sigre-log-normalize-convert`. |
| Phase 3 | Many IDs appear only near the end of the baseline | **Adjust**: the vehicle was still waking up; recapture a longer baseline or slice later. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
