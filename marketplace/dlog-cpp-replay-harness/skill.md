# C++ Deterministic Replay Harness

**One-line description:** Replays an MCAP drive or slice into C++ processing code with `mcap::McapReader::readMessages` in `LogTimeOrder`, an injected clock interface returning log time, seeded `std::mt19937_64` and single-threaded dispatch, writing outputs to a new MCAP so runs compare byte for byte.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `archive_path` (string, required): MCAP file or slice to replay.
- `drive_index` (object, required): From `dlog-drive-index-sqlite`; topics and expected counts.
- `entry_point` (string, required): C++ class or library target under test, for example `perception::Tracker` in target `tracker_lib`.

---

## Outputs

- `replay_procedure` (object): Harness target name, build flags, compiler version, command line, seed, input counts, output MCAP path and SHA-256.

---

## Phase 1: Make the Code Replayable

### Entry Criteria
- The class under test builds as a library separate from any driver or actuator interface. If it links a hardware interface, the harness provides a recording stub implementation instead.

### Actions
1. Search: `grep -rnE "steady_clock|system_clock|high_resolution_clock|std::random_device|std::thread|std::async|rand\(" <src>`.
2. Replace output-affecting uses with injected interfaces: a `Clock` with `virtual int64_t now_ns() const = 0;`, an RNG engine passed by reference, and a synchronous `process(topic, msg, t_ns)` entry.
3. Edit one class at a time; build and run existing tests (`ctest --output-on-failure`) after each change. Do NOT disable tests.
4. Floating point: build the harness and the library with the same flags every run. Results can differ across compilers, optimization levels and `-ffast-math`; record the flags and do not use `-ffast-math` for reference outputs. Unordered container iteration order is implementation-defined; do not let it decide output order.

### Output
Replayable library.

### Quality Gate
- The grep returns no hit in output-affecting paths, or each is listed with justification.
- `ctest` passes.

---

## Phase 2: Write the Harness

### Entry Criteria
- Library is replayable.

### Actions
1. Reader loop:
   ```cpp
   #define MCAP_IMPLEMENTATION   // in this TU only if no other TU defines it
   #include <mcap/reader.hpp>
   mcap::McapReader reader;
   auto st = reader.open(src_path);
   if (!st.ok()) { /* report st.message, exit nonzero */ }
   mcap::ReadMessageOptions opts;
   opts.readOrder = mcap::ReadMessageOptions::ReadOrder::LogTimeOrder;
   auto onProblem = [](const mcap::Status& s) { std::cerr << s.message << "\n"; problems++; };
   for (const auto& view : reader.readMessages(onProblem, opts)) {
       clock.set(view.message.logTime);
       node.process(view.channel->topic, view.message.data, view.message.dataSize, view.message.logTime);
   }
   reader.close();
   ```
2. Decode payloads with the same deserializer the stack uses (for ROS 2 CDR, `rclcpp::Serialization<T>` on an `rclcpp::SerializedMessage` built from the bytes).
3. Write outputs with `mcap::McapWriter` (see `dlog-cpp-mcap-writer`) using the input `logTime`.
4. Treat any `onProblem` call as a failed run.

### Output
Harness executable.

### Quality Gate
- Processed message count equals `mcap info` count for the replayed topics, and `problems` is 0.
- Output MCAP passes `mcap doctor`.

---

## Phase 3: Run Twice

### Entry Criteria
- Harness runs once.

### Actions
1. Run twice with the same binary, arguments and seed to `run1/` and `run2/`.
2. `sha256sum run1/out.mcap run2/out.mcap`.
3. If different, send both to `dlog-replay-determinism-check`.
4. Record compiler (`c++ --version`), flags, seed and hashes.

### Output
`replay_procedure`.

### Quality Gate
- Two output hashes recorded with the binary's own SHA-256.

---

## Worked Example

Illustrative.
```
$ cmake -B build -DCMAKE_BUILD_TYPE=RelWithDebInfo && cmake --build build --target replay_tracker
$ ./build/replay_tracker --src cases/case_0007.mcap --seed 1234 --out run1/out.mcap
processed 3712, problems 0, outputs 119
$ ./build/replay_tracker --src cases/case_0007.mcap --seed 1234 --out run2/out.mcap
$ sha256sum run1/out.mcap run2/out.mcap
88b2...19fe  run1/out.mcap
88b2...19fe  run2/out.mcap
```

---

## Exit Criteria

DONE when the harness replays in log-time order with injected clock and seed, reports zero reader problems, and two runs' hashes are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Library cannot be separated from a hardware interface | **Stop**: refactor the interface boundary first. |
| Phase 2 | `onProblem` reports errors | **Return**: validate the file with `dlog-log-validate-recover`. |
| Phase 2 | Duplicate MCAP symbols at link | **Adjust**: define `MCAP_IMPLEMENTATION` in exactly one TU. |
| Phase 3 | Hashes differ | **Return**: to `dlog-replay-determinism-check`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
