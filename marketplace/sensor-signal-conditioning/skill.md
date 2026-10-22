# Sensor Signal Conditioning

Design the front-end circuit that amplifies and conditions the raw sensor signal to match the ADC input range while minimizing added noise.

## Inputs

- `sensor-output`: Sensor type (resistive bridge, piezoelectric, thermocouple, current loop 4-20mA, voltage output), output range, source impedance, bandwidth
- `adc-input-range`: ADC full-scale voltage range (e.g., 0 to 3.3V or +/-2.5V differential), input impedance

## Outputs

- `conditioning-circuit`: Schematic with amplifier topology (instrumentation amp, difference amp, charge amp), gain setting resistors, and expected output range
- `noise-analysis`: Total input-referred noise from the conditioning circuit in the signal bandwidth, compared against the sensor's minimum detectable signal

## Process

1. For a Wheatstone bridge sensor (strain gauge, pressure sensor, load cell): the bridge output is a differential voltage of 1 to 3 mV/V excitation per full-scale. For a 5V excitation and 2 mV/V sensitivity, full-scale output is 10 mV differential. Use an instrumentation amplifier (INA) with gain G = ADC_range / (2 * V_bridge_FS) to center the signal in the ADC input range. For 10 mV full-scale to 3.3V ADC: G = 165.
2. INA selection criteria: input bias current (must be low for high-impedance bridges), CMRR (must reject the common-mode voltage of Vexcitation/2), gain error and drift, and input noise density. For high-accuracy measurements (better than 0.1 percent), use an INA with gain error under 0.01 percent and CMRR above 100 dB at the signal frequency.
3. For a piezoelectric sensor (accelerometer, pressure transducer): the sensor is a charge source Q = d*F where d is the piezoelectric coefficient. Use a charge amplifier: Vout = -Q/Cf = -d*F/Cf where Cf is the feedback capacitor. The low-frequency cutoff is f_low = 1/(2*pi*Rf*Cf) where Rf is the feedback resistor (sets the DC bias point). For vibration measurement from 10 Hz to 10 kHz, choose Rf*Cf = 1/(2*pi*10) = 16 ms.
4. For a 4-20 mA current loop: convert to voltage with a precision sense resistor. Vsense = I * Rsense. For a 0 to 3.3V ADC range: Rsense = 3.3V / 20mA = 165 ohm. The 4mA zero offset maps to 0.66V, leaving 0.66V to 3.3V for the 4-20mA signal range. Use a precision resistor (0.1 percent tolerance, low TC of 25 ppm/C) to minimize gain error.
5. For all topologies, calculate the signal-to-noise ratio: SNR = V_signal_rms / V_noise_rms where V_noise_rms = en * sqrt(BW) * G (amplifier noise referred to output). The SNR must exceed the ADC resolution by at least 6 dB: SNR > 6.02*N + 1.76 + 6 dB where N is the ADC bits. If the conditioning circuit noise exceeds the ADC quantization noise, the ADC resolution is wasted.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
