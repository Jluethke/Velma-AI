# ROS 2 Read-Only SocketCAN Bridge for an Owned Vehicle

**One-line description:** Brings up a Linux SocketCAN interface in listen-only mode on a vehicle the user owns, verifies raw traffic with candump, bridges received frames into ROS 2 with the ros2_socketcan receiver node only (no sender), and records them to MCAP for offline decoding.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_interface` (string, required): SocketCAN interface name, for example `can0`, from a USB or PCIe CAN adapter supported by the Linux kernel.
- `can_bitrate` (integer, required): Bus bitrate in bit/s, taken from the vehicle's or bus's documentation for the connector being tapped. Never guessed.

---

## Outputs

- `can_topic` (string): The ROS 2 topic carrying received frames and its message type.
- `can_capture_check` (object): `ip -details link show` output proving listen-only mode, a candump sample, `ros2 topic hz` on the frame topic, and confirmation that no sender node is running.

---

## Phase 1: Listen-Only Interface

### Entry Criteria
- The vehicle is owned by the user.
- The work is read-only: logging, decoding and diagnostics reads. No frames are transmitted by this flow.
- `can_bitrate` comes from documentation for the bus being tapped.

### Actions
1. Connect the adapter to the documented diagnostic or bus connector. Do not cut into wiring, and do not connect behind or around a security gateway module; read only what the connector exposes.
2. Bring the interface up in listen-only mode so the controller never transmits, including acknowledgment bits:
   `sudo ip link set <can_interface> down`
   `sudo ip link set <can_interface> type can bitrate <can_bitrate> listen-only on`
   `sudo ip link set <can_interface> up`
3. Verify: `ip -details link show <can_interface>`. The output must include `<LISTEN-ONLY>` in the CAN control mode flags and the bitrate. Confirm the flag name with `ip link help can` if your iproute2 prints it differently.
4. Install can-utils if missing (`sudo apt install can-utils`) and run `candump -ta <can_interface>` for a short window with the vehicle in the state the user wants to observe. Each line shows interface, arbitration ID, length and data bytes.

### Output
A listen-only interface showing traffic.

### Quality Gate
- `ip -details link show` output contains the listen-only flag and the documented bitrate.
- candump prints frames. If it prints nothing, the bitrate or connector is wrong; do not try other bitrates by guess, return to documentation.

---

## Phase 2: Bridge Receive-Only Into ROS 2

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Install the bridge: `sudo apt install ros-<distro>-ros2-socketcan`.
2. Start ONLY the receiver: `ros2 launch ros2_socketcan socket_can_receiver.launch.py interface:=<can_interface>`. Confirm the launch file name and argument with `ros2 launch ros2_socketcan --show-args socket_can_receiver.launch.py`; check the package README for your distro.
3. Do not launch `socket_can_sender` or the combined bridge launch file. The listen-only interface would reject transmission anyway; not launching a sender keeps the system unambiguous.
4. Find the topic: `ros2 topic list -t | grep -i can`. The receiver publishes `can_msgs/msg/Frame` (commonly on `/from_can_bus`; record what your version uses as `can_topic`).
5. `ros2 node list` must show the receiver and no sender node.

### Output
Frames on a ROS 2 topic.

### Quality Gate
- `ros2 topic hz <can_topic>` prints a rate.
- `ros2 node list` contains no node with `sender` in its name.

---

## Phase 3: Record for Offline Decoding

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Record with `ros2-rosbag2-mcap-record` using `<can_topic>` as the topic list, or directly: `ros2 bag record -s mcap -o can_run01 <can_topic>`.
2. In parallel, keep a raw log for cross-check: `candump -l <can_interface>` writes a `candump-<date>.log` file.
3. After stopping, compare frame counts: `ros2 bag info can_run01` Count versus `wc -l candump-*.log`. They should be close; a large gap means the bridge dropped frames.
4. Decoding signals requires a DBC file the user is entitled to use. Decoding happens offline from the bag or log; nothing in decoding transmits.

### Output
`can_topic`, `can_capture_check`.

### Quality Gate
- The bag's frame count and the candump log line count are both recorded with the difference.

---

## Worked Example

Illustrative only. Owned vehicle, adapter on `can0`, bitrate 500000 from the bus documentation.

- Phase 1: `ip -details link show can0` shows `can <LISTEN-ONLY> state ERROR-ACTIVE ... bitrate 500000`; `candump -ta can0` prints frames such as `(1729500000.120000)  can0  3E9   [8]  00 00 00 00 00 00 00 00`.
- Phase 2: `ros2 topic hz /from_can_bus` prints an average rate.
- Phase 3: bag count 120344, candump log 120351 lines.

---

## Exit Criteria

DONE when the interface is proven listen-only, only the receiver runs, frames are on a ROS 2 topic, and a recording exists with its count cross-checked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Vehicle not owned by the user | **Stop**: this flow applies only to the user's own vehicle. |
| Phase 1 | Bitrate unknown | **Return**: request the documented bitrate. |
| Phase 1 | Interface state `BUS-OFF` or no frames | **Stop**: disconnect, recheck connector pinout and bitrate from documentation. |
| Phase 2 | Launch file name differs | **Adjust**: use `ros2 pkg prefix ros2_socketcan` and list its `share/ros2_socketcan/launch` directory; pick the receiver file. |
| Phase 3 | Large count gap | **Retry**: rerecord with fewer other topics; record the gap if it persists. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
