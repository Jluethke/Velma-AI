# Sleep Mode Architecture

Select and configure the optimal sleep mode for each system state, mapping wake sources to system events and designing the sleep/wake state machine.

## Inputs

- `power-profile`: Current in each mode
- `power-budget-gap`: Required current reduction

## Outputs

- `sleep-mode-selection`: For each system state: which MCU sleep mode, which peripherals remain active, which clocks run, and expected current draw
- `wake-source-map`: Each wake source (RTC alarm, GPIO pin, UART activity, comparator, I2C address match) with its latency from trigger to application code running

## Process

1. Map the MCU's sleep modes to current consumption from the datasheet. Typical ARM Cortex-M hierarchy: Sleep (WFI, CPU stopped, peripherals run: 1 to 10 mA), Stop (most clocks off, SRAM retained, wake from EXTI: 1 to 100 uA), Standby (only backup domain, wake from RTC/WKUP pin: 1 to 5 uA), Shutdown (everything off: under 100 nA).
2. For each system state (monitoring, communicating, processing, idle), select the deepest sleep mode that preserves the required peripheral operation and meets the wake latency requirement. Deeper modes save more power but take longer to wake: Sleep wakes in cycles, Stop in 2 to 10 us, Standby requires full boot.
3. Configure wake sources. RTC alarm for periodic wake (sensor sampling). GPIO EXTI for external events (button press, sensor interrupt). UART activity detection for incoming commands (USART wake from Stop on start bit). I2C address match for bus wakeup in multi-device systems.
4. Design the sleep/wake state machine. Track the current state and what events can occur. Before entering sleep: ensure all pending operations are complete (DMA transfers done, UART TX buffer flushed, flash writes committed). After wake: identify the wake source (check wake flags), reinitialize only what was lost in the sleep mode (clock tree for Stop, full init for Standby).
5. Handle the idle task in an RTOS: the idle task should enter the deepest allowed sleep mode. The RTOS tick must wake the system before the next scheduled task. Tickless idle mode (available in FreeRTOS, Zephyr) suppresses the tick during long idle periods, allowing the system to stay in deep sleep.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
