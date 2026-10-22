# Data Rate And Link Requirements

Derive the communication data rate from payload data generation, onboard storage, contact time, and required downlink margin, then establish the link requirements.

## Inputs

- `payload-data-rate`: Raw data generation rate, compression ratio, onboard processing capability
- `orbit-and-ground-stations`: Orbit parameters, ground station locations, contact durations per pass, passes per day

## Outputs

- `link-requirements`: Required downlink rate, uplink rate, contact schedule, onboard storage capacity
- `frequency-band-selection`: Selected RF band with regulatory and performance justification

## Process

1. Calculate the daily data volume: V_daily = R_payload * T_acquisition * C_ratio + V_housekeeping, where R_payload is the raw data rate, T_acquisition is the daily observation time, and C_ratio is the compression ratio (typically 2:1 to 10:1 depending on data type).
2. Calculate the available contact time per day: T_contact = sum(T_pass_i) for all ground station passes. For a LEO satellite at 500 km with a 5-degree minimum elevation, a typical pass duration is 6-10 minutes. A single mid-latitude ground station gives 4-6 passes per day.
3. Determine the required downlink data rate: R_downlink = V_daily / (T_contact * eta_link), where eta_link accounts for link acquisition time, protocol overhead, and retransmissions (typically 0.70-0.85). If R_downlink exceeds practical limits for the band, increase ground stations, add onboard storage and process over multiple days, or use relay satellites.
4. Select the frequency band. S-band (2-4 GHz): moderate data rate (up to ~10 Mbps), small antenna, well-established, ITAR-free components available. X-band (8-12 GHz): higher data rate (up to ~800 Mbps), requires better pointing. Ka-band (26-40 GHz): highest data rate (>1 Gbps), rain fade is significant, requires precise pointing. Optical: highest data rate, immune to RF interference, requires sub-arcsecond pointing.
5. Size the onboard data storage: S_onboard = V_daily * N_margin, where N_margin is 1.5-2x to handle missed contacts. Select solid-state recorder technology. Radiation-hardened NAND flash for most missions; space-qualified SDRAM for high-speed buffering.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
