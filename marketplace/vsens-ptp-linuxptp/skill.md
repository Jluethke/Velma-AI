# PTP Sensor Time Sync with linuxptp ptp4l and phc2sys

**One-line description:** Synchronizes Ethernet sensors to the host with IEEE 1588 PTP using linuxptp: confirms NIC hardware timestamping with ethtool -T, runs ptp4l as grandmaster or client with the profile the sensor needs, ties the PTP hardware clock to the system clock with phc2sys, and reads offset, servo state and the TAI-UTC offset from the logs and pmc.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `timing_requirements` (object, required): From `vsens-sensor-inventory`; lists PTP sensors and the user's allowed clock offset.
- `ptp_interface` (object, required): Host NIC name, which side is grandmaster (host or an external grandmaster), and each PTP sensor's documented profile: transport (L2 or UDPv4), delay mechanism (E2E or P2P), domain number.

---

## Outputs

- `ptp_sync_report` (object): NIC timestamping capabilities, the ptp4l config file used, port state, offset statistics from the ptp4l or sensor status over the test window, phc2sys offset statistics, the UTC offset in use, and each sensor's reported PTP state.

---

## Phase 1: Check Hardware Timestamping

### Entry Criteria
- `ptp4l -v` and `phc2sys -v` print versions (package `linuxptp`).
- The sensor is on a direct link or a switch whose PTP behavior the user knows (a non-PTP switch adds variable delay).

### Actions
1. Run `ethtool -T <iface>`. Record `PTP Hardware Clock:` index and the capabilities list.
2. Apply:

| `ethtool -T` shows | Mode |
|---|---|
| `hardware-transmit`, `hardware-receive`, `hardware-raw-clock`, and a PHC index | Hardware timestamping (`-H`, the default) |
| Only `software-transmit` and `software-receive` | Software timestamping (`-S`); record that accuracy is limited by host interrupt latency |
| `PTP Hardware Clock: none` and no software modes | **Stop**; use another NIC |

3. Record `ls -l /dev/ptp*` and map the PHC index to `/dev/ptpN`.

### Output
Timestamping mode and PHC device.

### Quality Gate
- The `ethtool -T` output is saved in the report.
- The chosen mode follows the table row that matches it.

---

## Phase 2: Run ptp4l

### Entry Criteria
- Mode chosen.

### Actions
1. Write `/etc/linuxptp/sensors.cfg` starting from the linuxptp default config. Set `domainNumber`, `network_transport` (`L2` or `UDPv4`), and `delay_mechanism` (`E2E` or `P2P`) to the sensor's documented profile. For a gPTP (IEEE 802.1AS) sensor, start from the `gPTP.cfg` file shipped in the linuxptp `configs/` directory instead.
2. Host as grandmaster: set `serverOnly 1` (older linuxptp versions call it `masterOnly 1`; check `man ptp4l`). Host as client of an external grandmaster: set `clientOnly 1` (older: `slaveOnly 1`).
3. Run in the foreground first: `sudo ptp4l -f /etc/linuxptp/sensors.cfg -i <iface> -m`.
4. Read the log. On a client port, lines look like `master offset  -23 s2 freq  +1543 path delay  612`. `s0` is unlocked, `s1` is a clock step, `s2` is locked. On a grandmaster port, look for `assuming the grand master role`.
5. Query state: `sudo pmc -u -b 0 'GET PORT_DATA_SET'` (look at `portState`) and `sudo pmc -u -b 0 'GET TIME_STATUS_NP'` (look at `master_offset` and `gmPresent`).
6. On the sensor, read its PTP status through the interface its manual documents (web API, CLI or diagnostic message). Record the state it reports (for example locked or slave).

### Output
ptp4l running with port state and offsets.

### Quality Gate
- On every client (host or sensor), the state reads locked (`s2` or the sensor's locked state) for the full test window.
- The absolute offset over the window is recorded as median and maximum, and compared to the user's allowed offset, or marked "no limit set".

---

## Phase 3: Tie System Clock and Check UTC Offset

### Entry Criteria
- ptp4l locked.

### Actions
1. PTP runs on the TAI timescale. Read `currentUtcOffset` with `sudo pmc -u -b 0 'GET TIME_PROPERTIES_DATA_SET'`. The value is the published TAI minus UTC difference (IERS Bulletin C).
2. Host as grandmaster with a disciplined system clock (from `vsens-pps-chrony`): run `sudo phc2sys -s CLOCK_REALTIME -c <iface> -O <offset> -m` so the PHC follows system time on TAI, or use `phc2sys -a -rr -m` to let phc2sys read roles from ptp4l. Check `man phc2sys` for the `-O` sign convention.
3. Host as client: run `sudo phc2sys -s <iface> -c CLOCK_REALTIME -w -m`; `-w` waits for ptp4l to lock and reads the UTC offset from it.
4. Read phc2sys lines: `CLOCK_REALTIME phc offset  -4 s2 freq  -110 delay  1400`. Record offset statistics.
5. Compare a sensor timestamp with host `CLOCK_REALTIME` for one message. A difference equal to the UTC offset in seconds means one side is on TAI and the other on UTC. Fix it in configuration, not by subtracting in application code without recording it.
6. Install as services (for example `ptp4l@<iface>.service` and `phc2sys@<iface>.service` units if your distribution ships them) and record the unit files.
7. Emit `ptp_sync_report`.

### Output
`ptp_sync_report`.

### Quality Gate
- phc2sys reports `s2` for the full test window with offset statistics recorded.
- The sensor-vs-host timestamp difference is recorded, and if it equals `currentUtcOffset` seconds the fix applied is named.

---

## Worked Example

Illustrative only. Host `enp3s0` (igb) is grandmaster for a lidar on a direct link, UDPv4, E2E, domain 0.

```
$ ethtool -T enp3s0 | grep -E 'PTP Hardware Clock|hardware-'
PTP Hardware Clock: 0
        hardware-transmit
        hardware-receive
        hardware-raw-clock
$ sudo ptp4l -f /etc/linuxptp/sensors.cfg -i enp3s0 -m
ptp4l[120.331]: port 1 (enp3s0): LISTENING to MASTER on ANNOUNCE_RECEIPT_TIMEOUT_EXPIRES
ptp4l[120.331]: selected local clock 001b21.fffe.a1b2c3 as best master
ptp4l[120.331]: port 1 (enp3s0): assuming the grand master role
$ sudo phc2sys -s CLOCK_REALTIME -c enp3s0 -O 37 -m
phc2sys[130.002]: enp3s0 sys offset   -18 s2 freq  -2121 delay   1544
```
Lidar status reports PTP locked. Sensor stamp minus host time: 0.0004 s, not 37 s, so the timescale is consistent.

---

## Exit Criteria

DONE when every PTP client is locked for the test window, offsets are recorded against the user's limit, and the TAI-UTC handling is verified with a real sensor timestamp.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No hardware timestamping | **Adjust**: use software mode and record it, or **Stop** and change NIC. |
| Phase 2 | Sensor never leaves listening | **Adjust**: transport, delay mechanism or domain differ from the sensor profile; match them. |
| Phase 2 | Offsets jump between s2 and s1 | **Stop**: another clock source steps the clock (chrony or systemd-timesyncd on the same clock); disable the conflict. |
| Phase 3 | 37-second-class mismatch | **Adjust**: fix the `-O` or `-w` usage, then **Retry** the comparison. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
