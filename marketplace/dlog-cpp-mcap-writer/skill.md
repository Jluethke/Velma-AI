# C++ MCAP Writer with Rotation

**One-line description:** Writes vehicle data to MCAP from C++ with the header-only `mcap` library (`mcap::McapWriter`, `McapWriterOptions`), a lock-protected bounded queue drained by one writer thread, per-channel drop counters, and duration-based rotation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_format_decision` (object, required): From `dlog-format-select`; encoding and compression per channel.
- `storage_budget` (object, required): From `dlog-storage-budget`; split duration.

---

## Outputs

- `writer_config` (object): Source files, mcap library version, compression and chunk size, queue capacity, rotation duration, build flags, and load test results.

---

## Phase 1: Integrate the Library

### Entry Criteria
- The mcap C++ library is available (Conan package `mcap`, or the `cpp/mcap/include` directory from the foxglove/mcap repository) along with zstd and lz4 development packages.

### Actions
1. In exactly ONE translation unit write:
   ```cpp
   #define MCAP_IMPLEMENTATION
   #include <mcap/writer.hpp>
   ```
   Every other file includes `<mcap/writer.hpp>` without the define. Defining it twice causes duplicate symbol link errors.
2. If a compressor is unavailable, define `MCAP_COMPRESSION_NO_LZ4` or `MCAP_COMPRESSION_NO_ZSTD` before the include, as the library README describes.
3. Link `zstd` and `lz4` in CMake (`target_link_libraries(logger PRIVATE zstd lz4)` or the Conan targets).
4. Build once with `-fsanitize=address,undefined` for the tests in Phase 3.

### Output
Library compiling and linking.

### Quality Gate
- `grep -rn "MCAP_IMPLEMENTATION" src/` returns exactly one line.
- The project builds with no warnings from the mcap headers at the project's warning level.

---

## Phase 2: Writer Thread and Rotation

### Entry Criteria
- Library integrated.

### Actions
1. Open a file:
   ```cpp
   mcap::McapWriterOptions opts("");          // profile
   opts.compression = mcap::Compression::Zstd; // or Lz4, None
   opts.chunkSize = chunk_bytes;               // check the header for the default
   mcap::McapWriter writer;
   auto st = writer.open(path_active, opts);
   if (!st.ok()) { /* report st.message, stop */ }
   mcap::Schema schema("my.Imu", "jsonschema", schema_text);
   writer.addSchema(schema);
   mcap::Channel ch("/imu", "json", schema.id);
   writer.addChannel(ch);
   ```
2. Write a message:
   ```cpp
   mcap::Message m;
   m.channelId = ch.id; m.sequence = seq++; m.logTime = t_ns; m.publishTime = t_pub_ns;
   m.data = reinterpret_cast<const std::byte*>(buf.data()); m.dataSize = buf.size();
   auto ws = writer.write(m);
   ```
   `m.data` is not copied until `write` returns; the buffer must stay alive until then.
3. Timestamps: `std::chrono::system_clock::now().time_since_epoch()` cast to `std::chrono::nanoseconds` gives a realtime stamp in `uint64_t` (`mcap::Timestamp`). Never use `steady_clock` for `logTime` in multi-host systems (see `dlog-clock-domain-map`).
4. Sensor callbacks push into a bounded queue (mutex plus condition variable, or a single-producer single-consumer ring buffer). On full, increment an `std::atomic<uint64_t>` drop counter and return. No disk I/O in callbacks.
5. Rotation in the writer thread: when `logTime - file_start >= split_ns`, write stats metadata (`mcap::Metadata md; md.name = "logger_stats"; md.metadata = {{"dropped_imu", "0"}}; writer.write(md);`), `writer.close()`, rename `.mcap.active` to `.mcap`, open the next file and re-add schemas and channels.
6. Handle SIGINT and SIGTERM by setting an atomic flag only (async-signal-safe); the writer thread drains and closes.

### Output
Writer and rotation source.

### Quality Gate
- Every `writer.open` and `writer.write` result is checked with `.ok()`.
- The signal handler body only stores to an atomic.

---

## Phase 3: Load and Sanitizer Test

### Entry Criteria
- Writer built with sanitizers.

### Actions
1. Run at the peak rate from `measured_rates` for at least two split periods.
2. `mcap info` and `mcap doctor` on every output file.
3. `mcap list metadata` and read drop counters.
4. Rebuild without sanitizers in Release and repeat; sanitizer builds are slower and can cause drops that the release build does not have.

### Output
`writer_config`.

### Quality Gate
- No ASan or UBSan report in the sanitizer run.
- Release run: written + dropped equals produced per channel, and `mcap doctor` exits 0 on every file.

---

## Worked Example

Illustrative.
```
$ cmake --build build --config Release && ./build/logger --duration 150
produced imu=30000 lidar=1500
$ mcap doctor /data/drives/d1/part_0002.mcap ; echo $?
0
$ mcap list metadata /data/drives/d1/part_0002.mcap
logger_stats  {"dropped_imu":"0","dropped_lidar":"0"}
```

---

## Exit Criteria

DONE when the C++ writer rotates, closes cleanly on signals, passes sanitizers and shows written + dropped = produced.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Duplicate symbols at link | **Adjust**: keep `MCAP_IMPLEMENTATION` in one TU only. |
| Phase 1 | Undefined references to ZSTD_ or LZ4_ symbols | **Adjust**: link the libraries or define the matching NO_ macro. |
| Phase 2 | `writer.open` returns not ok | **Stop**: report `status.message`; check path and permissions. |
| Phase 3 | ASan heap-use-after-free on `m.data` | **Adjust**: keep the buffer alive until `write` returns. |
| Phase 3 | Drops at peak rate in Release | **Return**: to `dlog-disk-throughput-measure` or lighter compression. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
