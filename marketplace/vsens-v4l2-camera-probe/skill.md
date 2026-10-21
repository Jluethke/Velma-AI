# V4L2 Camera Probe and Format Survey

**One-line description:** Surveys one V4L2 camera node with v4l2-ctl: driver capabilities, every pixel format, frame size and frame interval it offers, its control list, and a measured streaming rate per candidate mode.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_inventory` (object[], required): From `vsens-sensor-inventory`.
- `camera_device` (string, required): The capture node, preferably a stable `/dev/v4l/by-id/...-video-index0` or `/dev/v4l/by-path/...` symlink.
- `csi_link_report` (object, optional): From `vsens-gmsl-csi-bringup` when the camera is CSI or GMSL; null for USB UVC cameras.

---

## Outputs

- `camera_device_report` (object): Driver name, card, bus info, capabilities, the full format, size and interval table, the control list with ranges and defaults, and measured fps per tested mode.

---

## Phase 1: Read Capabilities and Formats

### Entry Criteria
- `camera_device` exists (`test -e <camera_device>` returns 0).
- No other process holds the device: `fuser -v <camera_device>` prints nothing.

### Actions
1. Run `v4l2-ctl -d <camera_device> --info`. Record `Driver name`, `Card type`, `Bus info`, and confirm `Device Caps` contains `Video Capture` and `Streaming`.
2. If `Device Caps` shows `Metadata Capture` only, this is the UVC metadata node. Use the sibling node (usually the lower index) instead.
3. Run `v4l2-ctl -d <camera_device> --list-formats-ext` and copy every `Pixel Format`, `Size: Discrete WxH` and `Interval: Discrete Xs (Y fps)` line into a table.
4. Mark each format as compressed (`MJPG`, `H264`) or raw (`YUYV`, `UYVY`, `NV12`, `GREY`, Bayer `RGGB`/`BA81` family). Calibration and timing work prefer raw formats, since compressed formats add a decode step and can drop frames under load.

### Output
Format, size and interval table.

### Quality Gate
- The table has one row per format, size and interval line printed by `--list-formats-ext`.
- `--info` shows `Streaming` in `Device Caps`.

---

## Phase 2: Read Controls

### Entry Criteria
- Format table exists.

### Actions
1. Run `v4l2-ctl -d <camera_device> --list-ctrls-menus` and record every control with min, max, step, default and current value.
2. Note the exposure control names this driver uses. Kernels since 5.x UVC typically expose `auto_exposure` and `exposure_time_absolute`; older kernels expose `exposure_auto` and `exposure_absolute`. Use the names this device prints. Never assume.
3. Record the unit of the exposure control from the driver docs. For UVC, `exposure_time_absolute` is in units of 100 microseconds per the UVC 1.5 specification.
4. Record whether `exposure_dynamic_framerate` (or `exposure_auto_priority` on older kernels) exists. When it is 1, the camera may lower frame rate in low light.

### Output
Control list with exposure control names and units.

### Quality Gate
- Every control printed by `--list-ctrls-menus` is in the list.
- The exposure control name and unit are recorded with their source.

---

## Phase 3: Measure Streaming Rate

### Entry Criteria
- Control list exists.

### Actions
1. For each candidate mode the user needs, run `v4l2-ctl -d <camera_device> --set-fmt-video=width=W,height=H,pixelformat=FOURCC --set-parm=FPS --stream-mmap=4 --stream-count=300`.
2. Read the per-second `fps` lines it prints. Record the median of those lines.
3. Read back the applied interval with `v4l2-ctl -d <camera_device> --get-parm`. The driver may round the request.
4. If measured fps is below the requested fps, check: USB link speed from `lsusb -t`, `exposure_dynamic_framerate` value, and whether exposure time exceeds the frame period.
5. Emit `camera_device_report`.

### Output
`camera_device_report`.

### Quality Gate
- Every tested mode has a measured fps from a 300-frame stream and the `--get-parm` readback.
- Any mode whose measured fps is below its requested fps has a recorded cause from step 4 or "cause unknown".

---

## Worked Example

Illustrative only. A USB UVC global-shutter camera at `/dev/v4l/by-id/usb-Cam_123-video-index0`.

```
$ v4l2-ctl -d /dev/video0 --list-formats-ext
        [0]: 'YUYV' (YUYV 4:2:2)
                Size: Discrete 1280x720
                        Interval: Discrete 0.017s (60.000 fps)
        [1]: 'MJPG' (Motion-JPEG, compressed)
$ v4l2-ctl -d /dev/video0 --list-ctrls-menus | grep -i exposure
  auto_exposure 0x009a0901 (menu) : min=0 max=3 default=3 value=3
  exposure_time_absolute 0x009a0902 (int) : min=1 max=5000 step=1 default=156 value=156
$ v4l2-ctl -d /dev/video0 --set-fmt-video=width=1280,height=720,pixelformat=YUYV --set-parm=60 --stream-mmap=4 --stream-count=300
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< 59.94 fps
```
Report: YUYV 1280x720 measured 59.94 fps; exposure unit 100 us.

---

## Exit Criteria

DONE when the report holds capabilities, the full format table, the control list with exposure names and units, and a measured fps per needed mode.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Device or resource busy` | **Stop**: find the holder with `fuser -v`; ask the user before stopping it. |
| Phase 1 | Node is metadata only | **Adjust**: switch to the capture node and rerun. |
| Phase 3 | `VIDIOC_S_FMT` returns EINVAL | **Adjust**: use only a size and fourcc printed by `--list-formats-ext`. |
| Phase 3 | Measured fps far below requested | **Return**: run `vsens-v4l2-exposure-framerate` to cap exposure, then remeasure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
