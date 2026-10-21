# SocketCAN Link Setup for OBD-II

**One-line description:** Brings up a Linux SocketCAN interface on the vehicle's OBD-II CAN pins with `ip link`, confirms the bitrate passively in listen-only mode first, and reads the controller state and error counters before any diagnostic request is sent.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `diag_scope` (object, required): From `uds-diag-scope-readonly`. Must have `read_only` true and `interface` "socketcan".
- `can_interface` (string, required): Kernel interface name, for example `can0` (gs_usb, PEAK, Kvaser) or `slcan0` (serial line CAN).
- `can_bitrate` (integer, required): Candidate bitrate in bit/s. ISO 15765-4 allows 500000 or 250000.

---

## Outputs

- `can_link_status` (object): Interface name, confirmed bitrate, controller state (ERROR-ACTIVE expected), error counters, the command lines used, and whether traffic was seen in listen-only mode.

---

## Phase 1: Check Kernel Support and Hardware

### Entry Criteria
- `diag_scope.read_only` is true and `diag_scope.interface` is "socketcan".
- The adapter is plugged into the OBD-II connector: pin 6 CAN-High, pin 14 CAN-Low, pin 4/5 ground (SAE J1962).

### Actions
1. Run `ip link show type can`. The interface named in `can_interface` must appear. If it does not, run `dmesg | tail -n 30` and look for the driver line (for example `gs_usb` or `peak_usb`).
2. For a serial-line adapter, attach it first: `sudo slcand -o -c -s6 /dev/ttyACM0 slcan0` (`-s6` selects 500 kbit/s, `-s5` selects 250 kbit/s in the slcan speed table; confirm with `slcand -h`).
3. Install can-utils if missing: `sudo apt install can-utils`. Confirm with `candump -h`.
4. Do NOT run `cansend` yet. Nothing is transmitted in this phase.

### Output
Interface present and can-utils installed.

### Quality Gate
- `ip link show type can` lists `can_interface`.
- `candump -h` exits and prints usage.

---

## Phase 2: Confirm Bitrate in Listen-Only Mode

### Entry Criteria
- Phase 1 passed. Ignition on (engine off is fine) so ECUs are awake.

### Actions
1. `sudo ip link set <can_interface> down`
2. `sudo ip link set <can_interface> type can bitrate <can_bitrate> listen-only on`
3. `sudo ip link set <can_interface> up`
4. `timeout 5 candump -n 50 <can_interface>` and count received frames.
5. Run `ip -details -statistics link show <can_interface>` and read the `state` field and the `berr-counter tx N rx N` values.
6. Decision table:

| Frames seen | state | Meaning | Next |
|---|---|---|---|
| > 0 | ERROR-ACTIVE | Bitrate matches | Phase 3 |
| 0 | ERROR-ACTIVE or ERROR-PASSIVE, rx counter rising | Wrong bitrate | Retry with the other ISO 15765-4 bitrate |
| 0 | ERROR-ACTIVE, counters 0 | Bus quiet (gateway filters OBD port) | Phase 3; the port answers requests only |
| any | BUS-OFF | Wiring or bitrate fault | Stop and recheck pins |

7. Listen-only mode never transmits, so it cannot disturb the bus while you search for the bitrate. Do not probe bitrates in normal mode.

### Output
Confirmed bitrate.

### Quality Gate
- `ip -details link show` prints the confirmed bitrate and `LISTEN-ONLY`.
- `state` is ERROR-ACTIVE.

---

## Phase 3: Switch to Normal Mode for Requests

### Entry Criteria
- Bitrate confirmed in Phase 2.

### Actions
1. `sudo ip link set <can_interface> down`
2. `sudo ip link set <can_interface> type can bitrate <bitrate> listen-only off restart-ms 100` (`restart-ms` lets the controller recover from bus-off automatically; read its meaning in `ip link help can`).
3. `sudo ip link set <can_interface> up`
4. Recheck `ip -details -statistics link show <can_interface>`; state must be ERROR-ACTIVE and counters near zero.
5. Write `can_link_status` with every command line used.

### Output
`can_link_status`.

### Quality Gate
- `can_link_status.state` == "ERROR-ACTIVE" read from the command output, not assumed.
- `can_link_status.commands` lists the exact `ip link` lines.

---

## Worked Example

Illustrative only.

```
$ sudo ip link set can0 type can bitrate 500000 listen-only on
$ sudo ip link set can0 up
$ timeout 5 candump -n 50 can0
  can0  0C9   [8]  84 0D 2A 00 00 00 00 00
  can0  3E9   [8]  00 00 00 00 00 00 00 00
$ ip -details -statistics link show can0
    can <LISTEN-ONLY> state ERROR-ACTIVE (berr-counter tx 0 rx 0) restart-ms 0
          bitrate 500000 sample-point 0.875
```

Phase 2 sees frames, state ERROR-ACTIVE: bitrate 500000 confirmed. Phase 3 brings can0 up in normal mode.

---

## Exit Criteria

DONE when the interface is up in normal mode at a bitrate confirmed by passive listening, with state ERROR-ACTIVE.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Interface missing | **Stop**: check `dmesg` for the driver; install the adapter's driver before continuing. |
| Phase 2 | No frames at either bitrate and counters rising | **Stop**: check pins 6 and 14 and ground; do not try other bitrates in normal mode. |
| Phase 2 | `RTNETLINK answers: Operation not supported` on listen-only | **Adjust**: the driver lacks listen-only; check with `ip -details link show` for ctrlmode support and use the vehicle's documented bitrate. |
| Phase 3 | State goes BUS-OFF after switching to normal | **Stop**: bring the link down; the bitrate or sample point is wrong. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
