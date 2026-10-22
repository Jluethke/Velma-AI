# Clock Disciplining Holdover

Design the disciplining algorithm that steers the local clock to a reference (GPS, UTC) and the holdover strategy for when the reference is lost.

## Inputs

- `clock-performance-data`: Measured stability, drift, and environmental sensitivity
- `characterization-report`: Complete clock characterization data

## Outputs

- `disciplining-algorithm`: Control algorithm for steering the clock to the reference with filter design and tuning
- `holdover-performance`: Time error prediction during GPS denial as a function of holdover duration

## Process

1. Design the disciplining loop. A GPS-disciplined oscillator (GPSDO) uses the 1PPS output from a GPS receiver as the reference. The phase error between the local oscillator 1PPS and GPS 1PPS is measured by a time interval counter (sub-nanosecond resolution). A digital control loop adjusts the oscillator frequency tuning (EFC voltage for OCXO, digital command for atomic).
2. Select the loop bandwidth. This trades off short-term and long-term performance. Short-term (< 1/BW) performance comes from the local oscillator. Long-term (> 1/BW) performance comes from GPS. For an OCXO with ADEV crossing the GPS ADEV at tau ~100s, the optimal loop bandwidth is approximately 0.01 Hz (time constant ~100s). For Rb with crossing at tau ~10,000s, bandwidth ~0.0001 Hz.
3. Implement a Kalman filter for the disciplining. State vector: [phase error, frequency error, frequency drift]. The Kalman filter optimally combines the GPS 1PPS measurement with the oscillator model, and directly estimates the drift rate for holdover prediction. The Q matrix encodes the oscillator noise model (random walk of frequency, frequency drift).
4. Design the holdover mode. When GPS is lost, freeze the Kalman filter (no more measurements). The last estimated frequency and drift become the prediction. The holdover time error grows as: dt(T) = drift_rate * T^2/2 + frequency_offset * T + noise_integral. For a disciplined Rb with 1e-12/day drift and 1e-12 frequency error at holdover entry, the time error after 24 hours is approximately 50-100 ns.
5. Implement the steering to UTC. For timing applications, the disciplined clock must track UTC(USNO) or UTC as realized by the GPS constellation. Apply the GPS-UTC offset from the navigation message. For sub-microsecond holdover, the clock must have been disciplined long enough for the Kalman filter to converge (typically 3-5 time constants).
6. Document holdover performance prediction as a time error vs holdover duration curve. Include the 95th percentile bound for the time error at 1 hour, 4 hours, 24 hours, and 7 days. This curve is the key specification for applications requiring timing holdover during GNSS denial.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
