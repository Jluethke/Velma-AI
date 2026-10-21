# Lidar Driver Bring-Up and Point Cloud Format Check

**One-line description:** Brings up an Ethernet lidar by confirming UDP packet flow with tcpdump, checking kernel UDP receive buffer drops with nstat, and reading the PointCloud2 or PCD field layout so the per-point time, ring and intensity fields are known before any deskew or calibration.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_inventory` (object[], required): From `vsens-sensor-inventory`; the lidar row with interface, IP and timestamp source.
- `lidar_model` (string, required): Manufacturer, model, firmware version, the driver package and version, and the configured mode (for example columns per frame and frame rate).

---

## Outputs

- `lidar_stream_report` (object): Host and sensor IPs, UDP ports, packets per second measured, UDP receive buffer error counts before and after, frame rate measured, the PointCloud2 field list with datatype and offset, point step, organized or unorganized layout, the per-point time field name and unit, and the timestamp source.

---

## Phase 1: Network and Packet Flow

### Entry Criteria
- The lidar is powered and on a dedicated NIC or a switch port with no other heavy traffic.
- The lidar is stationary on a bench mount or on a parked vehicle; this flow sends no motion commands.

### Actions
1. Read the default data and IMU or position UDP ports from the vendor manual for this firmware (for example Ouster documents lidar port 7502 and IMU port 7503 as defaults; Velodyne documents data port 2368 and position port 8308). Use the configured values if the user changed them.
2. Assign the host NIC a static IP in the sensor's subnet with `nmcli` or netplan. Confirm with `ip -br addr show <iface>`.
3. Capture: `sudo tcpdump -i <iface> -n -c 2000 udp port <data_port> -w lidar.pcap`. Then `capinfos lidar.pcap` (from Wireshark tools) and record the average packet rate and packet size.
4. Compute expected packets per second from the manual (packets per frame x frames per second). Record expected and measured.

### Output
Packet flow figures.

### Quality Gate
- `capinfos` average packet rate is recorded next to the manual-derived expected rate.
- Packet size in `capinfos` equals the packet size the manual gives for this mode.

---

## Phase 2: Kernel Receive Drops

### Entry Criteria
- Packets arrive.

### Actions
1. Read counters: `nstat -az UdpRcvbufErrors UdpInErrors`. Record values.
2. Start the driver and run it for 60 seconds. Read the counters again. Any increase is packets the kernel dropped because the socket buffer was full.
3. If drops increased, read `sysctl net.core.rmem_max net.core.rmem_default` and the driver's documented receive buffer parameter. Raise `net.core.rmem_max` with `sudo sysctl -w net.core.rmem_max=<bytes>` to the value the driver documentation gives; persist in `/etc/sysctl.d/`.
4. Check NIC level drops: `ethtool -S <iface> | grep -iE 'drop|miss|err'` before and after.

### Output
Drop counters before and after, with changes made.

### Quality Gate
- `UdpRcvbufErrors` does not increase over a 60-second run after the fix, shown by two `nstat` readings.
- Every sysctl change is written in a file under `/etc/sysctl.d/` and listed in the report.

---

## Phase 3: Point Cloud Layout

### Entry Criteria
- Driver runs without kernel drops.

### Actions
1. ROS 2: `ros2 topic echo --once /points --field fields` and `--field point_step`, `--field height`, `--field width`, `--field is_dense`. Record each field's `name`, `offset`, `datatype` (sensor_msgs/PointField constants: 7 FLOAT32, 8 FLOAT64, 6 UINT32, 4 UINT16, 2 UINT8).
2. Find the per-point time field. Names differ by driver (for example `t`, `time`, `timestamp`). Read the driver's documentation for its unit (nanoseconds since scan start, seconds relative to header stamp, or absolute seconds). Do not assume.
3. Find the ring or channel field and confirm `height` equals the number of beams when the cloud is organized (`height > 1`).
4. Without ROS, save a frame as PCD and read its header: `VERSION`, `FIELDS`, `SIZE`, `TYPE`, `COUNT`, `WIDTH`, `HEIGHT`, `VIEWPOINT`, `POINTS`, `DATA` (ascii, binary or binary_compressed). `POINTS` must equal `WIDTH x HEIGHT`.
5. Measure frame rate: `ros2 topic hz /points`. Compare to the configured mode.
6. Record what `header.stamp` represents for this driver (scan start, scan end, or receipt time) and whether it comes from the sensor clock synced by PTP or from the host.

### Output
`lidar_stream_report`.

### Quality Gate
- The report lists every PointField with name, offset and datatype exactly as printed.
- The per-point time field unit is cited from driver documentation.

---

## Worked Example

Illustrative only. A 64-beam lidar in 1024x10 mode.

```
$ sudo tcpdump -i enp3s0 -n -c 2000 udp port 7502 -w lidar.pcap
$ capinfos lidar.pcap | grep -E 'Average packet (rate|size)'
Average packet size: 24896.00 bytes
Average packet rate: 640 packets/s
$ nstat -az UdpRcvbufErrors
UdpRcvbufErrors                 1832               0.0
```
After raising `net.core.rmem_max` per the driver docs, a second 60-second run left `UdpRcvbufErrors` at 1832. Fields: x/y/z FLOAT32 at 0/4/8, intensity, `t` UINT32 nanoseconds since scan start, `ring` UINT16. `height` 64, `width` 1024, `ros2 topic hz` 10.0.

---

## Exit Criteria

DONE when packets arrive at the expected rate, kernel UDP drops stop increasing, and the point field layout, time unit and stamp meaning are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No packets in tcpdump | **Adjust**: check subnet, the sensor's configured destination IP, and firewall (`sudo nft list ruleset`). |
| Phase 1 | Packet rate below expected | **Stop**: check link speed with `ethtool <iface>`; a link at 100 Mb/s cannot carry high-resolution modes. |
| Phase 2 | Drops continue after buffer increase | **Adjust**: pin the driver to a core and check CPU load; then **Retry**. |
| Phase 3 | No per-point time field | **Return**: deskew is impossible; record it and check the driver for an option to publish it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
