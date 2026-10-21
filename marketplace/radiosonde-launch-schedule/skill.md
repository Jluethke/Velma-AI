# Radiosonde Launch Schedule

Design the radiosonde launch schedule to capture diurnal boundary layer evolution, synoptic transitions, and special event triggers.

## Inputs

- `campaign-objectives`: Vertical profiling requirements
- `measurement-period`: Campaign dates and intensive observation periods

## Outputs

- `launch-schedule`: Calendar of launches with times, balloon specs, and payload configuration
- `launch-sop`: Standard operating procedure for sonde preparation, inflation, release, and data QC

## Process

1. Set baseline launch times to match WMO synoptic hours (00Z, 12Z) plus dawn/dusk for boundary layer transitions
2. Add intensive observation period launches at 3-hour intervals during target meteorological events
3. Define event-triggered launches (thunderstorm approach, frontal passage, pollution episode)
4. Write the launch SOP covering sonde activation, surface check, inflation, release criteria, and real-time data QC

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
