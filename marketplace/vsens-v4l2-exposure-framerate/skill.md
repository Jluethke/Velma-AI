# Lock V4L2 Exposure to Hold a Fixed Frame Rate

**One-line description:** Switches a V4L2 camera to manual exposure with an exposure time that fits inside the frame period, disables dynamic frame rate, persists the settings with a udev rule, and proves the frame rate stays fixed in dark and bright scenes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `camera_device_report` (object, required): From `vsens-v4l2-camera-probe`; holds exposure control names, units and ranges.
- `target_frame_rate` (number, required): Frame rate in fps the application needs; must be one of the intervals in the report.
- `max_exposure_us` (number, optional): Upper exposure limit in microseconds chosen by the user for motion blur. If absent, the limit is the frame period only.

---

## Outputs

- `camera_control_settings` (object): The control names and values applied, the exposure in microseconds, the frame period, the udev rule text, and measured fps in a dark and a bright scene.

---

## Phase 1: Compute the Exposure Ceiling

### Entry Criteria
- `target_frame_rate` appears as an interval in `camera_device_report`.

### Actions
1. Compute frame period in microseconds: `period_us = 1e6 / target_frame_rate`.
2. Set `ceiling_us = period_us`. If `max_exposure_us` is given, set `ceiling_us = min(period_us, max_exposure_us)`. Do not invent a blur limit.
3. Many sensors need readout or blanking time beyond exposure. Read the sensor datasheet for the maximum exposure at this frame rate. If the datasheet gives a lower limit, use it.
4. Convert to control units. For UVC `exposure_time_absolute` (100 us units): `value = floor(ceiling_us / 100)`. Clamp to the control's min and max from the report.

### Output
Exposure ceiling in microseconds and in control units.

### Quality Gate
- `value x unit_us <= period_us` holds when computed.
- The value lies within the control min and max printed by `--list-ctrls-menus`.

---

## Phase 2: Apply Manual Exposure

### Entry Criteria
- Exposure ceiling computed.

### Actions
1. Set manual mode. On UVC, `auto_exposure` menu value 1 is Manual Mode per the V4L2 control documentation: `v4l2-ctl -d <dev> -c auto_exposure=1`. On older kernels the control is `exposure_auto=1`. Use the name from the report.
2. Disable dynamic frame rate: `v4l2-ctl -d <dev> -c exposure_dynamic_framerate=0` (older kernels: `exposure_auto_priority=0`). Skip only if the control does not exist.
3. Set exposure: `v4l2-ctl -d <dev> -c exposure_time_absolute=<value>`.
4. Set gain if needed for brightness, never exposure above the ceiling: `v4l2-ctl -d <dev> -c gain=<n>` within the reported range.
5. Read back with `v4l2-ctl -d <dev> -C auto_exposure,exposure_time_absolute,exposure_dynamic_framerate` and confirm each value.
6. Do NOT set controls while another process streams unless the driver documents it as safe; some drivers return EBUSY or apply the change after several frames.

### Output
Applied control values.

### Quality Gate
- `-C` readback equals the values written.
- `auto_exposure` reads the manual value, not the auto value.

---

## Phase 3: Persist and Verify

### Entry Criteria
- Controls applied.

### Actions
1. Create `/etc/udev/rules.d/90-camera-exposure.rules` with one line matching the camera and running `v4l2-ctl` on add, for example `ACTION=="add", SUBSYSTEM=="video4linux", ATTRS{idVendor}=="<vid>", ATTRS{idProduct}=="<pid>", ATTR{index}=="0", RUN+="/usr/bin/v4l2-ctl -d $devnode -c auto_exposure=1 -c exposure_dynamic_framerate=0 -c exposure_time_absolute=<value>"`.
2. Reload: `sudo udevadm control --reload && sudo udevadm trigger -s video4linux`. Replug the camera and repeat the `-C` readback.
3. Cover the lens and run `v4l2-ctl -d <dev> --stream-mmap --stream-count=300`. Record the fps lines.
4. Point at a bright scene and repeat. Record the fps lines.
5. Emit `camera_control_settings`.

### Output
`camera_control_settings`.

### Quality Gate
- After replug, `-C` readback shows the persisted values without running anything by hand.
- Dark and bright streams both report fps equal to `--get-parm` readback within the rounding the driver prints.

---

## Worked Example

Illustrative only. `target_frame_rate` = 30, `max_exposure_us` = 8000.

Phase 1: period 33333 us; ceiling = min(33333, 8000) = 8000 us; control value = 80.
Phase 2:
```
$ v4l2-ctl -d /dev/video0 -c auto_exposure=1 -c exposure_dynamic_framerate=0 -c exposure_time_absolute=80
$ v4l2-ctl -d /dev/video0 -C auto_exposure,exposure_time_absolute
auto_exposure: 1
exposure_time_absolute: 80
```
Phase 3: lens covered: `<<<<< 30.00 fps`; bright scene: `<<<<< 30.00 fps`. Before the change the covered-lens run read 15.00 fps, which was dynamic frame rate halving the rate.

---

## Exit Criteria

DONE when manual exposure inside the frame period persists across replug and the measured rate holds in dark and bright scenes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requested rate not offered | **Return**: pick a rate from `camera_device_report`. |
| Phase 2 | `VIDIOC_S_EXT_CTRLS: failed: Input/output error` | **Adjust**: set `auto_exposure` to manual first, then exposure, as separate commands. |
| Phase 2 | Exposure control is inactive (flags=inactive) | **Adjust**: manual mode is not set; repeat step 1. |
| Phase 3 | Rate drops in dark scene | **Retry**: confirm `exposure_dynamic_framerate=0`; if the control is missing, the firmware may not support a fixed rate; **Stop** and report it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
