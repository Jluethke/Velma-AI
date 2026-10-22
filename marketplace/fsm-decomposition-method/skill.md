# Fsm Decomposition Method

Decompose large or complex FSMs into hierarchical or parallel sub-machines to reduce complexity, improve timing, and enable independent verification.

## Inputs

- `fsm-rtl`: Initial FSM implementation, potentially large or complex
- `encoding-rationale`: Encoding choice and resource impact

## Outputs

- `decomposed-fsm-design`: Architecture showing how the FSM is split into sub-machines with defined interfaces between them
- `interface-protocol`: Signals and handshake protocol between sub-machines, ensuring they coordinate correctly

## Process

1. Identify independent control threads. If the FSM has groups of states that operate independently (e.g., a transmit path and a receive path), split them into separate FSMs that run in parallel. They communicate through shared status signals, not shared states.
2. Identify hierarchical structure. If the FSM has a high-level mode (idle, configure, run, shutdown) with sub-modes within each, implement as a hierarchical FSM: a top-level FSM selects the mode, and sub-FSMs implement the detailed behavior within each mode. The top-level FSM enables/disables sub-FSMs and routes their status signals.
3. Define the interface between sub-machines: (a) start/done handshake (top FSM asserts start, sub-FSM runs and asserts done when complete), (b) shared status registers that sub-FSMs update and the top FSM reads, (c) a command register that the top FSM writes to direct sub-FSM behavior.
4. Verify that the decomposition does not change the external behavior. The decomposed design must produce identical outputs for identical input sequences. Create a compliance test that exercises the original FSM and the decomposed design in parallel and compares outputs on every cycle.
5. Each sub-FSM is now small enough to encode, optimize, and verify independently. Apply encoding selection and safe-state logic to each sub-FSM individually.
6. If sub-FSMs are in different clock domains (e.g., a control FSM in the processor clock domain and a data FSM in the interface clock domain), the interface between them is a CDC crossing and must be synchronized appropriately.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
