# Terrain Matching Algorithm

Design the terrain matching algorithm that correlates measured terrain profiles with the database to estimate position corrections.

## Inputs

- `terrain-sensor-specification`: Sensor measurement characteristics
- `terrain-database`: Formatted terrain elevation database
- `measurement-error-model`: Sensor error statistics

## Outputs

- `matching-algorithm`: Complete terrain matching algorithm with position correction output and confidence metric
- `accuracy-prediction`: Expected position correction accuracy as a function of terrain roughness and sensor performance

## Process

1. TERCOM (Terrain Contour Matching) batch correlation. Collect a profile of N terrain height measurements along the flight path. For each candidate position offset (dx, dy) within the search area, extract the corresponding profile from the database and compute the mean absolute difference (MAD) or correlation coefficient with the measured profile. The position offset with the minimum MAD (or maximum correlation) is the best estimate. Search area is defined by the INS position uncertainty (typically 3-sigma).
2. SITAN (Sandia Inertial Terrain-Aided Navigation) sequential method. Uses an extended Kalman filter where each terrain height measurement is processed individually. The measurement model: h_measured = h_aircraft - h_terrain(lat, lon). The terrain height is a nonlinear function of position, linearized about the current estimated position. The H matrix contains the terrain slope (dh/dlat, dh/dlon). Flat terrain makes H small and the measurement uninformative (confirming the suitability map).
3. Particle filter approach. For highly nonlinear terrain or multimodal position distributions (ambiguous terrain), a particle filter represents the position probability distribution as a set of weighted samples. Each measurement reweights the particles based on how well the measured height matches the database at each particle's position. Particle resampling prevents weight degeneracy. More computationally expensive but handles ambiguity.
4. Set the update rate and profile length. TERCOM typically uses profiles of 30-100 measurements (3-10 km at typical altitudes and speeds) and updates every profile length. SITAN updates at each measurement. The particle filter updates at each measurement. Longer profiles give more information but assume the INS error is approximately constant over the profile.
5. Implement confidence monitoring. The correlation peak height relative to the background (peak-to-sidelobe ratio) indicates match quality. A low ratio means the terrain is ambiguous or the sensor data is poor. Output a confidence metric with each position correction. If confidence is below threshold, do not apply the correction to the INS.
6. Predict the achievable accuracy. Run the algorithm in simulation using the actual terrain database and the sensor error model. Inject known position offsets and verify recovery. The accuracy depends primarily on terrain roughness, database accuracy, sensor noise, and the ratio of database resolution to position error. Typical achievable accuracy: 30-100m CEP with DTED-2 and radar altimeter for terrain with adequate roughness.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
