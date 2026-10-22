# Conducted Emissions Pre Test

Measure conducted emissions on power lines using a LISN and spectrum analyzer to identify emissions that would fail CISPR/FCC limits before visiting a compliance lab.

## Inputs

- `applicable-standard`: EMC standard to test against (CISPR 32, FCC Part 15, EN 55032) with class (A or B) and frequency range (typically 150kHz to 30MHz)
- `test-setup-description`: Equipment under test configuration, operating mode, cable lengths, and grounding arrangement

## Outputs

- `conducted-emissions-scan`: Measured emissions vs frequency with quasi-peak and average detector results overlaid on the applicable limit line
- `margin-analysis`: Margin to limit at each emission peak, identifying frequencies with less than 6dB margin as at-risk
- `emission-source-identification`: For each significant emission: identified source (switching frequency harmonics, clock harmonics, processor activity) and current path

## Process

1. Set up the LISN on each power line (L, N for AC; +V, GND for DC). The LISN provides a defined 50-ohm impedance to the equipment at RF frequencies while passing the power. Connect the LISN RF output to the spectrum analyzer 50-ohm input.
2. Configure the spectrum analyzer: frequency range 150kHz to 30MHz, resolution bandwidth 9kHz (for quasi-peak per CISPR), reference level 80dBuV or higher to avoid overloading the input, attenuation 10dB. First run a peak detector scan to find the worst-case frequencies quickly.
3. At each significant emission peak, switch to quasi-peak detector and measure for sufficient dwell time (1 second per frequency point for quasi-peak). For frequencies where quasi-peak passes but is close to the limit, also measure with average detector since many standards have both quasi-peak and average limits.
4. Identify the source of each emission. Switching converter fundamentals and harmonics appear at integer multiples of the switching frequency. Clock harmonics appear at integer multiples of the oscillator frequency. Compare the emission frequencies to the known clock and switching frequencies on the board.
5. Apply the pre-compliance correlation factor. In-house measurements typically read 3-6dB different from a compliance lab due to differences in ground plane, cable routing, ambient noise, and LISN calibration. Target 6dB margin to the limit in pre-compliance to have confidence in a compliance lab pass.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
