# Byte and Bit Change Counts: Action versus Rest

**One-line description:** Counts frame-to-frame value changes per ID, per byte and per bit inside every labeled action window and every rest window, then ranks candidates that change in every action repetition and not in rests, merging any cansniffer or SavvyCAN notes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert` with `norm/segments.tsv`.
- `capture_plan` (object, required): Output of `sigre-capture-plan-labeled-actions`.
- `id_inventory` (object, required): Output of `sigre-baseline-idle-inventory`.
- `cansniffer_candidates` (object[], optional): Output of `sigre-linux-cansniffer-isolate`.
- `savvycan_candidates` (object[], optional): Output of `sigre-savvycan-sniffer-isolate`.

---

## Outputs

- `candidate_bytes` (object[]): Per target action: rows of `id`, `byte`, `bit` (or `all`), `reps_changed` / `reps_total`, `rest_changes`, `action_change_rate`, `rest_change_rate`, `tier` (strict or ranked), and whether a visual tool also saw it.

---

## Phase 1: Count Changes per Window

### Entry Criteria
- `segments.tsv` has action rows and rest rows.

### Actions
1. Save as `~/canre/changes.py`. It reads one normalized log and `segments.tsv` and prints per window, per ID, per byte and bit, the number of frame-to-frame changes and the frame count:
   ```
   import re, sys, collections
   rx = re.compile(r"^\(([\d.]+)\) \S+ ([0-9A-F]+)#([0-9A-F]*)$")
   log, seg = sys.argv[1], sys.argv[2]
   frames = [(float(m[1]), m[2], bytes.fromhex(m[3])) for m in (rx.match(l.strip()) for l in open(log)) if m]
   wins = [l.rstrip("\n").split("\t") for l in open(seg) if l.split("\t")[0] in log]
   print("window\tid\tbyte\tbit\tchanges\tframes")
   for _, label, a, b in wins:
       a, b = float(a), float(b); prev = {}; ch = collections.Counter(); n = collections.Counter()
       for t, cid, d in frames:
           if not a <= t <= b: continue
           n[cid] += 1
           if cid in prev:
               p = prev[cid]
               for i in range(min(len(p), len(d))):
                   x = p[i] ^ d[i]
                   for k in range(8):
                       if x >> k & 1: ch[(cid, i, k)] += 1
           prev[cid] = d
       for (cid, i, k), c in sorted(ch.items()):
           print("%s\t%s\t%d\t%d\t%d\t%d" % (label, cid, i, k, c, n[cid]))
   ```
2. Run per file: `python ~/canre/changes.py norm/FILE.log norm/segments.tsv > work/changes_FILE.tsv`.
3. Bit numbering: bit `k` here is bit `k` of byte `i` with bit 0 the least significant bit of that byte. Keep this convention for every later flow.

### Output
`work/changes_*.tsv`.

### Quality Gate
- Every window label from `segments.tsv` for that file appears in the output, or has zero changes recorded.
- Header line present in every output file.

---

## Phase 2: Compare Actions with Rests

### Entry Criteria
- Change tables exist.

### Actions
1. For each target action label, group its repetitions (`brake_1` to `brake_N`) and all `rest_n` windows of the same file.
2. Apply these rules per (id, byte, bit):

| Condition | Tier |
|---|---|
| Changes in every action repetition and zero changes in every rest window and baseline | strict |
| Changes in every action repetition, nonzero in rests, action change rate higher than rest change rate | ranked (sort by action rate divided by rest rate, report the ratio, no cutoff) |
| Changes in some repetitions only | weak (kept in a separate list) |
| Byte classed free-running in `id_inventory` | excluded here; goes to counter and checksum detection |

3. Collapse bit rows into byte rows when all changing bits of that byte share the tier, but keep the bit list.
4. Do not drop a ranked candidate because its ratio looks small; continuous signals (speed, pedal) carry noise in rests. Report the ratio and let the reference correlation decide.

### Output
Tiered candidate table per action.

### Quality Gate
- Every strict row shows `reps_changed` equal to `reps_total` and `rest_changes` equal to 0.
- Every ranked row reports both rates and their ratio.

---

## Phase 3: Merge Visual Notes and Emit

### Entry Criteria
- Tiered table exists.

### Actions
1. If `cansniffer_candidates` or `savvycan_candidates` is present, mark each row `seen_visually = yes` when the same ID and byte appear there.
2. A visual candidate with no matching count row is a disagreement; recompute its counts for that ID directly and record the result. Counts win over visual impressions.
3. Emit `candidate_bytes`.

### Output
`candidate_bytes`.

### Quality Gate
- Every visual candidate has a matching row or a recorded disagreement with counts.
- Every target action has at least one row or an explicit "no candidate" line.

---

## Worked Example

Illustrative only.

```
$ python ~/canre/changes.py norm/20261021_parked.log norm/segments.tsv | grep -E 'brake_|rest_' | grep -E '3B0|2C4' | head
brake_1	2C4	0	0	3	300
brake_1	2C4	0	1	2	300
brake_1	3B0	0	0	2	60
rest_1	...   (no rows for 2C4 or 3B0)
```

Phase 2: `3B0 byte0 bit0` strict (5/5, rest 0); `2C4 byte0 bits0-4` strict (5/5, rest 0), a multi-bit field, likely brake pressure or pedal travel. Phase 3: both seen in cansniffer notes.

---

## Exit Criteria

DONE when every target action has tiered candidate rows backed by change counts, and every visual candidate agrees with counts or has a recorded disagreement.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Script prints only the header | **Adjust**: the `segments.tsv` file column does not match the log name; fix the file column. |
| Phase 2 | No strict and no ranked candidate for an action | **Return**: recapture with more repetitions or check the action really changes something visible on the cluster. |
| Phase 2 | Dozens of strict candidates for one switch | **Adjust**: several modules may echo the state; keep all, the DBC can carry each. |
| Phase 3 | Visual and count results disagree | **Adjust**: trust counts; record the disagreement. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
