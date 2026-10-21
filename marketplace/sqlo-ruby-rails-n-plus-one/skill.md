# Rails Active Record N+1 Query Fix

**One-line description:** Detects N+1 queries in a Rails code path with the Bullet gem, `strict_loading` and a `sql.active_record` notification counter, fixes each with `includes`, `preload`, `eager_load` or a counter cache, and pins the query count in a test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Rails application root (contains `Gemfile` and `config/application.rb`).
- `test_command` (string, required): For example `bin/rails test` or `bundle exec rspec`.
- `suspect_endpoint` (string, required): Controller action, view, job or serializer suspected of N+1.

---

## Outputs

- `n_plus_one_fixes` (object[]): Per fix: file and line, the relation before and after, query counts at two sizes, and the pinning test.

---

## Phase 1: Detect

### Entry Criteria
- `test_command` passes before any change.
- Rails version recorded: `bin/rails -v`.

### Actions
1. Add a counting helper for tests (no gem needed):
```ruby
def count_queries(&block)
  count = 0
  counter = ->(_name, _start, _finish, _id, payload) {
    count += 1 unless payload[:name].in?(["SCHEMA", "TRANSACTION"]) || payload[:cached]
  }
  ActiveSupport::Notifications.subscribed(counter, "sql.active_record", &block)
  count
end
```
2. Write a request or integration test that seeds 10 parents with children, calls the endpoint inside `count_queries`, then repeats with 20. Growth with n means N+1.
3. Name the association: read `log/test.log`, where Rails prints each SQL line; the repeated `SELECT ... WHERE "items"."order_id" = $1` names `Order#items`.
4. Optional: Bullet. Add `gem "bullet", group: [:development, :test]`, run `bundle install`, and in `config/environments/test.rb`:
```ruby
config.after_initialize do
  Bullet.enable = true
  Bullet.raise = true
end
```
   Bullet then raises `Bullet::Notification::UnoptimizedQueryError` naming the model and association, for example `USE eager loading detected Order => [:items]`.
5. Rails 6.1 and later: `Order.strict_loading.where(...)` makes any lazy load raise `ActiveRecord::StrictLoadingViolationError`, naming the association.

### Output
Counts at two sizes and named associations.

### Quality Gate
- Two counts at two sizes are recorded from test output.
- Each association is named from the log line, Bullet error or strict loading error.

---

## Phase 2: Apply the Fix

### Entry Criteria
- N+1 confirmed.

### Actions
1. Choose:

| Situation | Fix | SQL |
|---|---|---|
| Load association, no WHERE on it | `preload(:items)` | separate `IN` query |
| Load and filter or order by association columns | `eager_load(:customer)` or `includes(:customer).references(:customers)` | LEFT OUTER JOIN |
| Let Rails choose | `includes(:items)` (preload unless referenced in WHERE/ORDER) | either |
| Nested | `includes(items: :product)` | |
| `order.items.count` or `.size` in a loop | `counter_cache: true` on `belongs_to :order` plus an `items_count` column (migration), or `left_joins(:items).group(:id).select("orders.*, COUNT(items.id) AS items_count")` | |
| Scoped association (`order.items.where(active: true)` in loop) | define `has_many :active_items, -> { where(active: true) }, class_name: "Item"` and `preload(:active_items)` | |

2. Traps:
   - Calling `.where`, `.order` or `.count` on a preloaded association runs a new query. Use `.size` (uses loaded records) and Ruby `select`/`sort_by`, or a scoped association.
   - `eager_load` with `limit` on a has_many uses a DISTINCT subquery and can be slow; prefer `preload` for collections.
   - Serializers and Jbuilder views access associations too; trace the full render.
3. Edit one relation in one file.

### Output
Relation updated at one call site.

### Quality Gate
- `git diff --stat` shows only the intended file (plus a migration only for counter cache).

---

## Phase 3: Pin and Run

### Entry Criteria
- Phase 2 edit made.

### Actions
1. Rerun the counting test at both sizes; counts must match.
2. Assert: `assert_equal EXPECTED, count_queries { get orders_path }` (Minitest) or `expect(count_queries { get orders_path }).to eq(EXPECTED)` (RSpec), with `EXPECTED` the post-fix count. Rails 7.2 and later also provides `assert_queries_count`; check your version before using it.
3. Run the full `test_command`. Do not delete or loosen failing tests; fix the cause.
4. If a counter cache was added, backfill it in the migration with `Order.reset_counters(order.id, :items)` in batches, and say so in the output.

### Output
`n_plus_one_fixes`.

### Quality Gate
- Equal counts at both sizes in test output.
- The count assertion passes.
- Full `test_command` exit code is 0.

---

## Worked Example

Illustrative only.

Input: `OrdersController#index` rendering `app/views/orders/index.html.erb`.

Phase 1: 10 orders gives 23 queries; 20 gives 43. Bullet: `USE eager loading detected Order => [:customer]` and `Order => [:items]`.

Phase 2, `app/controllers/orders_controller.rb` line 7:
```ruby
# before
@orders = Order.where(status: "shipped").order(created_at: :desc).limit(50)
# after
@orders = Order.where(status: "shipped").order(created_at: :desc).limit(50)
               .includes(:customer, items: :product)
```
Phase 3: 5 queries at both sizes. `assert_equal 5, count_queries { get orders_path }`. `bin/rails test`: 402 runs, 0 failures.

---

## Exit Criteria

DONE when the count is constant across sizes, a test pins it, and the full suite passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Suite red before change | **Stop**: report failures. |
| Phase 1 | Bullet not allowed as a dependency | **Adjust**: use the notification counter and `strict_loading` only. |
| Phase 2 | `includes` triggers a huge JOIN | **Adjust**: switch to `preload`. |
| Phase 3 | Counter cache values wrong in tests | **Retry**: confirm fixtures or factories create children through the association so the cache updates. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
