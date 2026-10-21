# SPI and I2C Peripheral Bring-Up

**One-line description:** Brings up an I2C or SPI sensor by reading its identity register, using a logic analyzer protocol decoder to check address ACK, SPI mode and chip-select framing, and applying the I2C bus-clear procedure when SDA is held low.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Test firmware that performs one identity-register read.
- `pin_map` (object[], required): SCL/SDA or SCK/MOSI/MISO/CS pins with alternate function numbers.
- `device_datasheet` (string, required): Datasheet of the slave device (address, identity register, SPI mode, timing).
- `logic_analyzer` (string, required): Analyzer model and sigrok driver name.

---

## Outputs

- `bus_bringup_record` (object): Bus type, measured clock, address or mode used, decoded transaction, identity value read versus datasheet value, and faults fixed.

---

## Phase 1: Electrical Checks

### Entry Criteria
- Board powered; slave device powered (measure its supply pin).

### Actions
1. I2C: with the bus idle, measure SCL and SDA with a meter or analyzer; both must sit at the high level. If either is low, see Phase 3.
2. I2C: confirm pull-up resistors exist on the schematic. The internal GPIO pull-ups are usually too weak for the bus speed; the rise time limit per mode is in NXP UM10204 (I2C-bus specification), table "Characteristics of the SDA and SCL bus lines". Measure rise time with an oscilloscope if available and compare to that table.
3. SPI: confirm CS is pulled to its inactive level (high for active-low CS) so the slave ignores the bus during reset.
4. Record the slave's identity register address and expected value from `device_datasheet` (for example a WHO_AM_I or CHIP_ID register).

### Output
Idle levels, pull-ups, expected identity value.

### Quality Gate
- Idle SCL and SDA readings are recorded as high, or the fault is recorded.
- Identity register address and expected value cite a datasheet page.

---

## Phase 2: First Transaction

### Entry Criteria
- Electrical checks pass.

### Actions
1. I2C address: datasheets give either the 7-bit address or the 8-bit write byte. Decision table:

| Datasheet shows | 7-bit address | Driver needs |
|---|---|---|
| 7-bit, for example 0x68 | 0x68 | Check the driver API: STM32 HAL `HAL_I2C_Mem_Read` takes the address shifted left (0xD0); Zephyr `i2c_write_read` and Linux take 0x68 |
| 8-bit write/read pair, for example 0xD0/0xD1 | 0x68 | Same rule as above |

2. Read the identity register once. Capture with the analyzer and decode:
   - I2C: `sigrok-cli -i i2c.sr -P i2c:scl=D0:sda=D1 -A i2c`
   - SPI: `sigrok-cli -i spi.sr -P spi:clk=D0:mosi=D1:miso=D2:cs=D3:cpol=<0|1>:cpha=<0|1>`
   Check `sigrok-cli -P i2c --show` and `-P spi --show` for option names in your version.
3. I2C reading: the decode shows Start, Address write, ACK or NACK, Data, Stop. A NACK right after the address means wrong address, slave unpowered, or slave held in reset.
4. SPI mode: take CPOL and CPHA from the device datasheet timing diagram (clock idle level gives CPOL; data sampled on first or second edge gives CPHA). If decoded MISO bytes look shifted by one bit, the mode is wrong.
5. SPI framing: CS must stay asserted for the whole register address plus data. If CS toggles between bytes and the device needs a continuous frame, use software CS (GPIO) around the whole transfer.

### Output
Decoded transaction and identity value.

### Quality Gate
- Decoded identity byte equals the datasheet value.
- For I2C, the decode shows ACK after the address byte.

---

## Phase 3: Bus Faults

### Entry Criteria
- A fault from Phase 1 or 2 is present, or Phase 2 passed (then record "no faults").

### Actions
1. I2C SDA stuck low (a slave was mid-byte when the master reset): apply the bus clear in UM10204 section "Bus clear": reconfigure SCL as GPIO open-drain output, clock SCL up to nine pulses until SDA reads high, then generate a STOP, then return pins to the I2C alternate function. Many I2C peripherals also need a software reset bit toggled after this; read the reference manual I2C chapter.
2. I2C clock stretching: if the slave stretches SCL, confirm the master peripheral supports it and that it is not disabled (for STM32, NOSTRETCH applies to slave mode; read the chapter for your part).
3. SPI MISO floating high (0xFF) on every read: slave not selected or not powered; MISO all zero: wrong CS pin or slave in reset.
4. Record each fault and fix.

### Output
`bus_bringup_record`.

### Quality Gate
- After any bus clear, idle SDA reads high (measurement recorded).
- Every fault has a decoded capture or meter reading as evidence.

---

## Worked Example

Illustrative. MPU-6050 style IMU on I2C1, datasheet WHO_AM_I register 0x75 expected 0x68.

- Phase 1: SCL and SDA idle at 3.3 V; 4.7 kOhm pull-ups on the schematic.
- Phase 2: first try used `HAL_I2C_Mem_Read(&hi2c1, 0x68, 0x75, ...)`; decode showed `Address write: 34` then `NACK`. Changed to `0x68 << 1`; decode shows `Address write: 68`, `ACK`, `Data read: 68`, `NACK`, `Stop`. Identity matches.
- Phase 3: no stuck bus observed.

---

## Exit Criteria

DONE when the identity register reads the datasheet value with a decoded capture as evidence, and any bus fault is cleared and recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No pull-ups on the board | **Return**: report as a schematic defect; do not rely on internal pull-ups beyond what UM10204 rise-time allows. |
| Phase 2 | NACK at the address | **Adjust**: apply the address decision table, recheck slave power and reset pins. |
| Phase 2 | MISO bits shifted | **Adjust**: change CPHA, then CPOL, against the datasheet timing diagram. |
| Phase 3 | SDA still low after nine clocks | **Stop**: power-cycle the slave; record the slave as holding the bus. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
