# GNSS PPS Time with gpsd and chrony

**One-line description:** Disciplines the logging computer clock to GNSS time using a PPS pulse and gpsd time messages as chrony refclocks, verifies the PPS edge with `ppstest`, and reads sync quality from `chronyc sources` and `chronyc tracking`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `clock_domain_map` (object[], required): From `dlog-clock-domain-map`.
- `gnss_device` (object, optional): Serial device of the receiver (for example `/dev/ttyACM0`) and PPS device (for example `/dev/pps0`). If absent, discovered in Phase 1.

---

## Outputs

- `gnss_time_report` (object): PPS device, chrony refclock lines used, `chronyc sources` and `chronyc tracking` output, system time offset statistics and the time a fix was held.

---

## Phase 1: Verify NMEA and PPS

### Entry Criteria
- The receiver has a sky view and a fix.
- The PPS line is wired to a GPIO with the `pps-gpio` overlay, or the receiver exposes PPS on DCD of a serial port (`ldattach PPS /dev/ttyS0`).

### Actions
1. `ls /dev/pps*` and record the device.
2. `sudo ppstest /dev/pps0` (from pps-tools) and confirm one `assert` line per second with a sequence number that increments by one.
3. Start gpsd: `sudo gpsd -n -N -D 2 /dev/ttyACM0 /dev/pps0` in the foreground, and in another terminal `cgps` or `gpsmon` to confirm a 3D fix. `-n` makes gpsd poll the device without a client, which chrony needs.
4. Do NOT continue without a fix; PPS without time messages gives only the second edge, not which second.

### Output
Confirmed PPS and NMEA devices.

### Quality Gate
- `ppstest` printed consecutive sequence numbers for the observation period.
- `cgps` shows a 3D fix.

---

## Phase 2: Configure chrony

### Entry Criteria
- PPS and fix confirmed.

### Actions
1. Edit `/etc/chrony/chrony.conf` (or `/etc/chrony.conf`) and add:
   ```
   refclock SHM 0 refid NMEA noselect
   refclock PPS /dev/pps0 lock NMEA refid PPS
   ```
   `lock NMEA` ties each PPS edge to the second named by the NMEA source. Marking NMEA `noselect` avoids using its large serial delay as the time source. The `offset` and `delay` options on the SHM line are calibration values for your receiver; measure them against PPS rather than copying numbers from another setup.
2. If PTP from `dlog-ptp-linuxptp-sync` also runs, decide which one disciplines CLOCK_REALTIME. Only one may.
3. `sudo systemctl restart chrony`.

### Output
chrony running with refclocks.

### Quality Gate
- `chronyc sources -v` lists `#* PPS` (the asterisk marks the selected source) after it settles.

---

## Phase 3: Measure

### Entry Criteria
- PPS selected.

### Actions
1. `chronyc tracking` and record `System time`, `RMS offset`, `Frequency`, `Leap status`.
2. `chronyc sourcestats` and record `Offset` and `Std Dev` for PPS.
3. Enable chrony logging (`log tracking measurements statistics` with `logdir /var/log/chrony`) and compute offset max and spread over the observation window from `tracking.log`.
4. Record the GPS to UTC handling: gpsd reports UTC to chrony; confirm `Leap status : Normal`.

### Output
`gnss_time_report`.

### Quality Gate
- `gnss_time_report` quotes `chronyc tracking` and gives statistics computed from `tracking.log` with the row count used.

---

## Worked Example

Illustrative.
```
$ sudo ppstest /dev/pps0
source 0 - assert 1792512000.000000412, sequence: 4410 - clear 0.000000000, sequence: 0
source 0 - assert 1792512001.000000398, sequence: 4411 - clear 0.000000000, sequence: 0
$ chronyc sources -v
#? NMEA   0   4   377    15   +112ms[ +112ms] +/- 200ms
#* PPS    0   4   377    14   -201ns[ -244ns] +/-  310ns
$ chronyc tracking | grep -E "System time|RMS offset|Leap"
System time     : 0.000000187 seconds fast of NTP time
RMS offset      : 0.000000402 seconds
Leap status     : Normal
```

---

## Exit Criteria

DONE when chrony selects the PPS source and offsets are reported from chrony's own logs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ppstest` times out | **Stop**: check wiring, the device tree overlay and `dmesg | grep pps`. |
| Phase 2 | PPS stays `#?` or `#x` | **Adjust**: confirm the NMEA source is reachable (`#?` with reach 377) and that `lock` names its refid. |
| Phase 3 | `Leap status : Not synchronised` | **Retry**: wait for selection; if it persists, return to Phase 2. |
| Phase 3 | GNSS outage during a drive | **Return**: report holdover duration from `tracking.log`; mark affected drives in their manifest. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
