# Adc Dac Layout For Optimal Performance

Layout ADC and DAC circuits for maximum SNR and minimum distortion, applying the converter manufacturer's recommendations with the physics behind them.

## Inputs

- `partition-implementation`: Ground strategy implementation
- `guard-ring-design`: Protection for sensitive nodes
- `component-datasheets`: ADC/DAC datasheets with layout recommendations and evaluation board layout

## Outputs

- `adc-dac-placement`: Component placement for each converter: decoupling capacitor positions, reference circuit location, input network placement
- `critical-trace-routing`: Routing plan for clock, analog input, reference, and digital output traces with length and spacing constraints
- `performance-verification-plan`: How to verify the layout achieves the datasheet SNR: test points, measurement method, expected degradation from layout

## Process

1. Place the ADC/DAC decoupling capacitors first, before any other component in the area. Each AVDD pin gets a 100 nF capacitor within 2 mm, connected directly to the AGND pin (not to a distant ground via). Each DVDD pin gets a 100 nF capacitor connected to DGND. A 10 uF bulk capacitor serves each power domain. These capacitor positions are non-negotiable; other components route around them.
2. Place the voltage reference circuit adjacent to the ADC reference pins. The reference decoupling capacitor must be within 3 mm of the REF pin. Route the reference trace as a wide (20 mil minimum), short, direct connection. Any noise on the reference appears directly as gain error in every sample. Shield the reference trace between ground traces or on a shielded internal layer.
3. Route the ADC clock as a controlled-impedance trace, matched to the clock source impedance (usually 50 ohms). Keep the clock trace away from analog input traces (10 mm minimum separation or on different layers with a ground plane between them). Clock jitter degrades SNR: a 1 ps rms jitter on a 100 MHz input signal costs 1 dB of SNR. The clock trace is as critical as the analog input.
4. Route digital output traces away from analog inputs. The digital outputs switch during each conversion and create transient currents in the ground plane. Route digital outputs toward the digital section, away from the analog section. If the ADC has a serial output (SPI, LVDS), prefer it over parallel outputs because fewer traces switch simultaneously, creating less ground bounce.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
