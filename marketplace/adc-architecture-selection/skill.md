# Adc Architecture Selection

Select the ADC architecture that meets the resolution, sampling rate, power, and area constraints from the available options: SAR, delta-sigma, pipeline, and flash.

## Inputs

- `conversion-spec`: Resolution in bits (ENOB), sampling rate fs, input bandwidth, SNR/SNDR requirements, power budget, area budget
- `system-context`: What drives the ADC (sensor bandwidth, signal type: DC, audio, RF), anti-aliasing filter order available

## Outputs

- `selected-architecture`: ADC type with key parameters: for SAR the number of bits and comparison cycles; for delta-sigma the oversampling ratio OSR and modulator order; for pipeline the number of stages and bits per stage
- `architecture-tradeoffs`: Power-vs-speed figure of merit (Walden FOM = P/(2^ENOB * fs) in fJ/conversion-step), area estimate, and design complexity assessment

## Process

1. Map the resolution-speed space. SAR ADCs cover 8 to 18 bits at up to 10 MSPS, with excellent power efficiency (FOM of 1 to 10 fJ/conv-step in advanced CMOS). Delta-sigma covers 12 to 24 bits at audio to MHz bandwidth, trading speed for resolution through oversampling. Pipeline covers 8 to 16 bits at 10 MSPS to 1 GSPS. Flash covers 4 to 8 bits at multi-GSPS but area and power scale as 2^N.
2. For a SAR ADC at N bits, the comparator must resolve signals smaller than Vref/(2^(N+1)) within one clock period. The DAC settling time must be under T/(N+1) where T = 1/fs (one comparison per bit, plus one for sampling). The total capacitor array size for N bits is 2^N * C_unit, where C_unit is set by the kT/C noise requirement: C_total > kT/(Vn_rms^2) where Vn_rms = Vref/(2^(N+1)*sqrt(12)) for 0.5 LSB noise.
3. For a delta-sigma ADC, the oversampling ratio OSR = fs_clk/(2*BW) where BW is the signal bandwidth and fs_clk is the modulator clock. An Lth-order modulator achieves SQNR = (2L+1)*10*log10(OSR) - 10*log10(pi^(2L)/(2L+1)) dB. A second-order modulator with OSR = 256 achieves about 100 dB SQNR (16+ bits ENOB). Higher orders give more bits per doubling of OSR but require careful stability management.
4. For a pipeline ADC, each stage resolves B bits and passes the residue (amplified by 2^B) to the next stage. The interstage gain amplifier (MDAC) accuracy limits resolution: its gain error and settling must be within 0.5 LSB of the remaining bits. A 1.5-bit/stage architecture (B=1 with digital correction) relaxes comparator offset to +/-Vref/4 instead of Vref/2^N.
5. Compare candidates on the Walden FOM. State-of-the-art SAR ADCs achieve 1 to 5 fJ/conv-step, pipelines achieve 10 to 50 fJ/conv-step, and delta-sigma ADCs achieve 1 to 100 fJ/conv-step depending on bandwidth. If the application allows, a SAR is almost always the most power-efficient choice below 10 MSPS.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
