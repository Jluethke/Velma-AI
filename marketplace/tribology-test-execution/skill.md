# Tribology Test Execution

Run the tribology test with continuous friction force and contact data acquisition.

## Inputs

- `test-configuration`: Test geometry and parameters
- `prepared-specimens`: Ready-to-test specimens

## Outputs

- `friction-time-series`: Friction force or coefficient vs sliding distance or time
- `test-conditions-log`: Actual temperature, humidity, and any anomalies during the test

## Process

1. Mount the specimen and counter-body, apply the specified load, and start the motion.
2. Record friction force continuously throughout the test at the specified sampling rate.
3. Monitor and log environmental conditions (temperature, humidity) during the test.
4. Stop at the target sliding distance or time and carefully remove specimens for post-test analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
