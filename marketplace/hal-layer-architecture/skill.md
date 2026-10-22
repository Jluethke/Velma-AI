# Hal Layer Architecture

Define the HAL layer structure: register access at the bottom, peripheral drivers in the middle, and board support package at the top, with clear interfaces between each.

## Inputs

- `target-mcus`: The set of MCUs the HAL must support (current target plus planned ports), with their register models and peripheral differences
- `portability-requirements`: Which peripherals must be portable across MCU families, and where platform-specific optimization is acceptable

## Outputs

- `layer-definitions`: Three layers defined: register access (CMSIS-level), peripheral driver (HAL API), and board support package (BSP), with the responsibility and interface of each
- `api-design-rules`: Rules for HAL API design: naming conventions, error handling pattern, callback registration, and what must be in the API vs what is configuration

## Process

1. Define three layers. Bottom: register access layer provides typed access to hardware registers. Use CMSIS-style header files with struct overlays for each peripheral (e.g., SPI_TypeDef with CR1, CR2, SR, DR members). This layer is MCU-specific and auto-generated from SVD files where possible.
2. Middle: peripheral driver layer provides a portable API. Functions like hal_spi_init(), hal_spi_transfer(), hal_spi_transfer_dma(). The API is the same across MCU families; the implementation behind it changes. This is where 90% of the porting effort lives.
3. Top: board support package (BSP) maps physical board resources to HAL objects. It defines which SPI peripheral instance connects to which device, which GPIO pins are used for chip selects, and the default configuration for each peripheral. The application code calls BSP functions (bsp_flash_spi_init()) which call HAL functions with the correct parameters.
4. Define the API contract: every HAL function returns a status code (HAL_OK, HAL_ERROR, HAL_BUSY, HAL_TIMEOUT). Callbacks are registered via function pointers, not hard-coded ISR names. Configuration is passed as a struct, not individual parameters, to allow future extension without breaking the API.
5. Separate compile-time configuration (which peripherals are enabled, buffer sizes) from runtime configuration (baud rate, mode). Compile-time config goes in a hal_conf.h header. Runtime config goes in the init struct. This allows dead-code elimination of unused peripherals.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
