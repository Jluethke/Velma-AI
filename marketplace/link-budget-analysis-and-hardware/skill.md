# Link Budget Analysis And Hardware

Perform the detailed link budget calculation for both uplink and downlink, select the transponder and antenna hardware, and verify link closure with adequate margin.

## Inputs

- `link-requirements`: Required data rates and contact geometry
- `frequency-band-selection`: Chosen RF band

## Outputs

- `link-budget`: Complete link budget with all gains and losses, achieved Eb/No vs required, and link margin
- `communication-hardware`: Transponder selection, antenna type and gain, RF power, ground station requirements

## Process

1. Build the link budget. Start with transmit power P_tx (dBW). Add transmit antenna gain G_tx (dBi). Subtract path losses: free space path loss FSPL = 20*log10(4*pi*d*f/c) in dB, where d is the slant range (worst case: maximum range at minimum elevation) and f is the frequency. Subtract atmospheric loss (0.1-0.5 dB for S/X-band, 1-3 dB for Ka-band at low elevation). Subtract rain fade margin for Ka-band (3-10 dB depending on availability requirement and ground station latitude).
2. Add receive antenna gain G_rx (dBi). Subtract system noise temperature contribution: T_sys = T_antenna + T_feed + T_LNA * L_feed, where T_LNA is the LNA noise temperature (typically 50-150K for space, 20-50K for ground). Convert to G/T figure of merit.
3. Calculate received C/No = EIRP - FSPL - L_atm + G/T - k_Boltzmann (in dB-Hz). Then Eb/No = C/No - 10*log10(R_data). Compare to required Eb/No for the selected modulation and coding: BPSK uncoded needs ~10 dB, QPSK with rate-1/2 turbo code needs ~1 dB at BER = 10^-6.
4. Calculate link margin = achieved Eb/No - required Eb/No. Target 3 dB minimum margin for established links, 6 dB for new designs. If margin is insufficient, increase transmit power, antenna gain, or reduce data rate. If margin is excessive, reduce transmit power or increase data rate.
5. Select hardware. Spacecraft transponder: transmit power (1-50W typical), receiver sensitivity, modulation capability. Spacecraft antenna: patch (5-8 dBi, wide beam for omni coverage), horn (15-20 dBi), parabolic reflector (25-45 dBi, requires tracking). Ground station: dish diameter sets G/T (3m dish gives ~38 dBi at X-band). Verify that the selected antenna beamwidth is compatible with the spacecraft pointing accuracy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
