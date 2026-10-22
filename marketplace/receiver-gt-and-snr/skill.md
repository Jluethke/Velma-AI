# Receiver Gt And Snr

Combine the receiver figure of merit with the link to get carrier-to-noise-density and signal-to-noise.

## Inputs

- `path_loss_budget`: Loss between transmitter and receiver.
- `eirp_budget`: Radiated power at the transmitter.
- `required_data_rate`: Rate that converts carrier-to-noise-density into energy per bit.

## Outputs

- `gt_budget`: Receiver gain-to-noise-temperature figure of merit.
- `carrier_to_noise`: Carrier-to-noise-density ratio of the link.
- `received_snr`: Energy-per-bit to noise-density ratio.

## Process

1. Receiver figure of merit G/T = receive-antenna gain (dBi) - 10*log10(system noise temperature in K).
2. System noise temperature = antenna noise + receiver noise, referred to the antenna port; a cooled or low-noise front end lowers it and raises G/T.
3. Carrier-to-noise-density C/N0 = EIRP - free-space loss - other losses + G/T - Boltzmann constant (where 10*log10(k) = -228.6 dBW/K/Hz).
4. Energy per bit to noise density Eb/N0 = C/N0 - 10*log10(bit rate).
5. Carry the result in decibels throughout so each gain and loss simply adds, and keep the worst-case geometry and weather in the numbers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
