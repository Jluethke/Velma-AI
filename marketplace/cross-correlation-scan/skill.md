# Cross-Correlation Scan

Cross-correlate every unknown signal's byte patterns against all known decoded signals to find matching physical quantities. Identify mirror signals (redundant copies, r > 0.90) and infer unknown encodings by least-squares fit of scale and offset.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Extract candidate signals from unknown messages
REASON  --> Correlate against all known signals
PLAN    --> Classify mirrors, infer encoding for matches
ACT     --> Output correlation results and mirror signal list
```

## Inputs

- `unknown_signals`: list[object] -- Unidentified messages with byte patterns from unknown-signal-inventory
- `bus_captures`: list[file] -- Full capture for time-series extraction
- `signal_database`: object -- Known signal time-series for correlation targets

## Outputs

- `correlation_results`: list[object] -- For each unknown candidate: matched known signal, Pearson r, lag, candidate encoding (byte order, offset, scale)
- `mirror_signals`: list[object] -- Unknowns confirmed as redundant copies of known signals (r > 0.90)

---

## Execution

### OBSERVE: Extract Candidates

1. For each unknown message, extract every plausible signal interpretation:
   - Each single byte as an unsigned 8-bit value
   - Each pair of adjacent bytes as big-endian unsigned 16-bit
   - Each pair of adjacent bytes as little-endian unsigned 16-bit
   - Each 4-byte group as 32-bit (both endiannesses)
   - Skip bytes already identified as counters or checksums

2. Align each candidate time-series to the same time base as the known signals.

### REASON: Correlate

1. For each (unknown candidate, known signal) pair, compute Pearson correlation coefficient r and the optimal time lag.
2. Accept r > 0.90 as a confirmed mirror. Flag 0.75 < r < 0.90 as a candidate requiring further evidence.
3. For confirmed mirrors, fit the encoding by least-squares regression:
   ```
   known_value = scale * raw_unknown + offset
   ```
   The fitted scale and offset define the unknown's encoding. Residual should be near zero.

4. For candidates (0.75-0.90), note the correlation but do not declare the match proven. These require event-correlation or targeted captures to confirm.

### PLAN: Classify Mirrors

1. Mirrors carry the same physical quantity as a known signal. They confirm the signal graph but add no new information.
2. For each mirror, record: unknown message ID, byte position, encoding (endianness, scale, offset), and the known signal it mirrors.
3. Compute the mirror's rate and jitter vs the primary's. The signal with higher rate and lower jitter is the primary source.
4. Set confirmed mirrors aside. They are solved. The remaining unknowns go to event-correlation-analysis.

### ACT: Deliver

1. Output correlation results: all pairs with r > 0.75, sorted by correlation strength.
2. Output mirror signal list: confirmed matches with encoding and primary/mirror designation.
3. Report: how many unknowns were resolved (mirrors), how many remain unresolved.

## Exit Criteria

1. Every unknown has been correlated against every known signal
2. Mirrors (r > 0.90) are confirmed with encoding
3. Candidates (0.75-0.90) are flagged for further analysis
4. Remaining unresolved unknowns are counted

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
