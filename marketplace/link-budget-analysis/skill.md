# Link Budget Analysis

Calculate the complete link budget to determine whether the required range is achievable with the available transmit power and receiver sensitivity.

## Inputs

- `system-requirements`: Required range, data rate, BER target, operating frequency band (915 MHz, 2.4 GHz, etc.), environment (indoor, outdoor, urban, rural)
- `regulatory-limits`: Maximum EIRP from regulations (FCC Part 15: +30 dBm for 902-928 MHz, +20 dBm for 2.4 GHz ISM)

## Outputs

- `link-budget-table`: Complete link budget from transmitter to receiver: Tx power, antenna gains, path loss, fade margin, cable losses, and resulting received power vs receiver sensitivity
- `link-margin`: The margin between received power and sensitivity, which must be positive by at least the fade margin (typically 10 to 20 dB for outdoor, 20 to 30 dB for indoor with multipath)

## Process

1. Free-space path loss (FSPL): FSPL(dB) = 20*log10(d) + 20*log10(f) + 32.45 where d is distance in km and f is frequency in MHz. At 2.4 GHz and 100 meters: FSPL = 20*log10(0.1) + 20*log10(2400) + 32.45 = -20 + 67.6 + 32.45 = 80 dB. At 915 MHz and 1 km: FSPL = 0 + 59.2 + 32.45 = 91.7 dB.
2. Add environment-specific losses. Indoor: wall penetration loss (5 to 15 dB per wall depending on material: drywall 3 dB, concrete 10 dB, metal 20+ dB), floor penetration (10 to 20 dB per floor). Outdoor urban: Hata model or Okumura-Hata for distances beyond 1 km. Vegetation: 0.2 dB/m for foliage at 2.4 GHz.
3. Fade margin accounts for multipath fading (constructive and destructive interference from reflected signals) and shadowing (obstruction by moving objects). For 99 percent link availability in a Rayleigh fading environment, the fade margin must be 20 dB. For 99.9 percent: 30 dB. Indoor environments with strong multipath need higher margins.
4. Received power: Prx(dBm) = Ptx(dBm) + Gtx(dBi) - Lcable_tx(dB) - FSPL(dB) - Lmisc(dB) + Grx(dBi) - Lcable_rx(dB). The link margin is: Margin = Prx - Sensitivity - Fade_margin. If margin is negative, the link cannot close at the required range. Options: increase Tx power (up to regulatory limit), increase antenna gain (larger antenna), reduce data rate (improves sensitivity), or reduce range.
5. Sensitivity is set by the required Eb/N0 for the modulation and coding at the target BER: Sensitivity(dBm) = -174 + 10*log10(BW) + NF + Eb/N0_required where -174 dBm/Hz is the thermal noise floor at 290K, BW is the receiver noise bandwidth in Hz, and NF is the receiver noise figure in dB. For BLE (1 MHz BW, NF = 6 dB, GFSK with Eb/N0 = 10 dB for BER 1e-3): Sensitivity = -174 + 60 + 6 + 10 = -98 dBm.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
