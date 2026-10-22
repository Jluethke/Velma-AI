# Image Processing Pipeline Design

Design the image processing pipeline from raw sensor data to the final measurement or classification result.

## Inputs

- `illumination-design`: Illumination geometry and spectrum, expected image characteristics
- `contrast-analysis`: Predicted contrast and feature appearance

## Outputs

- `processing-pipeline`: Ordered list of processing steps with algorithm selection and parameters for each: preprocessing, segmentation, feature extraction, measurement or classification, output format
- `performance-specification`: Processing latency per frame, measurement accuracy and repeatability (gauge R&R), false positive and false negative rates for defect detection

## Process

1. Preprocessing: (1) Dark-frame subtraction (remove fixed-pattern noise), (2) Flat-field correction (divide by normalized reference image to correct illumination non-uniformity and pixel-to-pixel sensitivity variation), (3) Lens distortion correction (apply the inverse of the distortion model from camera calibration), (4) Noise reduction (Gaussian blur for Gaussian noise, median filter for salt-and-pepper).
2. Segmentation: separate the regions of interest from the background. Thresholding: Otsu's method for bimodal histograms, adaptive thresholding for non-uniform illumination. Edge detection: Canny (gradient magnitude + non-maximum suppression + hysteresis thresholding). For complex scenes: watershed segmentation, connected components analysis.
3. Feature extraction: from each segmented region, compute the relevant features. Dimensional: area, perimeter, bounding box, centroid, orientation (principal axis from the second central moments), circularity = 4*pi*area / perimeter^2. Intensity: mean, min, max, standard deviation within the region. Texture: Haralick features from the gray-level co-occurrence matrix (GLCM).
4. For sub-pixel measurement accuracy: fit an analytic model to the intensity profile across an edge. The edge position can be determined to 0.1-0.01 pixel by fitting an error function (erf) or sigmoid to the intensity transition. Calibrate the pixel-to-mm conversion using a certified calibration target (dot grid or checkerboard) and a camera calibration procedure (Zhang's method).
5. For defect detection: train a classifier (threshold-based rules, or machine learning: SVM, random forest, CNN) on labeled images of good and defective parts. Report the false positive rate (good parts rejected) and false negative rate (defective parts accepted) on a validation set. For safety-critical applications, target false negative rate < 0.1% with statistical confidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
