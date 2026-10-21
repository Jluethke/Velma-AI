# JVM Root Cause with JDWP, jdb and IDE Attach

**One-line description:** Starts the red JUnit test with a JDWP agent suspended at startup through Maven Surefire or Gradle, attaches `jdb` or an IDE, and uses exception catchpoints, `where`, `locals`, `print`/`dump` and conditional breakpoints to find the line where state first goes wrong.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `regression_test` (object, required): Output of `repro-red-test-gate`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `jvm_debug_trace` (object): Debugger transcript, stack at the failure, local values, origin line, and a one-sentence defect statement. Empty when `stack` is not java.

---

## Phase 1: Start the Test Waiting for a Debugger

### Entry Criteria
- `regression_test` is red.
- The test classes are compiled with debug info (`javac -g`; Maven and Gradle do this by default). Without it `locals` prints "Local variable information not available".

### Actions
1. Start the single test suspended on port 5005:
   - Maven Surefire: `./mvnw test -Dtest='<Class>#<method>' -Dmaven.surefire.debug` (Surefire's built-in switch; it listens on 5005 and waits). Confirm the console prints `Listening for transport dt_socket at address: 5005`.
   - Gradle: `./gradlew test --tests '<fqcn>.<method>' --debug-jvm` (listens on 5005 and waits).
   - Plain JVM: `java -agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:5005 ...` (JDK 9+ needs `*:` to listen on all interfaces; use `localhost:5005` to stay local).
2. Ensure forking does not hide the JVM: Surefire `forkCount=0` disables the debug switch; if the POM sets it, override with `-DforkCount=1`.

### Output
JVM waiting on port 5005.

### Quality Gate
- Console shows `Listening for transport dt_socket at address: 5005`.

---

## Phase 2: Catch the Failure

### Entry Criteria
- JVM waiting.

### Actions
1. Attach: `jdb -attach localhost:5005` (Windows shared-memory transport differs; use the socket form above). In IntelliJ: Run, Attach to Process, or a "Remote JVM Debug" configuration on port 5005. In VS Code with the Java extension: `{"type": "java", "request": "attach", "hostName": "localhost", "port": 5005}`.
2. In `jdb` before resuming:
   - Exception: `catch java.lang.NullPointerException` (use the class from the error signature; `catch uncaught java.lang.Throwable` stops on anything uncaught). For an assertion failure, use `catch org.opentest4j.AssertionFailedError`.
   - Line: `stop at com.acme.io.CsvReader:88`.
   - Method: `stop in com.acme.io.CsvReader.read`.
3. `run` (or `cont` if already started) to resume.
4. When stopped, paste:
   1. `where` (full stack of the current thread; `where all` for all threads).
   2. `locals`.
   3. `print <expr>` for scalars and `dump <obj>` for all fields of an object.
   4. `list` for the surrounding source (requires `-sourcepath src/main/java` when starting jdb: `jdb -sourcepath src/main/java:src/test/java -attach localhost:5005`).
5. JDK 14+ helpful NullPointerException messages (on by default from JDK 15) already name the null expression, for example `Cannot invoke "String.length()" because "<local3>" is null`. If you see `<localN>`, the class was compiled without `-g`.

### Output
Failure frame evidence.

### Quality Gate
- `where` output and the values of every variable on the failing line are pasted.

---

## Phase 3: Walk Back to the Origin

### Entry Criteria
- Bad value identified.

### Actions
1. `up` and `down` move between frames; inspect `locals` in each until the frame where an argument first holds the bad value.
2. Set a breakpoint where it is produced and restart the test (Phase 1 again). In `jdb` there is no conditional breakpoint syntax; use an IDE conditional breakpoint, or stop at the line and check `print <cond>` on each hit with `cont`.
3. Step: `next` (over), `step` (into), `step up` (finish the current method).
4. JVM-specific origins to check:

| Symptom | Check |
|---|---|
| `equals` mismatch in a `HashMap`/`HashSet` | `hashCode` not overridden alongside `equals`, or a mutable field used in `hashCode` changed after insertion |
| `ConcurrentModificationException` | Collection modified while iterating; the stack shows the iterator's `next` |
| Wrong `Integer` comparison | `==` on boxed `Integer` outside the cache range (`-128..127` by default per `Integer.valueOf` docs) |
| Date off by one | `LocalDate.now()` uses the default zone; `SimpleDateFormat` shared across threads |
| BOM in first field | `InputStreamReader` with UTF-8 does not strip U+FEFF |

5. Write the defect sentence: "At <class>:<line>, <expr> is <value> because <cause>."

### Output
`jvm_debug_trace`.

### Quality Gate
- The defect sentence cites a class and line that appear in the pasted `where` output or a stepped frame.

---

## Worked Example

Illustrative only.

```
$ ./mvnw test -Dtest='CsvReaderTest#readsUtf8BomHeader' -Dmaven.surefire.debug
Listening for transport dt_socket at address: 5005
$ jdb -sourcepath src/main/java -attach localhost:5005
> stop at com.acme.io.CsvReader:52
> run
Breakpoint hit: "thread=main", com.acme.io.CsvReader.read(), line=52
> print header[0]
 header[0] = "?id"
> print (int) header[0].charAt(0)
 (int) header[0].charAt(0) = 65279
```

65279 is U+FEFF. Defect: "At CsvReader:52, the first header name keeps the UTF-8 BOM because the reader is built with `InputStreamReader(in, UTF_8)`, which does not strip it."

---

## Exit Criteria

DONE when `jvm_debug_trace` holds the stack, values at the producing line, and a defect sentence tied to that line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Build does not pause | **Adjust**: the POM sets `forkCount=0` or a custom `argLine`; override with `-DforkCount=1` and check `mvn help:effective-pom`. |
| Phase 2 | `Local variable information not available` | **Adjust**: recompile with `-g` (Maven `maven.compiler.debug=true`, the default). |
| Phase 2 | Breakpoint `deferred` and never hit | **Adjust**: the class name is wrong or not yet loaded; use the fully qualified name and check spelling with `classes`. |
| Phase 3 | Weak model reads a stale value from a different thread | **Adjust**: `where all` and `thread <id>` to select the thread that owns the failing stack. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
