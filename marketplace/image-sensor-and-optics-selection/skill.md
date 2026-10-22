# Image Sensor And Optics Selection

Select the image sensor and lens combination to meet the resolution, sensitivity, dynamic range, and frame rate requirements.

## Inputs

- `imaging-requirements`: Field of view, spatial resolution (um or line pairs/mm), frame rate, spectral band, dynamic range (dB), sensitivity (minimum detectable signal)
- `operating-conditions`: Working distance, ambient illumination, vibration, temperature range, size and weight constraints

## Outputs

- `sensor-selection`: Sensor format, pixel count, pixel size, full well capacity, read noise (e-), dark current (e-/s), quantum efficiency at operating wavelength, readout architecture (global shutter vs rolling shutter), frame rate at full resolution
- `lens-selection`: Focal length, f-number, mount type, resolution (lp/mm at center and corner), distortion, working distance, depth of field

## Process

1. From the required field of view and spatial resolution, compute the minimum pixel count: N_pixels = FOV / GSD where GSD (ground sample distance) = resolution / 2 (Nyquist). For a 100mm FOV with 50um resolution: N_pixels = 100mm / 25um = 4000 pixels, requiring at least a 4k sensor.
2. Select the pixel size: smaller pixels give higher resolution per unit sensor area but collect fewer photons per pixel. The signal per pixel: S = E * A_pixel * t * QE / (h*v) where E is the irradiance at the sensor, A_pixel is the pixel area, t is the integration time, and QE is the quantum efficiency. The pixel must not saturate (S < full_well) and must exceed the noise floor (S > k * sqrt(read_noise^2 + dark_current*t + S)).
3. Dynamic range in dB = 20*log10(full_well_capacity / read_noise). Scientific CCD: 70-80 dB. Scientific CMOS (sCMOS): 80-90 dB with dual-gain readout. Consumer CMOS: 60-70 dB. If the scene dynamic range exceeds the sensor, use HDR mode (multiple exposures) or logarithmic response sensors.
4. For the lens: focal length f = (sensor_size / 2) / tan(half_FOV). Or equivalently, f = working_distance * sensor_size / FOV for the object-space FOV. Select an f-number that balances depth of field (larger f/# = more DOF) against diffraction limit (Airy disk diameter = 2.44 * lambda * f/#). The lens resolving power must exceed the Nyquist frequency: MTF > 0.2 at 1/(2*pixel_pitch) lp/mm.
5. Depth of field: DOF = 2 * N * c * (1 + M) / M^2 where N is the f-number, c is the circle of confusion (= pixel size for diffraction-limited), and M is the magnification. For large DOF at high magnification, consider focus stacking or telecentric lenses (constant magnification across the DOF).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
