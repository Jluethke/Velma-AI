# Fsm Encoding And Implementation

Implement the FSM in RTL with an encoding style optimized for the target FPGA, including safe state handling and output registration.

## Inputs

- `state-transition-table`: Complete state, transition, and output specification
- `state-diagram`: Visual state diagram for reference

## Outputs

- `fsm-rtl`: Synthesizable RTL implementation with chosen encoding, registered outputs, and safe-state recovery logic
- `encoding-rationale`: Justification for the chosen encoding style and its impact on resource usage and timing

## Process

1. Select state encoding based on the target and state count: One-hot encoding uses one flip-flop per state. On FPGAs, this is often fastest because next-state logic reduces to a simple OR of transition conditions (one LUT level). Suitable for FSMs with fewer than ~32 states. Binary encoding uses log2(N) flip-flops. Saves registers but requires more combinational logic for decoding. Use for FSMs with many states (>32) or when register count is constrained. Gray encoding minimizes transitions between adjacent states; use only when the state encoding feeds a CDC crossing or an external bus.
2. Implement the FSM as a two-process or three-process style: (a) Two-process: one sequential process for state register, one combinational process for next-state and output logic. (b) Three-process: separate combinational processes for next-state and outputs. (c) Single-process: everything in one clocked process. Single-process is cleanest for simple FSMs; two-process gives explicit separation for review.
3. Add illegal state recovery. For one-hot encoding: add a default case that detects when zero or more than one state bit is set and forces a return to the idle state. For binary encoding: add a default case in the case statement. Synthesis tools can optimize away unreachable states unless told not to: use the 'safe' FSM attribute (syn_encoding = 'safe' in Synplify, SAFE_STATE in Vivado) to force the tool to include recovery logic.
4. Register all outputs. Even for Moore machines, the output logic may have enough combinational depth to create setup time problems. Register the outputs in the state register process. This adds one clock cycle of latency but guarantees glitch-free outputs and simplifies timing closure.
5. For Mealy outputs that must not have the one-cycle latency penalty: register them, but pipeline the downstream logic to absorb the latency. Alternatively, use a look-ahead technique where the output is computed from the next-state value (which is available in the combinational process) rather than the current state.
6. Implement the reset. Use synchronous reset for FPGAs (it maps to the FDRE primitive's reset input and does not consume additional logic). The reset state must be the idle/safe state. All output registers must also reset to their safe values.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
