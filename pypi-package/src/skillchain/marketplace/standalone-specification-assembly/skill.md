# Standalone Specification Assembly

Assemble extracted message formats, state machine, and error handling into a self-contained protocol specification document. The specification is organized by layer (physical, data-link, application), includes byte-level diagrams, and provides an implementation checklist.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load message catalog, state machine, error handling
REASON  --> Organize by protocol layer, cross-reference
PLAN    --> Build layout diagrams, transition tables, timing tables
ACT     --> Output protocol specification and implementation checklist
```

## Inputs

- `message_catalog`: list[object] -- All message formats from message-format-extraction
- `protocol_state_machine`: object -- Protocol states and transitions from state-protocol-extraction
- `error_handling`: list[object] -- Error conditions and responses

## Outputs

- `protocol_specification`: object -- Complete standalone specification organized by layer, with diagrams and tables
- `implementation_checklist`: list[object] -- Ordered checklist for building a conforming implementation from scratch

---

## Execution

### OBSERVE: Gather All Components

1. Load all inputs. Verify internal consistency: every message referenced in the state machine should exist in the message catalog. Every error condition should reference a real message or field.
2. Identify any gaps: messages in the catalog not referenced by the state machine (passive/informational messages), or state transitions referencing undocumented messages.

### REASON: Organize by Layer

1. **Physical layer.** Bus parameters: bus type, bitrate, frame format, voltage levels (if known).
2. **Data-link layer.** Message framing: arbitration ID range, DLC conventions, integrity fields (checksum algorithm, counter format), and message acceptance criteria.
3. **Application layer.** State machine: states, transitions, commands, responses. Timing: send rates, timeouts, cooldowns. Constraints: value limits, ramp rates, error thresholds.

### PLAN: Build the Specification

1. For each message, draw a byte-level layout diagram:
   ```
   Byte 0     Byte 1     Byte 2     Byte 3     Byte 4     Byte 5
   [--TORQUE[10:8]--][--TORQUE[7:0]--][---CTRL---][  unused  ][--CNTR--|--][--CHECKSUM--]
   ```

2. For the state machine, provide:
   - Text-based state diagram
   - Transition table (current, trigger, guard, next, action)
   - Timing table (parameter, value, unit)

3. For error handling, provide a decision tree: input condition -> check -> pass/fail -> action.

4. Write the implementation checklist in build order:
   - Step 1: Implement the checksum algorithm. Test against 5+ known vectors.
   - Step 2: Implement message construction for each message type.
   - Step 3: Implement the state machine with timing.
   - Step 4: Implement error detection and handling.
   - Step 5: Validate against real captured data.

### ACT: Deliver

1. Output the specification as a structured document with sections per layer.
2. Output the checklist as an ordered build plan.
3. Include test vectors for every integrity algorithm.

## Exit Criteria

1. Every message has a byte-level diagram
2. The state machine has a transition table and timing table
3. Error handling has a decision tree
4. The implementation checklist is ordered and complete
5. The specification stands alone without reference to source code

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
