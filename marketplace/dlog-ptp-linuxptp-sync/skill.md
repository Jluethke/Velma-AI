# PTP Time Sync with linuxptp

**One-line description:** Configures IEEE 1588 Precision Time Protocol on the logging computer with linuxptp (`ptp4l` for the NIC hardware clock, `phc2sys` to copy it to the system clock), verifies hardware timestamping with `ethtool -T`, and reads servo state and offsets from the tools' own output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `clock_domain_map` (object[], required): From `dlog-clock-domain-map`; shows which sensors are PTP clients or grandmasters.
- `network_interface` (string, required): NIC that faces the sensor network, for example `eth1`.

---

## Outputs

- `ptp_sync_report` (object): Hardware timestamping capability, ptp4l role and config, servo state, offset statistics from ptp4l and phc2sys over the observation window, and the master clock identity.

---

## Phase 1: Check Hardware Support

### Entry Criteria
- linuxptp is installed (`ptp4l -v` prints a version).
- The user knows which device is the grandmaster (a GNSS-disciplined PTP master, a sensor, or this computer).

### Actions
1. `ethtool -T <network_interface>`. Look for `hardware-transmit`, `hardware-receive`, `hardware-raw-clock` and a `PTP Hardware Clock: N` line. N is the `/dev/ptpN` index.
2. If those are missing, only software timestamping is possible (`ptp4l -S`); record that, since accuracy is then limited by kernel scheduling.
3. Check the sensors' PTP profile in their manuals: delay mechanism (E2E or P2P), transport (UDPv4 or Layer 2), domain number. gPTP (IEEE 802.1AS) devices need the `gPTP.cfg` style settings shipped in linuxptp's `configs/` directory.

### Output
Capability record.

### Quality Gate
- The capability record quotes the `ethtool -T` output lines.

---

## Phase 2: Run ptp4l and phc2sys

### Entry Criteria
- Capability recorded; profile parameters known.

### Actions
1. Write `/etc/linuxptp/ptp4l.conf` (path varies by distro; check the service unit) starting from linuxptp's `configs/default.cfg`. Set only what the sensors require: `domainNumber`, `delay_mechanism`, `network_transport`. If this computer must never become master, set `clientOnly 1` (older versions name it `slaveOnly 1`; check `man ptp4l`).
2. Start in the foreground first: `sudo ptp4l -i <network_interface> -f /etc/linuxptp/ptp4l.conf -m`.
3. Read each line `master offset <ns> s<state> freq <ppb> path delay <ns>`. `s0` unlocked, `s1` clock step, `s2` locked. Wait until `s2` stays.
4. Copy PHC to system clock: `sudo phc2sys -s <network_interface> -c CLOCK_REALTIME -w -m`. Read `CLOCK_REALTIME phc offset <ns> s2 freq ...`. `-w` waits for ptp4l to be synced. If this computer is the grandmaster instead, reverse direction per `man phc2sys`.
5. Query state: `sudo pmc -u -b 0 'GET CURRENT_DATA_SET'` and read `offsetFromMaster` and `meanPathDelay`; `sudo pmc -u -b 0 'GET PARENT_DATA_SET'` for `grandmasterIdentity`.
6. Do NOT also run NTP or chrony stepping CLOCK_REALTIME at the same time; two disciplines fight. Disable the other service or configure chrony to use the PHC as a refclock (`refclock PHC /dev/ptpN`).

### Output
Running ptp4l and phc2sys with logged offsets.

### Quality Gate
- ptp4l output shows `s2` continuously for the whole observation window.
- `pmc` returns a `grandmasterIdentity` that matches the intended master.

---

## Phase 3: Measure and Report

### Entry Criteria
- Both daemons locked.

### Actions
1. Capture the observation window: `sudo ptp4l ... -m 2>&1 | tee ptp4l.log` and same for phc2sys.
2. Compute max absolute offset and standard deviation from the `master offset` and `phc offset` columns, for example with `awk`.
3. Compare to the tolerance the user sets for sensor sync. This flow does not supply a tolerance.
4. Enable the services (`systemctl enable --now ptp4l@<iface>` or the distro's unit names) only after the foreground run passes.

### Output
`ptp_sync_report`.

### Quality Gate
- The report gives offset max and standard deviation computed from the saved logs, with the line count used.

---

## Worked Example

Illustrative.
```
$ ethtool -T eth1 | grep -E "hardware|PTP"
        hardware-transmit
        hardware-receive
        hardware-raw-clock
PTP Hardware Clock: 0
$ sudo ptp4l -i eth1 -f ptp4l.conf -m
ptp4l[512.3]: master offset        -12 s2 freq  +3021 path delay    410
$ sudo phc2sys -s eth1 -c CLOCK_REALTIME -w -m
phc2sys[513.1]: CLOCK_REALTIME phc offset   8 s2 freq  -1203 delay  512
```
Report: 600 lines, ptp4l |offset| max 41 ns, std 11 ns; phc2sys |offset| max 63 ns.

---

## Exit Criteria

DONE when ptp4l and phc2sys hold `s2` through the window and offsets are reported from logs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No hardware timestamping | **Adjust**: use `ptp4l -S` and report reduced accuracy, or move sensors to a NIC with a PHC. |
| Phase 2 | Stuck in `s0` or no `master offset` lines | **Retry**: check domain number, transport and that the switch passes PTP multicast; `tcpdump -i <iface> udp port 319 or udp port 320` or `ether proto 0x88f7` shows PTP traffic. |
| Phase 2 | Offsets jump periodically | **Stop**: another service is stepping the clock; disable it. |
| Phase 3 | Offsets exceed the user tolerance | **Return**: report the numbers; do not widen the tolerance. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
