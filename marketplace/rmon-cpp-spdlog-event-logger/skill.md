# C++ spdlog JSON Lines Event Logger

**One-line description:** Implements the monitor event logger in C++ with an spdlog rotating file sink whose pattern is the bare message, serializes each record with nlohmann/json, flushes on trip-class events with `flush_on`, and validates the produced file against the monitor log schema.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `monitor_log_schema` (object, required): Output of `rmon-monitor-log-schema`.
- `repo_dir` (string, required): Monitor repository root (CMake project).

---

## Outputs

- `cpp_event_logger` (object): Paths (`include/monitor/event_log.hpp`, `src/event_log.cpp`, `tests/event_log_test.cpp`), a sample log path, and the schema validation summary.

---

## Phase 1: Add Dependencies and Implement

### Entry Criteria
- Rotation size and file count are given by the user or a requirement.

### Actions
1. Add to `CMakeLists.txt` (pin the releases your project uses):
   ```cmake
   FetchContent_Declare(spdlog URL https://github.com/gabime/spdlog/archive/refs/tags/v1.14.1.zip)
   FetchContent_Declare(json URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz)
   FetchContent_MakeAvailable(spdlog json)
   target_link_libraries(monitor PUBLIC spdlog::spdlog nlohmann_json::nlohmann_json)
   ```
2. Implement in `src/event_log.cpp`:
   ```cpp
   #include <spdlog/sinks/rotating_file_sink.h>
   #include <spdlog/spdlog.h>
   #include <nlohmann/json.hpp>
   // constructor:
   logger_ = spdlog::rotating_logger_mt("monitor_events", path, max_bytes, max_files);
   logger_->set_pattern("%v");                  // message only, so each line is pure JSON
   logger_->set_level(spdlog::level::info);
   logger_->flush_on(spdlog::level::warn);      // trip-class records are logged at warn
   // emit():
   nlohmann::json rec = fields;
   rec["t_mono_ns"] = std::chrono::duration_cast<std::chrono::nanoseconds>(
       std::chrono::steady_clock::now().time_since_epoch()).count();
   rec["seq"] = ++seq_;
   const bool trip_class = rec["event"] != "eval";
   const std::string line = rec.dump();
   if (trip_class) logger_->warn(line); else logger_->info(line);
   ```
3. NaN check: `nlohmann::json` serializes NaN as `null`, which would hide a bad input. Check `std::isfinite` before inserting a value and set `verdict` to `invalid_input` when it fails.
4. `t_wall_utc`: format from `std::chrono::system_clock::now()` with `std::put_time(std::gmtime(...), "%FT%T")` plus milliseconds and `Z`. Wall time is for correlation only.
5. Act first, then log: the switch transition and safe-state request happen before `emit()`.

### Output
Logger source.

### Quality Gate
- `cmake --build build -j` exits 0.
- `rg -n "set_pattern\(\"%v\"\)" src/event_log.cpp` returns one line.

---

## Phase 2: Test and Validate

### Entry Criteria
- Build passes.

### Actions
1. `tests/event_log_test.cpp`: create a logger in a temp directory (`std::filesystem::temp_directory_path()`), emit one `eval` and one `trip`, call `spdlog::drop("monitor_events")` to close it, then read the file and assert each line parses with `nlohmann::json::parse` and `seq` increments by 1.
2. Validate the produced file with the schema using Python, since the schema tooling is shared:
   ```
   python -c "import json,jsonschema; s=json.load(open('monitor_event.schema.json')); v=jsonschema.Draft202012Validator(s); [v.validate(json.loads(l)) for l in open('build/sample_events.jsonl')]; print('ok')"
   ```
3. Run `ctest --test-dir build --output-on-failure` and the sanitizer build.

### Output
`cpp_event_logger`.

### Quality Gate
- `ctest` prints `100% tests passed` in both builds.
- The validation command prints `ok`.

---

## Worked Example

Illustrative only.
```
$ ctest --test-dir build -R EventLog --output-on-failure
100% tests passed, 0 tests failed out of 3
$ head -1 build/sample_events.jsonl
{"bound":{"max":2.0,"min":-0.5,"source":"SYS-114"},"check_id":"P-RANGE-01","event":"trip",...}
$ python -c "..."
ok
```
Keys appear sorted because `nlohmann::json` uses `std::map` by default; that is valid JSON Lines.

---

## Exit Criteria

DONE when each line is a schema-valid JSON object, trip-class records flush immediately, non-finite inputs are flagged rather than serialized as null, and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `spdlog_ex` thrown on logger creation (name already registered) | **Adjust**: call `spdlog::drop` before re-creating, or use `spdlog::get` first. |
| Phase 2 | Schema rejects a line because NaN became `null` | **Retry**: add the `isfinite` check before inserting values. |
| Phase 2 | Last records missing after a crash test | **Adjust**: confirm trip-class records use `warn` so `flush_on` applies. |

**Do not:** use spdlog's default pattern (it adds non-JSON prefixes), log before acting, or let NaN serialize silently.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
