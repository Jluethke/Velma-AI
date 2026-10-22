# Fsm Specification Extraction

Extract a complete state machine specification from the system requirements: states, transitions, conditions, outputs, and timing constraints.

## Inputs

- `protocol-specification`: The protocol, control sequence, or behavior that the FSM must implement, including all operating modes and error conditions
- `interface-requirements`: Input signals, output signals, timing requirements, and latency constraints for the FSM's external interfaces

## Outputs

- `state-transition-table`: Complete list of states, for each state: all valid input combinations and the resulting next state and output values
- `state-diagram`: Visual or textual state diagram showing all states, transitions, and conditions for human review

## Process

1. List all distinct operating modes or phases. Each becomes a candidate state. Include: idle/reset state, active states for each operating phase, wait states for handshakes or delays, error states for fault conditions, and a safe/recovery state.
2. For each state, enumerate all input combinations that cause a transition. Use a decision tree: for N binary inputs, there are 2^N combinations, but most are 'stay in current state'. Identify only the combinations that trigger a transition.
3. Define outputs for each state. Choose Moore (outputs depend only on state) when output timing must be predictable and glitch-free. Choose Mealy (outputs depend on state and inputs) when the FSM must react within the same clock cycle as an input change. Mealy outputs must be registered at the FSM output to prevent combinational glitches on the output pins.
4. Add timeout transitions: if the FSM can be stuck waiting for an input that never arrives (due to an external fault), add a timer-based transition to an error or recovery state. Define the timeout value from the worst-case expected response time plus margin.
5. Verify completeness: every state has a defined behavior for every possible input combination. Any undefined combination must explicitly remain in the current state, not be left as a don't-care that the synthesis tool may interpret unpredictably.
6. Review the specification with the system designer. State machines are difficult to modify after implementation; missing transitions or states discovered late require re-verification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
