# Timing Jitter Budget Analysis

Build the timing budget and jitter budget for each high-speed interface to verify that setup and hold times are met with margin across all operating conditions.

## Inputs

- `interface-spec`: Data rate, unit interval (UI), setup time Tsu and hold time Th requirements from the receiver datasheet, clock-data relationship (source-synchronous, recovered clock, system clock)
- `board-design`: Trace lengths and propagation delays for clock and data, skew between differential pairs, number of connectors/vias in the path

## Outputs

- `timing-budget`: Table showing each timing contribution (driver delay, propagation delay, clock skew, receiver setup/hold), summed to show the timing margin at worst case
- `jitter-budget`: Breakdown of jitter: deterministic (ISI, DCD, crosstalk-induced) and random, combined to total jitter at the target BER, compared against the available timing margin

## Process

1. For source-synchronous interfaces (DDR, LVDS): the clock and data travel the same path, so the timing budget is about skew, not absolute delay. The key terms are: Tskew_max = Tdata_delay - Tclock_delay (trace length mismatch), Tsetup_margin = UI/2 - Tskew - Tsu - Tjitter. Match data and clock trace lengths to within 10 to 50 mils depending on edge rate.
2. For recovered-clock interfaces (PCIe, SATA, USB 3.x): the receiver CDR (clock and data recovery) extracts timing from the data stream. The jitter budget replaces the timing budget. The CDR tracks low-frequency jitter (below its bandwidth, typically 1 to 10 MHz) but cannot track high-frequency jitter. Total jitter at BER = 1e-12: TJ = DJ + 2*alpha*RJ where alpha = 7.03 for BER 1e-12.
3. Deterministic jitter (DJ) components: duty-cycle distortion (DCD) from asymmetric rise/fall times, inter-symbol interference (ISI) from channel loss and reflections, periodic jitter (PJ) from crosstalk or power supply coupling. DJ is bounded and adds directly.
4. Random jitter (RJ) from thermal noise, shot noise in drivers/receivers, and oscillator phase noise. RJ is Gaussian and unbounded; at BER 1e-12, the peak-to-peak random jitter is 14.07 * sigma_RJ. Total jitter TJ(1e-12) = DJ_pp + 14.07 * RJ_rms must be less than the unit interval.
5. Eye diagram measurement: the eye opening = UI - TJ(BER). For a 10 Gbps link (UI = 100 ps), if TJ(1e-12) = 70 ps, the eye opening is 30 ps, which must exceed the receiver's minimum eye opening requirement. If the eye closes, equalization (CTLE, DFE) at the receiver can open it by compensating for ISI.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
