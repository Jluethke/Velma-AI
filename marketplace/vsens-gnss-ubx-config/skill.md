# u-blox Receiver Configuration with UBX and ubxtool

**One-line description:** Configures a u-blox generation 9 or later receiver through the UBX configuration interface (CFG-VALSET keys) with gpsd's ubxtool, setting measurement rate, UBX-NAV-PVT output and the time pulse, then reads NAV-PVT fixType, carrSoln, hAcc and numSV to confirm the change took effect.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gnss_stream_report` (object, required): From `vsens-gnss-nmea-gpsd`; confirms the port works and the PPS line state.
- `measurement_rate_hz` (number, required): Navigation solution rate the application needs. Must not exceed the maximum the receiver datasheet gives for the enabled constellations and RTK mode.

---

## Outputs

- `ubx_config` (object): Receiver model and firmware from MON-VER, every configuration key set with old value, new value and layer, the NAV-PVT field readout after the change, and the time pulse settings.

---

## Phase 1: Identify and Read Current Config

### Entry Criteria
- `ubxtool -h` runs (package `gpsd-tools` or `gpsd-clients` depending on distribution).
- gpsd is running on the port, or ubxtool is given the device directly per its help text.

### Actions
1. Set the protocol version so ubxtool uses VALSET and VALGET: `export UBXOPTS="-P <ver>"` where `<ver>` is the protocol version in the receiver's interface description (for example 27.12 for some generation 9 firmware). Read it from `ubxtool -p MON-VER` output (`PROTVER=` in the extension strings).
2. Record `ubxtool -p MON-VER` output: SW version, HW version, `FWVER=`, `PROTVER=`, `MOD=`.
3. Read current values: `ubxtool -g CFG-RATE-MEAS`, `ubxtool -g CFG-RATE-NAV`, `ubxtool -g CFG-MSGOUT-UBX_NAV_PVT_USB` (or `_UART1` for the UART port in use), `ubxtool -g CFG-TP-PULSE_DEF`, `ubxtool -g CFG-TP-PERIOD_TP1`, `ubxtool -g CFG-TP-LEN_TP1`, `ubxtool -g CFG-TP-TIMEGRID_TP1`.
4. Look up each key's unit and meaning in the u-blox Interface Description for this firmware. Do not use key names that are not in that document.

### Output
Receiver identity and current key values.

### Quality Gate
- MON-VER output is saved with `PROTVER`.
- Every key in step 3 has a readback value recorded, or "key not supported" from the receiver's NAK.

---

## Phase 2: Apply Configuration

### Entry Criteria
- Current values recorded so they can be restored.

### Actions
1. Compute `CFG-RATE-MEAS` in milliseconds: `round(1000 / measurement_rate_hz)`. Set it: `ubxtool -z CFG-RATE-MEAS,<ms>`.
2. Keep `CFG-RATE-NAV` at 1 (one navigation solution per measurement) unless the user asks otherwise.
3. Enable NAV-PVT on the port in use, once per navigation solution: `ubxtool -z CFG-MSGOUT-UBX_NAV_PVT_USB,1`.
4. Time pulse: confirm `CFG-TP-PERIOD_TP1` is 1000000 microseconds (1 Hz) and `CFG-TP-TIMEGRID_TP1` aligns to the time system you use (UTC or GPS per the Interface Description enumeration). Set only if the user's PPS consumer needs a change.
5. ubxtool writes to the RAM layer unless told otherwise. Check `ubxtool -h` for the layer option and write to BBR and Flash only after Phase 3 passes.
6. Do NOT send `CFG-RST` or factory reset commands in this flow.

### Output
Keys applied in RAM.

### Quality Gate
- `ubxtool -g` readback for each changed key equals the written value.
- Each `-z` command printed an ACK (`UBX-ACK-ACK`), not `UBX-ACK-NAK`.

---

## Phase 3: Verify with NAV-PVT and Persist

### Entry Criteria
- Keys applied.

### Actions
1. Read NAV-PVT for 30 seconds through gpsd: `ubxtool -p NAV-PVT` repeatedly, or `gpspipe -R` and decode with ubxtool. Record `iTOW` spacing, `fixType`, `flags` (gnssFixOK bit, carrSoln bits), `numSV`, `hAcc`, `vAcc`.
2. Decode with the Interface Description: `fixType` 0 no fix, 1 dead reckoning only, 2 2D, 3 3D, 4 GNSS plus dead reckoning, 5 time only. `carrSoln` 0 no carrier solution, 1 float, 2 fixed. `hAcc` and `vAcc` are in millimeters.
3. Confirm `iTOW` spacing equals `CFG-RATE-MEAS` in milliseconds.
4. Persist: rerun the same `-z` commands with the BBR and Flash layer per `ubxtool -h`. Power cycle the receiver and repeat the Phase 2 readback.
5. Emit `ubx_config`.

### Output
`ubx_config`.

### Quality Gate
- `iTOW` deltas equal the configured period for every consecutive NAV-PVT pair in the 30-second capture.
- After power cycle, `ubxtool -g CFG-RATE-MEAS` returns the new value.

---

## Worked Example

Illustrative only. ZED-F9P, `measurement_rate_hz` = 5.

```
$ ubxtool -p MON-VER | grep -E 'FWVER|PROTVER|MOD'
  extension FWVER=HPG 1.32
  extension PROTVER=27.31
  extension MOD=ZED-F9P
$ export UBXOPTS="-P 27.31"
$ ubxtool -z CFG-RATE-MEAS,200
UBX-ACK-ACK:
$ ubxtool -g CFG-RATE-MEAS
    item CFG-RATE-MEAS/0x30210001 val 200
$ ubxtool -p NAV-PVT
UBX-NAV-PVT: iTOW 382915200 ... fixType 3 flags x1 ... numSV 22 ... hAcc 1210 vAcc 1890
```
iTOW spacing 200 ms; carrSoln 0 (no RTK yet, expected before `vsens-gnss-ntrip-rtk`).

---

## Exit Criteria

DONE when the rate, NAV-PVT output and time pulse keys read back correctly, NAV-PVT spacing matches the rate, and the settings survive a power cycle.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-g` returns nothing | **Adjust**: protocol version unset or wrong; set `UBXOPTS="-P <ver>"` from MON-VER. |
| Phase 2 | `UBX-ACK-NAK` | **Stop**: key name or value invalid for this firmware; check the Interface Description. |
| Phase 3 | iTOW spacing irregular | **Adjust**: rate too high for port bandwidth or constellations; lower the rate or raise baud. |
| Phase 3 | Values lost after power cycle | **Retry**: write to BBR and Flash layers; confirm the layer flag in `ubxtool -h`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
