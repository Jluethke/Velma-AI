# C and C++ Leak Check With Valgrind Memcheck

**One-line description:** Runs a debug build under Valgrind Memcheck with full leak checking, reads the LEAK SUMMARY categories (definitely, indirectly, possibly lost, still reachable), uses `vgdb` incremental leak checks for long-running servers, and maps each loss record to the allocating source line.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`. Binary and arguments.
- `load_recipe` (object, required): From `leak-intake-load-recipe`. Scale the operation count down for Valgrind but keep it counted.
- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`. Each loss record is matched to a hypothesis id (C5, C10 and others) or marked "none".

---

## Outputs

- `memcheck_report` (object[]): Loss records grouped by kind, each with bytes, block count, the allocation stack (function, file:line), and whether the record grows between two incremental checks.

---

## Phase 1: Build and Run Under Memcheck

### Entry Criteria
- Linux (or another platform Valgrind supports for your architecture). `valgrind --version` prints a version.
- The program builds from source.

### Actions
1. Build with debug info and frame pointers: add `-g -O1 -fno-omit-frame-pointer` (or `-O0`) to `CFLAGS`/`CXXFLAGS`. CMake: `cmake -DCMAKE_BUILD_TYPE=Debug -B build-vg && cmake --build build-vg`. Do not build with `-fsanitize=address` for Valgrind; the two do not run together.
2. Run:
   `valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes --num-callers=40 --log-file=vg.%p.log ./build-vg/server --config test.conf`
   `--track-origins=yes` slows the run further and only helps uninitialized-value errors; drop it if the run is too slow for the load.
3. Memcheck runs the program many times slower than native (the Valgrind manual describes a large slowdown). Lower the load rate in `load_recipe` and record the reduced op count; leak growth is compared per operation, so a smaller N is fine.
4. For a server that does not exit, use incremental checks (Phase 2). For a batch tool, let it exit normally; the leak summary is printed at exit.

### Output
Running or completed Memcheck log `vg.<pid>.log`.

### Quality Gate
- `grep -E "HEAP SUMMARY|LEAK SUMMARY" vg.*.log` prints both headers (at exit), or the server is running under Valgrind with a known PID.

---

## Phase 2: Incremental Checks for Long-Running Processes

### Entry Criteria
- Server is running under Valgrind (gdbserver support is on by default, `--vgdb=yes`).

### Actions
1. After warmup, run a full leak check through `vgdb`:
   `vgdb --pid=<valgrind pid> leak_check full reachable any`
   Output goes to the Valgrind log.
2. Run N operations, then:
   `vgdb --pid=<valgrind pid> leak_check full reachable increased`
   `increased` reports only loss records that grew since the previous check. Check the exact monitor command syntax with `vgdb --pid=<pid> help` for your Valgrind version.
3. Repeat once more after another N operations. Records that increase in both windows are the leak.

### Output
Two incremental leak reports in the log.

### Quality Gate
- The log contains two leak checks after warmup, and the records reported as increased are listed with their byte growth.

---

## Phase 3: Read and Classify Loss Records

### Entry Criteria
- A leak summary or incremental report exists.

### Actions
1. Read the summary block:
   ```
   LEAK SUMMARY:
      definitely lost: X bytes in Y blocks
      indirectly lost: ...
        possibly lost: ...
      still reachable: ...
           suppressed: ...
   ```
2. Classify with this table:

   | Kind | Meaning | Action |
   |---|---|---|
   | definitely lost | no pointer to the block remains | fix first; real leak |
   | indirectly lost | reachable only from a definitely lost block | usually disappears when the owning block is freed |
   | possibly lost | only an interior pointer remains | check custom allocators and pointer tagging; often real |
   | still reachable | pointer still exists at exit | not a leak at exit; but if it grows per operation in incremental checks, it is a logical leak (container never trimmed), continue in `leak-cpp-heaptrack` |

3. For each record, read the stack below `at 0x...: malloc` / `operator new`: the first frame in your source is the allocation site. The leak is the missing `free`, `delete`, or smart-pointer ownership along the paths after that site, often an error path or early return.
4. Third-party noise: generate suppressions with `--gen-suppressions=all`, copy the blocks for libraries you do not own into `project.supp`, and rerun with `--suppressions=project.supp`. Never suppress a frame from your own code.
5. To use Memcheck as a gate later: `--errors-for-leak-kinds=definite --error-exitcode=1` makes the run exit nonzero on definite leaks.

### Output
`memcheck_report`.

### Quality Gate
- Every `definitely lost` record from your code appears in the report with file:line.
- The suppression file (if any) contains no frame from the project's source tree: `grep -c "<project namespace or path>" project.supp` prints 0.

---

## Worked Example

Illustrative only.

Input: C++ telemetry daemon `teld`, RSS grows 300 bytes/msg.

Phase 1: `valgrind --leak-check=full --show-leak-kinds=all --num-callers=40 --log-file=vg.%p.log ./build-vg/teld -c test.conf`; load reduced to 20 msg/s.

Phase 2: `vgdb --pid=24410 leak_check full reachable increased` after 5,000 msgs, again after 10,000:
```
==24410== 1,520,000 (+760,000) bytes in 5,000 (+2,500) blocks are definitely lost in loss record 412 of 415
==24410==    at 0x4846F33: operator new(unsigned long) (vg_replace_malloc.c:...)
==24410==    by 0x11A2F4: Frame::decode(Buffer const&) (frame.cpp:88)
==24410==    by 0x118B10: Session::onMessage(Buffer const&) (session.cpp:142)
```

Phase 3: definitely lost. `frame.cpp:88` does `auto* hdr = new Header(...)`; `session.cpp:150` returns early on checksum failure without `delete hdr`.

---

## Exit Criteria

DONE when every definitely and possibly lost record from project code, and every still-reachable record that grows per operation, is listed with its allocation site.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Program crashes only under Valgrind with unsupported instruction | **Adjust**: rebuild without `-march=native` and AVX-512 flags for the Valgrind build. |
| Phase 1 | Run too slow to reach the leaking path | **Adjust**: use `leak-cpp-asan-lsan` or `leak-cpp-heaptrack`, which are much faster. |
| Phase 2 | `vgdb` cannot connect | **Retry**: start Valgrind with `--vgdb=yes` explicitly and run `vgdb` as the same user. |
| Phase 3 | Only "still reachable" records, none growing | **Stop**: no leak at this layer; report it and return to `leak-managed-vs-native-split`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
