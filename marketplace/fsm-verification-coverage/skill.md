# Fsm Verification Coverage

Verify FSM correctness through state and transition coverage, illegal state injection, and assertion-based checking of temporal properties.

## Inputs

- `decomposed-fsm-design`: Final FSM architecture with sub-machines and interfaces
- `interface-protocol`: Inter-FSM communication protocol specification

## Outputs

- `fsm-verification-report`: Coverage report showing state coverage, transition coverage, and results of illegal state injection, assertion checking, and timeout testing
- `fsm-signoff`: Signoff statement that all states are reachable, all transitions are exercised, and all error recovery paths are verified

## Process

1. Measure state coverage: every defined state must be visited at least once during simulation. If a state is unreachable, it is either dead code (remove it) or the test is incomplete (add a stimulus that reaches it).
2. Measure transition coverage: every defined transition (from-state, input-condition, to-state) must be exercised at least once. Arc coverage is more thorough than state coverage because a state may be reachable by multiple paths.
3. Inject illegal states. Force the state register to every value not in the defined state set and verify the FSM recovers to the safe state within one clock cycle. For one-hot encoding, inject zero-hot and multi-hot values. For binary encoding, inject unused code points. This verifies the safe-state recovery logic.
4. Write temporal assertions (SVA or PSL): (a) No state lasts longer than its maximum allowed duration. (b) After a start signal, the FSM eventually reaches the done state (liveness property). (c) The FSM never asserts mutually exclusive outputs simultaneously. (d) The FSM returns to idle within N cycles of a reset assertion.
5. Test timeout transitions. Block the expected input indefinitely and verify the FSM transitions to the error state after the specified timeout. Verify the error state can be exited via the defined recovery mechanism (reset or explicit recovery command).
6. Run regression with random input sequences: constrained random stimulus exercises unexpected input combinations that directed tests miss. Random testing over long runs (millions of cycles) catches rare state-input combinations that trigger bugs.
7. For hierarchical FSMs: verify the top-level FSM's behavior when sub-FSMs report errors, when sub-FSMs take longer than expected, and when multiple sub-FSMs complete simultaneously.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
