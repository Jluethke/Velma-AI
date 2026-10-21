# Java Multi-Stage Dockerfile

**One-line description:** Writes a multi-stage Dockerfile for a Maven or Gradle Java service that caches dependency resolution, extracts Spring Boot layers (or a plain jar) into separate image layers, runs on a JRE, distroless Java or a `jlink` custom runtime, and sets container-aware heap sizing through `JAVA_TOOL_OPTIONS`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root with `pom.xml` or `build.gradle(.kts)`.
- `build_profile` (object, required): From `ctr-stack-inventory` with `stack=java`.
- `pinned_bases` (object, required): From `ctr-pin-base-digest`.
- `jvm_max_ram_percentage` (string, optional): Value for `-XX:MaxRAMPercentage`. If empty, the JVM default applies and is recorded as such.

---

## Outputs

- `java_dockerfile` (object): Dockerfile path, build tool commands, layering method (`boot-layers`, `plain-jar`, `jlink`), JVM flags set, and Phase 3 verification output.

---

## Phase 1: Build Stage with Cached Dependencies

### Entry Criteria
- A build wrapper (`mvnw` or `gradlew`) or system build tool is recorded in `build_profile`.
- `builder_ref` is a JDK image with the project's Java major version.

### Actions
1. Maven (wrapper preferred):
```
# syntax=docker/dockerfile:1
FROM <builder_ref> AS build
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -ntp dependency:go-offline
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -ntp package -DskipTests
```
   `dependency:go-offline` does not fetch every plugin dependency; the cache mount on the second `RUN` covers what it misses. Multi-module projects must copy every module's `pom.xml` before `go-offline`.
2. Gradle:
```
FROM <builder_ref> AS build
WORKDIR /src
COPY gradlew settings.gradle* build.gradle* gradle.properties* ./
COPY gradle gradle
RUN --mount=type=cache,target=/root/.gradle ./gradlew --no-daemon dependencies
COPY src src
RUN --mount=type=cache,target=/root/.gradle ./gradlew --no-daemon bootJar -x test
```
   Use `jar` or `installDist` instead of `bootJar` for non-Spring projects; read `build.gradle` for which task the project uses.
3. `-DskipTests` / `-x test` are allowed here ONLY because `ctr-test-in-image` runs the tests in a separate stage. Do not leave tests skipped without that flow.
4. Confirm exactly one jar was produced: `ls target/*.jar` (Maven) or `ls build/libs/*.jar` (Gradle). If `*-plain.jar` also exists (Spring Boot Gradle), copy the one without `-plain`.

### Output
Build stage producing one executable jar.

### Quality Gate
- `docker build --target build <project_dir>` exits 0.
- The build log shows `BUILD SUCCESS` (Maven) or `BUILD SUCCESSFUL` (Gradle).

---

## Phase 2: Layer Extraction and Runtime

### Entry Criteria
- Build stage succeeds.

### Actions
1. Choose the layering method:

| Condition | Method |
|---|---|
| Spring Boot 3.3 or later | `java -Djarmode=tools -jar app.jar extract --layers --launcher --destination /layers` |
| Spring Boot 2.3 to 3.2 | `java -Djarmode=layertools -jar app.jar extract --destination /layers` |
| Not Spring Boot | Copy the jar and its `lib/` (from `installDist` or `maven-dependency-plugin copy-dependencies`) as separate `COPY` lines, dependencies first |

   Read the Spring Boot version from `pom.xml` parent or the Gradle plugin line. Run `java -Djarmode=tools -jar app.jar help` to confirm the tools mode exists before relying on it.
2. Runtime for boot layers (order matters: least-changing first):
```
FROM build AS extract
RUN java -Djarmode=tools -jar target/app.jar extract --layers --launcher --destination /layers

FROM <runtime_ref> AS runtime
WORKDIR /app
COPY --from=extract /layers/dependencies/ ./
COPY --from=extract /layers/spring-boot-loader/ ./
COPY --from=extract /layers/snapshot-dependencies/ ./
COPY --from=extract /layers/application/ ./
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```
   Boot 3.2 and later use `org.springframework.boot.loader.launch.JarLauncher`; earlier versions use `org.springframework.boot.loader.JarLauncher`. Confirm with `unzip -l app.jar | grep JarLauncher`.
3. Distroless Java (`gcr.io/distroless/java<major>-debian12`) sets `ENTRYPOINT ["java", "-jar"]`-style defaults; read `docker image inspect -f '{{json .Config.Entrypoint}}' <runtime_ref>` and write `CMD` to match.
4. Optional `jlink` runtime (smaller, only when `base_preference` asks for it): in the build stage run `jdeps --ignore-missing-deps --print-module-deps --multi-release <major> --class-path 'BOOT-INF/lib/*' app.jar` to list modules, then `jlink --add-modules <list> --strip-debug --no-man-pages --no-header-files --output /jre`. Check `jlink --help` for the `--compress` values your JDK accepts. Copy `/jre` into `debian:12-slim` and set `PATH`. Run the app's full test suite on this image; missing modules fail only at runtime with `ClassNotFoundException`.
5. Heap sizing: since JDK 10 the JVM reads the container memory limit; default max heap is 25% of it. Set only what the user supplied:
   `ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=<jvm_max_ram_percentage>"`. If the input is empty, set nothing and record "JVM default 25%". Do NOT hard-code `-Xmx`; it ignores the container limit.
6. Non-root: Temurin images run as root. Add `RUN groupadd --system --gid <gid> app && useradd --system --uid <uid> --gid app app` and `USER <uid>:<gid>`; distroless `:nonroot` tags are already 65532 (details in `ctr-nonroot-user`).

### Output
Complete Dockerfile.

### Quality Gate
- `docker build -t <name>:dev <project_dir>` exits 0.
- `docker history <name>:dev` shows the four layer `COPY` steps as separate rows (boot-layers method).

---

## Phase 3: Verify JVM Behavior in the Container

### Entry Criteria
- Image built.

### Actions
1. Container awareness and heap: `docker run --rm -m 512m --entrypoint java <name>:dev -XX:+PrintFlagsFinal -version | grep -E "MaxHeapSize|UseContainerSupport"`. `UseContainerSupport` must be `true`; `MaxHeapSize` must be the chosen percentage of 512 MiB (or 25% if unset). On distroless, the entrypoint path is the image's `java` as shown by `docker image inspect`.
2. `JAVA_TOOL_OPTIONS` was picked up: the app's stderr begins with `Picked up JAVA_TOOL_OPTIONS: ...` (`docker logs`).
3. Startup: `docker run -d --name jvmtest -p <port>:<port> <name>:dev`, then `docker logs jvmtest` shows the framework's started line (Spring Boot: `Started <App> in N seconds`).
4. Shutdown: `docker stop jvmtest`; `docker inspect -f '{{.State.ExitCode}}' jvmtest` should be `143` or `0`, not `137`. Spring Boot graceful shutdown needs `server.shutdown=graceful` in config; record if absent, do not change app config in this flow.

### Output
`java_dockerfile` with verification output.

### Quality Gate
- Step 1 output shows `UseContainerSupport = true` and the `MaxHeapSize` value.
- Step 3 log shows the started line.

---

## Worked Example

Illustrative. Spring Boot 3.3.4, Maven wrapper, Java 21, port 8080, `jvm_max_ram_percentage=75`.

Phase 1: `./mvnw -B -ntp package -DskipTests` ends `BUILD SUCCESS`; `target/orders-0.1.0.jar`.

Phase 2: `extract --layers --launcher` creates `dependencies`, `spring-boot-loader`, `snapshot-dependencies`, `application`. Runtime `eclipse-temurin:21-jre-noble@sha256:...`, `ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"`, `USER 10001:10001`.

Phase 3: with `-m 512m`, `size_t MaxHeapSize = 402653184` (75% of 512 MiB), `bool UseContainerSupport = true`. Logs: `Started OrdersApplication in 3.9 seconds`.

---

## Exit Criteria

DONE when the jar's dependencies and application code sit in separate layers, the runtime is a JRE (or distroless or jlink) image running non-root, and heap sizing is confirmed from `PrintFlagsFinal` output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dependency download fails behind a proxy or private repo | **Adjust**: mount `settings.xml` as a secret (`--mount=type=secret,id=m2settings,target=/root/.m2/settings.xml`); never `COPY` it. |
| Phase 2 | `Unsupported jarmode 'tools'` | **Adjust**: Boot is older than 3.3; use `-Djarmode=layertools`. |
| Phase 2 | `ClassNotFoundException: ...JarLauncher` | **Adjust**: use the launcher class name for the Boot version found with `unzip -l`. |
| Phase 3 | `MaxHeapSize` ignores the limit | **Stop**: an explicit `-Xmx` is set somewhere (`grep -rn Xmx`); report it rather than stacking flags. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
