# Modulation Coding And Margin

Select modulation and forward error correction, then close the budget with positive link margin.

## Inputs

- `received_snr`: Available energy-per-bit to noise-density.
- `carrier_to_noise`: Carrier-to-noise-density for acquisition checks.
- `required_data_rate`: Rate that the chosen scheme must support.

## Outputs

- `modcod_selection`: Modulation and coding scheme.
- `link_margin`: Margin of available over required energy per bit.
- `closed_link_budget`: Final budget showing a positive margin at the data rate.

## Process

1. Uncoded coherent BPSK or QPSK needs about 9.6 dB of Eb/N0 for a 1e-5 bit error rate; this is the reference before coding.
2. Forward error correction buys coding gain: concatenated convolutional and Reed-Solomon gives several dB, and modern turbo or LDPC codes operate within 1 to 2 dB of the Shannon limit.
3. Link margin = available Eb/N0 - required Eb/N0 for the chosen scheme - implementation loss (typically 1 to 2 dB).
4. Target at least 3 dB of margin for an operational link so weather, aging, and pointing error do not break it.
5. If the margin is negative, raise EIRP, grow an antenna, lower the data rate, or move to a stronger code, and re-close the budget.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
