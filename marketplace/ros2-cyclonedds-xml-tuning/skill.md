# ROS 2 Cyclone DDS XML Configuration

**One-line description:** Writes and loads a Cyclone DDS configuration for rmw_cyclonedds_cpp (network interface pinning, unicast peer list when multicast is blocked, socket receive buffer for large messages), then proves it was applied and that data flows between hosts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rmw_env` (object, required): Environment from `ros2-dds-rmw-selection`; `RMW_IMPLEMENTATION` must be `rmw_cyclonedds_cpp`.
- `network_topology` (object, required): Hosts, interface names, IP addresses, multicast availability.

---

## Outputs

- `cyclonedds_config` (object): Path and full text of the XML, and the `CYCLONEDDS_URI` value.
- `cyclonedds_check` (object): Evidence the config loaded and the measured result for each change.

---

## Phase 1: Decide What to Change

### Entry Criteria
- `rmw_env.RMW_IMPLEMENTATION == rmw_cyclonedds_cpp`.

### Actions
1. Run `ip -brief addr` on each host and record interface names and addresses.
2. Select the rows that apply:

| Condition | Change |
|---|---|
| Host has more than one interface (for example WiFi plus Ethernet, or a Docker bridge) and traffic goes out the wrong one | Pin `NetworkInterface` to the interface on the robot network. |
| Multicast is blocked | Set `AllowMulticast` to `false` and list every host in `Peers`. |
| Large messages drop or stall | Raise `SocketReceiveBufferSize` and the kernel limit `net.core.rmem_max`, using the values in the ROS 2 "DDS tuning information" page; confirm those values on the page for your distro. |
| None | No change. |

3. Record the measured symptom for each selected row.

### Output
Selected rows with symptoms.

### Quality Gate
- Every selected row has a recorded command and output showing the symptom.

---

## Phase 2: Write and Load the Configuration

### Entry Criteria
- At least one row selected.

### Actions
1. Write `~/cyclonedds.xml` containing only the selected elements:
   ```
   <?xml version="1.0" encoding="UTF-8" ?>
   <CycloneDDS xmlns="https://cdds.io/config">
     <Domain Id="any">
       <General>
         <Interfaces>
           <NetworkInterface name="eth0" />
         </Interfaces>
         <AllowMulticast>false</AllowMulticast>
       </General>
       <Discovery>
         <Peers>
           <Peer address="192.168.10.21" />
           <Peer address="192.168.10.22" />
         </Peers>
         <ParticipantIndex>auto</ParticipantIndex>
       </Discovery>
       <Internal>
         <SocketReceiveBufferSize min="<value from the tuning page>" />
       </Internal>
     </Domain>
   </CycloneDDS>
   ```
   The `Interfaces/NetworkInterface` form is for Cyclone DDS 0.10 and newer. Older releases use `NetworkInterfaceAddress`; check the version shipped with your distro.
2. With unicast peers and `ParticipantIndex auto`, each host supports a limited number of participants (one per node process). If nodes fail to start with participant index errors, raise `MaxAutoParticipantIndex` in `Discovery`; check the element in the Cyclone DDS configuration reference.
3. Load it: `export CYCLONEDDS_URI=file://$HOME/cyclonedds.xml`.
4. If raising buffers, set the kernel limit first: `sudo sysctl -w net.core.rmem_max=<value>`. Cyclone fails to start, or warns, when `min` exceeds the kernel maximum.
5. Start a node and read stderr. Configuration errors print lines naming the element; fix and restart until none appear.

### Output
Loaded configuration.

### Quality Gate
- Node startup prints no Cyclone configuration error.
- `printenv CYCLONEDDS_URI` shows the file in the shell that starts the node.

---

## Phase 3: Prove the Change

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Rerun each Phase 1 symptom command and record the result.
2. Run `ros2 run demo_nodes_cpp talker` on one host and `ros2 run demo_nodes_py listener` on each other host.
3. For interface pinning, confirm the traffic path: `sudo tcpdump -i eth0 udp portrange 7400-7600 -c 20` should show RTPS packets on the pinned interface. Ports follow the RTPS port mapping for the domain ID; use the range printed in your capture if it differs.

### Output
`cyclonedds_config`, `cyclonedds_check`.

### Quality Gate
- Every selected row shows a changed measurement.
- The listener receives on every host.

---

## Worked Example

Illustrative only. Robot computer with `wlan0` and `eth0`; sensor host on `eth0`.

- Phase 1: `ros2 topic hz /scan` on the robot prints nothing; tcpdump on `wlan0` shows RTPS packets. Interface row selected.
- Phase 2: `NetworkInterface name="eth0"`; no errors at startup.
- Phase 3: `ros2 topic hz /scan` prints `average rate: 10.003`; tcpdump on `eth0` shows RTPS packets.

---

## Exit Criteria

DONE when each selected change is applied, proven by a changed measurement, and data flows between all hosts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | RMW is not Cyclone DDS | **Stop**: use `ros2-fastdds-xml-tuning`. |
| Phase 2 | Unknown element error | **Adjust**: check the element name against the Cyclone DDS configuration reference for the installed version. |
| Phase 2 | Buffer size error at startup | **Adjust**: raise `net.core.rmem_max` to at least the `min` value, then restart. |
| Phase 3 | Listener silent with peers configured | **Adjust**: confirm every host lists every other host as a peer and that `ROS_DOMAIN_ID` matches. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
