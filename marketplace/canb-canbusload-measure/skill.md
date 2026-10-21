# Bus Load Measurement with canbusload

**One-line description:** Measures CAN bus utilization per interface with can-utils canbusload, explains how it estimates bits per frame, and cross-checks the figure against a frame-count calculation from a candump log.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Interface, for example "can0".
- `bit_timing` (object, required): From `canb-bit-timing-calc`; canbusload needs the nominal bit rate.
- `candump_log` (string, required): From `canb-candump-capture`; used for the cross-check.

---

## Outputs

- `busload_report` (object): canbusload samples (min, max, mean percent over the run), the frame-count estimate, the difference between them, and the busiest IDs.

---

## Phase 1: Run canbusload

### Entry Criteria
- Interface up and receiving.

### Actions
1. Run `canbusload -h` and read the option list on your version. Common options: `-t` (timestamp), `-b` (bar graph), `-c` (color), `-r` (redraw terminal), `-e` (exact bit stuffing calculation on newer versions). Use only options your help text lists.
2. Run with the bit rate from `bit_timing`: `canbusload can0@500000 -t -b`. For CAN FD, newer versions accept a data bit rate after a comma; check the help text for the exact syntax.
3. Let it run for at least the same period as the scenario of interest (user choice), then stop with Ctrl+C. Save the output: `canbusload can0@500000 -t | tee busload.txt` ends when you stop it.
4. Read each line: `can0@500000  frames  bits  load%`; load is bits seen in the interval divided by the bit rate.

### Output
busload.txt with interval samples.

### Quality Gate
- busload.txt has one line per interval with a percent value.
- The bit rate in the command equals `bit_timing.bitrate`.

---

## Phase 2: Cross-Check from the Log

### Entry Criteria
- `candump_log` present.

### Actions
1. Count frames per DLC and ID type in the log (standard 11-bit IDs have 3 hex digits, extended 29-bit IDs have 8).
2. Compute a lower bound on bits per classic frame without stuffing: standard data frame = 47 + 8 * data_bytes bits (SOF, ID, control, CRC, delimiters, ACK, EOF, and 3-bit intermission); extended = 67 + 8 * data_bytes. These counts come from the ISO 11898-1 frame layout; recompute them from the standard if you need exactness. Worst-case stuffing adds bits on top.
3. Lower-bound load = sum(bits) / (capture duration * bitrate). canbusload without `-e` uses a similar unstuffed estimate, so the two figures should be close; with `-e` canbusload counts stuff bits and reads higher.
4. List the five IDs contributing the most bits.

### Output
Cross-check figures.

### Quality Gate
- The frame-count estimate and the canbusload mean are both reported with the same interval.
- If they differ by more than the stuffing explanation covers, the difference is listed as an open question.

---

## Worked Example

Illustrative. 500 kbit/s bus, 60 s log.

- Phase 1: `canbusload can0@500000 -t -b` shows samples between 31% and 34%.
- Phase 2: log has 120000 standard frames with 8 data bytes: 120000 * 111 bits / (60 s * 500000) = 44.4%. That is higher than canbusload, which means the log span or the frame count needs rechecking: the log turned out to span 90 s, giving 29.6%, consistent with the measured range.

---

## Exit Criteria

DONE when `busload_report` contains canbusload samples, an independent frame-count estimate for the same period, and the top contributing IDs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `canbusload: command not found` | **Adjust**: install the distro can-utils package. |
| Phase 1 | Option rejected | **Adjust**: remove it; use only what `canbusload -h` lists. |
| Phase 2 | Estimate and measurement disagree widely | **Retry**: confirm the log duration and bit rate before concluding anything. |
| Phase 2 | Load high enough to cause RX overflow errors | **Return**: send to `canb-error-frame-diagnosis` with the busiest IDs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
