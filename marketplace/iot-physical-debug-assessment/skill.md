# Iot Physical Debug Assessment

Assess physical debug interfaces (JTAG, UART, SWD) for access to the device runtime and stored data.

## Inputs

- `device-documentation`: Device hardware specifications
- `firmware-contents`: Firmware analysis results for boot process understanding

## Outputs

- `debug-interface-findings`: Accessible debug interfaces and what they expose
- `physical-access-risk`: Assessment of what an attacker with physical access can achieve

## Process

1. Visually inspect the PCB for debug headers, test points, and labeled interfaces
2. Probe suspected UART and JTAG connections
3. Attempt to read flash memory contents through debug interfaces
4. Check whether secure boot is enabled and debug fuses are blown

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
