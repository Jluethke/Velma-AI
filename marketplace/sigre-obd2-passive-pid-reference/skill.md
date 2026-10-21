# Passive OBD-II PID Reference Extraction

**One-line description:** Searches existing captures for OBD-II mode 01 responses that some other device already requested (11-bit 0x7E8 to 0x7EF, or 29-bit 0x18DAF1xx), decodes them with the SAE J1979 formulas into a timestamped reference series, and never sends a request itself.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`.

---

## Outputs

- `obd2_reference` (object): Path to `obd2_ref.tsv` with columns `epoch<TAB>pid<TAB>value<TAB>unit`, the list of PIDs found, their sample intervals measured from the data, and the responding ECU IDs; or a "no passive OBD traffic" result.

---

## Phase 1: Find Passive Responses

### Entry Criteria
- Normalized logs exist.
- This flow sends nothing. If a scan tool or dongle was plugged in, it was the user's own device, already installed, and its traffic is only observed.

### Actions
1. Search for 11-bit responses: `grep -hE ' 7E[89A-F]#' norm/*.log | head`.
2. Search for 29-bit responses: `grep -hE ' 18DAF1[0-9A-F]{2}#' norm/*.log | head`.
3. Search for requests to learn who polls: `grep -hE ' 7DF#| 18DB33F1#' norm/*.log | head`.
4. If no responses exist in any log, stop and return "no passive OBD traffic". Do not plug in a scan tool or run `cansend` to create traffic; on the vehicle that would be transmitting.

### Output
Matching response lines or a stop result.

### Quality Gate
- The grep commands and their line counts are recorded.
- No transmit command appears in this session's shell history.

---

## Phase 2: Decode Mode 01 Single Frames

### Entry Criteria
- Responses found.

### Actions
1. A mode 01 single-frame response (ISO 15765-2 single frame) has data byte 0 = `0x0N` (N payload bytes), byte 1 = `0x41`, byte 2 = PID, then data bytes A, B.
2. Decode with SAE J1979 formulas:

| PID | Quantity | Formula | Unit |
|---|---|---|---|
| 0x0D | Vehicle speed | A | km/h |
| 0x0C | Engine speed | (256*A + B) / 4 | rpm |
| 0x05 | Engine coolant temperature | A - 40 | degC |
| 0x11 | Absolute throttle position | A * 100 / 255 | percent |
| 0x04 | Calculated engine load | A * 100 / 255 | percent |

3. Save as `~/canre/obd.py` and run `python ~/canre/obd.py norm/*.log > obd2_ref.tsv`:
   ```
   import re, sys
   rx = re.compile(r"^\(([\d.]+)\) \S+ (7E[89A-F]|18DAF1[0-9A-F]{2})#([0-9A-F]*)$")
   F = {0x0D: (lambda a, b: a, "km/h"), 0x0C: (lambda a, b: (256 * a + b) / 4, "rpm"),
        0x05: (lambda a, b: a - 40, "degC"), 0x11: (lambda a, b: a * 100 / 255, "percent"),
        0x04: (lambda a, b: a * 100 / 255, "percent")}
   for fn in sys.argv[1:]:
       for l in open(fn):
           m = rx.match(l.strip())
           if not m: continue
           d = bytes.fromhex(m[3])
           if len(d) >= 4 and d[0] >> 4 == 0 and d[1] == 0x41 and d[2] in F:
               a = d[3]; b = d[4] if len(d) > 4 else 0
               f, u = F[d[2]]
               print("%s\t0x%02X\t%g\t%s" % (m[1], d[2], f(a, b), u))
   ```
4. Ignore multi-frame responses (byte 0 high nibble 1, 2 or 3); mode 01 speed and rpm fit in single frames.

### Output
`obd2_ref.tsv`.

### Quality Gate
- Every printed row has a PID from the table.
- Values fall inside the formula's possible range (speed 0 to 255 km/h, rpm 0 to 16383.75).

---

## Phase 3: Characterize and Emit

### Entry Criteria
- `obd2_ref.tsv` has rows.

### Actions
1. Per PID, compute the median interval between samples. Polled PIDs are often slow; record the measured interval.
2. Record resolution: PID 0x0D has 1 km/h resolution, which limits how precisely a scale factor can be fitted from it; report this alongside.
3. Emit `obd2_reference`.

### Output
`obd2_reference`.

### Quality Gate
- Each PID lists its measured interval and its formula resolution.
- Responding ECU IDs are recorded.

---

## Worked Example

Illustrative only.

```
$ grep -hcE ' 7E[89A-F]#' norm/20261021_drive.log
1802
$ python ~/canre/obd.py norm/20261021_drive.log | head -3
1729507001.204118	0x0D	48	km/h
1729507001.254630	0x0C	1712	rpm
1729507001.704301	0x0D	49	km/h
```

Responder 0x7E8; PID 0x0D interval 0.50 s, resolution 1 km/h; requests came from the owner's installed trip-logger dongle.

---

## Exit Criteria

DONE when passively observed mode 01 responses are decoded into a timestamped reference with measured intervals and resolutions, or the flow returns "no passive OBD traffic" without sending anything.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No responses in any log | **Return**: use `gps` or `manual` reference instead; never generate requests on the vehicle. |
| Phase 2 | Byte 1 is 0x7F | **Adjust**: that is a negative response; skip the line. |
| Phase 2 | Responses only in multi-frame form | **Adjust**: decode with an ISO-TP reassembler offline, or skip that PID. |
| Phase 3 | Interval too slow for the signal's dynamics | **Adjust**: record it; the regression flow uses only steady stretches. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
