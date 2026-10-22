# Closed Loop Stimulation Design

Design a closed-loop neurostimulation system that adjusts stimulation parameters in real time based on detected neural biomarkers.

## Inputs

- `therapeutic-objective`: What the closed loop must control (tremor, seizure, mood, motor output)
- `stimulation-parameters`: Stimulation parameter ranges
- `neural-state-markers`: Available biomarkers from neural recording

## Outputs

- `closed-loop-controller-design`: Biomarker detection algorithm, control law (on/off, proportional, model-predictive), parameter adjustment range, safety limits, and latency specification
- `stability-safety-analysis`: Analysis of closed-loop stability (no oscillation, no runaway stimulation), safety bounds, and fallback behavior

## Process

1. Select the biomarker for closed-loop control. For Parkinson's disease: beta band (13-30 Hz) power in the subthalamic nucleus (STN) correlates with bradykinesia and rigidity. Elevated beta = more symptoms = need stimulation. As stimulation takes effect, beta power decreases. This creates a natural negative feedback loop. For epilepsy: detect seizure onset signatures (sustained high-frequency oscillations 80-500 Hz, or DC shifts) and trigger stimulation to abort the seizure. For motor BCI: decoded movement intention triggers stimulation of motor cortex or spinal cord.
2. Design the control law. Simplest: threshold-based on/off control (if beta power exceeds threshold, stimulate at fixed parameters; below threshold, stop). This works for responsive neurostimulation in epilepsy (NeuroPace RNS). For smoother control in Parkinson's: proportional control where stimulation amplitude scales linearly with beta power above a baseline. More advanced: model-predictive control using a transfer function model from stimulation input to biomarker output (identified from open-loop data), optimizing stimulation trajectory to track a desired biomarker setpoint.
3. Analyze closed-loop stability. The neural system introduces delays: stimulation takes 0.5-2 seconds to affect beta power in Parkinson's. If the controller gain is too high relative to the loop delay, oscillations occur (stimulation cycles on and off at a frequency related to the delay). Use control theory: model the plant (brain response to stimulation as a first-order system with delay), design the controller with adequate phase margin (greater than 45 degrees). Set a maximum stimulation amplitude hard limit that cannot be exceeded by the control law under any biomarker input.
4. Define safety bounds and fallback. Maximum stimulation amplitude must never exceed the charge density safety limit regardless of biomarker input. Rate-limit parameter changes (no more than 10% amplitude change per second) to prevent abrupt transitions. If the biomarker signal is lost (electrode failure, artifact contamination), fall back to open-loop stimulation at the last known effective parameters. Log all biomarker values and parameter adjustments for clinician review. Include a patient-controlled emergency stop.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
