# ROS 2 Heartbeat Monitoring with Deadline and Liveliness QoS

**One-line description:** Monitors safety-relevant ROS 2 topics with the DDS deadline and liveliness QoS policies (rclcpp or rclpy event callbacks), checks offered versus requested QoS compatibility with `ros2 topic info --verbose`, adds a sequence counter so a stale publisher is caught, and routes a missed deadline to a stop request through the hardware relay, never to a software-only stop message.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `safety_requirements` (object[], required): Output of `fusa-requirements-decomposition`; supplies the per-topic detection budget.
- `ros_workspace` (string, required): Path to the colcon workspace that contains the publisher and monitor packages.

---

## Outputs

- `heartbeat_monitor` (object): `stack` (`ros2`), `ros_distro`, `rmw_implementation`, `monitored_topics` (name, type, deadline, liveliness kind, lease duration), `compatibility_check`, `reaction_path`, `test_results`.

---

## Phase 1: Choose Topics and Periods

### Entry Criteria
- `ros2 doctor --report` runs and prints the distribution; record `ROS_DISTRO` and `RMW_IMPLEMENTATION` (`echo $RMW_IMPLEMENTATION`, empty means the distro default).
- At least one TSR names a topic or a node whose loss must be detected.

### Actions
1. For each TSR, pick the data topic that proves the producing loop runs (for example `/steering/cmd`), not a separate "I am alive" topic published by a timer that could keep running while the control logic is stuck.
2. Measure the real rate: `ros2 topic hz /steering/cmd --window 200` while the system runs normally. Record mean and the reported max interval.
3. Set the deadline period from the TSR budget. It must exceed the measured max interval; if it does not, the budget and the publish rate conflict and the conflict is reported, not hidden.

### Output
Topic table with measured rate and chosen deadline.

### Quality Gate
- Every monitored topic has a measured max interval from `ros2 topic hz`.
- Every deadline is at least the measured max interval and at most the TSR budget, or a conflict is recorded.

---

## Phase 2: Configure QoS and Callbacks

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Publisher (rclcpp):
   ```cpp
   rclcpp::QoS qos(rclcpp::KeepLast(1));
   qos.reliable().deadline(rclcpp::Duration::from_nanoseconds(DEADLINE_NS))
      .liveliness(rclcpp::LivelinessPolicy::Automatic)
      .liveliness_lease_duration(rclcpp::Duration::from_nanoseconds(LEASE_NS));
   pub_ = create_publisher<CmdMsg>("/steering/cmd", qos);
   ```
2. Monitor subscription (rclcpp) with the same or longer requested deadline:
   ```cpp
   rclcpp::SubscriptionOptions opts;
   opts.event_callbacks.deadline_callback =
     [this](rclcpp::QOSDeadlineRequestedInfo & ev) { on_deadline_missed(ev.total_count_change); };
   opts.event_callbacks.liveliness_callback =
     [this](rclcpp::QOSLivelinessChangedInfo & ev) { if (ev.alive_count == 0) on_publisher_lost(); };
   sub_ = create_subscription<CmdMsg>("/steering/cmd", qos, cb, opts);
   ```
   rclpy equivalent: `QoSProfile(depth=1, deadline=Duration(nanoseconds=...), liveliness=QoSLivelinessPolicy.AUTOMATIC, liveliness_lease_duration=Duration(nanoseconds=...))` and `SubscriptionEventCallbacks(deadline=cb_deadline, liveliness=cb_liveliness)` passed as `event_callbacks=`. Check names against the API docs for your distro.
3. Add a `uint32` sequence counter to the message (or use the header stamp) and check in the monitor that it increments by one; a deadline only proves messages arrive, not that they are new.
4. Reaction: `on_deadline_missed` and `on_publisher_lost` stop toggling the line that keeps the software stop request relay energized (hardware retriggerable timer), so the hardware stop chain opens. A software "stop" topic may be published in addition for logging, never as the only reaction.
5. Build: `colcon build --packages-select <monitor_pkg> <publisher_pkg>` then `source install/setup.bash`.

### Output
Publisher and monitor with QoS events and sequence check.

### Quality Gate
- `colcon build` exits 0.
- `ros2 topic info /steering/cmd --verbose` shows the publisher and subscriber deadline and liveliness values as configured.
- The subscriber is listed as matched (subscription count at least 1); an incompatible QoS pair shows no match.

---

## Phase 3: Verify Detection Time

### Entry Criteria
- Phase 2 gate passed.
- Bench only, actuator power behind the independent hardware emergency stop, wheels off the ground.

### Actions
1. Freeze the publisher: `kill -STOP $(pgrep -f <publisher_executable>)`. Expected: the deadline callback fires; the relay drops.
2. Resume with `kill -CONT` and then kill it: `kill -9 <pid>`. Expected: liveliness callback with `alive_count == 0` after the lease duration.
3. Inject a stale message: in a test build, republish the last message with the same sequence number. Expected: the sequence check fires.
4. Measure from the signal to the relay coil drop with a logic analyzer. Record against the budget.
5. Check the monitor itself: freeze the monitor node; the hardware retriggerable timer must drop the relay because the monitor stops toggling.

### Output
`heartbeat_monitor` with test results.

### Quality Gate
- Each of the four tests has a capture and a measured time within the budget, or a recorded failure.
- The monitor freeze test drops the relay.

---

## Worked Example

Illustrative only. Humble, `rmw_cyclonedds_cpp`, `/steering/cmd` at 50 Hz, TSR budget 100 ms.

```
$ ros2 topic hz /steering/cmd --window 200
average rate: 49.98
	min: 0.017s max: 0.031s std dev: 0.0021s window: 200
$ ros2 topic info /steering/cmd --verbose
...
  Deadline: 60000000 nanoseconds
  Liveliness: AUTOMATIC
  Liveliness lease duration: 200000000 nanoseconds
```
Deadline 60 ms (above 31 ms max interval, below 100 ms budget). SIGSTOP on the publisher: deadline callback logged, relay dropped 64 ms after the last message.

---

## Exit Criteria

DONE when each safety topic has deadline and liveliness QoS matched between publisher and monitor, a sequence check, a hardware relay reaction, and measured detection times for freeze, kill, stale and monitor-freeze cases.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Measured max interval exceeds the budget | **Return**: report the rate and budget conflict to the requirements flow. |
| Phase 2 | Subscriber not matched after adding QoS | **Adjust**: requested deadline must be equal or longer than offered; liveliness kinds must be compatible. |
| Phase 2 | Callback API name differs in the distro | **Adjust**: use the names in that distro's rclcpp or rclpy docs. |
| Phase 3 | Deadline callback fires but relay stays on | **Stop**: reaction path is software-only; fix before any motion. |

**Do not:** monitor a timer-driven heartbeat topic instead of the data topic, rely on a stop topic as the safety reaction, or loosen the deadline to stop callbacks without fixing the publisher.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
