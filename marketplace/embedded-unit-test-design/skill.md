# Embedded Unit Test Design

Design unit tests that run on the host machine by abstracting hardware dependencies, using test doubles for peripherals, and testing algorithmic correctness in isolation.

## Inputs

- `firmware-architecture`: Code structure showing which modules depend on hardware and which are pure logic
- `test-framework-choice`: Unit test framework selection: Unity, CppUTest, Google Test, or cmocka, with rationale for the choice

## Outputs

- `test-doubles-design`: For each hardware-dependent module: the interface to mock, the mock implementation, and what the tests verify through the mock
- `unit-test-plan`: Test plan listing each module, its test cases, input ranges, expected outputs, and edge cases to cover

## Process

1. Separate firmware into testable layers: pure logic (algorithms, state machines, protocol parsers, data processing) that has no hardware dependency, and hardware interface code (register access, timing) that must be mocked. The pure logic layer should be the majority of the code.
2. Create test doubles (mocks/stubs) for hardware interfaces. A mock SPI driver stores the bytes 'transmitted' in an array and provides pre-loaded 'received' bytes. A mock GPIO records which pins were set/cleared. A mock timer returns pre-programmed tick values. The mock exposes inspection functions for test assertions.
3. Write tests for each pure-logic module. For a CAN message parser: test with valid messages (verify parsed signals match expected values), malformed messages (verify error handling), boundary values (signal at minimum, maximum, and one-bit-off), and byte-order edge cases.
4. For state machines, test every transition: feed inputs that trigger each valid transition and verify the resulting state and outputs. Feed inputs for invalid transitions and verify the state machine stays in the current state and reports the error. Use a state transition coverage metric.
5. Compile and run on the host using the native compiler (GCC or Clang for x86/x64). The firmware code includes the HAL headers that resolve to mocks in the test build and to real hardware in the target build. This requires the abstraction layer to be clean: no #include of MCU-specific headers in testable code.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
