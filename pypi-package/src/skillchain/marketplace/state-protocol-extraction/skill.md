# State Protocol Extraction

Extract a protocol's state machine from source code. Identify every state, transition condition, timing requirement, and error handling path. Produce a formal transition table and timing specification.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load key files and message catalog
REASON  --> Identify states, transitions, timing, error paths
PLAN    --> Build transition table and timing spec
ACT     --> Output protocol state machine and error handling
```

## Inputs

- `key_files`: list[object] -- Source files containing protocol state logic
- `message_catalog`: list[object] -- Extracted message formats from message-format-extraction

## Outputs

- `protocol_state_machine`: object -- States, transitions (trigger + guard + action), timing requirements (rates, timeouts, cooldowns)
- `error_handling`: list[object] -- Every error condition and its prescribed response

---

## Execution

### OBSERVE: Find State Logic

1. Find the main protocol loop or state handler in the source code. This is typically a function called at a fixed rate that checks inputs and updates state.
2. Identify state variables: enums, flags, or integers that track the protocol's current mode.
3. Identify timing constants: message rates, timeout durations, cooldown periods, ramp rate limits.

### REASON: Extract Transitions

1. For each state, identify all outgoing transitions:
   - **Trigger:** what event causes the transition (received message, timeout, internal flag)
   - **Guard condition:** what additional condition must be true (signal value check, state duration, counter match)
   - **Action:** what the protocol does on transition (send message, update variable, start timer)
   - **Next state:** where the transition leads

2. Extract timing requirements:
   - Message send rates (Hz) per state
   - Timeout durations (how long without input before fault)
   - Cooldown periods (minimum time between state changes)
   - Ramp rates (maximum rate of change for controlled values)

3. Extract error handling:
   - Checksum mismatch: what happens? (Ignore frame, increment error counter, enter fault state)
   - Counter discontinuity: what happens?
   - Message timeout: what happens after N missed messages?
   - Out-of-range value: what happens when a field exceeds its valid range?
   - Document the threshold for each error (e.g., "3 consecutive checksum failures triggers fault")

### PLAN: Formalize

1. Build the transition table:
   ```
   Current | Trigger      | Guard           | Next    | Action           | Timing
   IDLE    | msg_received | checksum valid  | ACTIVE  | send_ack         | within 10ms
   ACTIVE  | timeout      | no msg for 500ms| FAULT   | set_fault_flag   | immediate
   FAULT   | reset_cmd    | none            | IDLE    | clear_counters   | after 4s cooldown
   ```

2. Build the timing table:
   ```
   Parameter         | Value    | Evidence
   Send rate (ACTIVE)| 50 Hz    | timer constant in control loop
   Timeout threshold | 500 ms   | watchdog constant
   Cooldown period   | 4000 ms  | re-enable delay after fault
   Max ramp rate     | 3/frame  | rate limit constant
   ```

### ACT: Deliver

1. Output the protocol state machine as a transition table and text-based state diagram.
2. Output error handling as a table of conditions and responses.

## Exit Criteria

1. Every state in the source code is identified
2. Every transition has trigger, guard, action, and next state
3. Timing requirements are extracted with values and evidence
4. Error handling covers checksum, counter, timeout, and range errors

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
