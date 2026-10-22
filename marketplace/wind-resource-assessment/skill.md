# Wind Resource Assessment

Characterize the wind resource at a site using measurement campaigns, statistical distribution fitting, and long-term correlation to produce a bankable energy estimate.

## Inputs

- `site-location`: Project site coordinates, terrain type, and land area
- `measurement-campaign-data`: Met mast or lidar data (minimum 12 months) with wind speed, direction, temperature, and pressure at multiple heights

## Outputs

- `wind-resource-characterization`: Long-term corrected wind speed distribution at hub height, wind rose, turbulence intensity, wind shear profile, and seasonal patterns
- `site-wind-parameters`: Weibull shape and scale parameters, IEC turbine class determination, and extreme wind speed estimates

## Process

1. Validate the measurement data. Check for sensor icing (flat-line periods in winter), tower shadow effects (speed deficit at azimuths behind the tower), and data recovery rate (require greater than 90% for bankability). Apply corrections for tower shadow using direction-dependent exclusion sectors.
2. Fit a Weibull distribution to the wind speed data at each measurement height. The two-parameter Weibull (shape k and scale A) is the industry standard. Method of moments or maximum likelihood estimation. Verify the fit with a chi-squared or Kolmogorov-Smirnov test. Typical onshore sites have k between 1.8 and 2.5.
3. Extrapolate to hub height using the wind shear profile. Measure shear from at least two heights on the met mast. The power law exponent alpha typically ranges from 0.10 (flat, smooth terrain) to 0.25 (rough, forested terrain). Use the log law with roughness length for more physics-based extrapolation. Lidar measurements above 100m reduce extrapolation uncertainty.
4. Correlate to long-term reference data. The measurement period (1-3 years) may not represent the long-term mean. Use MCP (Measure-Correlate-Predict) with a 10-20 year reference dataset (reanalysis data like ERA5, or a nearby long-term met station). Apply the correlation to adjust the on-site data to the long-term mean. This step typically shifts the annual mean wind speed by +/- 5% and is a major source of uncertainty.
5. Determine the IEC turbine class from the hub-height wind parameters. Class I: Vref = 50 m/s, Vave = 10 m/s. Class II: Vref = 42.5 m/s, Vave = 8.5 m/s. Class III: Vref = 37.5 m/s, Vave = 7.5 m/s. Turbulence category A (Iref = 0.16), B (0.14), or C (0.12). The turbine selected must be certified for a class equal to or above the site conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
