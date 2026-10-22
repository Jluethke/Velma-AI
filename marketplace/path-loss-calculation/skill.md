# Path Loss Calculation

Calculate the total path loss between transmitter and receiver antennas using the selected propagation model, including all atmospheric and environmental effects.

## Inputs

- `link-requirements`: Frequency, distance, and environment parameters
- `channel-model-selection`: The propagation model to apply

## Outputs

- `total-path-loss`: Total path loss in dB with breakdown: free-space loss, atmospheric absorption, rain attenuation, diffraction loss, and any additional margin terms
- `fade-margin-analysis`: Required fade margin for the target availability, based on fading statistics for the link geometry and climate

## Process

1. Calculate free-space path loss: FSPL_dB = 20*log10(4*pi*d/lambda) = 20*log10(d_km) + 20*log10(f_GHz) + 92.45. This is the baseline loss.
2. Add atmospheric gas absorption. Use ITU-R P.676: oxygen absorption peaks at 60 GHz (about 15 dB/km), water vapor peaks at 22 GHz and 183 GHz. Below 10 GHz, atmospheric absorption is negligible for links under 50 km.
3. For frequencies above 10 GHz, calculate rain attenuation using ITU-R P.838: specific attenuation gamma_R = k * R^alpha dB/km, where R is rain rate in mm/hr and k, alpha are frequency and polarization dependent coefficients. Use the rain rate exceeded for the complement of the target availability.
4. For terrestrial links, check Fresnel zone clearance. The first Fresnel zone radius at midpoint: r1 = sqrt(lambda*d1*d2/(d1+d2)). If clearance is less than 0.6*r1, add diffraction loss using knife-edge or Bullington method.
5. For multipath fading on terrestrial links, calculate fade margin using the Vigants-Barnett method or ITU-R P.530. Flat fading probability depends on path length, frequency, climate, and terrain roughness.
6. Sum all losses: total_path_loss = FSPL + atmospheric + rain + diffraction + any additional environment-specific losses.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
