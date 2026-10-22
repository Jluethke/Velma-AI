# Optical Sensor Calibration Deployment

Calibrate the optical sensor system and install it in the field with proper bonding, routing, and protection.

## Inputs

- `interrogation-system`: Complete interrogator configuration
- `sensor-element-design`: Sensor element specifications
- `cross-sensitivity-analysis`: Known cross-sensitivities to compensate

## Outputs

- `calibration-certificate`: Calibration data linking sensor output to traceable reference measurements
- `installation-procedure`: Step-by-step bonding, routing, and protection procedure for field sensors
- `measurement-uncertainty-budget`: Total measurement uncertainty from all contributing sources

## Process

1. Calibrate each sensor against a traceable reference. For FBG strain sensors: mount on a calibration beam with known applied strain (foil strain gauge reference, calibrated to within 1%). Record FBG wavelength shift versus applied strain. Fit the gauge factor (typically 0.78 pm/microstrain at 1550nm). For temperature: calibrate in a thermal chamber against a traceable RTD or thermocouple.
2. Build the measurement uncertainty budget. Sources: interrogator wavelength accuracy, sensor gauge factor uncertainty, temperature compensation residual, bonding transfer function, long-term wavelength drift, connector repeatability. Combine using root-sum-square for independent sources. Express as expanded uncertainty (k=2, 95% confidence).
3. Install sensors. For strain measurement on structures: surface preparation (clean, abrade to Sa 2.5), adhesive selection (cyanoacrylate for short-term, epoxy for long-term, ceramic cement for high temperature). Fiber routing with adequate bend radius (> 15mm for standard SMF). Strain relief at ingress/egress points. Protect with a cover or embedment in composite structures.
4. For embedded sensors in composite structures, place the fiber between plies during layup. Fiber orientation matters: align with the reinforcement direction to minimize resin pocket formation. Entry and exit points need strain relief to prevent fiber breakage during cure. The embedding changes the effective gauge factor (stiffer host structure transfers less strain to the fiber).
5. Commission the installed system. Verify all sensor channels respond. Apply a known load or temperature change and compare the reading to the calibration. Set baseline readings (zero strain, ambient temperature). Configure data logging, alarming thresholds, and remote access. Document the installation with photographs and coordinates of each sensor location.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
