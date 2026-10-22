# Scope Trigger And Acquisition Setup

Configure trigger conditions, acquisition mode, and memory depth for reliable capture of the target signal event including rare or intermittent occurrences.

## Inputs

- `probe-selection`: Selected probe type and its characteristics
- `measurement-objective`: What is being measured and what events to capture
- `signal-specification`: Signal characteristics and expected behavior

## Outputs

- `trigger-configuration`: Trigger type, level, slope, holdoff, and coupling settings
- `acquisition-settings`: Acquisition mode (sample, peak detect, average, envelope), memory depth, and time/div
- `segmented-memory-plan`: If capturing rare events: segment count, segment length, and total capture time coverage

## Process

1. Set trigger level at the 50% crossing point of the signal for stable triggering. For noisy signals, use hysteresis (trigger coupling = HF reject or set trigger holdoff).
2. Select trigger type: edge trigger for periodic signals, pulse width trigger for glitch capture, pattern trigger for bus analysis, sequence trigger for state-dependent events.
3. Configure acquisition mode. Use sample mode for single-shot captures. Use averaging (16 to 64 averages) to reduce random noise for repetitive signals. Use peak detect mode to catch narrow glitches that fall between samples.
4. Calculate memory depth needed: memory_depth = sample_rate * time_window. For a 1GS/s scope capturing 1ms of data, 1M points are needed. Verify the scope maintains full sample rate at this memory depth (many scopes reduce sample rate as memory fills).
5. For rare events (power supply glitches, protocol errors), configure segmented memory. Each segment captures a short window around the trigger. With 1000 segments of 1000 points each, capture 1000 events over hours while using only 1M points of memory.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
