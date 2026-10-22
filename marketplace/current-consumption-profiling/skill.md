# Current Consumption Profiling

Profile the system's current consumption over time with sub-millisecond resolution to identify power spikes, inefficient duty cycles, and optimization opportunities.

## Inputs

- `clock-gating-table`: Peripheral clock states per system mode
- `dvfs-configuration`: Frequency/voltage operating points

## Outputs

- `current-waveform`: Time-resolved current profile at sub-ms resolution showing each operational phase with annotated events (wake, transmit, sleep entry)
- `optimization-targets`: Ranked list of power reduction opportunities with estimated mAh savings per day for each

## Process

1. Set up a power profiler that captures current with at least 1 us resolution and a dynamic range from 100 nA to 100 mA. The Nordic Power Profiler Kit 2 or Joulescope JS220 are suitable. Connect in series between the battery/supply and the board's power input.
2. Run a representative duty cycle: the system should go through all operational states including communication, sensing, processing, and sleeping. Capture a long enough trace to include several complete cycles.
3. Annotate the current waveform with GPIO debug signals: toggle a pin at each state transition so the power trace correlates with firmware events. This shows exactly which code section causes each current spike or plateau.
4. Identify power waste: time spent in active mode after the work is complete (waiting for an event instead of sleeping), peripherals left enabled during sleep (a common bug), radio transmit at higher power than needed, or excessive wake-up frequency.
5. Rank the optimization opportunities by impact: mAh_saved_per_day = (current_reduction_mA * duration_per_cycle_ms * cycles_per_day) / 3600000. Focus on the largest contributors first. A 1 mA reduction during a 10 ms active phase that runs 1000 times per day saves only 0.003 mAh. A 10 uA reduction during a 59-second sleep that repeats 1440 times per day saves 0.14 mAh.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
