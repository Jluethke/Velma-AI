# Link Requirements Extraction

Extract the link requirements from the system specification: data rate, bit error rate target, modulation scheme, operating frequency, distance, and target availability percentage.

## Inputs

- `system-specification`: The wireless system requirements including data rate, BER, frequency, distance, and availability targets
- `operating-environment`: Description of the deployment environment: indoor, outdoor, urban, rural, satellite, or point-to-point

## Outputs

- `link-requirements`: Structured requirements: frequency (Hz), data rate (bps), BER target, modulation type, coding rate, distance (m), availability (%)
- `channel-model-selection`: The propagation model selected for this environment (free space, Hata, COST-231, ITU-R P.530, rain attenuation model)

## Process

1. Record the operating frequency, required data rate, and acceptable bit error rate from the specification.
2. Determine the modulation scheme and coding rate. Calculate the required Eb/No from the BER target using the modulation's BER curve. For BPSK, BER = Q(sqrt(2*Eb/No)). For QPSK, same Eb/No as BPSK. For 16-QAM, approximately 3 dB worse.
3. Convert Eb/No to required SNR: SNR_dB = Eb/No_dB + 10*log10(data_rate/noise_bandwidth).
4. Select the propagation model based on environment. Free space for clear line-of-sight satellite or microwave links. Hata or COST-231 for cellular urban/suburban. ITU-R P.530 for terrestrial point-to-point microwave.
5. Document the link geometry: antenna heights, terrain type, whether Fresnel zone clearance is achievable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
