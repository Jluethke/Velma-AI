# Consumer-Driven Contracts with Pact

**One-line description:** Turns the in-process interface into a network contract by writing Pact consumer tests in the monolith (the consumer) that generate pact files, verifying them against the new service (the provider) with provider states, publishing to a Pact Broker and gating deploys with `can-i-deploy`, and reuses the existing contract suite against an HTTP client implementation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `module_interface` (object, required): From `mex-interface-boundary-contract`.
- `interface_contract_tests` (object, required): From `mex-interface-boundary-contract`; the implementation-agnostic suite.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `pact_files` (object): Paths of generated pact JSON files, consumer and provider names, the interactions with their provider states, and the publish command used.
- `provider_verification` (object): Verifier command, pass summary, `can-i-deploy` result, and the contract suite result against the HTTP client implementation.

---

## Phase 1: Consumer Tests in the Monolith

### Entry Criteria
- `deployment_decision` is `service`.
- An HTTP client implementation of the interface exists or is written in this phase.

### Actions
1. Install the Pact library for the stack from its official repository (pact-foundation on GitHub): python `pact-python`, node `@pact-foundation/pact`, go `pact-go` (v2), java `au.com.dius.pact.consumer:junit5`. Check the installed major version and use only the API shown in that version's README; Pact APIs changed between major versions (for example `PactV3`/`PactV4` in pact-js).
2. Names: consumer `shop-monolith`, provider `billing-service`. Use the same names everywhere.
3. One interaction per interface operation and per declared error, each with a provider state string such as `"invoice INV-1 exists"` or `"no invoice INV-404"`.
4. Use matchers, not literal values, for fields whose exact value the consumer does not depend on (type matchers for IDs and timestamps, regex for formats). Use literal values only where the consumer branches on the value (status enums).
5. Only include fields the consumer actually reads (from `seam_map` call shapes). Extra fields make the provider fail when it later removes data nobody uses.
6. The test drives the real HTTP client implementation against the Pact mock server. Running it writes the pact file (default directory `pacts/` in most implementations; confirm in the library docs).

### Output
Pact JSON file.

### Quality Gate
- The consumer test command exits 0.
- `ls pacts/shop-monolith-billing-service.json` exists and `jq '.interactions | length'` equals operations plus declared errors.

---

## Phase 2: Provider Verification in the Service

### Entry Criteria
- Pact file exists.

### Actions
1. In the service repo, implement provider state handlers that set up data for each state string, through the service's own code or a test database. Never share the monolith's database for this.
2. Verify with the stack's provider verifier (library-based verification is preferred: pact-python `Verifier`, pact-js `Verifier`, pact-go provider `VerifyProvider`, pact-jvm `@Provider` + `@PactFolder` or `@PactBroker` JUnit 5 tests). The standalone CLI `pact_verifier_cli` also works; read `pact_verifier_cli --help` for its flags.
3. Every interaction must pass. A failure prints the interaction description, the expected and actual body, and the mismatch path.
4. Fix the provider, never edit the pact file by hand to make verification pass.

### Output
Provider verification result.

### Quality Gate
- Verifier output shows every interaction verified and zero failures.

---

## Phase 3: Broker, can-i-deploy, and Contract Suite over HTTP

### Entry Criteria
- Verification passes locally.

### Actions
1. Publish from consumer CI with the Pact Broker client (`pact-broker` CLI from `pact_broker-client`, or the `pact-cli` Docker image):
   ```
   pact-broker publish pacts --consumer-app-version "$GIT_SHA" --branch "$GIT_BRANCH" --broker-base-url "$PACT_BROKER_BASE_URL" --broker-token "$PACT_BROKER_TOKEN"
   ```
2. Provider CI verifies pacts from the broker and publishes results with the provider version set to its git SHA (library option, see docs: `publishVerificationResult` / `publish_verification_results` / `pact.verifier.publishResults`).
3. Gate every deploy of either side:
   ```
   pact-broker can-i-deploy --pacticipant shop-monolith --version "$GIT_SHA" --to-environment production --broker-base-url "$PACT_BROKER_BASE_URL"
   ```
   After a deploy, record it: `pact-broker record-deployment --pacticipant billing-service --version "$GIT_SHA" --environment production`.
4. Add an `http` parameter to `interface_contract_tests` that builds the HTTP client against a locally started service. Run the same suite; it must pass with the same tests that pass in-process.

### Output
`pact_files`, `provider_verification`.

### Quality Gate
- `can-i-deploy` prints a positive result and exits 0 for the current versions.
- The contract suite passes for both `inprocess` and `http` parameters with equal test counts.

---

## Worked Example

Illustrative. Consumer tests in pact-js (check your installed major version's API).

```
$ npx jest tests/pact/billing.pact.test.ts
PASS tests/pact/billing.pact.test.ts (5 tests)
$ jq '.interactions | length' pacts/shop-monolith-billing-service.json
5
$ pact-broker can-i-deploy --pacticipant shop-monolith --version 3e9a1c2 --to-environment production
Computer says yes \o/
CONSUMER       | C.VERSION | PROVIDER        | P.VERSION | SUCCESS?
shop-monolith  | 3e9a1c2   | billing-service | 77b0d41   | true
```
Contract suite: `pytest tests/billing/contract -q` shows `48 passed` with params `inprocess` and `http` (24 each).

---

## Exit Criteria

DONE when every interface operation has a consumer interaction, the provider verifies all of them, deploys are gated by `can-i-deploy`, and the same contract suite passes over HTTP.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | API in examples does not match the installed library | **Stop**: read the README for the installed version; do not mix V2 and V3/V4 APIs. |
| Phase 2 | Provider state handler missing | **Adjust**: add a handler for the exact state string; strings must match byte for byte. |
| Phase 2 | Verification fails on a field the consumer does not read | **Adjust**: remove the field from the consumer interaction; republish. |
| Phase 3 | No Pact Broker available | **Adjust**: share pact files as CI artifacts and verify from files; record that `can-i-deploy` gating is not active as an open item. |
| Phase 3 | HTTP suite fails where in-process passes | **Stop**: a behavior difference over the wire (serialization, time zone, error mapping); fix the client or service, not the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
