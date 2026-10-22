# Closed Loop Decoder Adaptation

Adapt the decoder during closed-loop BCI use to account for user learning and neural non-stationarity, using intention-aware recalibration.

## Inputs

- `trained-decoder`: Initial offline-trained decoder
- `offline-performance-metrics`: Baseline offline accuracy

## Outputs

- `adaptive-decoder`: Decoder with online adaptation algorithm enabled, including learning rate and update schedule
- `closed-loop-performance-metrics`: Online performance metrics (target acquisition time, path efficiency, success rate, throughput in bits/s) from closed-loop testing

## Process

1. Identify the online-offline performance gap. Decoders trained on offline calibration data (user performs movements, neural data is recorded) typically underperform when used online (user observes decoded cursor and adapts behavior). The gap arises because the user's neural strategy changes under closed-loop feedback. Expect 20-50% performance reduction initially, recovering as user and decoder co-adapt.
2. Implement ReFIT-style intention estimation. During closed-loop cursor control, the true user intention is not known (unlike offline calibration where target movement is measured). Estimate intention by assuming the user always intends to move the cursor toward the target. Re-label the training data: replace the actual cursor velocity (which includes decoder errors) with the vector pointing from current cursor position to target position. Retrain the Kalman filter observation model on this corrected data. This typically doubles the bit rate compared to non-adaptive decoding.
3. For continuous adaptation: use recursive least squares (RLS) or stochastic gradient descent to update decoder parameters every N minutes using the most recent data with intention-estimated labels. Set the learning rate to balance tracking non-stationarity (higher rate) against stability (lower rate). A forgetting factor of 0.99-0.999 per sample in RLS gives good results. Monitor decoder stability: if decoded output variance suddenly increases, freeze adaptation and revert to last stable parameters.
4. Measure closed-loop performance with standardized tasks. Center-out reaching (Fitts's law): cursor starts at center, 8 targets appear at equal angles, measure acquisition time and path efficiency (straight-line distance / actual path length). Calculate throughput in bits/s using Fitts's law: TP = ID / MT, where ID = log2(D/W + 1), D is target distance, W is target width, MT is movement time. State-of-art intracortical BCI: 2-3 bits/s throughput, comparable to an assistive eye-tracker. Compare to offline predictions and quantify the online-offline gap closure from adaptation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
