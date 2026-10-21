# GStreamer Camera Capture Pipeline with Drop Accounting

**One-line description:** Builds a gst-launch-1.0 capture pipeline from v4l2src with explicit caps, a bounded leaky queue and fpsdisplaysink, then reads GST_DEBUG output and frame counters to prove the pipeline delivers the camera's rate without silent drops.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `camera_device_report` (object, required): From `vsens-v4l2-camera-probe`.
- `camera_control_settings` (object, required): From `vsens-v4l2-exposure-framerate`; holds the locked frame rate.

---

## Outputs

- `gst_pipeline` (string): The final pipeline string with every caps field explicit.
- `capture_rate_report` (object): Rendered and dropped frame counts from fpsdisplaysink, the caps negotiated (from `-v`), and any warnings from GST_DEBUG.

---

## Phase 1: Write Explicit Caps

### Entry Criteria
- `gst-inspect-1.0 v4l2src` prints the element (package `gstreamer1.0-plugins-good`).

### Actions
1. Pick one format, size and rate from `camera_device_report`. Map the V4L2 fourcc to GStreamer caps: `YUYV` becomes `video/x-raw,format=YUY2`; `UYVY` becomes `format=UYVY`; `NV12` becomes `format=NV12`; `GREY` becomes `format=GRAY8`; `MJPG` becomes `image/jpeg`; Bayer formats become `video/x-bayer,format=rggb` (or `bggr`, `gbrg`, `grbg`).
2. Write the caps with width, height and `framerate=N/1` (or the exact fraction, such as `30000/1001`, from `--list-formats-ext`).
3. Do NOT leave caps open. Without them, v4l2src negotiates whatever the driver offers first, which may be a lower rate or a compressed format.

### Output
Caps string.

### Quality Gate
- The caps string names format, width, height and framerate.
- The same mode appears in `camera_device_report`.

---

## Phase 2: Run and Read Negotiation

### Entry Criteria
- Caps string written.

### Actions
1. Run:
   `gst-launch-1.0 -v v4l2src device=<dev> do-timestamp=true io-mode=mmap ! <caps> ! queue max-size-buffers=4 leaky=downstream ! videoconvert ! fpsdisplaysink video-sink=fakesink text-overlay=false sync=false`
2. In the `-v` output, find the line `/GstPipeline:pipeline0/GstV4l2Src:v4l2src0.GstPad:src: caps = ...` and confirm it matches your caps exactly.
3. Read the `last-message` lines from fpsdisplaysink: `rendered: N, dropped: M, current: X, average: Y`.
4. `leaky=downstream` drops the oldest buffer when full. That keeps latency bounded but hides drops unless you count them. Record `dropped`.
5. `do-timestamp=true` stamps buffers with the pipeline clock on arrival. Drivers that set the V4L2 buffer timestamp flag `V4L2_BUF_FLAG_TIMESTAMP_MONOTONIC` give a capture-time stamp; record which one your downstream code reads.

### Output
Negotiated caps and fpsdisplaysink counters.

### Quality Gate
- The negotiated `caps =` line on the v4l2src pad equals the Phase 1 caps.
- After 60 seconds `average` equals the locked frame rate within the decimal places the camera report shows.

---

## Phase 3: Find Silent Drops

### Entry Criteria
- Pipeline runs.

### Actions
1. Rerun with `GST_DEBUG=v4l2src:5,v4l2bufferpool:5,2 gst-launch-1.0 ... 2> gst.log`.
2. Search the log: `grep -E 'lost frames|dropped|Buffer was lost|WARN' gst.log`. A line containing `lost frames detected` from v4l2src means the kernel sequence counter skipped, so the drop happened before GStreamer.
3. If drops exist, decide using this table:

| Evidence | Cause | Fix |
|---|---|---|
| `lost frames detected` in v4l2src | Driver queue starved | Raise buffer count: `v4l2src ... ! queue` and check CPU load with `top -H` |
| `dropped` grows in fpsdisplaysink only | Sink side too slow | Remove `videoconvert` if the consumer accepts the native format |
| `average` below rate, no drops | Camera sends slower | **Return** to `vsens-v4l2-exposure-framerate` |

4. Emit `gst_pipeline` and `capture_rate_report`.

### Output
`gst_pipeline`, `capture_rate_report`.

### Quality Gate
- `grep -c 'lost frames' gst.log` result is recorded.
- `dropped` from fpsdisplaysink is recorded for a run of at least 60 seconds.

---

## Worked Example

Illustrative only. YUYV 1280x720 at 60 fps.

```
$ gst-launch-1.0 -v v4l2src device=/dev/video0 do-timestamp=true ! video/x-raw,format=YUY2,width=1280,height=720,framerate=60/1 ! queue max-size-buffers=4 leaky=downstream ! videoconvert ! fpsdisplaysink video-sink=fakesink text-overlay=false sync=false
/GstPipeline:pipeline0/GstV4l2Src:v4l2src0.GstPad:src: caps = video/x-raw, format=(string)YUY2, width=(int)1280, height=(int)720, framerate=(fraction)60/1, ...
/GstPipeline:pipeline0/GstFPSDisplaySink:fpsdisplaysink0: last-message = rendered: 3601, dropped: 0, current: 60.01, average: 60.00
```
`grep -c 'lost frames' gst.log` returns 0. Report: zero drops in 60 seconds.

---

## Exit Criteria

DONE when the pipeline negotiates the intended caps, runs at the locked rate, and both drop counters are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `no element "v4l2src"` | **Stop**: install `gstreamer1.0-plugins-good` and rerun. |
| Phase 2 | `not-negotiated` error | **Adjust**: caps do not match a driver mode; copy them again from `--list-formats-ext`. |
| Phase 2 | `Device '/dev/video0' is busy` | **Stop**: another process holds the camera; find it with `fuser -v`. |
| Phase 3 | `lost frames detected` persists | **Return**: to `vsens-v4l2-camera-probe` to check USB speed and mode. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
