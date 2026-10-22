# Cross Session Decoder Transfer

Design the decoder recalibration strategy for stable day-to-day BCI use without full recalibration, using transfer learning and alignment techniques.

## Inputs

- `adaptive-decoder`: Decoder with adaptation capability
- `closed-loop-performance-metrics`: Within-session performance

## Outputs

- `transfer-learning-strategy`: Method for cross-session decoder initialization (zero-shot, few-shot, alignment-based) with expected warm-up time and accuracy
- `long-term-stability-assessment`: Performance trajectory over weeks and months, identifying degradation sources and their mitigations

## Process

1. Characterize day-to-day neural instability. Between sessions (next day), neural recordings change: single-unit tuning properties shift (preferred direction rotates, gain changes), some units disappear and new ones appear (electrode micromotion), baseline firing rates drift. These changes mean a decoder trained on day 1 data performs poorly on day 2 without recalibration (typically 50-80% accuracy drop for Kalman filter on raw spike features).
2. Implement alignment-based transfer. LFADS (Latent Factor Analysis via Dynamical Systems) or MINT (Modular Inverse Neural Transform) extract low-dimensional neural dynamics that are more stable than individual neuron tuning. Train the decoder on the latent factors rather than raw firing rates. Day-to-day alignment: find a linear mapping (Procrustes alignment) between day N latent space and the original training day latent space. This typically recovers 70-90% of within-session accuracy without any calibration data on the new day.
3. For few-shot recalibration: collect 2-5 minutes of calibration data on the new day (user performs a short target acquisition task). Use this data to update the observation model (Kalman filter C matrix) or fine-tune the last layer of a neural network decoder. This typically recovers 90-100% of within-session accuracy. The trade-off is calibration time: users prefer zero calibration, but 2 minutes of calibration dramatically improves the rest of the session.
4. Assess long-term stability. Track daily performance metrics (throughput, success rate, calibration time needed) over months. Identify trends: does performance gradually decline (electrode degradation, increasing glial scar) or remain stable with recalibration? For chronic arrays (Utah), typical trajectory: stable performance for 6-12 months with daily recalibration, then gradual decline as unit yield drops. Strategies to extend functional life: use multi-unit threshold crossings instead of sorted single units (more stable across months), use LFP features (stable for years but lower information content per channel), or transition to a combination of spike and LFP features as single units are lost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
