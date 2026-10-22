# Critical Chain Review

Review the critical chain method after each project. Did buffer management work? Were estimates calibrated? What changes for the next project?

## Inputs

- `buffer-status-dashboard`: The final buffer status at project completion
- `aggressive-estimates`: The 50% estimates used during the project

## Outputs

- `estimation-accuracy`: How accurate were the 50% estimates? What percentage of tasks finished within the estimate? What was the average overrun?
- `method-improvements`: What to change for the next project: buffer sizing, estimation calibration, resource conflict resolution, or buffer management thresholds

## Process

1. Compare actual task durations to the 50% estimates. If more than 60% of tasks finished within the estimate, the estimates were too padded (use tighter estimates next time). If less than 40% finished within, the estimates were too aggressive.
2. Compare actual buffer consumption to buffer size. If less than 50% of the buffer was used, the buffer was too large. If more than 90% was used, the buffer was too small.
3. Identify the tasks that consumed the most buffer. Were they predictable (we should have known) or unpredictable (genuine uncertainty)?
4. Update the method for the next project: adjust the buffer sizing formula, calibrate the estimation guidance, and revise the threshold zones based on this project's data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
