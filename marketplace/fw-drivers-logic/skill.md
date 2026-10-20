# Firmware Drivers and Logic

**One-line description:** Implements each interface driver and the application logic in a scaffolded firmware project, and proves the logic with host unit tests that cover every state machine fault transition.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `firmware_source` (string, required): Scaffolded project from `fw-project-scaffold`.
- `board_spec` (object, required): Interfaces with protocols, rates, frame formats, and the board's job.
- `critical_circuits` (object[], required): Firmware's limited role for each critical circuit (status and stop request only).

---

## Outputs

- `firmware_tests` (object): Host unit test results: test count per logic module, pass count, the fault transitions covered, and the command that reproduces the run.

---

## Phase 1: Implement Drivers

### Entry Criteria
- `firmware_source` builds and its host test target compiles.

### Actions
1. For each driver stub, implement initialization at the rate and mode in `board_spec` (e.g., CAN at 500 kbps with the bit timing computed from the peripheral clock and the datasheet formula, recorded with sample point near 87.5%).
2. Configure every peripheral from the generated board definition only.
3. Return explicit error codes from every driver call; logic handles each code.
4. Keep the authority limits from the scaffold: critical-circuit drivers read status and request stops only.

### Output
Implemented drivers.

### Quality Gate
- Every interface in `board_spec` has an implemented driver.
- Every bus timing value is computed from the clock and datasheet formula, with the computation recorded.
- Every driver call's error return is handled.

---

## Phase 2: Implement Logic

### Entry Criteria
- Drivers implemented.

### Actions
1. Implement the application logic in `logic/`: protocol framing and parsing, state machines, and the board's job from `board_spec`.
2. Write each state machine as an explicit state table with a defined fault state reachable from every state; entering it requests the safe state through the stop request path.
3. Bound every buffer by size and check every length field before use.

### Output
Implemented logic modules.

### Quality Gate
- Every state machine has a fault state reachable from every state.
- Zero unbounded copies; every received length is checked against its buffer.

---

## Phase 3: Host Test

### Entry Criteria
- Logic implemented.

### Actions
1. Write unit tests for each logic module: encode and decode round trips, every state transition including every fault transition, boundary values (zero length, maximum length, maximum plus one), and malformed input.
2. Run the host tests with the framework's host runner (Unity via CMake, or `west twister` / native_sim for Zephyr, or `pio test -e native`).
3. Fix failures at their cause and rerun until all pass.
4. Record counts and the reproduce command in `firmware_tests`.

### Output
`firmware_tests`.

### Quality Gate
- Every logic module has tests; every test passes.
- Every fault transition in every state table has a test.
- Malformed and boundary inputs are tested for every parser.

---

## Exit Criteria

DONE when every interface has a working driver, every state machine reaches a fault state from every state, and all host tests pass with every fault transition covered.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Bus timing cannot hit the required rate from the clock | **Escalate**: report the achievable rates and the clock change needed. |
| Phase 2 | Board job underspecified in `board_spec` | **Adjust**: implement the minimal behavior the interfaces imply, record the assumption. |
| Phase 3 | Test fails after 3 fixes | **Escalate**: report the test, input, expected, and actual. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
