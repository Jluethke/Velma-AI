# C++ V4L2 mmap Capture with Buffer Timestamps and Sequence

**One-line description:** Writes a minimal C++ V4L2 streaming capture loop (VIDIOC_REQBUFS, VIDIOC_QUERYBUF, mmap, VIDIOC_QBUF, VIDIOC_STREAMON, poll, VIDIOC_DQBUF) that logs each buffer's kernel timestamp, timestamp flags and sequence number, so frame drops and timestamp source are measured from the driver rather than guessed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `camera_control_settings` (object, required): From `vsens-v4l2-exposure-framerate`; the locked mode and frame rate.
- `camera_device_report` (object, required): From `vsens-v4l2-camera-probe`; the pixel format and size to request.

---

## Outputs

- `v4l2_capture_log` (string): Path to a CSV with one row per dequeued buffer: `host_monotonic_ns`, `sensor_stamp_ns` (the `v4l2_buffer.timestamp`), `seq` (`v4l2_buffer.sequence`), `bytesused`, and the timestamp flags, plus a summary of drops and the timestamp source flag.

---

## Phase 1: Write the Capture Loop

### Entry Criteria
- Kernel headers present: `test -f /usr/include/linux/videodev2.h`.
- No other process holds the camera (`fuser -v <dev>` prints nothing).

### Actions
1. Create `v4l2cap/main.cpp` and a `CMakeLists.txt` with `add_executable(v4l2cap main.cpp)` and C++17.
2. Open with `open(dev, O_RDWR | O_NONBLOCK)`. Call `VIDIOC_QUERYCAP` and require `V4L2_CAP_VIDEO_CAPTURE` and `V4L2_CAP_STREAMING` in `device_caps`.
3. `VIDIOC_S_FMT` with the format and size from `camera_device_report`; read back the struct the driver returns and log its values. `VIDIOC_S_PARM` with `timeperframe` from the locked rate; log the driver's readback.
4. `VIDIOC_REQBUFS` with `count` from the user or the driver's minimum, `type = V4L2_BUF_TYPE_VIDEO_CAPTURE`, `memory = V4L2_MEMORY_MMAP`. Use the `count` the driver returns, which may differ.
5. For each buffer: `VIDIOC_QUERYBUF`, then `mmap(nullptr, buf.length, PROT_READ | PROT_WRITE, MAP_SHARED, fd, buf.m.offset)`, then `VIDIOC_QBUF`.
6. Route every `ioctl` through one wrapper function `xioctl` that retries on `EINTR`; on any other error print `strerror(errno)` with the ioctl name and exit nonzero. Do not ignore return values.

### Output
Source files.

### Quality Gate
- `cmake -S v4l2cap -B v4l2cap/build && cmake --build v4l2cap/build` exits 0.
- With the checked wrapper named `xioctl`, `grep -nE '(^|[^x])ioctl\(' v4l2cap/main.cpp` prints exactly one line, the raw call inside `xioctl`.

---

## Phase 2: Stream and Log

### Entry Criteria
- Binary built.

### Actions
1. `VIDIOC_STREAMON`. Loop: `poll` on the fd with `POLLIN` and a timeout of several frame periods; on timeout log a stall row and continue.
2. `VIDIOC_DQBUF` into a `v4l2_buffer`. Read `clock_gettime(CLOCK_MONOTONIC)` right after it returns.
3. Log `buf.timestamp` converted to ns, `buf.sequence`, `buf.bytesused`, and `buf.flags & V4L2_BUF_FLAG_TIMESTAMP_MASK` and `buf.flags & V4L2_BUF_FLAG_TSTAMP_SRC_MASK`.
4. Re-queue the buffer immediately with `VIDIOC_QBUF` before any processing. Holding buffers starves the driver and causes drops.
5. Check `buf.flags & V4L2_BUF_FLAG_ERROR`; count and log errored buffers.
6. Run for the duration the user chooses, then `VIDIOC_STREAMOFF`, `munmap` each buffer, `close`.

### Output
CSV log.

### Quality Gate
- The CSV row count equals the number of DQBUF calls the program prints at exit.
- The program exits 0 and `dmesg` shows no new errors for the device.

---

## Phase 3: Read the Log

### Entry Criteria
- CSV exists.

### Actions
1. Timestamp clock: if the mask equals `V4L2_BUF_FLAG_TIMESTAMP_MONOTONIC`, `buf.timestamp` is CLOCK_MONOTONIC and comparable with `host_monotonic_ns`. If it equals `V4L2_BUF_FLAG_TIMESTAMP_UNKNOWN`, record that the stamp clock is unknown.
2. Timestamp source: `V4L2_BUF_FLAG_TSTAMP_SRC_SOE` means start of exposure; `V4L2_BUF_FLAG_TSTAMP_SRC_EOF` means end of frame (last byte). Record which one the driver sets; the UVC driver documents its choice in the kernel source.
3. Drops: `numpy.diff(seq)` values above 1 are frames the driver counted but you never received. Sum `diff - 1`.
4. Dequeue delay: `host_monotonic_ns - sensor_stamp_ns` (valid only for the MONOTONIC flag). Record median and maximum.
5. Record the path as `v4l2_capture_log`. It feeds `vsens-py-dropout-detector` directly, since the column names match.

### Output
`v4l2_capture_log`.

### Quality Gate
- The timestamp clock flag and source flag are recorded by name.
- The sequence-gap count is printed with the total frame count.

---

## Worked Example

Illustrative only. YUYV 1280x720 at 60 fps, 4 buffers, 60 s.

```
$ ./v4l2cap/build/v4l2cap /dev/video0 1280 720 YUYV 60 60 > cap.csv
S_FMT readback 1280x720 YUYV bytesperline 2560
REQBUFS requested 4 got 4
dequeued 3600, errored 0, poll timeouts 0
$ python3 -c "import numpy as n; d=n.genfromtxt('cap.csv',delimiter=',',names=True); s=n.diff(d['seq']); print(int((s[s>1]-1).sum()))"
0
```
Flags: TIMESTAMP_MONOTONIC, TSTAMP_SRC_SOE. Dequeue delay median 18.9 ms, maximum 21.4 ms.

---

## Exit Criteria

DONE when the capture loop runs with every ioctl checked, the log holds sequence, stamp and flags per buffer, and drops and stamp semantics are read from it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `VIDIOC_REQBUFS` returns EBUSY | **Stop**: another process streams; find it with `fuser -v`. |
| Phase 1 | `mmap` fails with EINVAL | **Adjust**: use `buf.m.offset` and `buf.length` from QUERYBUF exactly. |
| Phase 2 | Poll timeouts | **Return**: to `vsens-v4l2-exposure-framerate`; exposure may exceed the frame period. |
| Phase 3 | Sequence gaps | **Adjust**: increase buffer count and re-queue before processing, then **Retry**. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
