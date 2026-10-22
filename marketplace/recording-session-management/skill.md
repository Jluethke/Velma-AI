# Recording Session Management

Execute a recording session with proper equipment setup, quality checks, and real-time monitoring to maximize data quality.

## Inputs

- `experimental-protocol`: Task design, timing, and recording parameters

## Outputs

- `session-data`: Recorded neural data with behavioral timestamps, quality annotations, and metadata
- `session-quality-report`: Channel impedances, noise levels, unit yield, behavioral performance, and any anomalies during the session

## Process

1. Pre-session equipment check. Measure electrode impedances at 1 kHz using the recording system's built-in impedance test. Flag channels with impedance greater than 2 MOhm (possible broken electrode) or less than 10 kOhm (possible short to reference or ground). Check the noise floor: with inputs connected to the headstage but subject at rest, RMS noise should be below 5 uV in the spike band and below 10 uV broadband. Check reference and ground connections: poor reference shows as correlated 60 Hz noise across all channels.
2. Configure the recording system. Set the sampling rate (30 kSps for spike recording, 1 kSps for LFP-only). Set the gain to use the full ADC range without clipping: for a +/- 500 uV input range on 16-bit ADC, the LSB is 15 nV, adequate. Enable hardware filters: 0.3-6000 Hz bandpass for spike channels, 0.1-300 Hz for LFP. Set up event synchronization: connect behavioral task system to the recording system via digital event lines (TTL pulses marking trial start, stimulus onset, response, reward).
3. Monitor data quality during recording. Display a rolling spectrogram or RMS plot to detect artifacts in real time. Watch for: sudden impedance changes (electrode movement), sustained 60 Hz increase (ground or reference issue), broadband noise bursts (motion artifact, cable connector issue). If quality degrades, pause and troubleshoot before continuing. Track behavioral performance: task completion rate should exceed 80% to ensure adequate trial counts.
4. Post-session data management. Save raw data in a standardized format: Neurodata Without Borders (NWB) for archival, or the recording system's native format plus conversion scripts. Record metadata: date, subject ID, electrode map, channel impedances, experimental conditions, task parameters, session notes. Back up data immediately to a second location. Log the session in a lab notebook or database with quality annotations (good session, partial data loss on channels X-Y, behavioral engagement level).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
