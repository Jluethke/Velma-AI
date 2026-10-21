# Temporal Property Specification

**One-line description:** Writes the monitor's properties as past-time Signal Temporal Logic (STL, Maler and Nickovic 2004) formulas that an online monitor can evaluate at each sample without looking into the future, traces each to an envelope row or fallback timing, and checks each formula by hand against a short trace before any code is written.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operating_envelope` (object[], required): Output of `rmon-envelope-from-requirements`.
- `fallback_strategy` (object[], required): Output of `rmon-fallback-mode-selection`.

---

## Outputs

- `temporal_properties` (object[]): One row per property: `id`, `english`, `formula` (RTAMT discrete-time syntax), `variables` (name, type, unit), `sample_period_ms`, `traces_to` (envelope row or fallback row), `hand_trace` (input samples and expected verdict per sample).

---

## Phase 1: Write Properties in English

### Entry Criteria
- `operating_envelope` has at least one row with sourced `min` and `max`.

### Actions
1. For every envelope row write one sentence per field that is sourced:
   - Range: "At every sample, `x` is between `min` and `max`."
   - Rate: "At every sample, the change of `x` since the previous sample divided by the period is at most `max_rate`."
   - Age: "The age of the latest `x` sample is at most `max_age_ms`."
2. For every fallback row write the response property: "Whenever the trip flag rises, the safe-state flag is true within `reaction_ms`." Use `reaction_ms` only if it is numeric; otherwise keep the property and mark the bound `open`.
3. Skip fields that are open questions. Do not fill them with placeholder numbers.

### Output
English property list.

### Quality Gate
- Each property cites exactly one envelope or fallback row in `traces_to`.
- No property contains a number that is not in its traced row.

---

## Phase 2: Translate to Past-Time STL

### Entry Criteria
- English list complete.

### Actions
1. Use only past-time and present operators so the online monitor gives a verdict at each sample. In RTAMT syntax: `historically[a:b]`, `once[a:b]`, `since`, `prev`, `rise`, `fall`, `abs`, `and`, `or`, `not`, `implies`. Future operators (`always`, `eventually`, `until`) need lookahead; avoid them for online use or check that your RTAMT version's `pastify()` applies.
2. Templates:

   | English form | Formula |
   |---|---|
   | Range | `(x >= MIN) and (x <= MAX)` |
   | Rate | `abs(x - prev x) <= MAX_RATE * PERIOD_S` |
   | Response within N samples | `not(historically[0:N](trip and not safe))`, meaning "tripped but not yet safe" never holds for N+1 samples in a row |

3. Convert time bounds to sample counts in discrete time: N = bound_ms / sample_period_ms. If the division is not an integer, round N down (stricter) and write that in the row. Check the RTAMT README for your installed version on whether interval bounds are read as sample steps or as time units after `set_sampling_period`; write the bound in the form your version uses and note which.
4. Write the formula in the RTAMT form with an output variable, for example `out = (x >= -0.5) and (x <= 2.0)`.

### Output
Formula column filled.

### Quality Gate
- `rg -n "always|eventually|until" temporal_properties.json` returns nothing, or each hit is justified in the row.
- Every N has a recorded division and rounding note.

---

## Phase 3: Hand-Check Each Formula

### Entry Criteria
- Formulas written.

### Actions
1. For each property write a trace of 5 to 10 samples: at least one sample that satisfies it, one that violates it, and one exactly on the boundary.
2. Write the expected verdict per sample in `hand_trace`. In STL robustness terms, a positive value means satisfied, negative means violated, zero is the boundary.
3. These traces become the first unit tests in `rmon-py-rtamt-stl-monitor` and the fault injection plan.

### Output
`temporal_properties`.

### Quality Gate
- Every property has a hand trace with at least one violating sample and one boundary sample.
- The JSON parses: `python -c "import json; json.load(open('temporal_properties.json'))"`.

---

## Worked Example

Illustrative only. Envelope row `cmd_linear_x`, min -0.5, max 2.0 (m/s), period 20 ms.
```
id: P-RANGE-01
formula: out = (cmd_linear_x >= -0.5) and (cmd_linear_x <= 2.0)
hand_trace: [1.0 -> +1.0, 2.0 -> 0.0, 2.3 -> -0.3, -0.6 -> -0.1]
```
Robustness of an `and` is the minimum of its parts: at 2.3, min(2.3 + 0.5, 2.0 - 2.3) = -0.3.

---

## Exit Criteria

DONE when every sourced envelope field and fallback timing has a past-time formula, every time bound is a sample count with a rounding note, and each formula has a hand trace.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Envelope row has no sourced fields | **Adjust**: write no property for it; leave it in the open questions list. |
| Phase 2 | Requirement needs future knowledge (for example "will stop within 2 s") | **Adjust**: restate it as a past-time check evaluated 2 s later, accepting the delay, and note that delay in the row. |
| Phase 3 | Hand trace verdict disagrees with the formula | **Retry**: fix the formula, not the trace; the trace comes from the English sentence. |

**Do not:** use future operators in an online monitor without checking, put placeholder bounds in formulas, or change a hand trace to match a formula.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
