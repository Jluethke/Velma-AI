# Read-Only Diagnostic Request Guard

**One-line description:** Builds a default-deny allowlist check that every outgoing OBD-II or UDS request passes through before it reaches the bus, refusing write, security, reprogramming and actuator services, and proves with tests and a candump capture that a refused request transmits zero frames.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `diag_scope` (object, required): From `uds-diag-scope-readonly`.
- `allowed_services` (object[], required): The allowlist table from `uds-diag-scope-readonly`.

---

## Outputs

- `request_guard` (object): Path of the guard module, its function signature, the loaded allowlist, and the list of gated-write services with the confirmation input each needs.
- `guard_test_report` (object): Test runner summary and the candump evidence that refused requests sent nothing.

---

## Phase 1: Define the Decision Rules

### Entry Criteria
- `allowed_services` has a mode for every row.

### Actions
1. The guard is a pure function `check(request: bytes, confirmations: dict) -> (allowed: bool, reason: str)`. It does no I/O.
2. Rules, applied in this order:
   1. Empty request: deny.
   2. First byte (service ID) not in `allowed_services`: deny ("default deny").
   3. Mode denied: deny.
   4. UDS 0x10: allow subfunction 0x01 and 0x03 (with or without the 0x80 suppress bit); deny 0x02 programming and anything else.
   5. UDS 0x3E: allow subfunction 0x00 and 0x80 only.
   6. UDS 0x31: allow subfunction 0x03 for a routine ID in the documented list; allow 0x01 only when `confirmations["routine_doc_non_actuating"]` is true for that ID; deny routine IDs 0xE200 to 0xE2FF (ISO 14229-1 reserves this range for safety system routines such as pyrotechnic deployment), 0xFF00 (eraseMemory) and 0xFF01 (checkProgrammingDependencies) always.
   7. Gated write (UDS 0x14, OBD 0x04): allow only when `confirmations["clear_confirmed"]` is true.
   8. Otherwise allow.
3. The guard sits only in the tester's outbound diagnostic path. It never sits in, delays or filters any braking or emergency-stop path.

### Output
Written rule list.

### Quality Gate
- The rule list denies 0x27, 0x2E, 0x2F, 0x34 and 0x36 by rule 2 or 3.

---

## Phase 2: Implement in One File

### Entry Criteria
- Rules defined.

### Actions
1. Create one module (for example `diag/guard.py` or `guard.c`). Load the allowlist from a JSON file generated from `allowed_services`; do not duplicate the table in code.
2. Call `check()` inside the single send function of the transport (`uds-py-isotp-library` factory, `uds-c-isotp-socket` program, or the udsoncan connection wrapper). There must be no other send path.
3. On deny, raise or return an error that includes the reason and the hex of the request. Log it.
4. Edit one file at a time and run the tests after each edit.

### Output
Guard module wired into the send function.

### Quality Gate
- `grep -rn "\.send(" diag/` (or the equivalent) shows exactly one call site to the transport send, inside the guarded wrapper.

---

## Phase 3: Test and Prove Zero Transmission

### Entry Criteria
- Guard implemented.

### Actions
1. Unit tests, one per row:
   - allow `22 F1 90`, `19 02 08`, `10 03`, `3E 80`, `01 0C`, `09 02`.
   - deny `27 01`, `2E F1 90 00`, `2F 01 00 03`, `34 00 44`, `10 02`, `11 01`, `85 02`, `08 01`, `31 01 E2 00`, `31 01 FF 00`.
   - deny `14 FF FF FF` without confirmation; allow it with `clear_confirmed` true.
2. Run the suite (`pytest -q` or the C test runner).
3. Wire test: on `vcan0`, run `candump -L vcan0 > guard_wire.log` in one terminal, send `27 01` through the real send function in another, stop candump. The log must contain zero lines.
4. Never delete or loosen a deny test to make the suite pass.

### Output
`request_guard`, `guard_test_report`.

### Quality Gate
- Test summary shows all tests passed, 0 failed.
- `wc -l guard_wire.log` prints 0.

---

## Worked Example

Illustrative only.

```
$ pytest -q tests/test_guard.py
..................                                      [100%]
18 passed in 0.05s
$ candump -L vcan0 > guard_wire.log &  python -m diag.send vcan0 "27 01"
denied: service 0x27 not in allowlist (default deny)
$ wc -l guard_wire.log
0 guard_wire.log
```

---

## Exit Criteria

DONE when every request goes through one guarded send function, the allow and deny tests pass, and a refused request produces zero frames on the wire.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User asks to add 0x27 or 0x2E | **Stop**: these are out of scope for this domain. |
| Phase 2 | A second send path exists (for example a direct `cansend` call) | **Adjust**: route it through the guard or remove it. |
| Phase 3 | Wire log not empty for a denied request | **Stop**: the guard is bypassed; find the unguarded path before any vehicle use. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
