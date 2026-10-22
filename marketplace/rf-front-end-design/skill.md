# Rf Front End Design

Design the RF front end including the LNA, mixer, filters, and PA to meet the sensitivity and linearity requirements from the link budget.

## Inputs

- `link-budget-table`: Required sensitivity, maximum input power (for blocker scenarios), and transmit power
- `frequency-band`: Center frequency, bandwidth, adjacent channel rejection requirement

## Outputs

- `receiver-chain`: LNA noise figure and gain, mixer conversion loss and IIP3, IF/baseband filter bandwidth, and overall receiver noise figure and dynamic range
- `transmitter-chain`: PA output power, efficiency (PAE), linearity (EVM, ACPR), harmonic filtering

## Process

1. Cascaded noise figure (Friis equation): NF_total = NF1 + (NF2 - 1)/G1 + (NF3 - 1)/(G1*G2) + ... where NF and G are in linear (not dB). The LNA dominates the overall noise figure if its gain is high enough. For NF_total < 3 dB: choose an LNA with NF < 1.5 dB and gain > 15 dB, so the mixer noise contribution (NF2-1)/G1 < 1 dB even with a high-loss mixer.
2. LNA selection: key parameters are noise figure, gain, IIP3 (input third-order intercept point), and current consumption. For 2.4 GHz: typical integrated LNAs achieve NF = 1 to 2 dB, gain = 15 to 20 dB, IIP3 = -10 to 0 dBm. The LNA must not saturate from strong nearby transmitters; the maximum input without compression is P1dB_input = IIP3 - 9.6 dB.
3. Mixer selection: for superheterodyne, the mixer converts RF to IF. Conversion loss is typically 6 to 8 dB for passive mixers (no gain, but excellent linearity with IIP3 > +15 dBm) and -10 to -15 dB (gain) for active mixers (worse linearity with IIP3 around -5 dBm). For direct-conversion (zero-IF), the mixer converts directly to baseband, eliminating the IF filter but introducing DC offset and 1/f noise challenges.
4. System IIP3 (cascaded): 1/IIP3_total = 1/IIP3_1 + G1/IIP3_2 + G1*G2/IIP3_3 + ... The last stage before the ADC typically dominates the linearity because it sees the highest signal level. Design the gain distribution so that the signal level at each stage stays well below that stage's P1dB.
5. PA design for the transmitter: the required output power from the link budget sets the PA power rating. Power-added efficiency PAE = (Pout - Pin) / Pdc is the key figure of merit. Class A: PAE up to 50 percent but typically 25 to 35 percent. Class AB: 40 to 60 percent. Class E/F (switching mode): 60 to 80 percent but only for constant-envelope modulations (FSK, GMSK). For non-constant-envelope modulations (QAM, OFDM), back off the PA by 6 to 10 dB from P1dB to meet EVM and spectral mask requirements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
