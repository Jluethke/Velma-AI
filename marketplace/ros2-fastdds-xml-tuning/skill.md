# ROS 2 Fast DDS XML Profile and Discovery Server

**One-line description:** Writes and loads a Fast DDS XML profile for rmw_fastrtps_cpp (transport selection, shared memory control, publication mode) and, where multicast is blocked, sets up a Fast DDS Discovery Server, then proves the profile is actually applied and data flows.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rmw_env` (object, required): Environment from `ros2-dds-rmw-selection`; `RMW_IMPLEMENTATION` must be `rmw_fastrtps_cpp`.
- `network_topology` (object, required): Hosts, interfaces, multicast availability, container use.

---

## Outputs

- `fastdds_profile` (object): Path and full text of the XML profile, the environment variables that load it, and the Discovery Server address if used.
- `fastdds_check` (object): Evidence the profile loaded (no XML parser errors, observed behavior change) and talker or listener proof across the affected hosts.

---

## Phase 1: Decide What to Change

### Entry Criteria
- `rmw_env.RMW_IMPLEMENTATION == rmw_fastrtps_cpp`.

### Actions
1. Apply this table and select only the rows whose condition is true:

| Condition | Change |
|---|---|
| A node runs in a container without `--ipc=host`, discovery works but no data arrives | Disable shared memory by making UDPv4 the only transport (XML below). |
| Multicast is blocked between hosts | Use Discovery Server (Phase 3). |
| Large messages (images, point clouds) stall or drop with RELIABLE QoS | Test `RMW_FASTRTPS_PUBLICATION_MODE=ASYNCHRONOUS` and the kernel settings in the ROS 2 "DDS tuning information" page; measure before and after. |
| None of the above | Make no change. Do not tune without a measured symptom. |

2. Record the measured symptom for each selected row (command and output).

### Output
A list of selected changes with their symptoms.

### Quality Gate
- Every selected row has a recorded symptom; if none are selected, the flow ends with `fastdds_profile` set to "none".

---

## Phase 2: Write and Load the XML Profile

### Entry Criteria
- At least one XML change selected.

### Actions
1. Write `~/fastdds_profile.xml`:
   ```
   <?xml version="1.0" encoding="UTF-8" ?>
   <profiles xmlns="http://www.eprosima.com/XMLSchemas/fastRTPS_Profiles">
     <transport_descriptors>
       <transport_descriptor>
         <transport_id>udp_only</transport_id>
         <type>UDPv4</type>
       </transport_descriptor>
     </transport_descriptors>
     <participant profile_name="udp_participant" is_default_profile="true">
       <rtps>
         <userTransports>
           <transport_id>udp_only</transport_id>
         </userTransports>
         <useBuiltinTransports>false</useBuiltinTransports>
       </rtps>
     </participant>
   </profiles>
   ```
2. Load it: `export FASTRTPS_DEFAULT_PROFILES_FILE=$HOME/fastdds_profile.xml`. Fast DDS 3.x (used by newer distros) reads `FASTDDS_DEFAULT_PROFILES_FILE`; set both when unsure, and confirm the Fast DDS version with `ros2 doctor --report` or the vendor package version.
3. Only set `RMW_FASTRTPS_USE_QOS_FROM_XML=1` if you intend the XML to override QoS from code. Leaving it set by accident silently replaces the QoS from `ros2-qos-profile-selection`.
4. Start any node. A malformed file prints lines containing `XMLPARSER Error` or `XMLPROFILEMANAGER Error`. Fix and restart until none appear.
5. Prove the change is live: rerun the symptom from Phase 1. A profile that loads but changes nothing measurable is not proven applied.

### Output
Loaded profile with before and after evidence.

### Quality Gate
- Node startup output contains no `XMLPARSER Error` lines.
- The Phase 1 symptom command now gives a different, recorded result.

---

## Phase 3: Discovery Server (Only When Multicast Is Blocked)

### Entry Criteria
- The multicast-blocked row was selected.

### Actions
1. On a host reachable by all others, start the server: `fastdds discovery --server-id 0` (Fast DDS 2.x syntax). Confirm the exact flags with `fastdds discovery --help` for your installed version. The server listens on UDP port 11811 by default and prints its GUID prefix.
2. On every client host: `export ROS_DISCOVERY_SERVER=<server_ip>:11811`.
3. CLI tools such as `ros2 topic list` need full graph visibility: also `export ROS_SUPER_CLIENT=TRUE` in the terminal running the CLI, then `ros2 daemon stop`.
4. Run the talker and listener on two client hosts.

### Output
`fastdds_profile`, `fastdds_check`.

### Quality Gate
- The listener prints received messages across hosts.
- `ros2 topic list` in a super client terminal shows `/chatter`.

---

## Worked Example

Illustrative only. A perception node in Docker without `--ipc=host`.

- Phase 1: `ros2 topic info /points` shows publisher count 1 and subscriber count 1, but `ros2 topic hz /points` inside the container prints nothing. Row one selected.
- Phase 2: UDP-only profile loaded on host and container; no parser errors; `ros2 topic hz /points` now prints `average rate: 10.012`.
- Phase 3: not selected.

---

## Exit Criteria

DONE when every selected change is applied, proven live by a changed measurement, and data flows between the affected hosts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `RMW_IMPLEMENTATION` is not Fast DDS | **Stop**: use `ros2-cyclonedds-xml-tuning` instead. |
| Phase 2 | `XMLPARSER Error` | **Adjust**: validate the file against the namespace and element names in the Fast DDS XML documentation; fix and restart. |
| Phase 2 | No behavior change after loading | **Adjust**: confirm the environment variable is exported in the same shell that launches the node, and that the variable name matches the Fast DDS version. |
| Phase 3 | CLI shows no topics | **Adjust**: set `ROS_SUPER_CLIENT=TRUE` and restart the daemon. |
| Phase 3 | Server not reachable | **Retry**: check UDP 11811 with the host firewall, then rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
