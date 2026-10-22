# I2C Implementation Method

Implement I2C with proper bus configuration, clock stretching handling, multi-master arbitration, and error recovery for stuck buses.

## Inputs

- `i2c-device-list`: All I2C devices with addresses, speed grade (standard 100 kHz, fast 400 kHz, fast-plus 1 MHz), and any quirks from datasheets
- `bus-topology`: Wire length, pull-up resistor values, number of devices, and total bus capacitance

## Outputs

- `i2c-configuration`: I2C timing parameters (SCL frequency, rise time, fall time, setup/hold times), pull-up resistor selection, and analog/digital filter settings
- `i2c-driver-api`: Driver interface: init, write-register, read-register, write-block, read-block, bus-recovery, and address-scan

## Process

1. Select pull-up resistor values. The minimum value is set by the I2C output sink current (IOL = 3 mA for standard mode) and VDD: R_min = VDD / IOL. The maximum is set by the rise time requirement and bus capacitance: R_max = t_rise / (0.8473 * C_bus). For 400 kHz with 200 pF bus capacitance and 3.3V, typical values are 2.2 kOhm to 4.7 kOhm.
2. Configure the I2C timing registers. Modern MCUs (STM32 I2C v2) have a timing register calculated from the input clock, desired SCL frequency, and signal timing. Use the vendor's I2C timing calculation tool or the reference manual formula. Verify with an oscilloscope that SCL frequency, setup time, and hold time meet I2C spec.
3. Handle clock stretching: the slave holds SCL low to pause the master. The I2C peripheral handles this in hardware, but set a timeout to detect a stuck slave. If SCL is held low beyond the timeout, trigger bus recovery.
4. Implement bus recovery: if SDA is stuck low (slave holding it during an interrupted transfer), toggle SCL up to 9 times as a master to clock out the stuck slave, then issue a STOP condition. This is defined in the I2C specification and recovers most stuck-bus conditions.
5. For multi-master systems, implement arbitration-lost handling: when the peripheral detects arbitration loss (another master won), abort the current transfer and retry after a random back-off. The I2C hardware handles the bit-level arbitration; the driver handles the retry logic.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
