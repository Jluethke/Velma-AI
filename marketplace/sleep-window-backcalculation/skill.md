# Sleep Window Backcalculation

Count back from the fixed wake time to find the target bedtime and the full sleep window.

## Inputs

- `fixed-wake-time`: The fixed wake time
- `sleep-need-estimate`: Your estimated nightly sleep need, usually seven to eight hours

## Outputs

- `target-bedtime`: The bedtime that yields the needed sleep given the fixed wake time
- `sleep-window`: The protected window from target bedtime to wake time

## Process

1. Subtract your sleep need from the fixed wake time to find the target bedtime. A seven o'clock wake with an eight-hour need sets an eleven o'clock bedtime.
2. Add a short buffer for falling asleep, usually fifteen to twenty minutes, so the window reflects time in bed, not only time asleep.
3. Treat the resulting window as protected time. The sleep window is a scheduled appointment, not whatever is left after the day ends.
4. If the target bedtime is impossible given your evenings, the wake time or the obligations must change. Do not solve it by cutting the sleep need below your real need.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
