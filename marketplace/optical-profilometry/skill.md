# Optical Profilometry

Measure surface topography with vertical resolution from nm to mm using confocal, focus variation, or coherence scanning techniques.

## Inputs

- `interferometer-setup`: If interferometry is used as a complementary technique, its parameters
- `measurement-target`: Surface roughness range, lateral resolution, measurement area, sample material (reflective, transparent, rough)

## Outputs

- `profilometer-setup`: Instrument type (confocal, focus variation, coherence scanning/white-light interferometry, stylus for comparison), objective magnification, vertical range and resolution, lateral resolution, scan speed
- `topography-results`: 3D surface map, line profiles, surface roughness parameters (Sa, Sq, Sz, Ssk, Sku per ISO 25178), bearing area curve, PSD

## Process

1. Select the technique by the roughness range: stylus profilometry (contact, Ra 0.01-100um, highest dynamic range but 2D only and may scratch soft surfaces), confocal microscopy (optical, Sa 0.01-10um, 3D, good for steep slopes up to 70 degrees), coherence scanning interferometry (optical, Sa 0.1nm-100um, highest vertical resolution but fails on rough or steep surfaces), focus variation (optical, Sa 0.01-1000um, works on rough surfaces with diffuse reflection).
2. For confocal microscopy: the depth discrimination comes from the pinhole rejecting out-of-focus light. Axial resolution = 0.64 * lambda / (n - sqrt(n^2 - NA^2)). Lateral resolution = 0.61 * lambda / NA. Scan the objective vertically through the surface height range, recording the intensity at each pixel at each z-position. The z-position of maximum intensity is the surface height.
3. For coherence scanning interferometry (CSI / white-light interferometry): the short coherence length of the broadband source (10-20um for a white LED) produces fringes only when the path difference is near zero. Scan the objective vertically and record the fringe contrast at each pixel. The z-position of maximum fringe contrast (or the peak of the coherence envelope) gives the surface height. Vertical resolution: < 1nm.
4. Compute the surface roughness parameters per ISO 25178: Sa (arithmetic mean height), Sq (root mean square height), Sz (maximum height), Ssk (skewness: negative = valleys dominate, positive = peaks dominate), Sku (kurtosis: > 3 = sharp peaks/valleys, < 3 = rounded). Apply the appropriate spatial filter (S-filter and L-filter) to separate roughness from waviness and form.
5. Measurement uncertainty for optical profilometry: sources include vertical noise (from detector noise and vibration), lateral resolution (limits the ability to measure steep slopes: slope > arctan(lambda / (2 * lateral_resolution)) causes signal dropout), reference mirror flatness, scanner linearity, and environmental effects. For sub-nm measurements, temperature stability of 0.1K and vibration isolation to < 1um/s are needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
