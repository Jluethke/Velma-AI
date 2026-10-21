# Vehicle Sensor Inventory and Timing Requirements

**One-line description:** Builds a table of every sensor on a vehicle or robot with its physical interface, Linux device node, driver, nominal rate, timestamp source and coordinate frame, and derives the timing requirements every later sensor flow reads.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `platform_description` (string, required): The compute platform and vehicle: SoC or PC model, kernel version (`uname -r`), distribution, ROS 2 distribution if used, and network interfaces.
- `sensor_list` (object[], required): One entry per sensor with manufacturer, model, firmware version, and the datasheet or user manual URL.

---

## Outputs

- `sensor_inventory` (object[]): One row per sensor: id, type (camera, imu, gnss, lidar, radar), interface (USB UVC, MIPI CSI-2, GMSL, GigE, UDP Ethernet, serial UART, SPI, CAN), device node or IP, driver name, nominal rate from the datasheet, timestamp source (sensor hardware clock, PTP, PPS, host receive time), and frame id.
- `timing_requirements` (object): Per sensor nominal period, the clock the sensor stamps with, the sync mechanism planned (PTP, PPS plus NMEA, trigger line, none), and the user-supplied tolerances, with every missing tolerance listed as an open question.

---

## Phase 1: Enumerate Hardware

### Entry Criteria
- `platform_description` and `sensor_list` are present.
- Every sensor is physically connected and powered.

### Actions
1. Run `lsusb -t` and `lsusb -v -d <vid>:<pid>` for every USB sensor. Record bus speed (480M is USB 2.0, 5000M is USB 3.x). A USB 2.0 link limits uncompressed camera bandwidth.
2. Run `v4l2-ctl --list-devices` and record every `/dev/videoN` and `/dev/mediaN` per camera.
3. Run `ls -l /dev/serial/by-id/` and record the stable path for every serial GNSS or IMU. Never record `/dev/ttyUSB0` as the device path; it changes across reboots.
4. Run `ip -br link` and `ethtool -i <iface>` for every Ethernet sensor port. Record the NIC driver name.
5. Run `ip -details link show <canX>` for every CAN interface. Record whether the interface exists and its current state. Do not bring the interface up in this flow.
6. Run `ls /dev/pps* /dev/ptp*` and record which PPS and PTP hardware clock devices exist.

### Output
Raw hardware list with stable device paths.

### Quality Gate
- Every entry in `sensor_list` maps to one device node, IP address, or CAN interface in the raw list, or is marked "not detected".
- No serial device is recorded by a `/dev/ttyUSBN` or `/dev/ttyACMN` path when a `/dev/serial/by-id/` path exists.

---

## Phase 2: Read Datasheets

### Entry Criteria
- Raw hardware list exists.

### Actions
1. For each sensor, read from its datasheet: supported output rates, the clock it timestamps with, whether it accepts PTP (IEEE 1588), a PPS input, or a hardware trigger input, and the data format (NMEA 0183, UBX, PointCloud packets, CAN DBC).
2. Record the nominal rate and the datasheet page or section it came from. Do not guess a rate from a forum post.
3. Assign a frame id per sensor following ROS REP 103 (x forward, y left, z up for body frames; optical frames z forward, x right, y down) even when ROS is not used, so later calibrations share one convention.
4. Fill `sensor_inventory`.

### Output
`sensor_inventory`.

### Quality Gate
- Every row has a nominal rate with a datasheet citation, or the rate field says "open question".
- Every camera row has two frame ids: a body frame and an optical frame.

---

## Phase 3: Derive Timing Requirements

### Entry Criteria
- `sensor_inventory` complete.

### Actions
1. Compute the nominal period of each sensor as 1 / nominal rate.
2. Pick the sync mechanism from this table:

| Sensor capability | Planned mechanism |
|---|---|
| Ethernet sensor that supports IEEE 1588 | PTP via linuxptp (`vsens-ptp-linuxptp`) |
| GNSS receiver with PPS output | PPS plus NMEA into chrony (`vsens-pps-chrony`) |
| Camera with external trigger input | Hardware trigger from a timed GPIO or PWM |
| None of the above | Host receive time, with latency measured by `vsens-ros2-stamp-latency` or `vsens-camera-led-latency` |

3. Ask the user for the allowed clock offset and the allowed stamp latency per sensor. Record each as a user input. If the user has none, record "open question" and do not substitute a number.
4. Emit `timing_requirements`.

### Output
`timing_requirements`.

### Quality Gate
- Every sensor has a planned mechanism from the table.
- Every tolerance field holds a user-supplied number with units or the text "open question".

---

## Worked Example

Illustrative only. Input: an x86_64 PC running Ubuntu 22.04, ROS 2 Humble; a USB UVC camera, a u-blox ZED-F9P on USB, an Ouster OS1 on `enp3s0`, a serial IMU.

Phase 1:
```
$ v4l2-ctl --list-devices
USB Camera (usb-0000:00:14.0-2):
        /dev/video0
        /dev/video1
        /dev/media0
$ ls /dev/serial/by-id/
usb-u-blox_AG_-_www.u-blox.com_u-blox_GNSS_receiver-if00
$ ethtool -i enp3s0 | head -1
driver: igb
```
Phase 2: ZED-F9P row: rate up to the datasheet maximum for RTK, timestamp source GNSS time, PPS output on TIMEPULSE pin. Ouster row: supports PTP per its software user manual.
Phase 3: Ouster gets PTP; GNSS gets PPS plus NMEA; UVC camera gets host receive time with latency measurement. Allowed offsets: "open question" until the user supplies them.

---

## Exit Criteria

DONE when every sensor has a row with a stable device path, a cited nominal rate, a frame id, and a planned sync mechanism, and every tolerance is either user-supplied or listed as an open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sensor not detected | **Stop**: check power, cable and `dmesg -w` while replugging; do not continue with a missing sensor. |
| Phase 1 | No `/dev/serial/by-id/` entry | **Adjust**: write a udev rule matching `ATTRS{serial}` and record the symlink it creates. |
| Phase 2 | Datasheet missing the timestamp clock | **Adjust**: read the vendor driver source or user manual; if still unknown, record "host receive time". |
| Phase 3 | User gives no tolerance | **Return**: record "open question"; never insert a default number. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
