# RTK Corrections via NTRIP to a GNSS Receiver

**One-line description:** Feeds RTCM 3 corrections from an NTRIP caster into a GNSS receiver with RTKLIB str2str or gpsd's ntrip source, checks the mountpoint sourcetable and the RTCM message mix with pyrtcm, and tracks the receiver from float to fixed with NAV-PVT carrSoln and GGA quality.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ubx_config` (object, required): From `vsens-gnss-ubx-config`; the receiver is configured and reports NAV-PVT.
- `ntrip_caster` (object, required): Caster host, port, mountpoint, username and password (stored in a file readable only by the user, never in the report), and the NTRIP version the caster supports.

---

## Outputs

- `rtk_status_report` (object): Mountpoint sourcetable entry, RTCM message types and rates received, base station position from message 1005 or 1006, baseline distance, time from corrections start to float and to fixed, the share of epochs fixed, float and none over the test, and the transport used.

---

## Phase 1: Check the Mountpoint

### Entry Criteria
- The receiver has a standalone 3D fix (`fixType` 3) with open sky.
- Credentials are in a file with mode 600; check with `stat -c %a <file>`.

### Actions
1. Fetch the sourcetable: `curl -s -H "Ntrip-Version: Ntrip/2.0" -H "User-Agent: NTRIP curl" http://<host>:<port>/ | grep '^STR;<mountpoint>;'`.
2. Read the STR fields per the NTRIP specification (RTCM 10410): format (for example `RTCM 3.2`), format details (message types and rates), carrier, navigation systems, latitude, longitude, and the NMEA field: `1` means the caster requires a GGA position from the client (typical for virtual reference station mountpoints).
3. Confirm the navigation systems listed cover the constellations your receiver tracks.
4. Compute the distance from your position to the STR latitude and longitude. Record it. The allowed baseline is an open question for the user and the caster operator; do not invent a limit.

### Output
Mountpoint entry and baseline estimate.

### Quality Gate
- The `STR;<mountpoint>;` line is saved.
- The NMEA-required flag value is recorded.

---

## Phase 2: Stream Corrections

### Entry Criteria
- Mountpoint confirmed.

### Actions
1. Enable RTCM 3 input on the receiver port: read `ubxtool -g CFG-USBINPROT-RTCM3X` (or `CFG-UART1INPROT-RTCM3X`); set to 1 with `ubxtool -z` if 0.
2. Choose the transport:

| Situation | Transport |
|---|---|
| gpsd owns the serial port | Run gpsd with both sources: `gpsd -n ntrip://<user>:<pass>@<host>:<port>/<mount> <gnss_device>`; gpsd forwards RTCM to the device |
| No gpsd, port free | `str2str -in ntrip://<user>:<pass>@<host>:<port>/<mount> -out serial://<ttyname>:<baud>` |
| Mountpoint requires GGA | Use str2str with its NMEA position options (`-p lat lon hgt` and the request cycle option; confirm names with `str2str -h`) or a client that forwards live GGA |

3. Do NOT run str2str and gpsd on the same serial port at the same time; two writers corrupt the stream.
4. Tee corrections to a file for inspection: add a second `-out file://rtcm.bin` to str2str, or capture with a separate client.
5. Count RTCM messages: in Python, `from pyrtcm import RTCMReader`; iterate `RTCMReader(open('rtcm.bin','rb'))` and count `msg.identity`. Expect station message 1005 or 1006 and MSM messages (for example 1074 or 1077 GPS, 1084 or 1087 GLONASS, 1094 or 1097 Galileo, 1124 or 1127 BeiDou) per the STR format details.

### Output
Corrections flowing, message counts.

### Quality Gate
- str2str or gpsd log shows a connected state and a nonzero byte count growing over 60 seconds.
- The pyrtcm count lists 1005 or 1006 and at least one MSM type for each constellation the receiver uses.

---

## Phase 3: Track Float to Fixed

### Entry Criteria
- Corrections flowing.

### Actions
1. Log NAV-PVT every epoch for a test duration the user chooses. Record `carrSoln` (0 none, 1 float, 2 fixed), `hAcc`, `numSV`, and `flags` diffSoln bit.
2. Log GGA quality alongside: 5 RTK float, 4 RTK fixed per NMEA 0183.
3. Compute time from corrections start to first float and to first fixed. Compute the share of epochs in each state.
4. Read base position from 1005 or 1006 (`DF025`, `DF026`, `DF027` ECEF coordinates) and recompute the baseline with the rover position.
5. Emit `rtk_status_report`. Remove credentials from every logged command line before saving.

### Output
`rtk_status_report`.

### Quality Gate
- Fixed, float and none epoch counts are reported and sum to the total epoch count.
- `grep -c '<password>' rtk_status_report*` returns 0.

---

## Worked Example

Illustrative only.

```
$ curl -s -H "Ntrip-Version: Ntrip/2.0" http://caster.example:2101/ | grep '^STR;RTCM3_NEAR;'
STR;RTCM3_NEAR;City;RTCM 3.2;1005(10),1074(1),1084(1),1094(1),1124(1),1230(10);2;GPS+GLO+GAL+BDS;...;0;...
$ str2str -in ntrip://user:***@caster.example:2101/RTCM3_NEAR -out serial://ttyACM0:115200 -out file://rtcm.bin
2026/10/21 10:20:05 [CC---]  19234 B  1840 bps (0) caster.example/RTCM3_NEAR (1) ttyACM0 ...
$ python3 count_rtcm.py rtcm.bin
1005: 6  1074: 60  1084: 60  1094: 60  1124: 60  1230: 6
```
carrSoln 1 at 14 s, 2 at 41 s; over 10 min: fixed 93 percent, float 7 percent, none 0.

---

## Exit Criteria

DONE when corrections flow with the expected messages, and the float and fixed times and epoch shares are reported without credentials.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | HTTP 401 | **Stop**: credentials wrong or not authorized for this mountpoint. |
| Phase 2 | Connected but zero bytes | **Adjust**: mountpoint needs GGA; send position as in the transport table. |
| Phase 2 | Receiver ignores RTCM | **Adjust**: RTCM3 input disabled on that port; enable the INPROT key. |
| Phase 3 | Stays float | **Retry**: check sky view and baseline; if still float, **Return** with the share report and baseline for the user to decide. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
