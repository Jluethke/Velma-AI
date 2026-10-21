# RTAMT Online STL Monitor in Python

**One-line description:** Implements the past-time temporal properties as an online discrete-time monitor with RTAMT (Nickovic and Yamaguchi, ATVA 2020), feeds it one sample at a time, reads the returned reliableness as the trip signal (negative means violated), and checks it against the hand traces from the property specification.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `temporal_properties` (object[], required): Output of `rmon-temporal-property-spec`, saved as `temporal_properties.json`.
- `repo_dir` (string, required): Monitor repository root.

---

## Outputs

- `py_stl_monitor` (object): Module path (`monitor/stl_monitor.py`), test path, installed RTAMT version, pytest summary, and the list of properties RTAMT parsed.

---

## Phase 1: Install and Parse

### Entry Criteria
- Python 3 and pip available.
- Every property formula uses past-time operators only (checked in `rmon-temporal-property-spec`).

### Actions
1. `python -m pip install rtamt` then record the version: `python -m pip show rtamt`. Note it in the output; RTAMT's API has changed between releases.
2. Read the RTAMT README for that version and confirm the class name for discrete-time STL. Recent releases use `rtamt.StlDiscreteTimeSpecification`; older ones used `rtamt.STLDiscreteTimeSpecification`. Use the one your version provides; do not guess.
3. Parse every property in a loop:
   ```python
   import json, rtamt
   props = json.load(open("temporal_properties.json"))
   specs = {}
   for p in props:
       s = rtamt.StlDiscreteTimeSpecification()
       s.name = p["id"]
       for v in p["variables"]:
           s.declare_var(v["name"], "float")
       s.declare_var("out", "float")
       s.spec = p["formula"]          # for example "out = (x >= -0.5) and (x <= 2.0)"
       s.parse()
       specs[p["id"]] = s
   print(sorted(specs))
   ```
4. If `parse()` raises, print the exception text, fix the formula in `temporal_properties.json` (through the property flow), and rerun. Do not rewrite the formula only in code.

### Output
All properties parsed.

### Quality Gate
- The script prints every property `id` from the JSON file.
- `python -m pip show rtamt` output is saved with the version line.

---

## Phase 2: Online Update Loop

### Entry Criteria
- All specs parse.

### Actions
1. Create `monitor/stl_monitor.py` with a class that owns the parsed specs and exposes `step(k, sample)` where `k` is the integer sample index and `sample` is a dict of variable values.
2. Inside `step`, call each spec's `update` with the sample index and a list of `(name, value)` pairs, for example `rob = s.update(k, [("x", sample["x"])])`. Confirm the exact `update` signature in your version's README; some versions take a dict.
3. Treat `rob < 0` as `fail`, `rob >= 0` as `pass`. Log `rob` in the `reliableness` field of the event record.
4. Feed samples at a fixed period. If a sample is missing, do NOT feed the previous value again; report `stale` from the staleness checker instead, since repeated values hide a frozen producer.
5. Before `step`, reject NaN or infinite values with `math.isfinite`; reliableness of NaN is not a meaningful verdict.

### Output
`monitor/stl_monitor.py`.

### Quality Gate
- `python -c "import monitor.stl_monitor"` exits 0.
- `rg -n "isfinite" monitor/stl_monitor.py` returns at least one line.

---

## Phase 3: Test Against Hand Traces

### Entry Criteria
- Module imports.

### Actions
1. Create `tests/test_stl_monitor.py`. For each property, feed its `hand_trace` samples in order and assert the sign of each returned reliableness equals the expected verdict. For boundary samples assert `rob == 0` or `abs(rob) < 1e-9` when floats are involved.
2. Run `python -m pytest tests/test_stl_monitor.py -q`.
3. If a test fails, compare the formula with the English sentence first. The hand trace is the reference.

### Output
`py_stl_monitor`.

### Quality Gate
- pytest exits 0.
- Number of test cases is at least the total number of hand trace samples: `python -m pytest tests/test_stl_monitor.py -q --collect-only | tail -1`.

---

## Worked Example

Illustrative only.
```
$ python -m pip show rtamt | rg Version
Version: 0.3.5
$ python -c "..."   # Phase 1 parse loop
['P-AGE-01', 'P-RANGE-01', 'P-RATE-01']
$ python -m pytest tests/test_stl_monitor.py -q
............                                                   [100%]
12 passed in 0.88s
```
Sample k=3 with `cmd_linear_x` 2.3 returns reliableness -0.3; the monitor records `fail` and emits `PROPERTY_VIOLATED` to the switch.

---

## Exit Criteria

DONE when every property parses in the recorded RTAMT version, the online step rejects non-finite input, and reliableness signs match every hand trace sample.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `AttributeError` on the specification class | **Adjust**: use the class name from the installed version's README. |
| Phase 1 | Parse error on a future operator | **Return**: to `rmon-temporal-property-spec` to restate in past time. |
| Phase 2 | `update` signature mismatch | **Adjust**: follow the installed version's README example exactly. |
| Phase 3 | Reliableness sign disagrees with hand trace | **Retry**: fix the formula through the spec flow; never edit the trace. |

**Do not:** invent RTAMT methods, feed repeated stale values, or treat reliableness 0 as a violation when the property is non-strict.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
