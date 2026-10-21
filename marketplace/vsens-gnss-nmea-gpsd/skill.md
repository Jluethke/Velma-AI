# GNSS NMEA Stream Check with gpsd

**One-line description:** Reads a GNSS receiver's NMEA 0183 output through gpsd, gpspipe and gpsmon, validates checksums with pynmea2, and decodes GGA fix quality, RMC status, GSA dilution and GST error fields so later flows know exactly what fix the receiver reports and when.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_inventory` (object[], required): From `vsens-sensor-inventory`; the GNSS row.
- `gnss_device` (string, required): Stable serial path `/dev/serial/by-id/...` and the configured baud rate from the receiver configuration.

---

## Outputs

- `gnss_stream_report` (object): Sentence types and talker ids seen with rates, checksum failure count, GGA fix quality distribution, satellites used, HDOP, GST error estimates if present, the time of fix vs host arrival time per epoch, and whether a PPS line exists for `vsens-pps-chrony`.

---

## Phase 1: Raw Stream

### Entry Criteria
- The antenna has open sky view; record the location type (open field, urban, indoors).
- No other program holds the port: `fuser -v <gnss_device>` prints nothing, or only gpsd.

### Actions
1. Start gpsd in the foreground for inspection: `sudo gpsd -N -D 3 -n <gnss_device>` in one terminal. `-N` keeps it in the foreground, `-n` polls without waiting for a client, `-D` sets debug level.
2. In a second terminal, capture raw sentences: `gpspipe -r -n 200 > nmea.txt`.
3. Count sentence types: `cut -d, -f1 nmea.txt | sort | uniq -c`. The two letters after `$` are the talker (GP GPS, GL GLONASS, GA Galileo, GB or BD BeiDou, GN multi-constellation).
4. Validate checksums: in Python, `pynmea2.parse(line.strip(), check=True)` for each line; count `pynmea2.ChecksumError` exceptions. The checksum is the XOR of all characters between `$` and `*` per NMEA 0183.

### Output
Sentence table and checksum failure count.

### Quality Gate
- `uniq -c` output is recorded.
- Checksum failures are counted and are zero; any nonzero count is investigated in Error Handling.

---

## Phase 2: Decode Fix Fields

### Entry Criteria
- Checksums pass.

### Actions
1. GGA field 6 is fix quality. Decode with this table from NMEA 0183:

| GGA quality | Meaning |
|---|---|
| 0 | Invalid, no fix |
| 1 | GNSS fix (SPS) |
| 2 | Differential (DGPS or SBAS) |
| 4 | RTK fixed integer |
| 5 | RTK float |
| 6 | Estimated (dead reckoning) |

2. Record GGA field 7 (satellites used) and field 8 (HDOP).
3. RMC field 2 is status: `A` valid, `V` void. Treat any epoch with `V` as no fix even if GGA shows a position.
4. GSA field 2 is fix type: 1 none, 2 2D, 3 3D. Record PDOP, HDOP, VDOP.
5. If GST is present, record fields for latitude, longitude and altitude error standard deviation in meters. If GST is absent, record "receiver does not report error estimates in NMEA" and do not derive accuracy from HDOP alone.
6. Use `gpsmon` or `cgps -s` to cross-check the decoded fix mode against gpsd's view.

### Output
Per-epoch fix table.

### Quality Gate
- The distribution of GGA quality values over the capture is recorded as counts.
- Every epoch has RMC status recorded alongside GGA quality.

---

## Phase 3: Timing of the Stream

### Entry Criteria
- Fix table exists.

### Actions
1. Log host receive time with each sentence: `gpspipe -r -u` prefixes each line with the host time in seconds (check `gpspipe -h` for the timestamp options in your version).
2. For each epoch, compute host arrival time minus the UTC time of fix in GGA field 1 (convert the date from RMC). Account for the UTC to host clock difference only if the host is already synced; otherwise record "host unsynced".
3. Record the spread of this delay. NMEA sentence arrival is late and variable by design, so NMEA time alone is not a precision time source; that is why a PPS line is needed.
4. Check the receiver manual for a PPS (time pulse) output and whether it is wired to the host (a `/dev/ppsN` or a GPIO). Record it.
5. Emit `gnss_stream_report`.

### Output
`gnss_stream_report`.

### Quality Gate
- Median and maximum NMEA arrival delay are recorded with the host sync state.
- The report states yes or no for a wired PPS line with its device path.

---

## Worked Example

Illustrative only. Multi-band receiver in an open field.

```
$ gpspipe -r -n 200 > nmea.txt; cut -d, -f1 nmea.txt | sort | uniq -c
     40 $GNGGA
     40 $GNRMC
     80 $GNGSA
     40 $GNGST
$GNGGA,101530.00,4740.12345,N,12218.54321,W,1,18,0.62,45.3,M,-18.9,M,,*62
```
Quality 1 (GNSS fix), 18 satellites, HDOP 0.62. GST latitude sigma 0.9 m. NMEA arrival delay median 0.11 s, max 0.19 s (host synced by chrony to a network source). PPS wired to `/dev/pps0`: yes.

---

## Exit Criteria

DONE when sentence types, checksum status, fix quality distribution, and NMEA arrival delay are recorded, and the PPS wiring is known.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No output or binary garbage | **Adjust**: wrong baud, or the port outputs UBX only; check with `gpsmon` and the receiver config. |
| Phase 1 | Checksum errors | **Adjust**: baud too low for the configured sentence load or a noisy cable; reduce sentences or raise baud. |
| Phase 2 | Quality stays 0 | **Stop**: check antenna, cable and sky view before any configuration change. |
| Phase 3 | No PPS line | **Return**: record "host receive time only" for GNSS timing in `timing_requirements`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
