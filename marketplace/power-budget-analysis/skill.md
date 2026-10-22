# Power Budget Analysis

Establish the power budget by profiling current consumption in each operating mode and calculating the required battery life against available energy.

## Inputs

- `system-spec`: MCU, peripherals, sensors, communication modules, and their operating voltages and current consumption from datasheets
- `battery-spec`: Battery chemistry, nominal voltage, capacity in mAh, self-discharge rate, and operating temperature range

## Outputs

- `power-profile`: Current consumption in each mode: active-full, active-reduced, sleep, deep-sleep, and standby, measured at the system level including regulator efficiency losses
- `power-budget-gap`: Required battery life vs calculated battery life. If a gap exists, the target current reduction needed to close it.

## Process

1. Measure baseline current: board powered from a bench supply through a current sense resistor (10 to 100 mOhm depending on current range) or a dedicated power profiler (Nordic PPK2 or similar). Measure at the battery input, not after the regulator, to capture regulator quiescent current and efficiency losses.
2. Profile each operating mode separately: CPU running at full clock with all peripherals active, CPU running with unused peripherals disabled, sleep mode (CPU halted, peripherals running), deep sleep (CPU and most peripherals halted, only wake sources active), standby/shutdown (only RTC and wake pin active).
3. Calculate battery life: Life_hours = Battery_mAh / Average_current_mA. For duty-cycled operation: Average_mA = (active_mA * active_time + sleep_mA * sleep_time) / total_cycle_time. Include battery self-discharge (typically 2% to 5% per month for lithium).
4. Account for regulator efficiency. A switching regulator at 85% efficiency delivering 3.3V from a 3.7V LiPo means the battery-side current is 3.3/3.7 * load_current / 0.85. An LDO is simpler: battery current equals load current, but the voltage drop is wasted as heat.
5. Identify the power budget gap: if required lifetime exceeds calculated lifetime, compute the average current reduction needed. This sets the target for the optimization steps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
