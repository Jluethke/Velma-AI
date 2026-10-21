# Monitor Event Log Schema

**One-line description:** Defines a JSON Schema (draft 2020-12) for one JSON Lines record per monitor evaluation or trip, carrying monotonic and wall time, a sequence number, the inputs that were checked, the bound and its source, the verdict and robustness, and the hash of the envelope file, so any trip can be replayed and audited later.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operating_envelope` (object[], required): Output of `rmon-envelope-from-requirements`.
- `temporal_properties` (object[], required): Output of `rmon-temporal-property-spec`.

---

## Outputs

- `monitor_log_schema` (object): Path to `monitor_event.schema.json` plus the record-level rules: which events are always logged, which are sampled, the flush rule, and retention.

---

## Phase 1: Choose Fields

### Entry Criteria
- Both inputs present.

### Actions
1. Include these required fields in every record:

   | Field | Type | Why |
   |---|---|---|
   | `t_mono_ns` | integer | ordering and latency math; from `time.monotonic_ns()` or `std::chrono::steady_clock` |
   | `t_wall_utc` | string (RFC 3339) | correlation with other logs; never used for timeouts |
   | `seq` | integer | detects dropped log lines |
   | `monitor_id` | string | which monitor instance |
   | `event` | enum: `eval`, `trip`, `clear`, `state_change`, `self_fault`, `startup` | record type |
   | `check_id` | string | envelope row or property `id` |
   | `inputs` | object | the exact values checked, with their source timestamps |
   | `bound` | object | the bound values used and their `source` |
   | `verdict` | enum: `pass`, `fail`, `stale`, `invalid_input` | outcome |
   | `robustness` | number or null | STL robustness when available |
   | `switch_state` | enum from `rmon-simplex-switch-logic` | decision module state after this event |
   | `config_hash` | string | `git hash-object operating_envelope.json` |
   | `monitor_version` | string | build or git commit of the monitor |

2. Never log only the verdict. A trip record without inputs and bound cannot be replayed.

### Output
Field list.

### Quality Gate
- Every field above appears in the draft field list with a type.

---

## Phase 2: Write the JSON Schema

### Entry Criteria
- Field list fixed.

### Actions
1. Write `monitor_event.schema.json` with `"$schema": "https://json-schema.org/draft/2020-12/schema"`, `"type": "object"`, `"required"` listing every field from Phase 1, and `"additionalProperties": false` so typos fail validation.
2. Check the schema itself is valid:
   ```
   python -m pip install jsonschema
   python -c "import json,jsonschema; s=json.load(open('monitor_event.schema.json')); jsonschema.Draft202012Validator.check_schema(s); print('schema ok')"
   ```
3. Write two sample records (one `eval`, one `trip`) and validate them:
   ```
   python -c "import json,jsonschema; s=json.load(open('monitor_event.schema.json')); v=jsonschema.Draft202012Validator(s); [v.validate(json.loads(l)) for l in open('sample.jsonl')]; print('samples ok')"
   ```

### Output
Schema file and validated samples.

### Quality Gate
- Both commands print `schema ok` and `samples ok`.
- A sample with an extra field fails validation (`additionalProperties` works).

---

## Phase 3: Set Logging Rules

### Entry Criteria
- Schema validated.

### Actions
1. Always log: `trip`, `clear`, `state_change`, `self_fault`, `startup`.
2. `eval` records: log every evaluation if storage allows; otherwise log every Nth with N as a user input, and always log the K evaluations before a trip from an in-memory ring buffer (K is a user input). Record N and K in the rules.
3. Flush rule: flush the file on every `trip`, `state_change` and `self_fault` before the monitor continues.
4. Logging must never block the trip action. Order: act first (switch, request safe state), then log.

### Output
`monitor_log_schema`.

### Quality Gate
- The rules file names N, K and the retention period with a source (user input or requirement).
- The rules state "act first, then log".

---

## Worked Example

Illustrative only.
```
{"t_mono_ns":918273645512,"t_wall_utc":"2026-03-04T15:02:11.204Z","seq":40122,"monitor_id":"speed-mon-1",
 "event":"trip","check_id":"P-RANGE-01","inputs":{"cmd_linear_x":2.31,"src_t_mono_ns":918273641100},
 "bound":{"min":-0.5,"max":2.0,"source":"SYS-114"},"verdict":"fail","robustness":-0.31,
 "switch_state":"SAFETY","config_hash":"3b18e512dba79e4c8300dd08aeb37f8e728b8dad","monitor_version":"a1c9f0e"}
```

---

## Exit Criteria

DONE when the schema validates, samples pass, extra fields fail, and the always-log, sampling, flush and act-first rules are written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `check_schema` raises `SchemaError` | **Retry**: fix the reported keyword path. |
| Phase 2 | Old `jsonschema` lacks `Draft202012Validator` | **Adjust**: `pip install -U jsonschema` and rerun. |
| Phase 3 | Storage too small to log every eval | **Adjust**: sampled evals plus the pre-trip ring buffer; never drop trip records. |

**Do not:** use wall-clock time for timeouts, log the verdict without the inputs, or let a slow disk delay the trip.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
