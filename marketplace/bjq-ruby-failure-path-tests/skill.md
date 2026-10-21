# Ruby Job Failure-Path Tests

**One-line description:** Writes RSpec tests for Sidekiq job failure paths: `sidekiq_retry_in_block` returns `:kill` for permanent errors and a bounded delay for retryable ones, `sidekiq_retries_exhausted_block` reports, duplicate `perform` has one effect, strict args reject non-JSON arguments, and one integration test runs the job through Sidekiq's server middleware.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): App root with RSpec configured.
- `retry_policy` (object[], required): Output of `bjq-retry-backoff-jitter-policy` for Sidekiq.
- `idempotency_design` (object, required): Output of `bjq-idempotency-key-store`.

---

## Outputs

- `ruby_failure_tests` (object[]): Per job: spec file, examples R1 to R5, and passing RSpec output.

---

## Phase 1: Harness

### Entry Criteria
- `bundle exec rspec --version` runs.

### Actions
1. In `spec/rails_helper.rb` (or `spec_helper.rb`), `require "sidekiq/testing"` and set the default mode `Sidekiq::Testing.fake!` (jobs are pushed to an array per class, `ChargeJob.jobs`). Use `Sidekiq::Testing.inline!` inside a block only for tests that need the job to run on enqueue.
2. Clear between examples: `config.before(:each) { Sidekiq::Worker.clear_all }` (`Sidekiq::Job.clear_all` in newer versions; check which constant your version defines).
3. Know the limits: neither fake nor inline mode exercises Sidekiq's retry machinery (no retry set, no delay). Test the retry decision by calling the class's blocks directly (Phase 2), and the effect behavior by calling `perform` directly.
4. Database: if the job writes in a transaction and specs use transactional fixtures, the idempotency claim and the effect share the spec transaction. That is fine for R3; do not disable transactional fixtures globally.
5. One spec file per job: `spec/jobs/<job>_failures_spec.rb`.

### Output
Harness changes and file paths.

### Quality Gate
- `rg -n "sidekiq/testing" spec/` finds the require.

---

## Phase 2: Write the Examples

### Entry Criteria
- Harness ready.

### Actions
1. Write and run one example at a time:

| Id | Path | Example |
|---|---|---|
| R1 | Retryable error delay | `delay = ChargeJob.sidekiq_retry_in_block.call(count, Net::ReadTimeout.new, {})`; assert `delay` is an Integer within `0..[cap, base * 2**count].min` for several `count` values (or `nil` when the job relies on Sidekiq's default formula) |
| R2 | Permanent error | `expect(ChargeJob.sidekiq_retry_in_block.call(0, Stripe::CardError.new("declined", nil), {})).to eq(:kill)` |
| R3 | Duplicate perform | `job = ChargeJob.new; 2.times { job.perform(envelope) }`; assert the effect count from `idempotency_design` is 1 (for example `expect(Charge.where(order_id: 8812).count).to eq(1)`) and the provider double received the same idempotency key both times |
| R4 | Retries exhausted | `ChargeJob.sidekiq_retries_exhausted_block.call({"class" => "ChargeJob", "args" => [envelope], "error_message" => "x"}, RuntimeError.new("x"))`; assert the alert or failure record was written |
| R5 | Strict args | With `Sidekiq.strict_args!` on in the test environment: `expect { ChargeJob.perform_async(Time.now) }.to raise_error(ArgumentError)` |

2. Integration example: run one job through the server middleware chain in inline mode so custom middleware (logging, tenant, idempotency) executes: `Sidekiq::Testing.inline! { ChargeJob.perform_async(envelope) }`, and register any server middleware in `Sidekiq::Testing.server_middleware { |chain| chain.add MyMiddleware }`.
3. Use instance doubles for provider clients (`instance_double(Stripe::PaymentIntent)` or `allow(Stripe::PaymentIntent).to receive(:create)`), stubbing only methods that exist (RSpec verifies doubles against the real class when `verify_partial_doubles` is on; turn it on in `spec_helper.rb` if it is not).

### Output
Spec files.

### Quality Gate
- Each job file has R1 to R5 (`rg -n "R[1-5]" spec/jobs/<job>_failures_spec.rb`).
- Each example passes when run alone: `bundle exec rspec spec/jobs/<job>_failures_spec.rb:<line>`.

---

## Phase 3: Mutation Check and Full Run

### Entry Criteria
- Examples pass.

### Actions
1. One mutation at a time on a local branch: delete the `:kill` branch from the retry block (R2 must fail); remove the idempotency claim (R3 must fail); remove `Sidekiq.strict_args!` (R5 must fail). Revert with `git checkout -- <file>`.
2. Run `bundle exec rspec` for the whole suite.
3. Never add `skip`, `pending`, `xit`, or `:focus` to get green.

### Output
`ruby_failure_tests`.

### Quality Gate
- Each mutation caused the named example to fail (output pasted), and code was reverted.
- `rg -n "xit |skip|pending|focus: true" spec/jobs` prints nothing new.
- `bundle exec rspec` exits 0.

---

## Worked Example

Illustrative only.

Input: job `ChargeJob`; `retry_policy`: permanent on `Stripe::CardError`, default Sidekiq delay otherwise.

```ruby
RSpec.describe ChargeJob do
  it "R2 kills on card errors" do
    expect(described_class.sidekiq_retry_in_block.call(0, Stripe::CardError.new("declined", nil), {})).to eq(:kill)
  end
end
```
```
$ bundle exec rspec spec/jobs/charge_job_failures_spec.rb
.....

Finished in 0.41 seconds (files took 2.1 seconds to load)
5 examples, 0 failures
```
Mutation: deleting the `when Stripe::CardError then :kill` line gives `expected: :kill got: nil` in R2; reverted.

---

## Exit Criteria

DONE when every Sidekiq job has passing R1 to R5 examples plus one middleware integration example, each mutation was caught, and the full suite passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Jobs use Active Job, not `Sidekiq::Job` | **Adjust**: test `retry_on` and `discard_on` with `ActiveJob::TestHelper` (`perform_enqueued_jobs`, `assert_performed_jobs`) and keep R3 and R5 equivalents. |
| Phase 2 | `sidekiq_retry_in_block` is nil | **Return**: the job has no retry block; send it back to `bjq-ruby-sidekiq-reliability-config`. |
| Phase 3 | Mutation not caught | **Retry**: strengthen the example and rerun. |
| Phase 3 | Unrelated specs fail | **Stop**: report them; do not modify them in this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
