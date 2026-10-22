# Object Detection Architecture

Select and configure the object detection architecture for camera and lidar: choose between detection paradigms, train or fine-tune models, and optimize for real-time inference on embedded hardware.

## Inputs

- `detection-requirements`: Required object classes, detection range, and accuracy targets
- `computational-budget`: Available compute hardware and latency budget for detection

## Outputs

- `detection-model`: Trained and optimized detection model with architecture, weights, and inference pipeline
- `detection-performance`: Measured precision, recall, and latency on representative test data

## Process

1. Select the detection paradigm. For camera: two-stage detectors (Faster R-CNN family) give higher accuracy but more latency; single-stage detectors (YOLO family, SSD) trade some accuracy for speed; anchor-free detectors (CenterNet, FCOS) avoid anchor hyperparameter tuning. For lidar 3D detection: point-based (PointPillars, VoxelNet) encode the point cloud into a pseudo-image and run 2D detection; point-transformer methods give higher accuracy but more compute. For camera-lidar fusion detection: project lidar features onto camera features in BEV space. Select based on the latency budget and accuracy requirements.
2. Configure the model for the target domain. Adjust input resolution for the range/resolution trade-off: higher resolution detects smaller objects at longer range but increases compute. Set the class list to match detection requirements; adding unnecessary classes wastes capacity. For transfer learning: start from a pretrained backbone (ImageNet or nuScenes/Waymo), fine-tune on domain-specific data. Collect or curate training data that covers the operational design domain: all weather conditions, times of day, object types, and edge cases.
3. Optimize for embedded inference. Quantize the model from FP32 to INT8 using post-training quantization or quantization-aware training, measuring accuracy loss at each step. Apply TensorRT or equivalent runtime optimization for the target GPU. Profile layer-by-layer to identify bottlenecks. Consider model pruning for further speedup if latency is not met. Target: inference time within the allocated computational budget (e.g., 20ms for a 50ms fusion cycle that includes pre/post-processing).
4. Validate detection performance. Run evaluation on a held-out test set that represents the operational domain. Report: precision-recall curves per class, AP (average precision) at standard IoU thresholds (0.5, 0.7 for 2D; 0.25, 0.5 for 3D), detection range vs recall curve, inference latency distribution (mean, 95th percentile, max). Identify failure modes: small objects, occluded objects, unusual poses, adverse weather. Document known limitations for the safety case.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
