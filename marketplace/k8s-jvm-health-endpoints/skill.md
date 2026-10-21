# JVM Health Endpoints (Spring Boot Actuator and Quarkus)

**One-line description:** Enables Spring Boot Actuator liveness and readiness health groups (or Quarkus SmallRye Health), puts dependency checks only in the readiness group, turns on graceful shutdown with a known phase timeout, and records the endpoint paths and port the probes must use.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Maven or Gradle project root.
- `workload_profile` (object, required): Output of `k8s-workload-inventory`; uses `container_port`, `dependencies`, `existing_health_routes`.

---

## Outputs

- `jvm_health_endpoints` (object): `framework`, `liveness_path`, `readiness_path`, `startup_path` (Quarkus only, else empty), `probe_port` (number or name), `shutdown_phase_timeout`, `sigterm_exit_seconds` (measured), `files_changed`.

---

## Phase 1: Detect Framework and Versions

### Entry Criteria
- `workload_profile.stack` == `java` (also Kotlin on the JVM).

### Actions
1. Maven: `./mvnw -q help:evaluate -Dexpression=project.parent.version -DforceStdout` prints the Spring Boot parent version when the parent is `spring-boot-starter-parent`. Gradle: `./gradlew -q dependencies --configuration runtimeClasspath | grep -E "spring-boot|quarkus-core" | head`.
2. Classify:

| Found | `framework` |
|---|---|
| `spring-boot-starter-actuator` on the classpath | `spring-boot` |
| `spring-boot-starter-web` without actuator | `spring-boot` (add `spring-boot-starter-actuator`) |
| `io.quarkus:quarkus-smallrye-health` | `quarkus` |
| `io.quarkus:quarkus-core` without health | `quarkus` (add `quarkus-smallrye-health`) |
| None | Not covered; record and **Stop** |

3. Read `application.properties` or `application.yml` for `server.port`, `management.server.port`, `management.endpoints.web.base-path`, `server.shutdown`.

### Output
`framework`, versions, current management settings.

### Quality Gate
- The version and dependency lines are copied from command output.

---

## Phase 2: Configure Probe Endpoints

### Entry Criteria
- Framework known. Change one file per step; run the test suite after each.

### Actions
1. Spring Boot. Add to `application.properties` (or YAML equivalent):
```properties
management.endpoint.health.probes.enabled=true
management.endpoint.health.probes.add-additional-paths=true
management.endpoint.health.group.readiness.include=readinessState,db
management.endpoints.web.exposure.include=health
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=<value>
```
   - Probes are auto-enabled when Spring Boot detects Kubernetes (`KUBERNETES_SERVICE_HOST` and `KUBERNETES_SERVICE_PORT` set). Setting the property makes local tests match the cluster.
   - Paths: `/actuator/health/liveness` and `/actuator/health/readiness`. With `add-additional-paths=true` the same groups are also served at `/livez` and `/readyz` on the MAIN server port. Use those when `management.server.port` is a separate port: a probe on the management port can pass while the main connector is broken.
   - Liveness group: keep the default (`livenessState` only). Do NOT add `db` or other dependency indicators to liveness.
   - Readiness group: add only indicators the app cannot serve without (`db`, `redis`, ...). Names come from `/actuator/health` output; check them, do not guess.
   - `spring.lifecycle.timeout-per-shutdown-phase` default is 30s. Choose a value below `terminationGracePeriodSeconds`; record it as `shutdown_phase_timeout`. Spring Boot changed the default of `server.shutdown` to `graceful` in 3.4; set it explicitly so behavior does not depend on the version.
2. Quarkus. Add `quarkus-smallrye-health` (`./mvnw quarkus:add-extension -Dextensions="smallrye-health"`). Paths: `/q/health/live`, `/q/health/ready`, `/q/health/started`. Datasource health is added to readiness automatically when `quarkus-agroal` is present (`quarkus.datasource.health.enabled` defaults to true). Graceful drain: `quarkus.shutdown.timeout=<value>`.
3. Tests. Spring: a `@SpringBootTest(webEnvironment = RANDOM_PORT)` test with `TestRestTemplate` asserting `GET /actuator/health/liveness` returns 200 and body `{"status":"UP"}`. Quarkus: `@QuarkusTest` with RestAssured `given().when().get("/q/health/live").then().statusCode(200)`.
4. Run `./mvnw -q verify` or `./gradlew test`.

### Output
Configuration and tests.

### Quality Gate
- The build command exits 0 and the new health test is listed in the report (`target/surefire-reports/` or `build/test-results/`).
- `curl -s localhost:<port>/actuator/health/liveness` (with the app run locally) prints `{"status":"UP"}`.

---

## Phase 3: Prove Shutdown in the Container

### Entry Criteria
- Image rebuilt (`docker build`, `./mvnw spring-boot:build-image`, or Jib).

### Actions
1. `docker run -d --name probe-test -p 8080:<container_port> <image>`.
2. Wait for startup, then `curl -s localhost:8080/actuator/health/readiness` (or the Quarkus path) and record the body.
3. Measure startup time, needed by `k8s-probe-tuning` for the startupProbe: `docker logs probe-test 2>&1 | grep -E "Started .* in [0-9.]+ seconds|started in [0-9.]+s"` and record the seconds.
4. `time docker stop -t 60 probe-test` then `docker inspect probe-test --format '{{.State.ExitCode}}'`.

| Exit code | Meaning | Action |
|---|---|---|
| 143 | JVM ran shutdown hooks after SIGTERM and exited with 128+15; this is the normal JVM result | Record `sigterm_exit_seconds`; confirm logs show `Commencing graceful shutdown` (Spring) |
| 0 | Application called `System.exit(0)` in a hook | Accept |
| 137 | Killed after 60 seconds | Shell wrapper is PID 1 or shutdown hangs; check `ENTRYPOINT` is `["java", ...]` in exec form and read the thread dump `docker exec probe-test jcmd 1 Thread.print` before stopping |

5. `docker rm probe-test`.

### Output
`jvm_health_endpoints`.

### Quality Gate
- Exit code is 143 or 0, and the logs contain the graceful shutdown line for Spring Boot.
- Startup seconds are copied from the log line.

---

## Worked Example

Illustrative only. Spring Boot 3.3 service, main port 8080, `management.server.port=8081`, PostgreSQL.

Phase 1: framework `spring-boot`; separate management port found.

Phase 2: `add-additional-paths=true` chosen so probes hit `/livez` and `/readyz` on 8080; readiness includes `readinessState,db`; `spring.lifecycle.timeout-per-shutdown-phase=20s` (below the planned grace period).

Phase 3:
```
$ docker logs probe-test 2>&1 | grep -E "Started .* in"
Started BillingApplication in 11.482 seconds (process running for 12.31)
$ curl -s localhost:8080/readyz
{"status":"UP"}
$ time docker stop -t 60 probe-test
real    0m2.37s
$ docker inspect probe-test --format '{{.State.ExitCode}}'
143
```
143 with `Commencing graceful shutdown. Waiting for active requests to complete` in the log is the expected result.

---

## Exit Criteria

DONE when liveness and readiness paths answer on the recorded port, readiness alone carries dependency checks, graceful shutdown is configured, and startup and shutdown seconds are measured.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Framework not Spring Boot or Quarkus | **Stop**: write a plain servlet or JAX-RS endpoint pair by the same rules in a new flow run. |
| Phase 2 | Readiness group lists an unknown indicator | **Adjust**: read names from `GET /actuator/health` with `management.endpoint.health.show-components=always` locally. |
| Phase 2 | Tests fail | **Adjust**: fix configuration; never remove tests. |
| Phase 3 | Exit 137 | **Retry**: fix the exec-form entrypoint and rebuild. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
