# Spi Implementation Method

Implement SPI master and slave with proper clock polarity/phase configuration, chip select management, DMA for bulk transfers, and multi-slave bus topology.

## Inputs

- `spi-device-specs`: Datasheets for all SPI devices on the bus: supported modes (CPOL/CPHA), maximum clock frequency, timing diagrams, and frame format
- `throughput-requirements`: Required data transfer rates and maximum latency for each SPI device

## Outputs

- `spi-configuration`: SPI peripheral config: mode (0/1/2/3), clock divider, frame size, MSB/LSB first, NSS management, and DMA channel assignments
- `spi-driver-api`: Driver interface: init, transfer (full-duplex), send (half-duplex TX), receive (half-duplex RX), transfer-DMA, chip-select control, and error handling

## Process

1. Determine SPI mode from the slave device datasheet. Mode 0 (CPOL=0, CPHA=0): clock idle low, sample on rising edge. Mode 3 (CPOL=1, CPHA=1): clock idle high, sample on falling edge. Modes 0 and 3 are most common. Match the master configuration to what each slave requires.
2. Set the clock divider to produce a frequency at or below the slave's maximum SPI clock. The MCU SPI peripheral divides the bus clock by powers of 2 (2, 4, 8, ... 256). Choose the highest frequency that stays within spec. Account for signal integrity: long traces or high capacitance may require a slower clock even if the slave supports faster.
3. Manage chip select (CS) in software (GPIO) for flexibility: assert CS (drive low) before the transfer, deassert (drive high) after. Some devices require CS to stay asserted between command and data bytes. Hardware NSS management does not support this pattern on most MCUs.
4. For transfers larger than a few bytes, use DMA: configure TX DMA to feed the SPI TX register and RX DMA to drain the SPI RX register simultaneously. For TX-only (display writes), configure RX DMA to a dummy location or disable it. The DMA complete interrupt signals the end of transfer.
5. For multi-slave buses, ensure each slave's CS is deasserted when not selected. If slaves have different SPI modes, reconfigure the SPI peripheral before each slave transaction. The reconfiguration must happen while the SPI is disabled to avoid glitches.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
