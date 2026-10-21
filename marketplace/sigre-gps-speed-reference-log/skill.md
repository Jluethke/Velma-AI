# GPS Speed Reference Log

**One-line description:** Logs GPS ground speed with host-clock timestamps during driving segments (gpsd and gpspipe on Linux, or NMEA RMC read from a serial port elsewhere), converts it to SI units, and records its update rate and fix quality so it can serve as ground truth for a speed signal.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_scope` (object, required): Output of `sigre-scope-owned-vehicle-readonly`.
- `capture_plan` (object, required): Output of `sigre-capture-plan-labeled-actions` with `reference_source` = gps.

---

## Outputs

- `gps_reference` (object): Path to `gps_ref.tsv` with columns `host_epoch<TAB>speed_mps<TAB>mode`, the receiver update interval measured from the data, the fix-mode share, and the logging method used.

---

## Phase 1: Receiver Check

### Entry Criteria
- `capture_plan.reference_source` == "gps".
- A USB GPS receiver is plugged into the same laptop that logs CAN.

### Actions
1. Linux: install gpsd and clients (`sudo apt install gpsd gpsd-clients`), start it on the device: `sudo gpsd -n /dev/ttyACM0` (use the device path `dmesg` reported). Run `cgps -s` and wait until the status shows a 3D fix.
2. Windows or macOS without gpsd: find the serial port (Device Manager COM port, or `/dev/tty.usbmodem*`), install `pip install pyserial`, and read lines: `python -m serial.tools.miniterm COM6 9600` (baud from the receiver's manual). Lines starting with `$GPRMC` or `$GNRMC` must appear.
3. Place the receiver with a clear sky view (windshield or roof); record placement.

### Output
Working receiver with a fix.

### Quality Gate
- `cgps` shows a 3D fix, or RMC sentences show status field `A` (valid).
- The receiver runs on the CAN logging host.

---

## Phase 2: Log with Host Timestamps

### Entry Criteria
- Fix present; CAN capture for the driving group is running.

### Actions
1. Linux:
   ```
   gpspipe -w | python3 -u -c "import sys,time;[print('%.6f\t%s'%(time.time(),l.strip()),flush=True) for l in sys.stdin]" > gps_host.tsv
   ```
   Each line has the host epoch, then a gpsd JSON object. TPV objects carry `speed` in meters per second and `mode` (2 = 2D, 3 = 3D).
2. Non-Linux: save as `~/canre/rmc.py` and run `python ~/canre/rmc.py COM6 9600 > gps_host.tsv`:
   ```
   import sys, time, serial
   s = serial.Serial(sys.argv[1], int(sys.argv[2]), timeout=1)
   while True:
       l = s.readline().decode("ascii", "replace").strip()
       if l: print("%.6f\t%s" % (time.time(), l), flush=True)
   ```
3. The passenger starts the GPS logger before the drive and stops it after the CAN logger stops. The driver does not touch the laptop.

### Output
`gps_host.tsv` raw.

### Quality Gate
- `gps_host.tsv` first and last host times cover the driving segments in `segments.tsv`.
- Line count is greater than zero and rising during the drive (check with `wc -l` after).

---

## Phase 3: Extract Speed

### Entry Criteria
- Raw GPS log closed.

### Actions
1. From gpsd JSON: keep lines whose object has `"class":"TPV"` and a `speed` key; write `host_epoch`, `speed`, `mode`.
2. From NMEA RMC: field 7 (counting the sentence name as field 0) is speed over ground in knots per NMEA 0183. Convert with 1 knot = 1852/3600 m/s (exact by the international nautical mile definition). Field 2 is status; keep only `A`.
3. Measure the update interval as the median difference of `host_epoch` between kept rows; do not assume a rate.
4. Note that GPS speed is horizontal ground speed and has receiver latency; the alignment flow measures the lag rather than assuming one.
5. Emit `gps_reference`.

### Output
`gps_reference`.

### Quality Gate
- `gps_ref.tsv` has only rows with a valid fix (`mode` 2 or 3, or RMC status `A`).
- Update interval is a measured number with the command that produced it.

---

## Worked Example

Illustrative only.

```
$ head -2 gps_host.tsv
1729507001.512330	{"class":"TPV","device":"/dev/ttyACM0","mode":3,"time":"2026-10-21T11:43:21.000Z","speed":13.412,...}
1729507002.511904	{"class":"TPV","device":"/dev/ttyACM0","mode":3,"time":"2026-10-21T11:43:22.000Z","speed":13.807,...}
```

`gps_ref.tsv`: 1729507001.512330 13.412 3. Measured interval 1.000 s; 100 percent 3D fix in the drive window.

---

## Exit Criteria

DONE when a host-timestamped, valid-fix GPS speed series in meters per second covers every driving segment, with its measured update interval.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No fix after waiting | **Adjust**: move the receiver to a sky view; wait longer; do not start the drive without a fix. |
| Phase 1 | No RMC sentences | **Adjust**: check baud and receiver configuration in its manual. |
| Phase 2 | GPS logged on a different host | **Stop**: the clock basis differs; relog on the CAN host. |
| Phase 3 | Long fix dropouts (tunnels) | **Adjust**: keep valid rows only; the alignment flow interpolates only inside valid stretches. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
