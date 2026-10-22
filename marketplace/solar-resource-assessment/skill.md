# Solar Resource Assessment

Characterize the solar resource at a site using TMY data, converting global horizontal irradiance (GHI) to plane-of-array (POA) irradiance through transposition models, and quantifying shading losses from horizon profiles and nearby obstructions.

## Inputs

- `site-coordinates`: Latitude and longitude of the project site
- `tmy-data-source`: Typical Meteorological Year dataset (NSRDB, Meteonorm, SolarAnywhere) with GHI, DNI, DHI, temperature, wind speed

## Outputs

- `poa-irradiance-profile`: Monthly and annual POA irradiance in kWh/m2 for the selected tilt and azimuth, with shading loss factors applied
- `site-thermal-profile`: Ambient temperature distribution and wind speed statistics for cell temperature modeling

## Process

1. Obtain TMY data for the site. Compare at least two data sources (NSRDB and Meteonorm) and use the lower P50 value unless site-specific ground measurements exist for correlation.
2. Select array tilt and azimuth. For fixed-tilt, start with latitude tilt for annual optimization or latitude minus 10-15 degrees for summer-peaking loads. For trackers, model single-axis horizontal with backtracking.
3. Apply a transposition model to convert GHI/DNI/DHI to POA irradiance. Use the Perez model for accuracy or Hay-Davies as a simpler alternative. The choice affects annual yield by 1-3%.
4. Build a horizon profile from site survey or lidar data. Calculate row-to-row shading loss from the ground coverage ratio (GCR). For fixed-tilt, GCR of 0.35-0.45 balances energy density with shading loss.
5. Quantify the site thermal profile. Cell temperature follows the Sandia or NOCT model: Tcell = Tamb + (NOCT - 20)/800 x POA. Higher wind speeds reduce cell temperature. This feeds the temperature derate in yield modeling.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
