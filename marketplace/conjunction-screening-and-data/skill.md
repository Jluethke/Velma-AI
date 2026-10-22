# Conjunction Screening And Data

Screen the spacecraft ephemeris against the catalog and ingest conjunction data for close approaches.

## Inputs

- `spacecraft_ephemeris`: Predicted orbit and covariance of the protected spacecraft.
- `tracking_data_sources`: Catalog and conjunction data feeds such as public space-tracking services.
- `screening_parameters`: Screening volume and look-ahead window.

## Outputs

- `conjunction_list`: Ranked close approaches within the look-ahead window.
- `close_approach_data`: Time of closest approach, miss distance, and combined covariance per event.

## Process

1. Ingest conjunction data messages, which report the time of closest approach, the miss vector, and the state covariance of both objects.
2. Screen with an ellipsoidal volume around the protected orbit over a look-ahead window of about 3 to 7 days.
3. Record for each event the time of closest approach, the radial and cross-track and along-track miss components, and the relative velocity.
4. Note the covariance quality, which comes from the tracking cadence and sensor type (radar in low orbit, optical for high orbit); poor covariance makes any probability estimate unreliable.
5. Keep in mind the catalog tracks objects down to roughly 10 cm in low orbit, so smaller lethal debris is not screened and remains a background risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
