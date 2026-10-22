# Pin Mux And Clock Abstraction

Abstract pin multiplexing and clock tree configuration so peripheral drivers do not contain pin or clock setup code, enabling board-level configuration without modifying drivers.

## Inputs

- `driver-template`: Standard driver pattern that needs pin and clock setup hooks
- `target-mcus`: MCU families with different pin mux and clock tree architectures

## Outputs

- `pin-mux-system`: Pin mux abstraction: pin definition struct, alternate function mapping, and the API for configuring a pin for a peripheral function
- `clock-tree-abstraction`: Clock tree configuration: system clock setup, peripheral clock enable/disable API, and frequency query API for baud rate calculation

## Process

1. Define a pin descriptor: port (GPIOA, GPIOB, ...), pin number (0-15), alternate function number (AF0-AF15 on STM32), pull-up/down, output speed, and drive strength. Store pin descriptors in the BSP, not the driver. The driver calls hal_gpio_init() with the pin descriptor during peripheral init.
2. Implement the alternate function mapping. On STM32, each pin has up to 16 alternate functions selected by the AFR registers. The BSP table maps each peripheral signal (SPI1_MOSI, UART2_TX) to a specific pin and AF number. This table is the only place that changes when a board revision moves a signal to a different pin.
3. Abstract clock enable: hal_rcc_periph_clock_enable(periph_id) enables the clock for the given peripheral. Internally, it sets the correct bit in the correct RCC enable register. The peripheral driver calls this in its init function, using a peripheral ID that the BSP provides.
4. Provide a clock frequency query: hal_rcc_get_pclk1_freq() returns the current APB1 bus clock frequency. Peripheral drivers use this to calculate baud rate divisors. This abstracts the clock tree so drivers do not need to know the PLL configuration or bus prescalers.
5. Handle low-power clock gating: hal_rcc_periph_clock_disable() in the deinit function. For sleep modes, provide hal_rcc_periph_clock_sleep_enable/disable() to control which peripheral clocks remain active during sleep. This allows the power management code to gate clocks without modifying each driver.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
