# Neural Population Decoding

Decode behavioral variables or intended actions from neural population activity using statistical and machine learning methods matched to the application latency and accuracy requirements.

## Inputs

- `sorted-spike-trains`: Spike trains from sorted single units
- `lfp-features`: LFP band power and spectral features
- `clinical-or-research-objective`: What must be decoded (cursor velocity, grasp type, speech, seizure onset)

## Outputs

- `decoder-model`: Trained decoder with architecture, parameters, feature set, and performance metrics (correlation, bit rate, latency)
- `decoding-performance-report`: Offline cross-validated accuracy, information transfer rate in bits per second, and comparison to chance level

## Process

1. Select features based on signal type and decoding target. For continuous kinematics (cursor velocity, arm trajectory): firing rates in 50-100 ms bins from motor cortex single units, or high-gamma power from ECoG over motor areas. For discrete classification (grasp type, speech phoneme): firing rate vectors at go-cue aligned epochs, or ECoG time-frequency features in a 500 ms window.
2. Select decoder architecture by application. For continuous BCI cursor control: Kalman filter (linear, interpretable, low latency) modeling the relationship between neural firing rates and cursor velocity. The ReFIT Kalman filter adds intention estimation during closed-loop control (clamp the inferred target, refit on corrected training data). For discrete classification: linear discriminant analysis (LDA) for low-dimensional, support vector machine for moderate, or recurrent neural network (GRU/LSTM) for temporal patterns in high-dimensional signals.
3. Train and validate. Split data into training (70%) and test (30%) sets, or use 5-fold cross-validation. For Kalman filter: fit state-transition and observation matrices from training data using least-squares. For classifiers: fit on training features, tune hyperparameters on validation fold. Measure offline performance: Pearson correlation (r) between decoded and actual kinematics for continuous, classification accuracy and confusion matrix for discrete. Calculate information transfer rate: ITR = log2(N) + P*log2(P) + (1-P)*log2((1-P)/(N-1)) bits per trial, where N = number of classes, P = accuracy.
4. Assess practical performance. Latency budget: time from neural activity to decoded output must be under 100 ms for BCI cursor control (50 ms neural processing delay + 50 ms decode + display). For speech BCI, under 200 ms is acceptable. Measure online performance if possible (closed-loop Fitts's law task: throughput in bits/s, path efficiency). Document session-to-session stability: does decoder performance degrade, and how much recalibration is needed (full retrain, bias correction, or transfer learning with a few trials).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
