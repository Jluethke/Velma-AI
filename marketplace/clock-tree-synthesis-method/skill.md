# Clock Tree Synthesis Method

Build the clock distribution network to meet skew, insertion delay, and OCV derating targets while minimizing clock power.

## Inputs

- `floorplan`: Placed design with clock source and sink locations
- `timing-requirements`: Clock uncertainty budget, skew target, and insertion delay limit

## Outputs

- `clock-tree`: Synthesized clock tree with buffer placement and routing
- `clock-tree-report`: Skew, insertion delay, transition time, and power of the clock network

## Process

1. Define CTS constraints: target skew (typically 50-200 ps), maximum insertion delay (to control clock latency for I/O timing), maximum transition time at sinks (fast transitions reduce short-circuit power and improve hold margin), and buffer cell list (which clock buffer cells the tool may use).
2. The CTS algorithm: starting from the clock source, recursively partition the clock sinks into balanced groups. Insert buffers to drive each group, balancing the capacitive load and wire delay at each level. The result is a balanced tree with equalized path lengths.
3. CTS with OCV (on-chip variation) derating: at each tree level, the delay can vary by +/- the OCV factor (typically 5-10%). To ensure hold timing, the early path must not arrive too early: this constrains the minimum skew between any two sinks. Apply CRPR (clock reconvergence pessimism removal) to avoid double-counting variation on shared tree segments.
4. For useful skew: intentionally adding skew can help timing. If path A to B has negative slack but the clock to B is late relative to A, adding positive skew (delivering the clock earlier to the launching flip-flop or later to the capturing flip-flop) recovers slack. CTS tools support useful-skew optimization.
5. Clock gating: insert clock gate cells (ICG) before the tree fans out to blocks that can be disabled. The ICG cell AND-gates the clock with an enable signal, stopping the clock to idle blocks. This reduces dynamic power by 20-50% in typical designs. Place ICGs close to the block they gate to maximize power savings.
6. Post-CTS timing: run timing analysis with the actual clock tree delays (not the estimated uncertainty). Setup and hold timing should both pass. If hold violations exist, insert delay buffers on the data path (hold fixing). Verify that clock tree power is within budget (clock typically consumes 30-50% of dynamic power).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
