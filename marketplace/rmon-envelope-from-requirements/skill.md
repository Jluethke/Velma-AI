# Operating Envelope from Requirements

**One-line description:** Turns written requirements into a machine-readable operating envelope with a range, a rate limit and a maximum data age per monitored signal, where every number cites a requirement, a named standard, a datasheet or a user decision, and everything else becomes an open question.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `monitor_scope` (object, required): Output of `rmon-scope-supervised-component`.
- `requirements_doc` (string, required): Path to the requirements set (system requirements, safety requirements, actuator datasheets, ODD description).

---

## Outputs

- `operating_envelope` (object[]): One row per signal: `signal`, `unit`, `min`, `max`, `max_rate` (unit per second), `max_age_ms`, `expected_period_ms`, and for every numeric field a `source` (requirement ID, standard clause, datasheet page, or `user:<name>,<date>`).
- `envelope_open_questions` (object[]): Every field that has no source: `signal`, `field`, `why_needed`, `who_can_answer`.

---

## Phase 1: Extract Candidate Bounds

### Entry Criteria
- `monitor_scope.commands` and `monitor_scope.inputs` are non-empty.
- `requirements_doc` exists.

### Actions
1. For each command and each safety-relevant input in `monitor_scope`, search the requirements for its name and unit: `rg -n -i "<signal name>|<unit>" <requirements_doc>`.
2. Copy every candidate number with its requirement ID verbatim. Typical sources:

   | Field | Where it usually lives |
   |---|---|
   | `min`, `max` | actuator datasheet limits, ODD speed limits, mechanical stops |
   | `max_rate` | actuator slew limit, comfort or stability requirement, controller design note |
   | `expected_period_ms` | ICD message rate |
   | `max_age_ms` | timing requirement, or the budget derived from the FTTI in `rmon-fallback-mode-selection` |

3. If two sources disagree, keep both and mark the row `conflict`. Do NOT average them or pick the looser one.

### Output
Candidate bound table with citations.

### Quality Gate
- Every numeric cell has a `source` string that can be found in `requirements_doc` with `rg -n "<source id>"`, or is in the open questions list.
- Every conflict row lists both values and both sources.

---

## Phase 2: Normalize and Check Consistency

### Entry Criteria
- Candidate table exists.

### Actions
1. Convert every number to the unit in `monitor_scope` (for example km/h to m/s by dividing by 3.6). Record the conversion in the row.
2. Check internal consistency with these rules:
   - If `min` is greater than or equal to `max`: mark `invalid`.
   - If `max_age_ms` is less than `expected_period_ms`: mark `invalid` (every healthy message would be stale).
   - If `max_rate` multiplied by `expected_period_ms / 1000` exceeds `max - min`: note that the rate check cannot trip before the range check; keep both.
3. Resolve `conflict` and `invalid` rows only with a cited decision from the requirements owner recorded as `user:<name>,<date>`. Otherwise move them to `envelope_open_questions`.

### Output
Normalized and consistency-checked envelope.

### Quality Gate
- Zero rows are marked `invalid` or `conflict` in `operating_envelope`; each such row is in `envelope_open_questions` instead.
- A script check prints nothing: `python -c "import json; e=json.load(open('operating_envelope.json')); [print(r['signal']) for r in e if r['min']>=r['max']]"`.

---

## Phase 3: Emit the Envelope

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Write `operating_envelope.json` and `envelope_open_questions.json`.
2. Put the file under version control in the monitor repository so its hash can be logged with every trip (see `rmon-monitor-log-schema`): `git hash-object operating_envelope.json`.
3. Never tighten or loosen a bound in code later without changing this file and its source field.

### Output
`operating_envelope`, `envelope_open_questions`.

### Quality Gate
- `git hash-object operating_envelope.json` prints a 40-character hash.
- The count of rows equals the count of monitored signals in `monitor_scope`, or each missing signal is in `envelope_open_questions`.

---

## Worked Example

Illustrative only. Signal `cmd_linear_x` (m/s). Requirement SYS-114 says "commanded forward speed shall not exceed 2.0 m/s in the warehouse ODD"; motor datasheet p.12 gives a reverse limit of -0.5 m/s; ICD-07 gives a 50 Hz rate (20 ms period); no requirement states a rate limit.

```
{"signal":"cmd_linear_x","unit":"m/s","min":-0.5,"max":2.0,"expected_period_ms":20,
 "source":{"min":"motor datasheet p.12","max":"SYS-114","expected_period_ms":"ICD-07"},
 "max_rate":null,"max_age_ms":null}
```
Open questions: `max_rate` (no requirement; ask the controls lead) and `max_age_ms` (derive after FTTI is known).

---

## Exit Criteria

DONE when every monitored signal has a sourced envelope row or an open question per missing field, no row is invalid, and the envelope file is versioned.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requirements contain no numbers for a signal | **Adjust**: list every field as an open question; do not copy limits from a similar product. |
| Phase 2 | Unit is ambiguous (for example "speed" without unit) | **Return**: to the requirements owner with the requirement ID. |
| Phase 2 | Owner unavailable to resolve a conflict | **Stop** for that signal: keep it open; continue with other signals. |
| Phase 3 | File not under version control | **Adjust**: `git init` or add it to the existing repo, then hash. |

**Do not:** invent a "reasonable" margin, round bounds toward looser values, or delete an open question to make the table look complete.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
