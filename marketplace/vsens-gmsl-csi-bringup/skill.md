# GMSL and MIPI CSI-2 Camera Link Bring-Up

**One-line description:** Brings up a MIPI CSI-2 or GMSL serializer/deserializer camera on an embedded Linux board by confirming the device tree, the I2C devices, and the media controller graph, then capturing raw frames from the sensor subdevice.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_inventory` (object[], required): From `vsens-sensor-inventory`; the camera rows with interface CSI or GMSL.
- `board_bsp` (string, required): Board support package name and version (for example the vendor Linux BSP release), the device tree overlay file in use, and the camera module vendor driver package.

---

## Outputs

- `csi_link_report` (object): Media graph topology, the entity and pad for each sensor, the negotiated media bus format and resolution, I2C addresses seen, deserializer link lock status, and a raw capture result per camera.

---

## Phase 1: Confirm Driver and Device Tree

### Entry Criteria
- At least one `sensor_inventory` row has interface CSI or GMSL.
- The camera module vendor's driver for this exact `board_bsp` is installed. A driver built for a different BSP release is not acceptable.

### Actions
1. Run `dmesg | grep -iE 'csi|gmsl|max9|ds90|imx|ar0|ov'` after boot and copy every probe line for the sensor, serializer and deserializer.
2. Run `cat /proc/device-tree/model` and list the active overlay with the BSP's documented method. Confirm the overlay named by the camera vendor is the one loaded.
3. Run `i2cdetect -l` to list buses, then `i2cdetect -y -r <bus>` only on the bus the vendor documents for the deserializer. A `UU` entry means a kernel driver owns that address, which is expected.
4. Do NOT write to any I2C register with `i2cset` in this flow. Register writes on a GMSL link can reconfigure the serializer and drop the link.

### Output
Driver probe log, active overlay, and I2C address list.

### Quality Gate
- `dmesg` shows a successful probe line for the sensor driver with no `-EREMOTEIO`, `-ENODEV` or `probe failed` for the same device.
- The deserializer address documented by the vendor shows `UU` in `i2cdetect`.

---

## Phase 2: Read the Media Graph

### Entry Criteria
- Sensor driver probed.

### Actions
1. Run `media-ctl -d /dev/media0 -p` and record each entity, its pads, links, and the `fmt:` line on each pad (for example `[fmt:SRGGB10_1X10/1920x1080 field:none]`).
2. Confirm an enabled link (`[ENABLED]`) runs from the sensor entity through the deserializer and CSI receiver to a `/dev/videoN` capture node.
3. If the platform uses a configurable pipeline and a link is not enabled, set it with `media-ctl -l '"<src entity>":<pad> -> "<sink entity>":<pad>[1]'` exactly as the vendor guide gives, then set the pad format with `media-ctl -V`.
4. For GMSL deserializers, read the link lock state from the vendor's sysfs node or debug output named in its driver documentation. If the driver exposes no lock status, record "not exposed".

### Output
Media topology with the capture node and pad formats.

### Quality Gate
- `media-ctl -p` shows an `[ENABLED]` path from the sensor entity to a `/dev/videoN` node.
- Every pad on that path reports the same media bus code and resolution.

---

## Phase 3: Capture Raw Frames

### Entry Criteria
- Enabled media path exists.

### Actions
1. Run `v4l2-ctl -d /dev/videoN --list-formats-ext` and choose the format that matches the pad `fmt:`.
2. Capture: `v4l2-ctl -d /dev/videoN --set-fmt-video=width=1920,height=1080,pixelformat=RG10 --stream-mmap --stream-count=100 --stream-to=/tmp/raw.bin`. Substitute the width, height and fourcc from step 1.
3. Read the line printed per second (for example `<<<<<<<<< 29.97 fps`). Record it.
4. Check file size: it must equal frame bytes times frame count. For RG10 unpacked in 16-bit containers, frame bytes = width x height x 2. Confirm packing from `--list-formats-ext` and the driver docs.
5. On NVIDIA Jetson BSPs the ISP path uses `nvarguscamerasrc` in GStreamer, not V4L2. Capture with V4L2 first anyway, since it isolates the sensor and link from the ISP.
6. Emit `csi_link_report`.

### Output
`csi_link_report`.

### Quality Gate
- `/tmp/raw.bin` size equals frame bytes x 100.
- `dmesg` shows no new CSI errors (for example `PHY`, `CRC`, `ECC`, `timeout`) during the capture.

---

## Worked Example

Illustrative only. A GMSL2 camera on a Jetson-class board.

Phase 1: `dmesg` shows `max9296 30-0048: max9296_probe: success` and the sensor driver probe line. `i2cdetect -y -r 30` shows `UU` at 0x48.
Phase 2:
```
$ media-ctl -d /dev/media0 -p
- entity 1: imx390 30-001b (1 pad, 1 link)
        pad0: Source [fmt:SRGGB12_1X12/1920x1080 field:none]
                -> "nvcsi--1":0 [ENABLED]
```
Phase 3: `v4l2-ctl ... --stream-count=100` prints `<<<<< 30.00 fps`; raw file size matches 1920 x 1080 x 2 x 100.

---

## Exit Criteria

DONE when every CSI or GMSL camera has an enabled media path, matching pad formats, and a raw capture of known size with no new link errors in `dmesg`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Probe fails with `-EREMOTEIO` | **Stop**: check the coax or FPC cable, connector seating and power-over-coax supply; do not edit the driver. |
| Phase 1 | Overlay not loaded | **Adjust**: load the vendor overlay with the BSP's documented tool and reboot. |
| Phase 2 | Pad formats differ along the path | **Adjust**: set the format with `media-ctl -V` on each pad as the vendor guide gives. |
| Phase 3 | `VIDIOC_STREAMON` fails or zero frames | **Retry**: once after a reboot; if it fails again **Return** to Phase 1 with the `dmesg` output. |
| Phase 3 | CSI CRC or ECC errors | **Stop**: link signal problem; check cable length and lane count against the vendor spec. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
