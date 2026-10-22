# Cdc Constraint Implementation

Write the timing constraints that make synchronizers work correctly in the physical implementation: max delay on crossing paths, false paths where appropriate, and placement constraints for synchronizer registers.

## Inputs

- `synchronizer-design`: Synchronizer structures with their implementation details
- `synchronizer-latency-budget`: Latency requirements for each synchronizer

## Outputs

- `cdc-constraints`: SDC/XDC constraints specific to all CDC paths: set_max_delay, set_false_path, ASYNC_REG attributes, and placement constraints
- `constraint-rationale`: Justification for each constraint, explaining why it is safe and what failure mode it prevents

## Process

1. For every two-flop synchronizer: set the ASYNC_REG attribute on both flops. This tells the tool to place them in the same slice (minimizing routing delay between them, which maximizes metastability resolution time) and prevents the tool from optimizing them away.
2. Apply set_max_delay -datapath_only between the source register and the first synchronizer flop. The value should be one destination clock period. The -datapath_only flag excludes clock skew, which is appropriate because the source and destination clocks are unrelated and skew between them is meaningless.
3. Do NOT use set_false_path on synchronized CDC paths. A false path removes the path from timing analysis entirely, which means the tool may route it with arbitrarily long delay. The set_max_delay constraint ensures the data arrives within a bounded time, which is necessary for the synchronizer to function.
4. For gray-coded bus crossings: apply set_max_delay with the same value to ALL bits of the bus. This ensures all bits arrive at the synchronizer flops within the same clock period, preventing different bits from being captured on different clock edges (which would give a non-gray-code value and corrupt the pointer).
5. For handshake crossings: constrain the request and acknowledge signals with set_max_delay as above. The data bus between source and destination does not need a CDC constraint because it is stable (held by the handshake protocol) when captured.
6. Document why each constraint is applied and what failure mode it prevents. Future constraint file edits must preserve these CDC constraints; removing them silently introduces metastability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
