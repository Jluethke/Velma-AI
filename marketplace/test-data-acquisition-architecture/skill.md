# Test Data Acquisition Architecture

Define the data-acquisition system: sample rates, anti-alias filtering, channel count, resolution, triggering, and time synchronization.

## Inputs

- `sensor-plan`: The channel list with each sensor's range and bandwidth
- `measured-quantities`: The frequency content and dynamic range each channel must capture

## Outputs

- `daq-architecture`: The sampling, filtering, resolution, channel grouping, triggering, and synchronization scheme for the campaign
- `channel-list`: The engineering channel list with sample rate, range, filter, and calibration coefficients ready to load into the system

## Process

1. Set each channel's sample rate above the Nyquist limit with margin. Sample at least 2x the highest frequency of interest to avoid aliasing, and in practice 5 to 10x to resolve the waveform shape. A 1 kHz signal of interest wants roughly 5 to 10 kS/s per channel; static channels can run at tens of samples per second.
2. Apply an analog anti-alias filter before digitizing, not a digital filter after. Energy above half the sample rate folds back into the band as unremovable false signal; a low-pass analog filter set below the Nyquist frequency is the only way to stop it. Record the filter corner and order per channel.
3. Choose resolution and range for the dynamic range you need. A 16-bit digitizer gives about 96 dB of range; a 24-bit delta-sigma channel suits low-level strain and acoustics. Set the input range to the signal plus headroom so the quantization step is small relative to the smallest feature you must resolve.
4. Define triggering and pre-trigger capture for transient events. A burst, impact, or failure happens once; set a level or external trigger and keep a pre-trigger buffer (often 10 to 50% of the record) so the data before the event is captured. For slow tests, continuous streaming to disk with timestamps is simpler and safer.
5. Synchronize time across all channels and subsystems. Phase relationships between channels (load versus strain, pressure versus displacement) are only meaningful if sampled on a common clock or hardware-synchronized; cross-correlation and modal work demand it. Use a shared clock, trigger, or timecode, and log the synchronization method.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
