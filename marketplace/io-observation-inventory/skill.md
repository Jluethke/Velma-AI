# I/O Observation Inventory

Catalog every observable input and output of a target embedded controller from recorded communication bus traffic. Produce a complete I/O boundary: every message the controller transmits, every message it reads (inferred from response correlations), timing profiles, and signal ranges.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Ingest bus captures and signal database
REASON  --> Identify transmitter, classify messages, correlate input-output pairs
PLAN    --> Build complete I/O boundary with timing and range metadata
ACT     --> Output transmit inventory, receive inventory, signal ranges
     \                                                              /
      +--- New captures arrive or signal database updated --- loop --+
```

## Inputs

- `bus_captures`: list[file] -- Recorded bus traffic files (candump, BLF, ASC, or CSV format). Each frame: timestamp, arbitration ID, data bytes, bus channel.
- `signal_database`: object -- Known signal definitions mapping message IDs to named signals with bit positions, byte order, scale, offset, and unit.

## Outputs

- `transmit_inventory`: list[object] -- Every message the controller transmits. Each entry: arbitration ID, DLC, mean rate (Hz), rate jitter (std dev), signal content, byte-level entropy.
- `receive_inventory`: list[object] -- Every message the controller reads, inferred from output correlation. Each entry: arbitration ID, correlated output signal, lag (ms), confidence (Pearson r).
- `signal_ranges`: list[object] -- Observed min, max, mean, and standard deviation for every decoded signal.

---

## Execution

### OBSERVE: Ingest the Data

**Entry criteria:** At least one bus capture file and a signal database are provided.

**Actions:**

1. **Parse all captures.** Extract every frame: timestamp, arbitration ID, DLC, raw data bytes, bus channel. Normalize timestamps to a common zero point across files.

2. **Build the message catalog.** For each unique arbitration ID observed:
   - Count total frames
   - Compute mean transmission rate (Hz) and standard deviation of inter-frame intervals
   - Record DLC (data length code)
   - Record the bus channel(s) it appears on

3. **Decode known signals.** For each message ID present in the signal database, unpack every defined signal from every frame. Record the time-series of each signal value.

4. **Compute byte-level entropy.** For each message ID, for each byte position, compute Shannon entropy across all observed frames. Static bytes (entropy near 0) carry fixed values. High-entropy bytes carry dynamic data or integrity fields.

**Output:** Parsed frame database, message catalog, decoded signal time-series, byte entropy map.

**Quality gate:** Every frame is parsed. Every known signal has a decoded time-series. Message rates are computed for all IDs.

---

### REASON: Identify Controller Ownership and Correlations

**Entry criteria:** Parsed frame database is ready.

**Actions:**

1. **Assign transmitter ownership.** Determine which controller transmits each message ID:
   - Use diagnostic address assignments if available (UDS response addresses map to specific ECUs)
   - Use timing signatures: messages from the same controller share a common clock offset pattern
   - Use power-state correlation: messages that start and stop together come from the same controller

2. **Identify the target controller's transmit set.** Given the target controller identity, collect all message IDs it transmits. This is the transmit inventory.

3. **Infer the receive set.** For each message NOT transmitted by the target controller:
   - Compute cross-correlation between that message's signals and the target controller's output signals
   - A statistically significant correlation (r > 0.70) with a consistent positive lag indicates the target reads that message and uses it in its output computation
   - Record the lag, correlation coefficient, and which output signal responds

4. **Identify integrity fields.** For each transmitted message:
   - Check the last byte for CRC/checksum behavior (value depends on all other bytes)
   - Check for monotonically incrementing nibbles (rolling counter)
   - Static bytes with entropy near 0 are likely unused or fixed configuration

5. **Classify unknown signals.** For message IDs not in the signal database:
   - Group dynamic bytes into candidate signals by analyzing co-variation patterns
   - Cross-correlate candidate signals with all known decoded signals to find mirrors (r > 0.90)
   - Rate-tier classification: 100 Hz = sensor data, 50 Hz = control, 10 Hz = status, 1 Hz = diagnostic

**Output:** Transmit inventory with ownership, receive inventory with correlation evidence, integrity field candidates.

**Quality gate:** Every message ID has an assigned transmitter (or "unknown"). The target controller's transmit and receive sets are defined. Integrity fields are identified.

---

### PLAN: Build the I/O Boundary

**Entry criteria:** Transmit and receive inventories are identified.

**Actions:**

1. **Compute signal ranges.** For every decoded signal in the target controller's transmit set:
   - Minimum observed value
   - Maximum observed value
   - Mean value
   - Standard deviation
   - Number of distinct values (for discrete/enumerated signals)

2. **Build the timing profile.** For each transmitted message:
   - Nominal rate (Hz)
   - Jitter: standard deviation of inter-frame intervals
   - Burst behavior: any periodic rate changes (e.g., rate doubles during certain operating modes)
   - First/last appearance timestamp (does it transmit continuously or only in certain states?)

3. **Map signal dependencies.** For each input-output pair (receive message signal -> transmit message signal):
   - Transfer characteristic: how does the output respond to input changes?
   - Latency: consistent lag from input change to output change
   - Gain: ratio of output change to input change (for linear relationships)

4. **Identify operating modes.** Cluster the captured data into distinct operating modes based on signal value patterns:
   - Mode = a stable region where signal relationships are consistent
   - Mode transitions = discontinuities in signal relationships
   - Different modes may have different I/O relationships

**Output:** Signal ranges, timing profiles, dependency map, operating mode segmentation.

**Quality gate:** Every transmitted signal has range statistics. Timing profiles cover all transmitted messages. At least one input-output dependency is mapped.

---

### ACT: Deliver the Inventory

**Entry criteria:** I/O boundary is fully characterized.

**Actions:**

1. **Format the transmit inventory.** For each message the controller transmits:
   ```
   ID: 0x220 (544)  DLC: 8  Rate: 100.0 Hz (jitter: 0.12 ms)
   Bus: CAN-C (500 kbps)
   Signals:
     COLUMN_TORQUE     [bytes 0-1, BE, signed]  range: -512..+511  mean: 2.3
     MOTOR_TORQUE      [bytes 2-3, BE, signed]  range: -400..+400  mean: 0.1
     LKAS_STATE        [byte 4, bits 7:5]       values: {0, 1, 2, 5}
     COUNTER           [byte 6, bits 7:4]       range: 0..15 (rolling)
     CHECKSUM          [byte 7]                 CRC-8 over bytes 0-6
   ```

2. **Format the receive inventory.** For each message the controller reads:
   ```
   ID: 0x202 (514)  Source: ABS/ESP module
   Evidence: SPEED_LEFT correlates with speed-dependent assist gain (r=0.94, lag=12ms)
   Used for: speed-dependent steering assist calculation
   ```

3. **Format signal ranges.** Table of all signals with min/max/mean/stddev.

4. **List unknowns.** Messages where the controller's role (transmit vs receive) could not be determined. These require targeted single-action captures to resolve.

**Output:** transmit_inventory, receive_inventory, signal_ranges.

**Quality gate:** All inventories are formatted. Unknown messages are listed with recommended next steps.

## Exit Criteria

1. Every message the target controller transmits is cataloged with signals, timing, and ranges
2. Every message the target controller reads is identified with correlation evidence
3. Signal ranges are computed for all decoded signals
4. Unknown messages are listed with classification guidance

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No captures provided | Abort with "no data" |
| OBSERVE | Signal database missing | Proceed with byte-level analysis only, flag all signals as "unknown encoding" |
| REASON | Cannot determine transmitter ownership | List as "unknown source" with statistical profile |
| REASON | No significant correlations found | Controller may be autonomous (no bus inputs) or captures lack sufficient variation |
| PLAN | Single operating mode only | Note limited coverage, recommend captures under different conditions |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
