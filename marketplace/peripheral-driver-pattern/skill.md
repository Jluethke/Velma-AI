# Peripheral Driver Pattern

Implement the standard peripheral driver pattern: init/deinit lifecycle, enable/disable control, blocking and non-blocking transfer APIs, and interrupt/DMA callback integration.

## Inputs

- `layer-definitions`: HAL layer structure and responsibilities
- `api-design-rules`: API naming, error handling, and callback conventions

## Outputs

- `driver-template`: Complete driver template showing the standard pattern for any peripheral: handle struct, init, deinit, blocking ops, interrupt ops, DMA ops, and callback dispatch
- `state-machine-design`: Peripheral driver state machine: RESET -> READY -> BUSY_TX/BUSY_RX -> READY, with error states and recovery transitions

## Process

1. Define the peripheral handle struct. It contains: pointer to the peripheral registers (SPI_TypeDef*), configuration parameters (stored for reconfiguration), state (RESET/READY/BUSY/ERROR), DMA handles for TX and RX, callback function pointers, and a lock (to prevent concurrent access from task and ISR).
2. Implement the lifecycle: hal_spi_init() configures the peripheral registers from the config struct and transitions state from RESET to READY. hal_spi_deinit() disables the peripheral, releases DMA channels, and transitions to RESET. Init is idempotent (safe to call twice).
3. Implement three transfer modes. Blocking: hal_spi_transmit() polls the TX-empty flag and waits for completion with a timeout. Interrupt-driven: hal_spi_transmit_it() starts the transfer and returns immediately; the ISR sends each byte and calls the completion callback when done. DMA: hal_spi_transmit_dma() configures DMA and returns; the DMA-complete ISR calls the callback.
4. Implement the ISR dispatch: the peripheral's ISR reads the status register, clears flags, and calls the appropriate handler based on the current state (TX complete, RX complete, error). The handler updates the state machine and invokes the registered callback. The ISR function itself is MCU-specific; the handler logic is portable.
5. Handle concurrent access: use a simple lock (a state variable, not an RTOS mutex, since the driver must work without an RTOS). hal_spi_transmit() checks if state is READY before starting. If BUSY, return HAL_BUSY immediately. The application decides whether to retry, queue, or report the error.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
