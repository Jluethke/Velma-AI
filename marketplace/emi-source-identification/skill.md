# Emi Source Identification

Identify and characterize all EMI sources in the system before designing mitigation, because fixing the source is always cheaper than filtering after the fact.

## Inputs

- `system-block-diagram`: All active blocks: switching converters, digital clocks, motor drives, communication interfaces, and their operating frequencies, edge rates, and current levels
- `emc-standard`: The applicable emissions standard (CISPR 32 Class B for residential, FCC Part 15 Class B, automotive: CISPR 25) with its frequency range and limits

## Outputs

- `emi-source-inventory`: For each source: fundamental frequency, harmonic spectrum estimate, current or voltage amplitude, and the coupling mechanism (conducted, radiated, or both)
- `risk-ranking`: Sources ranked by their likely contribution to emissions failure, based on amplitude and frequency relative to the limit

## Process

1. Switching power converters generate conducted DM noise at the switching frequency and its harmonics, plus CM noise from the switch node dV/dt coupling through parasitic capacitance to the chassis/ground. A buck converter switching at 500 kHz with 10 ns edges generates significant spectral energy up to 1/(pi*10ns) = 32 MHz.
2. Digital clocks generate radiated emissions from the PCB traces acting as unintentional antennas. A 100 MHz clock with 1 ns edges radiates harmonics up to 300 MHz or higher. The emission amplitude from a trace of length L carrying current I at frequency f is approximately: E = 1.3e-6 * f^2 * I * A / r (V/m) where A is the loop area (trace + return path) in m^2 and r is the distance in meters.
3. Motor drives generate broadband EMI from the PWM switching of the inverter. The motor cable acts as an antenna, radiating the PWM spectral content. CM current flows through the motor frame parasitic capacitance to ground. The EMI spectrum extends from the PWM frequency (typically 10 to 20 kHz) to tens of MHz.
4. Estimate the conducted emissions spectrum by calculating the Fourier coefficients of the switching waveform. For a trapezoidal waveform with amplitude A, duty cycle D, rise time tr, and frequency f0: the nth harmonic amplitude is An = 2*A*D*sinc(n*pi*D)*sinc(n*pi*f0*tr). Plot this envelope against the applicable limit line. The frequency range where the envelope exceeds the limit is where filtering is needed.
5. Rank sources by margin to limit. A source that exceeds the limit by 20 dB needs 20 dB of attenuation from filtering, shielding, or layout improvement. Sources within 6 dB of the limit are at risk due to measurement uncertainty and production variation. Sources more than 10 dB below the limit can typically be ignored.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
