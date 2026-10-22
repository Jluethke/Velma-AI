# Unknown Signal Inventory

Extract every unidentified signal from a bus capture and characterize its statistical properties. Classify bytes as static, slow-varying, fast-varying, counter-like, or high-entropy. Group unknowns by rate tier to constrain what each signal could be.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load captures and known signal database
REASON  --> Subtract known IDs, profile each unknown
PLAN    --> Classify bytes, group by rate tier
ACT     --> Output unknown signal list and byte dynamics
```

## Inputs

- `bus_captures`: list[file] -- Recorded bus traffic
- `signal_database`: object -- Known signal definitions (the already-identified subset)

## Outputs

- `unknown_signals`: list[object] -- Each: message ID, DLC, mean rate, byte-level entropy, time span present, bus channel
- `byte_dynamics`: list[object] -- Per unknown message: each byte position classified as static/slow/fast/counter/random

---

## Execution

### OBSERVE: Extract Unknown IDs

1. Parse all captures. Build the set of all observed message IDs.
2. Subtract all IDs present in the signal database. The remainder is the unknown set.
3. For each unknown ID, extract all observed frames with timestamps.

### REASON: Profile Each Unknown

1. **Rate and DLC.** Compute mean transmission rate (Hz) and DLC from all observed frames.
2. **Byte entropy.** For each byte position, compute Shannon entropy across all frames:
   - Entropy near 0: static (byte never changes)
   - Entropy 0.1-2.0: slow-varying (few distinct values, changes rarely)
   - Entropy 2.0-6.0: fast-varying (many values, changes frequently)
   - Entropy near 8.0: random or high-resolution measurement
3. **Counter detection.** Check each nibble and byte for monotonic increment with wrap.
4. **Time span.** Record the first and last timestamp the ID appears. IDs that appear only briefly are event-triggered. IDs present throughout are periodic.

### PLAN: Classify by Rate Tier

1. **100 Hz tier:** Almost always sensor data or control feedback. High-rate signals are safety-relevant.
2. **50 Hz tier:** Control signals or secondary sensor data.
3. **10 Hz tier:** Status messages, slow-changing measurements.
4. **1 Hz tier:** Diagnostic, configuration, or heartbeat messages.
5. **Event tier (< 1 Hz, bursty):** Triggered by specific actions, not periodic.

### ACT: Deliver

1. Output the unknown signal list sorted by rate tier (highest first).
2. Output byte dynamics: one row per message ID, one column per byte position, showing the classification.
3. Note total unknown count and percentage of bus traffic they represent.

## Exit Criteria

1. Every unknown message ID is profiled with rate, DLC, and entropy
2. Byte dynamics are classified for all unknowns
3. Rate-tier grouping is complete

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
