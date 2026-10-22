# Decoder Architecture And Training

Select the decoder model architecture, train on calibration data, and optimize hyperparameters using nested cross-validation.

## Inputs

- `feature-matrix`: Neural features at each time bin
- `behavioral-data`: Ground truth targets
- `feature-information-analysis`: Feature relevance rankings

## Outputs

- `trained-decoder`: Decoder model with fitted parameters and hyperparameters
- `offline-performance-metrics`: Cross-validated R-squared, MSE, classification accuracy, and information transfer rate

## Process

1. Select architecture by application. For 2D cursor control from motor cortex spikes: Kalman filter (state = [x, y, vx, vy], observation = firing rates). Linear, interpretable, updates in closed-form, very low latency (under 1 ms to compute). For 3D arm kinematics: Kalman filter or unscented Kalman filter if nonlinearities are significant. For discrete classification (grasp types, phonemes): LDA if features are approximately Gaussian, or gradient-boosted trees for nonlinear boundaries. For high-dimensional temporal sequences (speech from ECoG): RNN (GRU or LSTM) or temporal convolutional network, trained end-to-end.
2. Train on calibration data. For Kalman filter: closed-form solution. State transition matrix A from regressing state at t+1 on state at t. Observation matrix C from regressing firing rates on state. Noise covariances W and Q from residuals. For neural networks: train with Adam optimizer, learning rate 1e-3 to 1e-4, batch size 32-128, for 50-200 epochs with early stopping on validation loss. Use dropout (0.2-0.5) for regularization with small datasets (common in neural data, often under 10 minutes of calibration).
3. Hyperparameter optimization. Use 5-fold cross-validation with temporal splits (not random, to respect time structure). For Kalman filter: optimize the bin size, number of neural features, and time lags included. For neural networks: optimize hidden layer size, dropout rate, learning rate, and number of layers. Use Bayesian optimization (Gaussian process) or random search over the hyperparameter space. Report the mean and standard error of the performance metric across folds.
4. Measure offline decoding performance. For continuous targets (velocity): Pearson correlation r (typically 0.7-0.9 for motor BCI with intracortical arrays), R-squared (variance explained), and mean squared error. For discrete targets: classification accuracy, confusion matrix, Cohen's kappa (chance-corrected accuracy). Calculate information transfer rate for comparison across studies. Typical: 2-4 bits/s for intracortical motor BCI (cursor control), 0.5-1 bit/s for ECoG speech BCI, 0.1-0.5 bits/s for EEG motor imagery BCI.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
