# Fusion Architecture Design

Select and design the sensor fusion architecture: early fusion (raw data), mid-level fusion (feature/object level), or late fusion (decision level), based on the system's latency, accuracy, and computational constraints.

## Inputs

- `calibration-parameters`: Calibrated sensor transforms and timing
- `sensor-manifest`: Sensor suite with specifications
- `detection-requirements`: Required detection performance

## Outputs

- `fusion-architecture`: Selected fusion architecture with data flow diagram, processing stages, and interface definitions
- `computational-budget`: Processing time allocation per fusion stage and total latency budget

## Process

1. Evaluate early fusion: raw data from all sensors projected into a common representation (e.g., bird's-eye-view grid, voxel space). Advantages: the learning model sees everything and can discover cross-modal correlations. Disadvantages: high bandwidth and compute, requires tight synchronization, single model couples all sensor processing. Appropriate when compute is abundant and maximum detection performance justifies the cost.
2. Evaluate mid-level fusion: each sensor runs its own detection pipeline, outputs are associated and merged at the object or feature level. Camera produces 2D bounding boxes with classification. Lidar produces 3D clusters with geometry. Radar produces tracks with velocity. Association uses gating (Mahalanobis distance in measurement space) then assignment (Hungarian algorithm or GNN). Advantages: modular, each pipeline can run at its own rate, easier to diagnose failures. Disadvantages: association errors, information loss from per-sensor abstraction.
3. Evaluate late fusion: each sensor produces independent object tracks, a fusion node merges tracks using track-to-track association and covariance intersection or federated filtering. Advantages: simplest integration, sensors can be added or removed without redesign. Disadvantages: loses fine-grained information, association is harder at the track level, latency accumulates through per-sensor tracking.
4. Select the architecture from the evaluation. In practice, most production systems use mid-level fusion with early-fusion augmentation for critical detections. Define the data flow: sensor drivers, per-sensor processing pipelines, association and fusion node, output object list with uncertainties. Allocate the computational budget: total latency from sensor trigger to fused output must be within the control loop deadline (typically 50-100ms for ground vehicles at highway speed). Assign processing time to each stage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
