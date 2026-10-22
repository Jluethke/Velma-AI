# Hardware Reconnaissance

Perform hardware-level reconnaissance on an embedded device: identify debug interfaces, extract firmware from flash, map the communication interfaces, and document the hardware attack surface.

## Inputs

- `target-device`: Physical device to test: product description, external interfaces, any available documentation
- `test-scope`: Authorization scope, rules of engagement, non-destructive vs destructive analysis permitted

## Outputs

- `hardware-map`: Board photograph with identified ICs, debug ports (UART, JTAG, SWD), flash chips, test points, communication buses
- `extracted-firmware`: Firmware binary extracted from flash or obtained via debug interface, with extraction method documented

## Process

1. Visual board inspection: photograph the PCB (both sides). Identify all ICs by marking (look up datasheets). Locate debug headers (UART: 3-4 pin header near processor; JTAG: 10/14/20 pin header; SWD: 2-pin). Identify flash storage (SPI NOR: 8-pin SOIC, eMMC: BGA, NAND: TSOP). Locate test points and unpopulated headers.
2. UART discovery: use a logic analyzer or oscilloscope to probe suspected UART pins (look for 3.3V idle-high, data bursts at boot). Try common baud rates (115200, 9600, 57600). Connect a USB-UART adapter. Many devices output boot logs and provide a root shell on UART without authentication.
3. JTAG/SWD discovery: if header is present, identify pin functions (TCK, TMS, TDI, TDO for JTAG; SWDIO, SWCLK for SWD) using JTAGulator or manual probing. Connect with OpenOCD or a J-Link debugger. If debug is locked, document the lock mechanism (some devices use a read-once fuse, others use a password).
4. Firmware extraction: from SPI flash, desolder or use a test clip (SOIC-8 clip) and read with a flash programmer (CH341A, FlashROM). From eMMC: use the eMMC debug interface or SD adapter. Via debug interface: use OpenOCD to dump flash. From UART: if a bootloader shell is available (U-Boot), use memory read commands. Document which method succeeded.
5. Communication interface mapping: identify all external interfaces (Ethernet, Wi-Fi, Bluetooth, Zigbee, cellular, USB) and internal buses (SPI, I2C, CAN). For each external interface, note the protocol and whether it uses encryption/authentication. This map defines the remote attack surface.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
