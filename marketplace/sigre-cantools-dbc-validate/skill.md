# Validate the DBC with cantools on Fit and Held-Out Logs

**One-line description:** Decodes the capture logs and any held-out logs with `cantools decode` and the cantools Python API, checks every signal stays inside its DBC range, counters step and checksums match on every frame, and compares decoded physical values with the reference on data not used for fitting.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dbc_draft` (object, required): Output of `sigre-dbc-entry-write`.
- `capture_logs` (object, required): Output of `sigre-log-normalize-convert` (the logs used for fitting).
- `scaled_signals` (object[], required): Output of `sigre-scale-offset-regression`, including `fit_r2_min` and the per-field lag.
- `holdout_logs` (object, optional): A separate capture session (different day or drive), normalized the same way, with its own reference file. Not used in any earlier fit.

---

## Outputs

- `dbc_validation` (object): Per signal: decode success count, out-of-range count, counter step violations, checksum mismatches, fit-set R squared and RMS from decoding, held-out R squared and RMS (or "no holdout"), and pass or fail per check.

---

## Phase 1: Decode Smoke Test

### Entry Criteria
- `dbc_draft` loads in cantools.

### Actions
1. `cantools decode --single-line work/vehicle_re.dbc < norm/FILE.log | head`. cantools reads candump log lines on standard input and prints each decodable frame with its signals.
2. Confirm each message in the DBC appears in the decoded output by name: `cantools decode --single-line work/vehicle_re.dbc < norm/FILE.log | grep -c 'ID_2C4'`.
3. Plot one signal for a visual check: `cantools plot work/vehicle_re.dbc '*VehicleSpeed' < norm/FILE.log` (needs matplotlib; check `cantools plot --help` for options on your version). The curve must follow the drive: rise, steady, fall.

### Output
Decoded sample and plot.

### Quality Gate
- Every `BO_` message name has a nonzero decoded count.
- The plot shows no jumps at byte-boundary carries (a staircase of large jumps means a wrong order).

---

## Phase 2: Range, Counter and Checksum Checks

### Entry Criteria
- Smoke test passed.

### Actions
1. Save as `~/canre/check_dbc.py` and run `python ~/canre/check_dbc.py work/vehicle_re.dbc norm/FILE.log`:
   ```
   import re, sys, cantools, collections
   db = cantools.database.load_file(sys.argv[1])
   rx = re.compile(r"^\(([\d.]+)\) \S+ ([0-9A-F]+)#([0-9A-F]*)$")
   ids = {m.frame_id: m for m in db.messages}
   bad = collections.Counter(); ok = collections.Counter(); last = {}
   for l in open(sys.argv[2]):
       m = rx.match(l.strip())
       if not m: continue
       msg = ids.get(int(m[2], 16))  # cantools stores 29-bit IDs without the 0x80000000 DBC flag
       if not msg: continue
       d = msg.decode(bytes.fromhex(m[3]), decode_choices=False, scaling=True)
       for s in msg.signals:
           ok[s.name] += 1
           if s.minimum is not None and not (s.minimum <= d[s.name] <= s.maximum): bad["range:" + s.name] += 1
           if s.name.startswith("Counter_"):
               if s.name in last and (d[s.name] - last[s.name]) % (1 << s.length) != 1: bad["step:" + s.name] += 1
               last[s.name] = d[s.name]
   print(dict(ok)); print(dict(bad))
   ```
   Counter step violations near lost frames are expected; compare their count with gaps found in the capture flow before calling it a failure.
2. Recheck each checksum with `~/canre/cksum.py` from the counter and checksum flow on the same log; the match fraction must be the same as before.

### Output
Check counts per signal.

### Quality Gate
- `range:` failures are zero for every signal, or each is explained (for example an unresolved boundary).
- Checksum match fraction equals the value recorded in `counter_checksum_map`.

---

## Phase 3: Reference Comparison on Held-Out Data

### Entry Criteria
- Phase 2 recorded.

### Actions
1. For each scaled signal, decode its values with the cantools API over the held-out log, apply the lag recorded in `scaled_signals`, and pair with the held-out reference using the same interpolation as `sigre-reference-time-align`.
2. Compute R squared and RMS against the reference. Compare with the fit-set values.
3. Rule: held-out R squared at or above `fit_r2_min` is pass; below is fail. Without `holdout_logs`, record "no holdout" and do not mark the signal validated.
4. Emit `dbc_validation`.

### Output
`dbc_validation`.

### Quality Gate
- Every scaled signal has a held-out result or "no holdout".
- Pass or fail quotes the `fit_r2_min` value used.

---

## Worked Example

Illustrative only.

```
$ cantools decode --single-line work/vehicle_re.dbc < norm/20261021_drive.log | head -2
(1729507001.204500) can0 2C4#01A0000000001234 :: ID_2C4(VehicleSpeed: 4.1649 km/h)
(1729507001.205200) can0 1A0#0000003C0000077E :: ID_1A0(Counter_1A0: 7, Checksum_1A0: 126)
$ python ~/canre/check_dbc.py work/vehicle_re.dbc norm/20261021_drive.log
{'VehicleSpeed': 15011, 'Counter_1A0': 30022, 'Checksum_1A0': 30022, 'BrakePedalPressed': 3002}
{'range:VehicleSpeed': 4120}
```

4120 range failures: the decoded value exceeds the 12-bit max at higher speeds, confirming the open boundary; status fail for range, returned to the boundary search. Held-out drive of 2026-10-22 for the corrected 16-bit field: R squared 0.99962 against GPS, `fit_r2_min` 0.999: pass.

---

## Exit Criteria

DONE when every DBC signal decodes, range, counter and checksum checks are counted, and every scaled signal has a held-out comparison or an explicit "no holdout".

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `cantools decode` prints frames without signals | **Adjust**: the ID in `BO_` is wrong (hex written as decimal, or the extended flag missing); fix in `sigre-dbc-entry-write`. |
| Phase 2 | Range failures | **Return**: to `sigre-bit-boundary-search` or `sigre-scale-offset-regression` as the failure points. |
| Phase 2 | Checksum fraction changed | **Return**: the DBC checksum field position differs from the map; fix the `SG_`. |
| Phase 3 | Held-out fit fails | **Return**: the fit is specific to one capture; revisit lag and reference quality. Do not tune on the held-out data. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
