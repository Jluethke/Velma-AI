# Sidekiq Reliability Config

**One-line description:** Configures Sidekiq for safe retries and minimal job loss: `sidekiq_options retry`, a `sidekiq_retry_in` block that returns `:kill` for permanent errors, `sidekiq_retries_exhausted` and death handlers, `:timeout:` sized from measured runtimes, `Sidekiq.strict_args!`, and an explicit record of what the open source fetch loses on SIGKILL.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Rails or Ruby app root with `config/sidekiq.yml` and job classes.
- `retry_policy` (object[], required): Output of `bjq-retry-backoff-jitter-policy` for `queue_choice` = `sidekiq`.
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`.

---

## Outputs

- `sidekiq_config` (object): Per-job `sidekiq_options` and retry blocks, `config/sidekiq.yml` changes, initializer changes, the job-loss statement for the fetch strategy in use, and verification output.

---

## Phase 1: Read Versions and Current Options

### Entry Criteria
- `bundle exec ruby -e 'require "sidekiq"; puts Sidekiq::VERSION'` prints a version.

### Actions
1. Record Sidekiq version and edition: `bundle list | rg -i sidekiq` (open source `sidekiq`, or `sidekiq-pro` / `sidekiq-ent`). Settings below follow Sidekiq 7; for 6.x read the wiki pages for that version.
2. List job classes and their options: `rg -n "sidekiq_options|sidekiq_retry_in|sidekiq_retries_exhausted" <repo_path>/app`.
3. If the app uses Active Job (`< ApplicationJob` with `queue_adapter = :sidekiq`), note it: retries are then controlled by Active Job `retry_on` / `discard_on` plus Sidekiq's own retry; the two stack. Record which layer will own retries; the other must be off for that job.
4. Read `config/sidekiq.yml` for `:concurrency:`, `:timeout:` and `:queues:`.
5. Record the fetch strategy: open source uses basic fetch (`BRPOP`); Sidekiq Pro offers `super_fetch` (`config.super_fetch!`). With basic fetch, jobs in progress when the process receives SIGKILL (out-of-memory killer, `kill -9`, hard container stop) are lost. Jobs still running when the shutdown `:timeout:` expires are pushed back to Redis and run again.

### Output
Version, edition, current options, fetch strategy.

### Quality Gate
- Every job class appears with its options or `defaults`.
- The fetch strategy and its loss behavior are written in one sentence.

---

## Phase 2: Set Retry and Death Handling

### Entry Criteria
- Phase 1 recorded.

### Actions
1. From `retry_policy`, per job: `sidekiq_options retry: <retries>` (count of retries, not attempts). Sidekiq's default is 25 retries with a randomized polynomial delay spanning about three weeks (see the "Error Handling" wiki page); keep the default when the policy says so.
2. Permanent errors skip retries:
```ruby
sidekiq_retry_in do |count, exception, jobhash|
  case exception
  when PaymentDeclined, ActiveRecord::RecordNotFound then :kill   # to the Dead set
  end                                                             # nil -> default delay
end
```
   `:discard` drops the job with no record; use it only for jobs whose loss is acceptable and logged.
3. Exhaustion: `sidekiq_retries_exhausted do |job, ex| ... end` on a class, or global `config.death_handlers << ->(job, ex) { ... }` in `config/initializers/sidekiq.rb`, to report to monitoring. Handlers must not raise.
4. Dead set limits: the Dead set keeps a bounded number of jobs for a bounded time (`dead_max_jobs`, `dead_timeout_in_seconds`; defaults on the Error Handling wiki page). Record the values in effect.
5. Arguments: add `Sidekiq.strict_args!` in the initializer (test and development at least) so non-JSON-native arguments raise at enqueue.
6. Long jobs: Sidekiq has no lease; a job runs until it finishes, the process dies, or shutdown. For jobs whose maximum runtime exceeds `:timeout:`, a deploy pushes them back and they restart from the beginning; they must be idempotent or chunked.

### Output
Retry and death settings per job.

### Quality Gate
- Every job classified as having permanent errors has a `sidekiq_retry_in` block returning `:kill` for them.
- No job has retries owned by both Active Job and Sidekiq (`rg -n "retry_on" <repo_path>/app/jobs` cross-checked with `sidekiq_options retry`).

---

## Phase 3: Set Timeout and Verify

### Entry Criteria
- Retry settings written.

### Actions
1. `:timeout:` in `config/sidekiq.yml` is how long Sidekiq waits for running jobs after TERM before pushing them back. It must be shorter than the platform's kill deadline (Kubernetes `terminationGracePeriodSeconds`, Heroku's documented shutdown window, ECS `stopTimeout`), otherwise the platform sends SIGKILL first and basic fetch loses the jobs. The full shutdown sequence is in `bjq-ruby-graceful-shutdown`.
2. Write tests with `require "sidekiq/testing"`:
   - Retry block: `expect(ChargeJob.sidekiq_retry_in_block.call(1, PaymentDeclined.new("x"), {})).to eq(:kill)`.
   - Exhausted handler: `ChargeJob.sidekiq_retries_exhausted_block.call({"class" => "ChargeJob", "args" => [1]}, RuntimeError.new)` and assert the side effect (alert recorded).
   - Strict args: `expect { ChargeJob.perform_async(Time.now) }.to raise_error(ArgumentError)`.
3. Run `bundle exec rspec spec/jobs` then the full suite. Do not weaken or delete tests.
4. In staging, read the live retry and dead counts: `bundle exec rails runner 'require "sidekiq/api"; p Sidekiq::RetrySet.new.size, Sidekiq::DeadSet.new.size, Sidekiq::Stats.new.processed'`.

### Output
`sidekiq_config` with diffs and test output.

### Quality Gate
- `bundle exec rspec spec/jobs` exits 0 with the three test kinds present.
- `:timeout:` value is less than the platform kill deadline, both numbers shown.

---

## Worked Example

Illustrative only.

Input: Sidekiq 7.2 open source; `ChargeJob` (Stripe), max runtime 3.1 s; `ReportJob` max 940 s; Kubernetes `terminationGracePeriodSeconds: 30`; `:timeout: 25`.

- Phase 1: basic fetch; SIGKILL during a deploy loses in-flight jobs.
- Phase 2: `ChargeJob`: `sidekiq_options retry: 12`, retry block kills on `Stripe::CardError`. `ReportJob` exceeds the 25 s timeout, so every deploy restarts it; recorded as a finding: chunk it or accept restarts (it is idempotent per `bjq-idempotency-key-store`).
- Phase 3:
```
$ bundle exec rspec spec/jobs/charge_job_spec.rb
...
3 examples, 0 failures
```
25 < 30: pass.

---

## Exit Criteria

DONE when every job has explicit retry counts and a permanent-error `:kill` path, exhaustion is reported, strict args are on, `:timeout:` is below the platform kill deadline, the fetch-strategy loss is documented, and the job specs pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sidekiq 5 or older | **Stop**: the option names differ; upgrade first or follow the docs for that version. |
| Phase 2 | Losing in-flight jobs on SIGKILL is unacceptable | **Return**: report that basic fetch cannot meet it; options are Sidekiq Pro `super_fetch` or a broker with leases. |
| Phase 2 | Exception class to match is not known | **Adjust**: read the client gem source for the raised class and cite it. |
| Phase 3 | `sidekiq_retry_in_block` is nil in test | **Adjust**: the class has no block; the test is correct and the block is missing. Add it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
