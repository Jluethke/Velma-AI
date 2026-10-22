# Adc Specification Analysis

Map the ADC specifications (resolution, sampling rate, input bandwidth, power budget) to candidate architectures using the Walden figure of merit and Schreier figure of merit.

## Inputs

- `resolution-requirement`: Effective number of bits (ENOB) or SNR/SNDR target
- `sampling-rate`: Nyquist rate or oversampling rate in MS/s or GS/s
- `power-budget`: Maximum power consumption in milliwatts
- `input-bandwidth`: Signal bandwidth of interest

## Outputs

- `candidate-architectures`: Ranked list of ADC architectures with estimated power and area for each
- `selected-architecture`: Best architecture with quantitative justification

## Process

1. Calculate the Walden FOM: FOM_W = Power / (2^ENOB * fs) in fJ/conversion-step. State-of-the-art SAR ADCs achieve 1-10 fJ/step. Pipeline ADCs achieve 10-100 fJ/step. Sigma-delta achieves 1-10 fJ/step at audio rates.
2. Calculate the Schreier FOM: FOM_S = SNDR + 10*log10(BW/Power) in dB. This FOM better captures the thermal noise limit. State-of-the-art exceeds 175 dB for SAR at moderate speeds.
3. Architecture selection by speed and resolution: Flash (1-8 bits, >1 GS/s, 2^N-1 comparators, extreme power), Pipeline (8-14 bits, 10 MS/s to 1 GS/s, staged conversion with residue amplification), SAR (6-18 bits, 1 kS/s to 500 MS/s, single comparator with binary search), Sigma-delta (12-24 bits, 1 kS/s to 50 MS/s, oversampling and noise shaping).
4. For 10-14 bits at 100 MS/s to 1 GS/s, SAR and pipeline compete. SAR has lower power at lower speeds; pipeline has a throughput advantage from pipelining. Time-interleaved SAR is increasingly dominant at 28nm and below.
5. For >16 bits at <10 MS/s, sigma-delta is the only practical choice. The oversampling ratio (OSR = fs/(2*BW)) determines the noise shaping benefit: each doubling of OSR adds (L+0.5)*6 dB of SNR, where L is the modulator order.
6. Check that the selected architecture's theoretical limits (kT/C noise, comparator metastability, quantization noise) do not preclude meeting the specification before beginning detailed design.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
