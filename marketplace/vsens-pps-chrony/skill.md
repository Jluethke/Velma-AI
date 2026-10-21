# Discipline the Host Clock with GNSS PPS and chrony

**One-line description:** Disciplines the host system clock from a GNSS receiver's PPS line using the kernel PPS subsystem and chrony refclocks (PPS locked to an NMEA or SHM time source, or PHC when the host is a PTP client), verifies pulses with ppstest, and reads chronyc sources, sourcestats and tracking to prove the PPS source is selected.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gnss_stream_report` (object, required): From `vsens-gnss-nmea-gpsd`; gives the PPS wiring and NMEA arrival delay.
- `pps_device` (string, required): The PPS device (`/dev/ppsN`) and how it is created (device tree `pps-gpio` overlay, or `ldattach PPS` on a serial DCD line).
- `ptp_sync_report` (object, optional): From `vsens-ptp-linuxptp`; tells whether the host is PTP grandmaster or client so the clock roles do not conflict.

---

## Outputs

- `clock_discipline_report` (object): ppstest capture, the chrony refclock lines in use, `chronyc sources -v` and `chronyc tracking` output over the test window, the measured NMEA offset, the role of chrony versus phc2sys, and the `makestep` setting.

---

## Phase 1: Verify Pulses

### Entry Criteria
- The receiver has a fix (PPS on most receivers is only aligned after a fix; check its manual and the time pulse settings from `vsens-gnss-ubx-config` if used).
- `ppstest` is installed (package `pps-tools`).

### Actions
1. Serial DCD line: create the device with `sudo ldattach PPS /dev/ttyS<N>`; GPIO: confirm the `pps-gpio` overlay with `dmesg | grep pps`.
2. Run `sudo ppstest <pps_device>` for 20 seconds. Each line looks like `source 0 - assert 1792570800.000000412, sequence: 1234 - clear 0.000000000, sequence: 0`.
3. Check: `sequence` increments by 1 every second, and the fractional part of `assert` sits near the same value every line. If the host clock is not yet disciplined, the fraction reflects the host clock error, not pulse error.
4. Confirm polarity: if pulses arrive on `clear` instead of `assert`, the edge is inverted; use the overlay's `assert-falling-edge` property or chrony's `clear` refclock option.

### Output
ppstest log.

### Quality Gate
- 20 consecutive sequence numbers with no gap, saved.
- The edge used (assert or clear) is recorded.

---

## Phase 2: Configure chrony Refclocks

### Entry Criteria
- Pulses verified.

### Actions
1. Choose the configuration from this table:

| Setup | chrony lines |
|---|---|
| gpsd provides NMEA time via shared memory | `refclock SHM 0 refid NMEA noselect` and `refclock PPS <pps_device> lock NMEA refid PPS` |
| gpsd provides time via chrony socket | `refclock SOCK /run/chrony.<ttyname>.sock refid GPS noselect` and the PPS line locked to `GPS` |
| Host is a PTP client (from `ptp_sync_report`) | `refclock PHC /dev/ptpN refid PHC` and do not run `phc2sys -c CLOCK_REALTIME` at the same time |

2. `lock NMEA` pairs each pulse with the second from the NMEA source, so the NMEA source only labels the second and PPS gives the edge.
3. Keep exactly one program setting `CLOCK_REALTIME`. Disable `systemd-timesyncd` (`timedatectl set-ntp false` only if chrony is the chosen daemon and the user agrees) and confirm with `timedatectl show -p NTPSynchronized`.
4. Record the `makestep` line. A step during data recording breaks timestamp monotonicity in wall time; decide with the user whether stepping is allowed after startup.
5. Restart: `sudo systemctl restart chrony`.

### Output
`chrony.conf` refclock lines.

### Quality Gate
- `grep -E '^refclock|^makestep' /etc/chrony/chrony.conf` (path varies by distribution; check `chronyd -v` docs) output is saved.
- Only one of chrony, ntpd, systemd-timesyncd is active: `systemctl is-active chrony systemd-timesyncd ntp` shows one `active`.

---

## Phase 3: Verify Selection and Offset

### Entry Criteria
- chrony restarted.

### Actions
1. Wait until `chronyc sources -v` shows the PPS refclock with `Reach` 377 (octal, last 8 polls all received).
2. Read the state column: `#*` the selected refclock, `#+` combined, `#-` not combined, `#?` unusable, `#x` falseticker. PPS must show `#*`.
3. Run `chronyc sourcestats` and read the NMEA source `Offset`. Put that value in the NMEA refclock `offset` option so the label source is centered; record the value as measured, not invented.
4. Run `chronyc tracking` repeatedly over the test window and record `System time`, `Last offset`, `RMS offset`, `Skew` and `Leap status` (must be `Normal`).
5. If `ptp_sync_report` says the host is grandmaster, confirm phc2sys now copies a disciplined system clock to the PHC.
6. Emit `clock_discipline_report`.

### Output
`clock_discipline_report`.

### Quality Gate
- `chronyc sources` shows `#*` on the PPS line with `Reach 377`, saved.
- `RMS offset` statistics over the window are recorded and compared with the user's allowed offset, or "no limit set".

---

## Worked Example

Illustrative only. Receiver PPS on GPIO, gpsd on USB.

```
$ sudo ppstest /dev/pps0
source 0 - assert 1792570800.000001201, sequence: 4410 - clear  0.000000000, sequence: 0
source 0 - assert 1792570801.000001187, sequence: 4411 - clear  0.000000000, sequence: 0
$ chronyc sources -v
MS Name/IP address         Stratum Poll Reach LastRx Last sample
#? NMEA                          0   4   377    12   +118ms[ +118ms] +/-  200ms
#* PPS                           0   4   377    13    -21ns[  -24ns] +/-  202ns
$ chronyc tracking | grep -E 'System time|RMS offset|Leap'
System time     : 0.000000018 seconds slow of NTP time
RMS offset      : 0.000000071 seconds
Leap status     : Normal
```
NMEA offset measured 0.118 s; added as `offset 0.118` on the NMEA refclock.

---

## Exit Criteria

DONE when pulses are verified, PPS is the selected chrony source with full reach, only one program sets the system clock, and tracking statistics are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ppstest` times out | **Stop**: no pulses; check wiring, voltage level and the receiver time pulse config. |
| Phase 2 | Two clock daemons active | **Adjust**: disable the extra one with the user's approval, then **Retry**. |
| Phase 3 | PPS stays `#?` | **Adjust**: the lock source is missing or more than half a second off; set the NMEA `offset` and restart. |
| Phase 3 | PPS shown as `#x` | **Stop**: the PPS edge or polarity is wrong; return to Phase 1. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
