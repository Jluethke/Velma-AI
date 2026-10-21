# ROS 2 DDS and RMW Selection

**One-line description:** Selects one RMW implementation (Fast DDS or Cyclone DDS) for every host in the system from a decision table, sets RMW_IMPLEMENTATION, domain ID and discovery range consistently, and proves with a talker and listener that all hosts discover each other on the chosen middleware.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ros_distro` (string, required): Installed distro on every host. All hosts must run the same distro.
- `network_topology` (object, required): Hosts, their network interfaces and subnets, whether multicast passes between them, whether any node runs in a container, and whether WiFi links are involved.

---

## Outputs

- `rmw_choice` (string): `rmw_fastrtps_cpp` or `rmw_cyclonedds_cpp`, with the decision table row that selected it.
- `rmw_env` (object): The exact environment lines to set on every host: `RMW_IMPLEMENTATION`, `ROS_DOMAIN_ID`, and the discovery range variables valid for `ros_distro`.

---

## Phase 1: Choose the RMW

### Entry Criteria
- `network_topology` lists every host.

### Actions
1. Find the default: run `ros2 doctor --report` on one host and read the `middleware name` line in the RMW MIDDLEWARE section. Fast DDS (`rmw_fastrtps_cpp`) is the default in Humble and Jazzy.
2. Apply this table. Rows are engineering practice drawn from the ROS 2 documentation on DDS implementations and tuning; when two rows apply, the first matching row wins.

| Condition from `network_topology` | Choice | Reason |
|---|---|---|
| A required package or vendor driver documents support for only one RMW | That RMW | Avoid untested combinations. |
| Multicast is blocked between hosts and you need a central discovery process | Fast DDS with Discovery Server (`ros2-fastdds-xml-tuning`) | Discovery Server replaces multicast discovery with a server. |
| Multicast is blocked and a fixed peer list is acceptable | Cyclone DDS with a peer list (`ros2-cyclonedds-xml-tuning`) | Peers are listed in XML. |
| No constraint above applies | The distro default | Fewest changes; widest testing. |

3. Use ONE RMW on every host. Mixing vendors across hosts is not a supported configuration to rely on; record the choice once.
4. Install it if missing: `sudo apt install ros-<ros_distro>-rmw-cyclonedds-cpp` (or `ros-<ros_distro>-rmw-fastrtps-cpp`).

### Output
`rmw_choice`.

### Quality Gate
- `rmw_choice` cites the row that selected it.
- `ros2 pkg list | grep rmw_` on every host lists the chosen package.

---

## Phase 2: Set the Environment

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Choose `ROS_DOMAIN_ID`. The ROS 2 documentation states that 0 to 101 is safe on Linux with default port ranges; use a value in that range that no other robot on the same network uses. Ask the user if unsure.
2. Write `rmw_env` as lines for `~/.bashrc` or the service unit:
   ```
   export RMW_IMPLEMENTATION=<rmw_choice>
   export ROS_DOMAIN_ID=<id>
   ```
3. Discovery range depends on the distro:
   - Humble: `ROS_LOCALHOST_ONLY=1` restricts to the local host; leave unset for multi-host.
   - Iron and newer (including Jazzy): use `ROS_AUTOMATIC_DISCOVERY_RANGE` with `LOCALHOST`, `SUBNET`, `OFF` or `SYSTEM_DEFAULT`, and `ROS_STATIC_PEERS` for hosts outside the subnet. `ROS_LOCALHOST_ONLY` is deprecated there. Confirm the variables on the distro's "Improved Dynamic Discovery" documentation page.
4. After changing environment, run `ros2 daemon stop` on every host; the daemon caches graph state from the old settings.

### Output
`rmw_env`.

### Quality Gate
- `printenv | grep -E "RMW_IMPLEMENTATION|ROS_DOMAIN_ID|ROS_AUTOMATIC_DISCOVERY_RANGE|ROS_LOCALHOST_ONLY|ROS_STATIC_PEERS"` prints identical values on every host.

---

## Phase 3: Prove Cross-Host Discovery

### Entry Criteria
- Phase 2 applied on every host.

### Actions
1. If multicast discovery is expected, run `ros2 multicast receive` on host B and `ros2 multicast send` on host A. Host B must print `Received from <A ip>`.
2. Host A: `ros2 run demo_nodes_cpp talker`. Host B: `ros2 run demo_nodes_py listener`. Host B must print `I heard: [Hello World: N]`.
3. On host B, `ros2 doctor --report` must show the same middleware name as host A.
4. If a container is involved, repeat step 2 with one side in the container.

### Output
Discovery proven.

### Quality Gate
- The listener prints received messages on every host pair tested.
- `ros2 doctor --report` middleware name is identical on all hosts.

---

## Worked Example

Illustrative only. Two hosts on one wired subnet, Jazzy, no special driver constraint.

- Phase 1: default row; `rmw_choice = rmw_fastrtps_cpp`.
- Phase 2: `RMW_IMPLEMENTATION=rmw_fastrtps_cpp`, `ROS_DOMAIN_ID=17`, `ROS_AUTOMATIC_DISCOVERY_RANGE=SUBNET`.
- Phase 3: `ros2 multicast receive` prints `Received from 192.168.10.21:43005: 'Hello World!'`; listener prints `I heard: [Hello World: 4]`.

---

## Exit Criteria

DONE when one RMW is chosen with a cited reason, identical environment is set on every host, and a talker and listener communicate between every host pair.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Hosts run different distros | **Stop**: align distros first; cross-distro communication is not guaranteed. |
| Phase 3 | `ros2 multicast receive` prints nothing | **Adjust**: multicast is blocked; select the matching no-multicast row in Phase 1. |
| Phase 3 | Talker and listener on one host work, across hosts fail | **Adjust**: check host firewalls (`sudo ufw status`) and that both hosts use the same `ROS_DOMAIN_ID`. |
| Phase 3 | Discovery works but data does not, with one side in Docker | **Adjust**: shared memory transport cannot cross IPC namespaces; run the container with `--ipc=host` or disable shared memory in the RMW XML. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
