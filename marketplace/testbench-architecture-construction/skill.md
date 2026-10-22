# Testbench Architecture Construction

Build a layered testbench with drivers, monitors, scoreboards, and checkers that can support both directed and constrained random testing.

## Inputs

- `verification-plan`: Features to verify with methods and coverage targets
- `coverage-model-specification`: Functional coverage groups and cover points

## Outputs

- `testbench-rtl`: Complete testbench code with: transaction-level driver, monitor, reference model, scoreboard, checker, and coverage collector
- `testbench-architecture-doc`: Block diagram of the testbench showing signal flow from stimulus generation through DUT to checking

## Process

1. Implement the transaction layer. Define a transaction class (SystemVerilog class or VHDL record) that represents one unit of stimulus at the interface level: a packet, a register access, a memory transfer. Transactions abstract away pin-level timing, making tests readable and portable.
2. Implement the driver. The driver converts transactions to pin-level signals according to the interface protocol timing. It handles clock relationships, handshake protocols, and wait states. The driver must be protocol-correct; it is the golden reference for interface timing.
3. Implement the monitor. The monitor observes the DUT's output pins and converts pin-level activity back to transactions. It must correctly detect transaction boundaries (start/end of packet, completion of transfer) and extract all relevant fields. The monitor never drives signals; it is passive.
4. Implement the reference model (golden model). This is a behavioral implementation of the DUT's expected function: same inputs produce same outputs, without the RTL's implementation details. For a filter, it is the floating-point filter computation. For a protocol engine, it is the protocol state machine in a high-level language.
5. Implement the scoreboard. The scoreboard receives transactions from both the reference model and the DUT monitor. It compares them and reports mismatches. For out-of-order interfaces, the scoreboard must match by transaction ID or address, not arrival order.
6. Implement the coverage collector. Instantiate the coverage model from the verification plan. Sample cover points on relevant events (transaction completion, state transitions, error occurrences). The coverage collector runs in the background during all tests and reports accumulated coverage.
7. Implement the test sequencer. It generates the sequence of transactions that exercise the DUT. Directed tests provide specific transaction sequences. The constrained random generator creates random transactions within the valid input space (constraints prevent illegal inputs that would cause false failures).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
