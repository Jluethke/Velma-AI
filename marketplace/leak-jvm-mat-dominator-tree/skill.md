# JVM Heap Dump Analysis With the Eclipse MAT Dominator Tree

**One-line description:** Parses JVM heap dumps with Eclipse Memory Analyzer, runs the Leak Suspects report headless, reads the Dominator Tree by retained heap, compares histograms across two dumps, and traces the leaking objects with Path to GC Roots excluding weak and soft references.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `jvm_heap_dumps` (string[], required): From `leak-jvm-heap-dump-capture`. Two `.hprof` files.
- `jvm_histograms` (object[], required): From `leak-jvm-heap-dump-capture`. Classes that grew.

---

## Outputs

- `jvm_retention_report` (object[]): For each leak: the dominator object (class and field name of its owner), its retained heap in both dumps, the strong path to a GC root written hop by hop, and the GC root type (static field, thread, JNI global, system class).

---

## Phase 1: Parse the Dumps

### Entry Criteria
- Eclipse Memory Analyzer (MAT) standalone installed from eclipse.dev/mat.
- The analysis machine has more free RAM than the largest dump's size is a common recommendation; if parsing fails with OutOfMemoryError, raise MAT's heap.

### Actions
1. Set MAT's heap: edit `MemoryAnalyzer.ini` in the MAT install directory and change the `-Xmx` line under `-vmargs` (for example `-Xmx8g` for a dump of several gigabytes). Use a value your machine can spare.
2. Parse headless and generate the Leak Suspects report (Linux and macOS script; on Windows use `ParseHeapDump.bat`):
   `./ParseHeapDump.sh /dumps/h2.hprof org.eclipse.mat.api:suspects`
   This writes index files next to the dump and `h2_Leak_Suspects.zip`. Optionally also `org.eclipse.mat.api:top_components`.
3. Parse `h1.hprof` the same way so both are indexed for comparison.
4. Do not delete the `.index` files while analyzing; reopening reuses them and avoids reparsing.

### Output
Indexed dumps and the Leak Suspects zip.

### Quality Gate
- `ls h2_Leak_Suspects.zip h2*.index` lists the files.
- `unzip -l h2_Leak_Suspects.zip` lists `index.html`.

---

## Phase 2: Read the Dominator Tree

### Entry Criteria
- `h2.hprof` is indexed.

### Actions
1. Open `index.html` from the suspects zip. Each "Problem Suspect" names an object and the share of heap it retains, with an accumulation point. Note them, but verify each in the Dominator Tree; the report is a heuristic.
2. Open `h2.hprof` in the MAT GUI. Open the Dominator Tree (toolbar icon or Overview page link). Sort by "Retained Heap" descending.
3. Definitions you must apply:
   - Shallow heap: memory of the object itself.
   - Retained heap: memory freed if this object became unreachable. A leak shows as one object with a large retained heap that grows between dumps.
   - X dominates Y when every path from a GC root to Y passes through X.
4. Expand the top entries until you reach a collection (`HashMap`, `ConcurrentHashMap`, `ArrayList`, `LinkedBlockingQueue`) whose children are the growing classes from `jvm_histograms`. That collection is the accumulation point; its owner (the object one level up, with the field name shown) is the holder.
5. Use "Group by class" in the Dominator Tree when one class has many independent dominators.

### Output
Candidate holders with retained heap in `h2`.

### Quality Gate
- For each candidate, the retained heap value and the field name of its owner are copied from the Dominator Tree.

---

## Phase 3: Compare Dumps and Path to GC Roots

### Entry Criteria
- Candidate holders identified.

### Actions
1. Open the Histogram in each dump and add both to the Compare Basket (Histogram view > right-click or toolbar "Add to Compare Basket"), then "Compare the results". Confirm the classes from `jvm_histograms` grow; this confirms the dumps match the histogram diff.
2. Open `h1.hprof` and find the same holder (search its class in the Histogram, then "List objects > with incoming references"). Record its retained heap in `h1`. Growth from `h1` to `h2` close to N times the per-object size confirms it.
3. On one leaked instance in `h2`: right-click > "Path To GC Roots" > "exclude all phantom/weak/soft etc. references". Weak and soft references do not prevent collection; only strong paths matter.
4. Write the path from GC root to instance: root type (for example `class com.example.Registry` static field, or `Thread` local variable), then each `field` hop.
5. Common JVM shapes:

   | Path contains | Cause |
   |---|---|
   | static `Map` field in an application class | C1 unbounded cache or C4 global collection |
   | `java.lang.ThreadLocal$ThreadLocalMap$Entry` under a pooled `Thread` | C7 ThreadLocal never removed |
   | listener list in a long-lived bean | C2 listener not unregistered |
   | many `ClassLoader` instances retaining classes after redeploy | C11 classloader leak; also check metaspace in NMT |
   | `java.lang.ref.Finalizer` chain | objects waiting on slow finalizers |

### Output
`jvm_retention_report`.

### Quality Gate
- Each report entry has retained heap in both dumps and a strong path that begins at a named GC root.

---

## Worked Example

Illustrative only.

Input: `h1.hprof` and `h2.hprof`, histogram grew `QuoteResponse` by 30,000.

Phase 1: `-Xmx8g` in `MemoryAnalyzer.ini`; `./ParseHeapDump.sh h2.hprof org.eclipse.mat.api:suspects` produces `h2_Leak_Suspects.zip`. Suspect 1: "One instance of `java.util.concurrent.ConcurrentHashMap` loaded by `jdk.internal.loader.ClassLoaders$AppClassLoader` occupies 151,220,880 (61.4%) bytes."

Phase 2: Dominator Tree: `ConcurrentHashMap` retained 151 MB, owner `com.example.orders.QuoteService.responseCache`.

Phase 3: Compare Basket: `QuoteResponse` 36,004 vs 66,004. Same map retained 121 MB in `h1`. Path To GC Roots (excluding weak/soft): `class QuoteService` (system class loader) -> static `INSTANCE` -> `responseCache` -> `ConcurrentHashMap$Node[]` -> `Node` -> `QuoteResponse`. Cause C1.

---

## Exit Criteria

DONE when every leak candidate has retained heap from both dumps and a strong path from a named GC root, and the class row from the shapes table is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Parse fails with OutOfMemoryError | **Retry**: raise `-Xmx` in `MemoryAnalyzer.ini` and rerun; parsing resumes from index files. |
| Phase 1 | Dump truncated (process killed during dump) | **Return**: to `leak-jvm-heap-dump-capture` for a new dump. |
| Phase 2 | No dominator with large retained heap; memory spread across many small owners | **Adjust**: use "Group by class" and the Histogram compare; the leak is many holders of one class. |
| Phase 3 | Only weak or soft paths remain after exclusion | **Adjust**: the object is collectable; it is not the leak. Pick the next candidate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
