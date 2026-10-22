# Peripheral Clock Gating

Minimize active-mode power by disabling clocks to unused peripherals, reducing clock frequencies where full speed is not needed, and power-gating entire domains.

## Inputs

- `sleep-mode-selection`: Sleep modes and which peripherals must remain active
- `wake-source-map`: Wake sources requiring specific clocks or peripherals

## Outputs

- `clock-gating-table`: Each peripheral clock with: enabled/disabled per system state, clock source, frequency, and the current savings from disabling
- `dvfs-configuration`: Voltage and frequency scaling levels: clock frequency, core voltage, flash wait states, and current consumption for each level

## Process

1. Audit every peripheral clock enable bit. On STM32, the RCC_AHBxENR and RCC_APBxENR registers control peripheral clocks. Most are disabled by reset but driver initialization enables them. Disable after use: turn off the ADC clock after conversion complete, turn off SPI clock after the transfer.
2. For peripherals used intermittently, enable the clock just before the operation and disable immediately after. The clock enable propagation delay is typically 1 to 2 bus clock cycles. Do not forget to disable the clock in error paths.
3. Implement dynamic voltage and frequency scaling (DVFS). Define 2 to 4 operating points: full speed for computation, medium speed for communication, low speed for housekeeping. Each operating point specifies: CPU clock, bus clocks (AHB/APB), core voltage (if adjustable via internal regulator), and flash wait states.
4. When scaling down frequency, adjust flash wait states first (increase them), then reduce the clock. When scaling up, increase the clock first, then reduce wait states. Getting this order wrong causes the CPU to read garbage from flash.
5. Measure the current at each operating point with the actual workload, not just idle. A 48 MHz Cortex-M at 30% utilization may draw less average current than a 16 MHz Cortex-M at 90% utilization because the faster CPU finishes and sleeps sooner (race to sleep).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
