# CAN Transmit Scope Check

**One-line description:** Decides, from a fixed decision table, whether any frame may be transmitted on the target CAN network (virtual, bench, or owned vehicle), records the decision, and defaults every vehicle network to listen-only.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_kind` (string, required): One of "virtual" (vcan only), "bench" (ECUs or dev boards on a desk harness), "closed_course" (vehicle on a closed course), "vehicle" (any vehicle on a public road or in a garage).
- `vehicle_owned` (boolean, required): True only when the user owns the vehicle whose network is connected. Ignored for "virtual" and "bench" with no vehicle ECUs.
- `estop_confirmed` (boolean, optional): True when an independent hardware emergency stop (cuts actuator power without any software in the loop) is installed and was tested today.
- `planned_tx_ids` (string[], optional): Hex CAN IDs the user intends to transmit, with what each one commands.

---

## Outputs

- `tx_permission` (string): One of "none" (listen-only), "virtual_only", "bench_tx", "bench_tx_actuators".
- `scope_record` (object): The inputs, the decision table row that matched, the date, and the list of IDs that are allowed or refused with the reason.

---

## Phase 1: Classify the Target

### Entry Criteria
- `target_kind` and `vehicle_owned` are present.

### Actions
1. Read `target_kind`. If the value is not one of the four listed strings, stop and ask the user to pick one. Do not guess.
2. If `target_kind` is "vehicle" or "closed_course" and `vehicle_owned` is false, stop. Work on a vehicle the user does not own is out of scope for every flow in this domain.
3. For every ID in `planned_tx_ids`, write down what it commands in plain words. Mark the ID "actuator" if it can cause motion, steering, braking, throttle, gear change, door or window movement, or any other physical actuator. If the user does not know what an ID commands, mark it "actuator" (unknown counts as actuator).

### Output
Target class and a per-ID actuator flag.

### Quality Gate
- `target_kind` is exactly one of the four strings.
- Every ID in `planned_tx_ids` has a plain-language purpose and an actuator flag.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Phase 1 complete.

### Actions
1. Find the first matching row and set `tx_permission`:

| target_kind | actuator IDs planned | estop_confirmed | tx_permission |
|---|---|---|---|
| virtual | any | any | virtual_only |
| bench | no | any | bench_tx |
| bench | yes | true | bench_tx_actuators |
| bench | yes | false or missing | bench_tx (actuator IDs refused) |
| closed_course | yes | true | bench_tx_actuators |
| closed_course | no | any | none |
| closed_course | yes | false or missing | none |
| vehicle | any | any | none |

2. For "none", the interface must later be brought up with `listen-only on` (see `canb-socketcan-link-up`). Listen-only mode makes the controller never transmit, not even ACK bits or error frames.
3. Never write instructions that bypass a security gateway, immobilizer, emissions control, airbag, ABS or other safety system. If a planned ID would do that, refuse that ID and record why.
4. Record in `scope_record`: braking and emergency-stop paths are never gated, delayed or blocked by any software built in this domain. Any filter or gateway design must pass brake and stop frames through untouched.

### Output
`tx_permission` and draft `scope_record`.

### Quality Gate
- `tx_permission` is one of the four strings and matches exactly one table row.
- Every refused ID appears in `scope_record` with a reason.

---

## Phase 3: Record the Decision

### Entry Criteria
- `tx_permission` set.

### Actions
1. Write `scope_record` as JSON with keys: date, target_kind, vehicle_owned, estop_confirmed, matched_row, tx_permission, allowed_ids, refused_ids.
2. Tell the user in one sentence what is permitted. Example: "Listen-only: no frame will be sent on this bus."

### Output
`scope_record` saved and shown.

### Quality Gate
- `scope_record` parses as JSON (`python3 -m json.tool scope_record.json` exits 0).
- allowed_ids and refused_ids together equal `planned_tx_ids`.

---

## Worked Example

Illustrative. Input: `target_kind`="vehicle", `vehicle_owned`=true, `planned_tx_ids`=["7DF"] (OBD-II functional request).

- Phase 1: target class "vehicle"; 7DF marked non-actuator (diagnostic read request).
- Phase 2: row "vehicle / any / any" matches, `tx_permission`="none". Even a diagnostic read is not sent in this scope; reads happen by passive logging only.
- Phase 3: `scope_record` = {"target_kind":"vehicle","tx_permission":"none","allowed_ids":[],"refused_ids":[{"id":"7DF","reason":"vehicle scope is listen-only"}]}.

---

## Exit Criteria

DONE when `tx_permission` is set from one table row and `scope_record` lists every planned ID as allowed or refused.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `target_kind` not one of the four values | **Stop**: ask the user to choose; never infer it. |
| Phase 1 | Vehicle not owned by the user | **Stop**: end the flow; no later flow may run against that vehicle. |
| Phase 2 | Actuator ID planned with no tested hardware emergency stop | **Adjust**: refuse those IDs, permit the rest, record the refusal. |
| Phase 2 | User asks to bypass a gateway or safety system | **Stop**: refuse and record; do not describe a method. |
| Phase 3 | JSON does not parse | **Retry**: fix the syntax and rerun `python3 -m json.tool`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
