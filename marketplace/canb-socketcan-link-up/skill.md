# SocketCAN Interface Configuration with ip link

**One-line description:** Configures and brings up a SocketCAN interface with iproute2 (bitrate, CAN FD dbitrate and fd on, restart-ms, listen-only, berr-reporting, txqueuelen) and verifies the running state from `ip -details -statistics link show`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Interface name, for example "can0".
- `bit_timing` (object, required): From `canb-bit-timing-calc`; holds the exact `ip link` bit timing arguments.
- `tx_permission` (string, required): From `canb-tx-scope-check`. "none" forces listen-only.
- `restart_ms` (integer, optional): Automatic bus-off restart delay in milliseconds, chosen by the user or the system specification. 0 or absent means manual restart only.

---

## Outputs

- `link_state` (object): The command lines applied, the controller state (ERROR-ACTIVE, ERROR-WARNING, ERROR-PASSIVE, BUS-OFF, STOPPED), bitrate, sample point, fd flag, listen-only flag, restart-ms, txqueuelen, and the full `ip -details -statistics` text.

---

## Phase 1: Build the Command

### Entry Criteria
- `can_netdev` exists (`ip link show <can_netdev>` exits 0).
- `bit_timing` and `tx_permission` present.

### Actions
1. Start from the bit timing arguments in `bit_timing`, for example `bitrate 500000 sample-point 0.875`.
2. If `bit_timing` has a data phase, append `dbitrate <d> dsample-point <dsp> fd on`.
3. If `tx_permission` is "none", append `listen-only on`. This is mandatory for any vehicle network in this domain.
4. Append `berr-reporting on` so bus errors reach user space as error frames (some drivers do not support it; the command then fails and you remove it, recording that).
5. If `restart_ms` is a positive integer, append `restart-ms <restart_ms>`. If it is absent, append nothing; the kernel default is manual restart.
6. Do NOT add `loopback on` or `one-shot on` unless the user asked for them: `loopback on` makes the controller receive its own frames internally, and `one-shot on` disables automatic retransmission. Both change bus behavior.
7. For slcan devices (see `adapter_report`), skip the bit timing arguments: slcan sets them through `slcand -s<N>`.

### Output
Exact command line.

### Quality Gate
- If `tx_permission` is "none", the command contains `listen-only on`.
- Every argument appears in `ip link help can` output on this host (run it and check).

---

## Phase 2: Apply and Bring Up

### Entry Criteria
- Command built.

### Actions
1. `sudo ip link set <can_netdev> down` (bit timing can only change while down).
2. `sudo ip link set <can_netdev> type can <arguments>`.
3. Optional, for bursty senders: `sudo ip link set <can_netdev> txqueuelen <n>`. The CAN default is small; raise it only if `ip -s link` later shows TX dropped and record the value chosen and why.
4. `sudo ip link set <can_netdev> up`.
5. If any step prints `RTNETLINK answers: Operation not supported`, remove the last added option, record it as unsupported in `link_state`, and repeat from step 1.

### Output
Interface up.

### Quality Gate
- `ip -brief link show <can_netdev>` shows `UP` (or `UNKNOWN` for some USB drivers; record which).

---

## Phase 3: Verify the Running State

### Entry Criteria
- Interface up.

### Actions
1. Run `ip -details -statistics link show <can_netdev>`.
2. Read these fields and copy them into `link_state`:
   - `state ERROR-ACTIVE` (healthy), `ERROR-WARNING`, `ERROR-PASSIVE`, `BUS-OFF`, or `STOPPED`;
   - `(berr-counter tx N rx M)` when the driver reports counters;
   - `restart-ms`;
   - `bitrate`, `sample-point`, and for FD `dbitrate`, `dsample-point`;
   - the flags shown in angle brackets, for example `<LISTEN-ONLY,BERR-REPORTING,FD>`;
   - the counters line `re-started bus-errors arbit-lost error-warn error-pass bus-off`.
3. Decision table:

| state | Next action |
|---|---|
| ERROR-ACTIVE | Continue to capture flows. |
| ERROR-WARNING or ERROR-PASSIVE | Run `canb-error-frame-diagnosis` before anything else. |
| BUS-OFF | Run `canb-busoff-recovery`. |
| STOPPED | Interface is down; repeat Phase 2. |

### Output
`link_state`.

### Quality Gate
- `link_state.bitrate` equals the bit rate in `bit_timing`.
- When `tx_permission` is "none", the flags field contains `LISTEN-ONLY`.

---

## Worked Example

Illustrative. Input: `can_netdev`="can0", bit timing for 500 kbit/s at 0.875, `tx_permission`="none", `restart_ms`=100 (user choice).

- Phase 1: `ip link set can0 type can bitrate 500000 sample-point 0.875 listen-only on berr-reporting on restart-ms 100`.
- Phase 2: down, set, up; no errors.
- Phase 3: output includes
  `can <LISTEN-ONLY,BERR-REPORTING> state ERROR-ACTIVE (berr-counter tx 0 rx 0) restart-ms 100`
  `bitrate 500000 sample-point 0.875`. State ERROR-ACTIVE: continue.

---

## Exit Criteria

DONE when the interface is up, its printed bit timing matches `bit_timing`, listen-only is set whenever transmission is not permitted, and `link_state` records the controller state.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ip link help can` lacks an option | **Adjust**: drop the option, record "unsupported by this iproute2". |
| Phase 2 | `Device or resource busy` | **Retry**: set the interface down first. |
| Phase 2 | `Operation not supported` for listen-only on a vehicle bus | **Stop**: without listen-only the adapter would ACK and could send error frames on the vehicle; use an adapter that supports it. |
| Phase 3 | State BUS-OFF right after up | **Return**: bit rate or termination is wrong; run `canb-termination-check` and recheck `bitrate`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
