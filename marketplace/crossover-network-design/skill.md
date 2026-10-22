# Crossover Network Design

Design the crossover network to divide the audio band among drivers while maintaining flat summed response and controlled directivity.

## Inputs

- `driver-selection`: All drivers in the system with their parameters and frequency response
- `enclosure-specification`: Enclosure design for each driver
- `audio-requirements`: Target frequency response, power handling, and directivity

## Outputs

- `crossover-schematic`: Complete crossover circuit with component values for each driver section
- `summed-response`: Predicted total system frequency response (magnitude and phase) on and off axis
- `impedance-curve`: System impedance vs frequency for amplifier compatibility verification

## Process

1. Set crossover frequencies. The woofer-tweeter crossover must be low enough that the tweeter does not receive excessive excursion-limited energy, and high enough that the woofer is still pistonic (cone breakup modes must be above the crossover). Place the crossover at least one octave below the tweeter Fs and one octave below the woofer's first breakup mode.
2. Select crossover topology: Butterworth (maximally flat at crossover, but lobing off-axis); Linkwitz-Riley (in-phase summation at crossover, flat power response, standard for professional audio); Bessel (best transient response). The order determines the slope: 1st = 6 dB/oct, 2nd = 12, 3rd = 18, 4th = 24. Higher order protects tweeters better and reduces overlap region.
3. Design the passive filter components. For a second-order Linkwitz-Riley high-pass: C = 1/(4*pi*Fc*Re), L = Re/(pi*Fc). For the matching low-pass: L = Re/(pi*Fc), C = 1/(4*pi*Fc*Re). These values assume a resistive load; real drivers have reactive impedance. Add impedance equalization (Zobel network: series R-C across the driver to flatten the impedance rise from voice coil inductance).
4. Simulate the summed response: add the high-pass-filtered tweeter response to the low-pass-filtered woofer response including magnitude and phase. Check for a dip or peak at crossover from driver offset (physical distance between acoustic centers). Apply delay or reverse polarity to the tweeter to correct the summation if needed.
5. Measure the prototype and iterate. Measure each driver's response through its filter section individually, then measure the combined response at the design listening distance and angle. Adjust component values to compensate for real driver behavior that deviates from the model. Check off-axis response: the crossover frequency is where vertical lobing occurs due to driver spacing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
