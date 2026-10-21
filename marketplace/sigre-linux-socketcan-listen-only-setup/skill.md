# Linux SocketCAN Listen-Only Interface Setup

**One-line description:** Brings up a SocketCAN interface with `ip link` in listen-only mode, proves the LISTEN-ONLY flag is set, and finds the bus bitrate by watching receive error counters rather than by trial transmission.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_scope` (object, required): Output of `sigre-scope-owned-vehicle-readonly` with `stack` = linux.
- `can_ifname` (string, optional): SocketCAN interface name. Default is the name the kernel assigns, shown by `ip link show type can`.

---

## Outputs

- `socketcan_interface` (object): Interface name, driver, confirmed bitrate, the exact `ip -details -statistics link show` output proving LISTEN-ONLY, and the error counter readings at the confirmed bitrate.

---

## Phase 1: Identify the Interface and Driver

### Entry Criteria
- `capture_scope.stack` == "linux".
- The adapter is plugged into the laptop but NOT yet connected to the vehicle connector.

### Actions
1. Install can-utils if missing: `sudo apt install can-utils` (Debian or Ubuntu) or your distribution's equivalent.
2. Run `ip link show type can`. Record the interface name (for example `can0`).
3. Run `ethtool -i can0` or `readlink /sys/class/net/can0/device/driver` to record the kernel driver (gs_usb, peak_usb, kvaser_usb).
4. If no CAN interface appears and the adapter is a serial-line (slcan) device, stop and use an adapter with a SocketCAN netdev driver or check `slcand -h` on your system for a listen-only option and record it. Do not assume a flag exists.

### Output
Interface name and driver.

### Quality Gate
- `ip link show type can` lists the interface.
- Driver name is recorded from `ethtool -i` or sysfs.

---

## Phase 2: Set Listen-Only and Prove It

### Entry Criteria
- Interface identified; still not connected to the vehicle.

### Actions
1. Configure with the first candidate bitrate from `capture_scope`:
   ```
   sudo ip link set can0 down
   sudo ip link set can0 type can bitrate 500000 listen-only on
   sudo ip link set can0 up
   ```
2. Run `ip -details -statistics link show can0`. Read the line that starts with `can`. It must contain `<LISTEN-ONLY>` (with other flags possibly listed inside the angle brackets) and `state ERROR-ACTIVE`.
3. If the `ip link set ... listen-only on` command prints `RTNETLINK answers: Operation not supported`, the driver does not support listen-only. Stop.
4. For CAN FD buses recorded in `capture_scope`, add `dbitrate <rate> fd on` only with a data bitrate taken from service information; never guess it.
5. Do not run `cansend`, `cangen`, `canplayer` or `isotpsend` against this interface at any time.

### Output
Listen-only interface proof.

### Quality Gate
- The saved `ip -details` output contains the literal text `LISTEN-ONLY`.
- No transmit tool appears in the shell history for this session: `history | grep -E 'cansend|cangen|canplayer|isotpsend'` shows nothing aimed at `can0`.

---

## Phase 3: Confirm the Bitrate from Error Counters

### Entry Criteria
- LISTEN-ONLY proven.

### Actions
1. Connect the adapter to OBD-II pins 6 and 14 with ignition on, engine off.
2. In one terminal run `candump -e -t a can0,0~0,#FFFFFFFF` (shows data frames and error frames). In a second terminal run `watch -n 1 ip -details -statistics link show can0`.
3. Read the result with this table:

| Observation within the first seconds | Meaning | Next step |
|---|---|---|
| Data frames with IDs scroll, `berr-counter rx` stays at 0, `bus-errors` does not climb | Bitrate correct | Record it |
| No data frames, error frames appear, `rx` error counter climbs | Bitrate wrong | Down, set the next candidate, up, repeat |
| No frames and no errors at every candidate | Bus silent at the connector (often a gateway that only passes diagnostic traffic) | Stop; see Error Handling |

4. Record the final `ip -details -statistics link show can0` output as proof.

### Output
`socketcan_interface`.

### Quality Gate
- The recorded bitrate shows data frames in `candump` and a receive error counter that did not increase during a recorded check window.
- `socketcan_interface` holds the LISTEN-ONLY proof text.

---

## Worked Example

Illustrative only.

```
$ sudo ip link set can0 type can bitrate 500000 listen-only on
$ sudo ip link set can0 up
$ ip -details -statistics link show can0
3: can0: <NOARP,UP,LOWER_UP,ECHO> mtu 16 qdisc pfifo_fast state UP mode DEFAULT group default qlen 10
    link/can  promiscuity 0 minmtu 0 maxmtu 0
    can <LISTEN-ONLY> state ERROR-ACTIVE (berr-counter tx 0 rx 0) restart-ms 0
          bitrate 500000 sample-point 0.875
$ candump -e -t a can0,0~0,#FFFFFFFF
 (1729500100.112345)  can0  1A0   [8]  00 00 3C 00 00 00 00 7E
 (1729500100.113012)  can0  2C4   [8]  0F A0 00 00 00 00 12 34
```

Phase 3 result: 500000 confirmed, rx counter 0.

---

## Exit Criteria

DONE when the interface runs with LISTEN-ONLY shown by `ip -details`, the bitrate is confirmed by clean reception, and no transmit tool was used.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No CAN netdev appears | **Adjust**: check `dmesg | tail` for the driver load message; install the vendor kernel module if documented. |
| Phase 2 | `Operation not supported` on listen-only | **Stop**: the driver cannot enforce listen-only; change adapter. |
| Phase 2 | `Device or resource busy` | **Retry**: run `sudo ip link set can0 down` first, then set type and bring up. |
| Phase 3 | Error frames at every candidate bitrate | **Stop**: check wiring to pins 6/14 and grounds; do not try transmitting to probe the bus. |
| Phase 3 | Bus silent at the connector | **Stop**: the connector only carries diagnostic traffic; this domain does not cover access elsewhere or around a gateway. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
