# Site Chronology Builder

Combine standardized individual series into a site chronology using a biweight resistant mean, and assess signal strength.

## Inputs

- `standardized-indices`: Standardized ring-width indices for all samples at the site
- `sample-metadata`: Sample counts and date ranges

## Outputs

- `site-chronology`: Mean site chronology with sample depth and confidence intervals
- `signal-strength-statistics`: Expressed population signal (EPS), running Rbar, and sample depth over time

## Process

1. Compute the biweight mean of all standardized series for each year
2. Calculate the running EPS and Rbar to assess where the chronology has adequate signal strength
3. Truncate the chronology where EPS falls below the 0.85 threshold
4. Plot the final chronology with sample depth and EPS over time

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
