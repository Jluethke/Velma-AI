# Assertion And Formal Verification

Write SystemVerilog assertions for protocol compliance and safety properties, and apply formal verification to prove critical properties without simulation.

## Inputs

- `random-test-results`: Coverage status and any remaining gaps
- `regression-suite`: Complete regression test set

## Outputs

- `assertion-library`: Collection of SVA assertions covering protocol compliance, safety properties, and interface timing, annotated with the requirement each assertion verifies
- `formal-verification-results`: Properties proven, properties that could not be proved (with counterexamples or bounded proofs), and formal coverage analysis showing what fraction of the state space was explored

## Process

1. Write interface protocol assertions. For every handshake interface (valid/ready, request/grant, read/write): assert the protocol rules. Example: 'once valid is asserted, it must remain asserted until ready is asserted (no retraction).' These catch protocol violations that a scoreboard might miss if the reference model has the same bug.
2. Write safety assertions. These are properties that must always hold: 'the FIFO write pointer and read pointer are never more than depth apart,' 'the output voltage command is always within the safe range,' 'the state machine never enters an undefined state.' Safety assertions are never conditions; they fire as immediate errors.
3. Write liveness assertions. These are properties that must eventually hold: 'after a request, a response occurs within N cycles,' 'after a reset, the system reaches the idle state within M cycles.' Liveness assertions catch deadlocks and stuck conditions that safety assertions do not.
4. Apply formal verification to critical assertions. Formal tools exhaustively explore all reachable states and prove that the assertion holds for all possible input sequences, or find a counterexample. Start with bounded proofs (prove the property holds for K cycles) and increase K until the tool either proves unbounded or exceeds capacity.
5. For properties the formal tool cannot prove unbounded (state space too large): accept the bounded proof with documentation of the bound depth and the rationale for why it is sufficient (e.g., 'the maximum pipeline depth is 8 cycles, so a 20-cycle bound covers all reachable states').
6. Generate formal coverage: the formal tool reports which portions of the design's state space were explored during proof. Low formal coverage indicates the tool's constraints are too restrictive or the design has unreachable code. Use formal coverage alongside simulation coverage for a complete picture.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
