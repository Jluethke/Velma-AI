# Astronomical Target Selector

Select observation targets based on scientific goals, visibility, brightness, and sky conditions.

## Inputs

- `science-goals`: What to measure or detect (transits, spectra, variability, astrometry)
- `telescope-specs`: Aperture, instruments available, site latitude, and typical seeing

## Outputs

- `target-list`: Targets with coordinates, magnitudes, spectral types, and priority ranking
- `visibility-windows`: Observable dates, hour angles, and airmass constraints per target
- `finder-charts`: Star charts centered on each target with comparison stars marked

## Process

1. Query catalogs (Simbad, VizieR, MAST) for candidate targets matching science criteria
2. Filter by magnitude limits, declination, and crowding
3. Compute visibility for each target across the observing season
4. Rank by priority and prepare finder charts with comparison and check stars

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
