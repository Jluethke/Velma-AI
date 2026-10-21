# Vehicle Diagnostics Read-Only Scope

**One-line description:** Fixes the scope of a vehicle diagnostics session before any frame is sent: confirms the user owns the vehicle, picks the physical interface (SocketCAN, ELM327 or DoIP), and writes the read-only service allowlist that every later flow must obey.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `vehicle_description` (string, required): Model year, make, model, engine and market (for example "2019 compact sedan, 2.0 L gasoline, US market"). Used to pick the OBD protocol and the expected addressing.
- `ownership_confirmed` (boolean, required): True only when the user states they own the vehicle or hold written permission from the owner.
- `diag_interface` (string, required): One of `socketcan` (a Linux CAN adapter on the OBD-II pins 6 and 14), `elm327` (a serial or USB ELM327-compatible adapter), or `doip` (Ethernet diagnostics per ISO 13400).

---

## Outputs

- `diag_scope` (object): Vehicle, interface, addressing assumption (11-bit or 29-bit), the read-only flag (always true by default), and the list of items that need an explicit user confirmation before they run.
- `allowed_services` (object[]): One row per permitted request: service ID, allowed subfunctions, mode (read, gated-write, denied) and the reason.

---

## Phase 1: Confirm Ownership and Purpose

### Entry Criteria
- `vehicle_description`, `ownership_confirmed` and `diag_interface` are present.

### Actions
1. If `ownership_confirmed` is not true, stop. Do not proceed on a vehicle the user does not own or is not authorized to work on.
2. Write the purpose in one sentence, for example "read live engine data and stored trouble codes".
3. Record that the session is read-only by default: logging, decoding and diagnostic reads only.
4. Record the out-of-scope list verbatim in `diag_scope`: bypassing a security gateway, immobilizer work, emissions control changes, safety system (airbag, ABS, steering) changes, reflashing, and any SecurityAccess (0x27) or Authentication (0x29) request. These are never part of this domain.

### Output
Draft `diag_scope` with ownership, purpose and the read-only flag.

### Quality Gate
- `diag_scope.ownership_confirmed` is true.
- `diag_scope.read_only` is true.
- The out-of-scope list contains the six items in Action 4.

---

## Phase 2: Pick Interface and Addressing

### Entry Criteria
- Phase 1 passed.

### Actions
1. Use this table to set the transport:

| `diag_interface` | Transport | Next flow |
|---|---|---|
| socketcan | ISO 15765-2 over CAN, Linux kernel | `uds-socketcan-link-setup` |
| elm327 | ELM327 AT command set over serial | `uds-py-python-obd-elm327` |
| doip | ISO 13400-2 over TCP/UDP port 13400 | `uds-doip-basics` |

2. Set the addressing assumption. US vehicles sold from model year 2008 use CAN (ISO 15765-4) for OBD-II. Start with 11-bit addressing: functional request ID 0x7DF, physical request IDs 0x7E0 to 0x7E7, responses at request ID plus 8 (0x7E8 to 0x7EF). If no reply arrives on 11-bit, try 29-bit: functional 0x18DB33F1, physical 0x18DA<ecu>F1, responses 0x18DAF1<ecu>.
3. Record the CAN bitrate rule: ISO 15765-4 allows 500 kbit/s or 250 kbit/s. Try 500 kbit/s first in listen-only mode (see `uds-socketcan-link-setup`).
4. Do not guess an OEM-specific ECU address. Only the legislated OBD IDs above are known without the OEM's documentation.

### Output
`diag_scope` with interface, addressing and bitrate candidates.

### Quality Gate
- `diag_scope.interface` is one of the three values in the table.
- Every CAN ID in `diag_scope` comes from the list in Action 2 or from a cited OEM document.

---

## Phase 3: Write the Service Allowlist

### Entry Criteria
- Phase 2 passed.

### Actions
1. Write `allowed_services` with exactly these rows (default deny for everything else):

| Service | Subfunctions / scope | Mode |
|---|---|---|
| OBD 0x01, 0x02, 0x03, 0x07, 0x09, 0x0A | all PIDs | read |
| OBD 0x04 (clear DTCs) | none | gated-write (needs `clear_confirmed`) |
| UDS 0x10 DiagnosticSessionControl | 0x01 default, 0x03 extended | read |
| UDS 0x3E TesterPresent | 0x00, 0x80 | read |
| UDS 0x22 ReadDataByIdentifier | any DID | read |
| UDS 0x19 ReadDTCInformation | read subfunctions | read |
| UDS 0x14 ClearDiagnosticInformation | group per ISO 14229-1 | gated-write (needs `clear_confirmed`) |
| UDS 0x31 RoutineControl | 0x03 results; 0x01 only for a documented non-actuating routine | gated-write |
| UDS 0x10 subfunction 0x02 (programming) | none | denied |
| UDS 0x11, 0x27, 0x28, 0x29, 0x2E, 0x2F, 0x34, 0x35, 0x36, 0x37, 0x3D, 0x85, 0x87 | none | denied |
| OBD 0x08 | none | denied |

2. Add the rule: any request that commands an actuator (0x2F, actuating 0x31 routines, OBD 0x08) is out of scope for a vehicle on the road. It may run only on a bench or closed course behind an independent hardware emergency stop, and only through `uds-routine-control-0x31` entry criteria.
3. Record that braking and emergency-stop paths are never gated, delayed or blocked by any diagnostic software.

### Output
`diag_scope`, `allowed_services`.

### Quality Gate
- `allowed_services` contains every denied service ID listed in Action 1.
- Every row has a mode of read, gated-write or denied.
- No row permits 0x27, 0x29, 0x2E, 0x34 or 0x36.

---

## Worked Example

Illustrative only.

Input: `vehicle_description` = "2018 midsize SUV, 3.6 L V6, US", `ownership_confirmed` = true, `diag_interface` = "socketcan".

- Phase 1: purpose "read stored DTCs and live coolant temperature"; read-only true.
- Phase 2: transport ISO 15765-2 on SocketCAN; 11-bit, 0x7DF functional, 0x7E0/0x7E8 for the engine ECU; bitrate candidate 500000.
- Phase 3: `allowed_services` has 11 rows; 0x27 row reads `{"sid": "0x27", "mode": "denied", "reason": "security access is out of scope"}`.

---

## Exit Criteria

DONE when `diag_scope` records ownership, read-only default, interface and addressing, and `allowed_services` is a default-deny table that the request guard can load.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ownership_confirmed` false or missing | **Stop**: do not continue; this domain only covers vehicles the user owns. |
| Phase 1 | User asks for gateway, immobilizer or emissions bypass | **Stop**: decline that item; it is out of scope for every flow here. |
| Phase 2 | Vehicle predates CAN OBD (pre-2008 US) | **Adjust**: use `elm327`, which also speaks ISO 9141-2, ISO 14230-4 and SAE J1850. |
| Phase 2 | No OEM address list for a non-OBD ECU | **Return**: record the ECU as unknown; do not scan addresses with write services. |
| Phase 3 | User wants an actuator test on the road | **Stop**: actuator tests need a bench or closed course and a hardware emergency stop. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
