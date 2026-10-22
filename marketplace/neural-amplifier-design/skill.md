# Neural Amplifier Design

Design or select the analog front-end amplifier chain from the electrode impedance and signal specification, targeting the required noise floor, CMRR, and power per channel.

## Inputs

- `signal-specification`: Signal amplitude range and bandwidth
- `impedance-specification`: Electrode impedance at 1 kHz and expected range
- `channel-count-requirement`: Number of channels to amplify

## Outputs

- `amplifier-specification`: Input-referred noise floor, gain, bandwidth, CMRR, input impedance, power per channel, and ADC resolution
- `analog-front-end-architecture`: Amplifier topology (AC-coupled capacitive feedback, chopper-stabilized, or direct-coupled), multiplexing strategy, and ADC configuration

## Process

1. Set the input-referred noise target. For single-unit recording, the noise floor must be below 5 uVrms to detect 50 uV spikes with SNR of 10 (20 dB). For ECoG, below 2 uVrms. For EEG, below 1 uVrms. The amplifier noise and electrode thermal noise add in quadrature: total noise = sqrt(amp_noise^2 + electrode_thermal_noise^2). If electrode thermal noise dominates, reducing amplifier noise further yields diminishing returns.
2. Select amplifier topology. Capacitive feedback amplifiers (Intan RHD2164 architecture) are standard for implantable neural recording: AC-coupled with high-pass corner set by capacitor ratio (typically 0.1-1 Hz), mid-band gain of 100-200, input impedance greater than 10 MOhm at 1 kHz. Chopper-stabilized amplifiers reduce flicker noise below 1 Hz but require careful design to avoid chopper artifacts mixing into the neural band. Direct DC-coupled designs are needed for spreading depolarization research.
3. Size the ADC: resolution must capture the full dynamic range. Neural signals span about 60 dB (1 mV artifacts to 10 uV spikes). A 16-bit ADC with 1 mV input range gives 15 nV LSB, adequate. In practice, 10-12 bits after the programmable gain amplifier is sufficient for most applications. Sampling rate: 30 kSps per channel for spike recording, 1 kSps for LFP/EEG. Total data rate = channels x bits x sample_rate.
4. Calculate power budget per channel. State-of-art neural amplifiers achieve 1-5 uW per channel. For a 1024-channel system, the analog front-end alone draws 1-5 mW. Add digitization power (ADC, multiplexing). For implantable systems, total power must stay within the heat dissipation limit: less than 40 mW/cm2 on brain surface to avoid thermal tissue damage (1 degree C rise threshold). CMRR must exceed 80 dB to reject 50/60 Hz interference and motion artifacts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
