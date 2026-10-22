# Link Margin Calculation

Combine the EIRP, path loss, and receiver sensitivity to calculate the link margin and determine if the link closes for the target availability.

## Inputs

- `eirp-calculation`: EIRP in dBm with breakdown
- `total-path-loss`: Total path loss in dB with all atmospheric and environmental terms
- `receiver-sensitivity`: Minimum signal level in dBm
- `fade-margin-analysis`: Required fade margin for target availability
- `receiver-gain-budget`: Receive-side gains and losses

## Outputs

- `link-budget-result`: Complete link budget table showing every gain and loss term, the received signal level, the noise floor, the SNR, and the link margin in dB
- `link-closure-assessment`: Whether the link closes with positive margin, the margin available, and the limiting factor if it does not close

## Process

1. Calculate received signal power: P_rx = EIRP - total_path_loss + receive_antenna_gain - receive_cable_loss.
2. Calculate link margin: margin = P_rx - receiver_sensitivity. This is the margin above the minimum for the required BER at clear-sky conditions.
3. Compare the available margin to the required fade margin. If margin >= fade_margin, the link meets the availability target. If not, the link does not close.
4. Build the complete link budget table: every term from PA output through to demodulator input, clearly labeled as gain (+) or loss (-).
5. If the link does not close, identify which term is the most cost-effective to improve: increasing antenna size, reducing cable loss, improving noise figure, increasing transmit power, or selecting a lower-order modulation scheme with better sensitivity.
6. Document the sensitivity of the margin to key parameters: how many dB does the margin change per 1 dB change in each critical parameter. This identifies the fragile assumptions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
