# USB CAN Adapter Bring-Up (gs_usb and slcan)

**One-line description:** Brings a USB CAN adapter up as a Linux SocketCAN network device, using the in-kernel gs_usb driver for candleLight-firmware adapters or slcand for serial-line (slcan) adapters, and reports which features the adapter can and cannot provide.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `adapter_type` (string, required): "gs_usb" (candleLight / gs_usb firmware, appears as a native canX netdev), "slcan" (serial-line CAN, appears as /dev/ttyACMx or /dev/ttyUSBx), or "native" (on-board controller such as an SoC CAN, MCP251xFD SPI controller, or PCIe card).
- `usb_device_hint` (string, optional): USB vendor:product ID or tty path if the user already knows it.

---

## Outputs

- `can_netdev` (string): The SocketCAN interface name, for example "can0" or "slcan0".
- `adapter_report` (object): Driver name, kernel version, CAN FD support (yes/no), error frame support (yes/no), hardware timestamp support (yes/no/unknown), and the commands used.

---

## Phase 1: Identify the Adapter

### Entry Criteria
- Adapter plugged in. Linux host with root or sudo.

### Actions
1. Run `uname -r` and record the kernel version.
2. Run `lsusb` and find the adapter line. Record the vendor:product ID.
3. Run `sudo dmesg | tail -n 30` right after plugging in. Read which driver claimed the device:
   - a line containing `gs_usb` means a native SocketCAN device was created;
   - a line creating `/dev/ttyACM0` (cdc_acm) or `/dev/ttyUSB0` means a serial device, so the slcan path applies;
   - no line means no driver; go to Error Handling.
4. Run `ip -brief link show type can`. Every listed name is a SocketCAN device.

### Output
Driver and device path identified.

### Quality Gate
- The dmesg line naming the driver is quoted in `adapter_report`.
- `ip -brief link show type can` output is recorded (empty is allowed for slcan before Phase 2).

---

## Phase 2: Create the Network Device

### Entry Criteria
- Driver identified.

### Actions
1. If `adapter_type` is "gs_usb": run `sudo modprobe gs_usb` (harmless if already loaded) and confirm a `canX` device exists with `ip link show type can`. Bit rate is set later with `ip link`, not here.
2. If `adapter_type` is "slcan":
   1. Run `sudo modprobe slcan`.
   2. Attach with `sudo slcand -o -c -s<N> /dev/ttyACM0 slcan0`, where `-o` opens the channel, `-c` closes it on exit, and `-s<N>` selects the bit rate code. The standard slcan codes are s0=10k, s1=20k, s2=50k, s3=100k, s4=125k, s5=250k, s6=500k, s7=800k, s8=1M. Confirm the code list with `slcand -h` on your install.
   3. Run `sudo ip link set slcan0 up`.
   4. Note that with slcan the bit rate is set by `-s<N>`, not by `ip link ... bitrate`. Record this in `adapter_report` so `canb-socketcan-link-up` skips the bitrate command.
3. If `adapter_type` is "native": confirm the device appears in `ip link show type can`; record the driver from `ethtool -i can0` if ethtool supports it on that device.
4. Optional stable naming: write a udev rule that matches the adapter serial number and sets NAME. Check that it works by unplugging and replugging, then running `ip link show`.

### Output
`can_netdev` exists.

### Quality Gate
- `ip -details link show <can_netdev>` exits 0 and prints `link/can`.
- For slcan, `ps -C slcand` shows the daemon running.

---

## Phase 3: Record Capabilities

### Entry Criteria
- `can_netdev` exists.

### Actions
1. Run `ip -details link show <can_netdev>`. If the output contains a `data_bittiming_const` or `dbitrate` section, CAN FD is supported. If not, record FD as "no".
2. Record error frame support: gs_usb and most native drivers report error frames; serial slcan generally does not deliver controller error counters. Confirm in Phase 2 of `canb-error-frame-diagnosis`.
3. Run `ethtool -T <can_netdev>` and record whether `hardware-receive` timestamping is listed.
4. Assemble `adapter_report`.

### Output
`adapter_report`.

### Quality Gate
- FD support, error frame support and timestamp support each have a value and the command output that justifies it.

---

## Worked Example

Illustrative. Input: `adapter_type`="gs_usb".

- Phase 1: `lsusb` shows `ID 1d50:606f OpenMoko, Inc. Geschwister Schneider CAN adapter`; dmesg shows `gs_usb 1-1.2:1.0: Configuring for 1 interfaces`.
- Phase 2: `ip -brief link show type can` prints `can0  DOWN`. `can_netdev`="can0".
- Phase 3: `ip -details link show can0` shows `bittiming_const` and, on FD-capable firmware, `data_bittiming_const`. `ethtool -T can0` lists `hardware-receive`. Report: FD yes, error frames yes, hw timestamps yes.

---

## Exit Criteria

DONE when `can_netdev` exists as a SocketCAN device and `adapter_report` records driver, FD, error frame and timestamp support with evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No dmesg line after plugging in | **Retry**: try another USB port and cable; then check `lsusb` again. |
| Phase 1 | gs_usb module not found | **Adjust**: install the distro's extra kernel modules package (name varies; check the distro docs). |
| Phase 2 | `slcand` not found | **Adjust**: install the distro's can-utils package, which ships slcand. |
| Phase 2 | slcan0 not created | **Retry**: confirm the tty path with `ls /dev/ttyACM* /dev/ttyUSB*` and rerun slcand. |
| Phase 3 | FD needed but adapter lacks it | **Return**: report that the adapter cannot do CAN FD; do not try to force `fd on`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
