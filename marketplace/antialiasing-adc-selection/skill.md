# Antialiasing Adc Selection

Design the anti-aliasing filter and select the ADC to capture the sensor signal with the required resolution and bandwidth.

## Inputs

- `signal-bandwidth`: Maximum signal frequency of interest and required attenuation of out-of-band signals at the Nyquist frequency
- `conditioning-circuit`: Output signal range and impedance from the conditioning stage
- `resolution-spec`: Required measurement resolution in bits or engineering units, maximum allowed noise floor

## Outputs

- `filter-design`: Anti-aliasing filter topology (Butterworth, Bessel, Chebyshev), order, cutoff frequency, and component values
- `adc-selection`: ADC type, resolution, sampling rate, interface (SPI, I2C, parallel), and ENOB at the signal frequency

## Process

1. The anti-aliasing filter must attenuate signals at the Nyquist frequency (fs/2) by at least the ADC dynamic range. For a 16-bit ADC (96 dB dynamic range), the filter must provide at least 96 dB attenuation at fs/2. If the signal bandwidth is 1 kHz and the ADC samples at 10 kSPS (Nyquist at 5 kHz), a fourth-order Butterworth filter (-80 dB/decade) gives only 56 dB at 5 kHz. Either increase the sampling rate (oversampling) or increase filter order.
2. Oversampling relaxes the anti-aliasing filter: sampling at 100 kSPS moves the Nyquist to 50 kHz, and a second-order Butterworth at 1 kHz cutoff gives -80 dB at 50 kHz. Then decimation filtering (digital low-pass and downsample) recovers the effective data rate. Delta-sigma ADCs use extreme oversampling (OSR of 64 to 512) with a simple first-order RC anti-aliasing filter.
3. Filter type selection: Butterworth has the flattest passband (maximally flat magnitude), Bessel has the flattest group delay (best pulse response with no overshoot), and Chebyshev Type I has the steepest rolloff but with passband ripple. For measurement systems where amplitude accuracy matters, use Butterworth. For transient signals (pulse, step response), use Bessel to avoid ringing.
4. ADC ENOB at the signal frequency determines the actual usable resolution. ENOB = (SINAD - 1.76) / 6.02 where SINAD is signal-to-noise-and-distortion ratio. A 16-bit ADC with 90 dB SINAD at 1 kHz has ENOB = 14.7 bits at that frequency. Check the datasheet ENOB vs frequency curve; it degrades at higher frequencies due to aperture jitter and comparator settling.
5. Match the ADC's input impedance and sampling capacitor to the driving circuit. A SAR ADC's input has a switched capacitor that requires charge from the driving source within the acquisition time. The source impedance must be low enough to settle to within 0.5 LSB: R_source * C_sample < T_acq / (N+1) * ln(2) where T_acq is the acquisition time and N is resolution bits. Add a buffer amplifier (rail-to-rail output, adequate settling time) if the sensor conditioning output impedance is too high.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
