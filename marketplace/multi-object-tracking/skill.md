# Multi Object Tracking

Implement multi-object tracking: associate detections across frames, manage track lifecycle, and output tracked object states with uncertainty.

## Inputs

- `detection-model`: Per-frame detection output (bounding boxes, classes, confidence)
- `object-clusters`: Lidar cluster features for 3D tracking

## Outputs

- `tracked-objects`: List of tracked objects with ID, state (position, velocity, heading), classification, and uncertainty
- `tracking-metrics`: Tracking accuracy metrics: MOTA, ID switches, track fragmentation

## Process

1. Define the track state and motion model. State: position (x, y, z), velocity (vx, vy), heading, dimensions (length, width, height), classification. Motion model: constant velocity for most objects, bicycle model for vehicles (accounts for turning). Each track maintains a Kalman filter (or UKF for the bicycle model) that predicts the state forward between detections.
2. Associate detections to tracks using two-stage gating and assignment. First, gate: compute the Mahalanobis distance between each prediction and each detection, reject pairs beyond a threshold (e.g., 99.7% chi-squared gate). Second, assign: use the Hungarian algorithm (optimal assignment) or greedy nearest-neighbor (faster, suboptimal) to match predictions to detections. Cost function: weighted combination of spatial distance, size similarity, and appearance similarity (if using re-identification features). Handle the assignment matrix: matched pairs update their tracks, unmatched detections become tentative new tracks, unmatched predictions increment a missed-detection counter.
3. Manage track lifecycle. Track states: tentative (new detection, not yet confirmed), confirmed (enough consecutive matches, typically 3-5 frames), lost (missed detections exceeding a threshold, typically 5-10 frames), deleted. Tentative tracks are not reported to downstream systems to avoid false tracks. Confirmed tracks are reported with their full state and uncertainty. Lost tracks continue to predict forward (coasting) and can be re-associated if the object reappears. Delete tracks after the coast timeout to prevent ghost objects.
4. Output tracked objects with proper uncertainty. Each track reports: unique ID (persistent across frames), state estimate (position, velocity, heading), covariance (uncertainty in each state component), classification with confidence, track age, and time since last detection. Downstream systems use the covariance for decision-making: a track with high positional uncertainty gets a wider safety margin. Measure tracking performance with MOTA (multi-object tracking accuracy), MOTP (precision), ID switch rate, and track fragmentation rate on a validation set.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
