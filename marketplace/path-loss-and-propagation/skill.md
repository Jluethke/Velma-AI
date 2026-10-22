# Path Loss And Propagation

Compute free-space path loss and the atmospheric, rain, and polarization losses along the link.

## Inputs

- `contact_geometry`: Slant range and elevation for the worst-case pass.
- `antenna_design`: Frequency and polarization of the link.

## Outputs

- `path_loss_budget`: Free-space path loss in decibels.
- `propagation_losses`: Atmospheric, rain, and polarization-mismatch losses.

## Process

1. Free-space path loss (dB) = 20*log10(4*pi*d/lambda) = 92.45 + 20*log10(d_km) + 20*log10(f_GHz).
2. Worked case geostationary range 35786 km at 8.4 GHz gives about 202 dB of free-space loss.
3. Add gaseous atmospheric loss (a few tenths of a dB at X-band near zenith, rising at low elevation) from oxygen and water-vapor absorption.
4. Add rain attenuation, small at S- and X-band but tens of dB at Ka-band and low elevation, and set it from the availability target (for example 99.9 percent).
5. Add polarization-mismatch loss (small for matched circular polarization) and any radome or feed loss at the ground station.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
