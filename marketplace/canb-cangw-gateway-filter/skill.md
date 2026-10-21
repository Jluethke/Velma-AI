# CAN Gateway and Filtering Design with cangw

**One-line description:** Designs a one-direction-by-default CAN gateway between two SocketCAN interfaces using the kernel can-gw module and the can-utils cangw tool, with explicit per-ID forwarding rules, a pass-through guarantee for brake and stop frames, and counters that prove each rule works.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gateway_spec` (object, required): Source and destination interfaces, the ID/mask list to forward in each direction, whether any payload modification is wanted, and the purpose. Example: forward everything from vehicle-side "can0" (listen-only) to bench-side "vcan0" for analysis.
- `tx_permission` (string, required): From `canb-tx-scope-check`. Governs whether any rule may write onto a physical bus.

---

## Outputs

- `gateway_rules` (object): The rule table, the exact cangw commands, the `cangw -L` listing, per-rule handled/dropped counters after a test, and the safety notes.

---

## Phase 1: Design the Rule Table

### Entry Criteria
- `gateway_spec` present.

### Actions
1. Write a table: rule number, source, destination, filter (ID:mask), modification (none by default), purpose.
2. Direction rule: a destination that is a physical vehicle bus is allowed only when `tx_permission` is "bench_tx" or "bench_tx_actuators" and the "vehicle" is a bench setup. With `tx_permission` "none", destinations may only be virtual (vcan) interfaces.
3. Safety rule: a gateway in this design never drops, delays or modifies brake, emergency-stop or other safety frames between the nodes that need them. If the gateway sits in such a path, those IDs are forwarded unconditionally with no modification, listed first, and the design records that the stop path does not depend on this host being up. Prefer designs where those paths do not pass through a Linux gateway at all.
4. Never design a gateway to bypass a vehicle security gateway, immobilizer, or emissions or safety system.
5. Modifications (`-m` AND/OR/XOR/SET operations and checksum updates) are allowed only on bench buses and only with a written purpose.

### Output
Rule table.

### Quality Gate
- Every rule has a filter and a purpose.
- No rule writes to a physical bus when `tx_permission` is "none".

---

## Phase 2: Install Rules

### Entry Criteria
- Rule table approved by the user.

### Actions
1. `sudo modprobe can-gw`.
2. Read `cangw -h` for the exact syntax on your version. Core options: `-A` add, `-D` delete, `-F` flush, `-L` list, `-s <src>`, `-d <dst>`, `-f <id>:<mask>` filter, `-e` echo sent frames to local sockets, `-m` modification. Use only listed options.
3. Add one rule per table row, for example: `sudo cangw -A -s can0 -d vcan0 -e -f 0C9:7FF`.
4. List: `cangw -L`. Each printed rule must match a table row.

### Output
Rules installed.

### Quality Gate
- `cangw -L` lists exactly the table rows, no more.

---

## Phase 3: Prove Each Rule

### Entry Criteria
- Rules installed.

### Actions
1. Capture on the destination with `candump -l vcan0` for a fixed time.
2. Compare per-ID counts on source and destination logs: forwarded IDs must match counts; unlisted IDs must be absent at the destination.
3. `cangw -L` prints handled and dropped counters per rule in recent versions; record them.
4. Removal: `sudo cangw -F` flushes all rules; record the command for teardown.

### Output
`gateway_rules`.

### Quality Gate
- Forwarded-ID counts at source and destination are equal.
- No unlisted ID appears at the destination.

---

## Worked Example

Illustrative. `gateway_spec`: forward 0x0C9 and 0x1A0 from listen-only "can0" on the user's car to "vcan0" for a decoder app; `tx_permission`="none".

- Phase 1: two rules, destination vcan0 only; no modifications.
- Phase 2: `cangw -A -s can0 -d vcan0 -e -f 0C9:7FF` and `... -f 1A0:7FF`; `cangw -L` shows two rules.
- Phase 3: 60 s: can0 0x0C9 6000, vcan0 0x0C9 6000; 0x1A0 3000/3000; vcan0 contains no other IDs.

---

## Exit Criteria

DONE when the installed rules equal the approved table, forwarding counts match, unlisted IDs are absent, and the safety notes are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rule would write to a vehicle bus | **Stop**: refuse the rule. |
| Phase 1 | Gateway would sit in a brake or stop path | **Adjust**: forward those IDs unconditionally and record that the stop path cannot depend on this host; prefer moving the gateway out of that path. |
| Phase 2 | `cangw: netlink error` | **Retry**: load can-gw and run with sudo. |
| Phase 3 | Counts differ | **Return**: check filter masks and destination bus load. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
