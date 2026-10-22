# Thermal Camera Measurement

Configure and use a thermal camera for non-contact temperature measurement with proper emissivity correction, reflected temperature compensation, and spatial resolution awareness.

## Inputs

- `measurement-targets`: Components and areas to measure, including surface materials
- `thermocouple-configuration`: Thermocouple locations for cross-calibration with the thermal camera

## Outputs

- `thermal-images`: Calibrated thermal images of the board showing temperature distribution with correct emissivity settings for each material
- `emissivity-correction-map`: Emissivity values used for each surface material, with the method of determination (lookup table, contact measurement comparison, or tape method)
- `hotspot-identification`: Component temperatures from the thermal camera cross-referenced with thermocouple readings, identifying the hottest components and their operating margin

## Process

1. Set the thermal camera parameters: focus at the working distance, temperature range matching expected board temperatures, frame averaging for noise reduction. For electronics, a camera with NETD (noise equivalent temperature difference) of 50mK or better and spatial resolution of 25um or better per pixel at the working distance is recommended.
2. Correct emissivity for each material. Emissivity values for common electronics materials: black IC package mold compound 0.85-0.95, white silkscreen 0.80-0.90, bare copper 0.03-0.10 (extremely low, unreliable for direct measurement), solder 0.40-0.60, FR-4 laminate 0.85-0.95, aluminum heat sink (anodized) 0.80-0.90, (bare) 0.05-0.10.
3. For surfaces with low or uncertain emissivity (exposed copper, bare metal heat sinks), apply a thin layer of high-emissivity tape or paint to a portion of the surface. Measure the taped area (known emissivity approximately 0.95) and adjust the camera emissivity for the untaped area until both read the same temperature. This gives the true emissivity for that surface.
4. Set the reflected temperature (background radiation) correctly. In an indoor environment, the reflected temperature is approximately equal to the ambient air temperature. For measurements near hot objects (soldering stations, other boards), the reflected temperature from those objects can raise the apparent temperature of low-emissivity surfaces. Measure reflected temperature using a crumpled aluminum foil target.
5. Cross-calibrate with thermocouple readings. Compare the thermal camera reading at each thermocouple location with the thermocouple measurement. Agreement within plus or minus 2C for high-emissivity surfaces confirms correct camera setup. For low-emissivity surfaces, the thermocouple is the reference and the camera emissivity must be adjusted until the camera matches the thermocouple.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
