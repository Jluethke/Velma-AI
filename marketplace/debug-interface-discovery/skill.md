# Debug Interface Discovery

Identify and test debug and maintenance interfaces on the embedded device (JTAG, SWD, UART, SPI).

## Inputs

- `device-under-test`: Physical device or board to assess
- `device-documentation`: Datasheets, schematics, and FCC filings if available

## Outputs

- `interface-inventory`: All debug and maintenance interfaces found
- `access-level-per-interface`: What level of access each interface provides

## Process

1. Visually inspect the PCB for labeled and unlabeled headers, test points, and connectors
2. Use a logic analyzer to identify UART TX/RX, JTAG TDI/TDO/TMS/TCK, and SWD SWDIO/SWCLK
3. Attempt to connect and get a console or debug session on each interface found
4. Document the access level (read memory, write memory, halt CPU, full debug) for each

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
