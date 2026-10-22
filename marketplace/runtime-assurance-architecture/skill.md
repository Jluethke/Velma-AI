# Runtime Assurance Architecture

Implement a runtime assurance system that monitors safety in real-time and switches to a verified safe controller when the nominal controller threatens to violate constraints.

## Inputs

- `safety-envelope`: Reachable set or CBF-defined safe boundary
- `cbf-qp-controller`: Safety-filter controller
- `nominal-controller`: Performance-oriented controller (may be unverified, complex, or learned)

## Outputs

- `runtime-assurance-system`: Simplex-architecture monitor and switch logic with verified safe controller and switching conditions
- `certification-evidence`: Formal argument that the runtime assurance system guarantees safety regardless of the nominal controller behavior

## Process

1. Implement the Simplex architecture: the nominal controller (complex, high-performance, possibly unverified) runs by default. A monitor evaluates safety in real-time. When the monitor detects that the state is approaching the safety boundary, it switches to the verified safe controller (simple, conservative, formally verified).
2. Design the switching condition: switch to the safe controller when the state reaches a switching surface inside the safety envelope. The switching surface must be far enough from the true boundary that the safe controller has time to arrest the motion before the boundary is reached, accounting for switching delay and computation time.
3. The verified safe controller must be simple enough to be formally verified: a linear controller, a CBF-QP, or a lookup table. Its only requirement is keeping the state within the safety envelope. Performance is not its concern.
4. Implement the monitor as a separate software component with the highest integrity level. It evaluates h(x) (or V(x) from reachability) from sensor data and compares to the switching threshold. The monitor must be independent of the nominal controller code to prevent common-mode failures.
5. Build the certification argument: (1) the safety envelope is correct (verified by reachability computation or CBF proof); (2) the verified safe controller keeps the state in the envelope (proven by Lyapunov or reachability); (3) the monitor detects boundary approach with sufficient margin (verified by timing analysis and sensor noise bounds); (4) the switching logic is correct (simple enough for exhaustive testing or formal verification). This four-part argument is the safety case, independent of what the nominal controller does.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
