# python-can Logging and Conversion (BLF, ASC, CSV)

**One-line description:** Records or converts CAN logs between candump .log, Vector BLF and ASC, and CSV with python-can's LogReader, Logger and writer classes, and proves the conversion lossless by comparing frame counts, IDs, data and timestamps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `candump_log` (string, required): Source log from `canb-candump-capture` (candump `-l` format).
- `log_format` (string, required): Target extension: "blf", "asc", "csv", or "log".
- `project_dir` (string, required): Where the conversion script and output go.

---

## Outputs

- `converted_log` (object): Output path, format, frame count in and out, and the comparison result.

---

## Phase 1: Choose the Writer

### Entry Criteria
- python-can 4.x installed (see `canb-py-bus-notifier` Phase 1).

### Actions
1. python-can picks reader and writer from the file extension: `can.LogReader(path)` and `can.Logger(path)`. Mapping in 4.x: `.log` CanutilsLogReader/Writer (candump format), `.blf` BLFReader/BLFWriter, `.asc` ASCReader/ASCWriter, `.csv` CSVReader/CSVWriter, `.trc` TRC. Confirm the list for the installed version in the python-can "File IO" docs.
2. Check for the built-in converter: `python3 -m can.logconvert --help`. If it exists, use it: `python3 -m can.logconvert <candump_log> <out>.<log_format>`.
3. If it does not exist, write one script `<project_dir>/convert_log.py` that does:
   `with can.LogReader(src) as reader, can.Logger(dst) as writer:` then `for msg in reader: writer.on_message_received(msg)`.
4. Format pitfalls to record:
   - CSV in python-can stores data base64-encoded, not hex; other tools will not read it as hex.
   - ASC timestamps are written relative to the first frame; absolute time is kept only in the header date.
   - BLF is binary and compressed; inspect it only by reading it back.

### Output
Conversion command or script.

### Quality Gate
- The writer for the requested extension is named from the docs of the installed version.

---

## Phase 2: Convert and Compare

### Entry Criteria
- Command or script ready.

### Actions
1. Run the conversion.
2. Read both files back with `can.LogReader` and compare in a short check (same script or a second one):
   - frame count equal;
   - for each index: `arbitration_id`, `is_extended_id`, `is_fd`, `dlc`, and `bytes(data)` equal;
   - timestamp difference: for ASC compare relative times (subtract the first timestamp of each file); report the largest difference, which is limited by the format's printed resolution.
3. Print the result table.
4. Direct capture alternative: `python3 -m can.logger -i socketcan -c can0 -f capture.blf` records straight to BLF; check `python3 -m can.logger --help` for filter options.

### Output
`converted_log`.

### Quality Gate
- Frame counts are equal.
- Zero mismatches in ID, flags, DLC and data.
- The largest timestamp difference is reported as a number with units.

---

## Worked Example

Illustrative. Input: `candump-2026-10-21_101500.log` with 182340 frames, `log_format`="blf".

- Phase 1: `python3 -m can.logconvert --help` works; BLFWriter selected by extension.
- Phase 2: `python3 -m can.logconvert candump-2026-10-21_101500.log run1.blf`; read-back: 182340 in, 182340 out, 0 data mismatches, largest timestamp difference 0.000001 s.

---

## Exit Criteria

DONE when the converted file exists and reading it back matches the source in count, IDs, flags, DLC and data, with timestamp error reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `No module named can.logconvert` | **Adjust**: use the LogReader/Logger script. |
| Phase 1 | Extension not supported | **Return**: report the supported list from the installed version's docs. |
| Phase 2 | Count mismatch | **Retry**: make sure the writer context closed (the `with` block ended) before reading back. |
| Phase 2 | FD flags lost | **Return**: report that the target format or writer version drops FD flags; keep the candump original. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
