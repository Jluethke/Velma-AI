# Lidar Point Cloud Processing

Process raw lidar returns into calibrated, georeferenced point clouds with noise filtering and classification.

## Inputs

- `scanner-architecture`: Scan pattern and angular encoding
- `signal-processing-chain`: Raw range and intensity data format
- `application-constraints`: Real-time vs post-processing requirements

## Outputs

- `calibrated-point-cloud`: XYZ coordinates with intensity, calibrated and georeferenced
- `noise-filtering-results`: Removed noise points (multipath, bloom, atmospheric) with quality metrics
- `point-cloud-quality-metrics`: Point density, precision, accuracy verification against known targets

## Process

1. Convert raw measurements to 3D points. For each return: apply the range calibration (system delay offset, walk correction), convert from spherical (range, azimuth, elevation) to Cartesian (x, y, z) using the scanner's angular calibration. Apply the boresight alignment between the scanner and the navigation reference frame. For mobile lidar, integrate with INS/GNSS to georeference each point.
2. Filter noise points. Multipath: secondary reflections from nearby surfaces cause ghost points at incorrect ranges; filter by checking spatial consistency with neighbors. Bloom: strong retroreflectors saturate the detector, causing range errors; flag points with anomalously high intensity. Atmospheric: rain, fog, and dust create returns at short range; filter by range gating or statistical outlier removal. Near-range cutoff: scanner mechanics or optical design may create artifacts within minimum range.
3. Classify the point cloud for the application. Ground extraction: progressive morphological filter or cloth simulation filter separates ground from objects. Object clustering: group non-ground points into discrete objects by spatial proximity (DBSCAN or connected components on a voxel grid). For autonomous driving: further classify clusters as vehicles, pedestrians, cyclists, etc., using shape features or machine learning on the point cloud.
4. Verify point cloud accuracy. Place calibrated survey targets (flat panels of known reflectivity at measured positions) in the scene. Compare lidar-measured positions to survey truth. Range accuracy is typically 1-5 cm for dToF, sub-cm for FMCW. Angular accuracy depends on scanner calibration (typically 0.01-0.1 degrees). Point density varies with range squared (inverse square law for scanning lidars).
5. Optimize for real-time output. For automotive lidar, the full pipeline (ranging, calibration, noise filtering, basic classification) must complete within the frame time (typically 50-100 ms for 10-20 Hz frame rate). Hardware acceleration (FPGA or GPU) handles the FFT for FMCW or the TDC readout for dToF. Point cloud compression (octree, range image encoding) reduces bandwidth for downstream processing or transmission.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
