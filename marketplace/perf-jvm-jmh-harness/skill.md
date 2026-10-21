# JVM Benchmark Harness with JMH

**One-line description:** Builds a JMH benchmark for the slow Java or Kotlin method with `@State` inputs, `@Param` sizes, forks, warmup and measurement iterations, guards against dead-code elimination and constant folding, and exports the results as JSON with the GC profiler attached.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `perf_spec` (object, required): From `perf-metric-workload-define`.
- `workload_spec` (object, required): Sizes, inputs, iteration and fork settings.
- `bench_env_report` (object, required): Machine state and JDK version.
- `repo_path` (string, required): Project root (Maven `pom.xml` or Gradle `build.gradle(.kts)`).

---

## Outputs

- `jvm_bench_raw` (object): Path to `perf/bench/jmh_baseline.json`, the exact `java -jar` command, JDK and JMH versions, and per-`@Param` score, score error (99.9% interval half-width), unit, raw iteration data and `gc.alloc.rate.norm`.

---

## Phase 1: Create the JMH Module

### Entry Criteria
- `java -version` and `mvn -v` or `./gradlew --version` exit 0.

### Actions
1. Choose the build path with this table:

   | Build tool | Setup |
   |---|---|
   | Maven | Generate a separate module: `mvn archetype:generate -DinteractiveMode=false -DarchetypeGroupId=org.openjdk.jmh -DarchetypeArtifactId=jmh-java-benchmark-archetype -DgroupId=<your.group> -DartifactId=benchmarks -Dversion=1.0-SNAPSHOT`, then add the project under test as a dependency of `benchmarks/pom.xml`. |
   | Gradle | Apply the `me.champeau.jmh` plugin in a `benchmarks` subproject; put sources in `src/jmh/java`. Check the plugin README for the version matching your Gradle. |

2. Do not write a hand-rolled `System.nanoTime()` loop. JIT warmup, on-stack replacement and dead-code elimination make such loops wrong; JMH exists to handle them.
3. Record the JMH version from the generated `pom.xml` (`jmh.version` property) or the Gradle plugin config.

### Output
A `benchmarks` module that builds.

### Quality Gate
- `mvn -q -f benchmarks/pom.xml package` (or `./gradlew :benchmarks:jmhJar`) exits 0 and produces `benchmarks/target/benchmarks.jar` (or the Gradle jmh jar).

---

## Phase 2: Write the Benchmark Class

### Entry Criteria
- Module builds.

### Actions
1. Create `BuildReportBench.java` in the module:

```java
@State(Scope.Benchmark)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
public class BuildReportBench {
    @Param({"30000", "120000"})          // from workload_spec.sizes
    int size;
    List<Row> rows;                       // non-final field: prevents constant folding

    @Setup(Level.Trial)
    public void setup() { rows = TestData.rows(size); }   // not timed

    @Benchmark
    public Report buildReport() {         // returning the value keeps it alive
        return ReportBuilder.build(rows); // grep for the real class and method
    }
}
```

2. Rules that prevent wrong numbers:
   - Return the result or pass it to a `Blackhole` parameter (`bh.consume(x)`). A `void` benchmark that discards the result may be eliminated.
   - Keep inputs in non-final `@State` fields. A `static final` constant input can be folded at compile time.
   - Do not loop inside the `@Benchmark` method to "repeat" work; JMH repeats it and in-method loops get unrolled and distorted.
   - Use `Level.Trial` setup unless state must be reset each invocation; `Level.Invocation` adds timing overhead (JMH javadoc warns about it).
3. Rebuild the jar.

### Output
Benchmark class and rebuilt jar.

### Quality Gate
- `java -jar benchmarks/target/benchmarks.jar -l` lists `BuildReportBench.buildReport`.
- `grep -n "static final" BuildReportBench.java` finds no benchmark input.

---

## Phase 3: Run, Export and Read

### Entry Criteria
- Benchmark is listed.

### Actions
1. Print the defaults for your version: `java -jar benchmarks/target/benchmarks.jar -h` (see `-f`, `-wi`, `-w`, `-i`, `-r`). Use them unless `workload_spec` sets values; record the source.
2. Run:

```bash
java -jar benchmarks/target/benchmarks.jar BuildReportBench \
  -f <forks> -wi <warmup iterations> -i <measurement iterations> \
  -prof gc -rf json -rff perf/bench/jmh_baseline.json
```

3. Never use `-f 0` for measurements. Forking isolates the JIT profile of each benchmark; JMH prints a warning when forks are 0.
4. Read the summary table: `Benchmark (size) Mode Cnt Score Error Units`. `Score` is the mean, `Error` is the half-width of the 99.9% confidence interval. Read `BuildReportBench.buildReport:gc.alloc.rate.norm` in B/op for allocations.
5. Read the JSON: `primaryMetric.score`, `primaryMetric.scoreError`, `primaryMetric.scoreConfidence`, `primaryMetric.rawData` (one array per fork).
6. Fill `jvm_bench_raw`.

### Output
`jvm_bench_raw`.

### Quality Gate
- The JSON has one entry per `@Param` value with non-empty `rawData`.
- The console shows no `Fork: N/A` or forking warning.

---

## Worked Example

Illustrative. JDK 21, JMH 1.37, sizes 30,000 and 120,000, 3 forks, 5 warmup and 5 measurement iterations.

```
Benchmark                                   (size)  Mode  Cnt      Score     Error   Units
BuildReportBench.buildReport                 30000  avgt   15    812.441 ±  11.902   ms/op
BuildReportBench.buildReport                120000  avgt   15  12874.330 ± 201.554   ms/op
BuildReportBench.buildReport:gc.alloc.rate.norm  30000  avgt   15  1.21E9 ± 2.1E6   B/op
```

4x input gave about 15.8x time; recorded for classification.

---

## Exit Criteria

DONE when `perf/bench/jmh_baseline.json` holds forked results for every size with raw data and GC allocation per op, and the benchmark returns its result from non-final state.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Archetype download fails offline | **Adjust**: add `org.openjdk.jmh:jmh-core` and `jmh-generator-annprocess` dependencies by hand and the shade plugin config from the JMH samples. |
| Phase 2 | `Unable to find the resource: /META-INF/BenchmarkList` | **Retry**: the annotation processor did not run; check `jmh-generator-annprocess` is on the annotation processor path and rebuild. |
| Phase 3 | Score error larger than the score difference you hope to detect | **Adjust**: add forks or iterations as a recorded decision, or **Return** to `perf-bench-env-stabilize`. |
| Phase 3 | Benchmark takes hours | **Adjust**: reduce `-wi`/`-i` time with `-w`/`-r` as a recorded user decision. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
