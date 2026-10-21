# ROS 2 Deadline and Liveliness QoS Monitor

**One-line description:** Builds an rclcpp monitor node that subscribes to the supervised command and sensor topics with Deadline and Liveliness QoS set from the envelope, receives missed-deadline and liveliness-changed events through `SubscriptionOptions::event_callbacks`, detects QoS incompatibility, and confirms the negotiated profile with `ros2 topic info --verbose`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operating_envelope` (object[], required): Output of `rmon-envelope-from-requirements`; `max_age_ms` per topic signal.
- `repo_dir` (string, required): ROS 2 workspace `src/` package directory for the monitor (an `ament_cmake` package).

---

## Outputs

- `ros2_qos_monitor` (object): Package name, node executable name, the QoS profile per subscribed topic, the RMW implementation in use, and evidence of a deadline event firing on the bench.

---

## Phase 1: Check the Middleware Supports the Policies

### Entry Criteria
- A sourced ROS 2 install: `printenv ROS_DISTRO` prints a distribution name.
- The monitor node is a separate executable, never loaded into the supervised component's container.

### Actions
1. Record the RMW: `printenv RMW_IMPLEMENTATION` (empty means the distribution default) and `ros2 doctor --report | rg -i middleware`.
2. Confirm in the documentation of that RMW (Fast DDS, Cyclone DDS, Connext, Zenoh) that Deadline and Liveliness are supported. If a policy is unsupported, the event callback never fires and the monitor is blind; record that and use the timer-based staleness checker instead.
3. For each monitored topic, take `max_age_ms` from the envelope as the Deadline period. Liveliness lease duration comes from requirements or is listed as open; do not invent it.

### Output
RMW support table and per-topic periods.

### Quality Gate
- The RMW name is recorded with the command output.
- Every monitored topic has a Deadline period traced to an envelope row.

---

## Phase 2: Implement the Node

### Entry Criteria
- RMW supports the policies, or the fallback decision is recorded.

### Actions
1. In the monitor node constructor:
   ```cpp
   rclcpp::QoS qos(rclcpp::KeepLast(1));
   qos.reliable();
   qos.deadline(rclcpp::Duration::from_nanoseconds(max_age_ns));
   qos.liveliness(rclcpp::LivelinessPolicy::Automatic);
   qos.liveliness_lease_duration(rclcpp::Duration::from_nanoseconds(lease_ns));

   rclcpp::SubscriptionOptions opts;
   opts.event_callbacks.deadline_callback =
     [this](rclcpp::QOSDeadlineRequestedInfo & ev) {
       on_stale("/cmd_vel", ev.total_count, ev.total_count_change); };
   opts.event_callbacks.liveliness_callback =
     [this](rclcpp::QOSLivelinessChangedInfo & ev) {
       if (ev.alive_count == 0) on_silent("/cmd_vel", ev.not_alive_count); };
   opts.event_callbacks.incompatible_qos_callback =
     [this](rclcpp::QOSRequestedIncompatibleQoSInfo & ev) {
       on_monitor_fault("incompatible QoS policy id", ev.last_policy_kind); };

   sub_ = create_subscription<geometry_msgs::msg::Twist>("/cmd_vel", qos,
     [this](geometry_msgs::msg::Twist::ConstSharedPtr m) { on_cmd(*m); }, opts);
   ```
   Older distributions name the enum `RMW_QOS_POLICY_LIVELINESS_AUTOMATIC`; check the rclcpp API docs for your `ROS_DISTRO`.
2. A requested Deadline on the subscriber is compatible only if the publisher offers a Deadline period equal or shorter. If the publisher offers none, the subscription is incompatible and `incompatible_qos_callback` fires: treat that as a monitor fault (trip), never as a pass.
3. Keep a wall timer as a second, independent staleness path (`create_wall_timer`) that calls the staleness checker's `poll()`; QoS events depend on the middleware, the timer depends only on the monitor.
4. Run the node in its own process with its own executor: `ros2 run <pkg> <monitor_exe>`. Do not add it to a component container.

### Output
Monitor node source.

### Quality Gate
- `colcon build --packages-select <pkg>` exits 0.
- `rg -n "incompatible_qos_callback" <pkg>/src` returns at least one line.

---

## Phase 3: Verify on the Bench

### Entry Criteria
- Node builds. Bench setup only; no actuator is commanded by this test.

### Actions
1. Start the monitor, then inspect: `ros2 topic info /cmd_vel --verbose`. Read the "QoS profile" block for each endpoint and confirm Deadline and Liveliness match what you set.
2. Publish at the nominal rate from a test publisher with a Deadline offered: `ros2 topic pub -r <rate_hz> /cmd_vel geometry_msgs/msg/Twist "{}" --qos-reliability reliable` (check `ros2 topic pub --help` for deadline flags in your distribution; if none exist, use a small test publisher node that sets `qos.deadline`).
3. Stop the publisher with Ctrl+C. The monitor must log a deadline event within one Deadline period plus the timer period.
4. Start a publisher with no Deadline offered and confirm the incompatible QoS event is logged.

### Output
`ros2_qos_monitor`.

### Quality Gate
- The monitor log shows a `stale` record after the publisher stops, with `total_count_change` 1 or more.
- The monitor log shows an incompatible QoS fault for the publisher without Deadline.

---

## Worked Example

Illustrative only.
```
$ ros2 topic info /cmd_vel --verbose
Type: geometry_msgs/msg/Twist
Publisher count: 1
...
  QoS profile:
    Reliability: RELIABLE
    Durability: VOLATILE
    Lifespan: Infinite
    Deadline: 30000000 nanoseconds
    Liveliness: AUTOMATIC
    Liveliness lease duration: Infinite
$ (publisher stopped)
[speed_monitor]: deadline missed on /cmd_vel total=1 change=1 -> INPUT_STALE
```

---

## Exit Criteria

DONE when the RMW support is recorded, Deadline periods come from the envelope, missed deadlines and incompatible QoS both trip the monitor on the bench, and a timer-based staleness path runs alongside.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | RMW lacks Deadline support | **Adjust**: rely on the timer-based staleness checker; record the gap in the independence plan. |
| Phase 2 | Compile error on liveliness enum | **Adjust**: use the enum name from your distribution's rclcpp docs. |
| Phase 3 | No deadline event when the publisher stops | **Stop**: check the publisher offers a Deadline and `ros2 topic info --verbose` shows it; do not lower the period to force a trip. |

**Do not:** run the monitor in the supervised component's container, treat incompatible QoS as healthy, or rely on QoS events as the only staleness path.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
