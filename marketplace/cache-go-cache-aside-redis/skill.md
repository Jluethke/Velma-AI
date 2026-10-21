# Go Cache-Aside With go-redis

**One-line description:** Adds a cache-aside read path and after-commit invalidation to one Go hotspot using github.com/redis/go-redis/v9, with per-call context deadlines, `redis.Nil` miss handling, fail-open on errors, and table tests on miniredis including TTL fast-forward.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Go module.
- `key_schema` (object[], required): Key templates from `cache-key-schema-design`.
- `ttl_table` (object[], required): TTL and jitter per entry type from `cache-ttl-from-change-rate`.
- `invalidation_plan` (object[], required): Strategy and writer list from `cache-invalidation-strategy-select`.

---

## Outputs

- `cache_aside_change` (object): Files changed, the read function wrapped, the writers hooked, the `go test` command and its output, and the go-redis version from go.mod.

---

## Phase 1: Prepare Client and Tests

### Entry Criteria
- `go test ./...` passes before any change; record the output summary.

### Actions
1. Check go.mod: `grep redis go.mod`. The current module path is `github.com/redis/go-redis/v9`. The old path `github.com/go-redis/redis/v8` is a different module; if the repo uses it, keep it for this change and do not mix both.
2. If absent: `go get github.com/redis/go-redis/v9` and `go get github.com/alicebob/miniredis/v2` (test only).
3. Build one client at startup and pass it in (struct field or constructor argument), never a package-level global created inside the hotspot:
   `rdb := redis.NewClient(&redis.Options{Addr: addr, DialTimeout: dialTimeout, ReadTimeout: readTimeout, WriteTimeout: writeTimeout})`.
   All three durations are user inputs. Field names are from `redis.Options`; run `go doc github.com/redis/go-redis/v9 Options` to confirm them for your version.
4. Write failing table tests in `<pkg>/<entity>_cache_test.go`:
   `mr := miniredis.RunT(t)`; `rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})`.
   Cases: second call skips the repository (counter on a fake repo); after a write the next read is fresh; after `mr.FastForward(ttl + time.Second)` the key is gone; with `mr.Close()` called before the read, the read still returns the repository value.
5. Run `go test ./<pkg>/ -run Cache -v`. It must fail now.

### Output
Client wiring and failing tests.

### Quality Gate
- `go test ./<pkg>/ -run Cache` exits non-zero with assertion failures, not compile errors.
- `go vet ./...` exits 0.

---

## Phase 2: Implement the Read Path

### Entry Criteria
- Failing tests compile and fail.

### Actions
1. Edit only the hotspot function:

   ```go
   func (s *Store) GetProduct(ctx context.Context, id int64) (Product, error) {
       key := keys.Product(id)
       b, err := s.rdb.Get(ctx, key).Bytes()
       switch {
       case err == nil:
           var p Product
           if jerr := json.Unmarshal(b, &p); jerr == nil {
               return p, nil
           }
       case errors.Is(err, redis.Nil):
           // miss
       default:
           s.log.Warn("cache get", "key", key, "err", err) // fail open
       }
       p, err := s.repo.LoadProduct(ctx, id)
       if err != nil {
           return Product{}, err
       }
       if enc, jerr := json.Marshal(p); jerr == nil {
           if serr := s.rdb.Set(ctx, key, enc, ttlWithJitter(productTTL, productJitter)).Err(); serr != nil {
               s.log.Warn("cache set", "key", key, "err", serr)
           }
       }
       return p, nil
   }
   ```
2. `redis.Nil` means the key does not exist. It is not a failure; do not log it as an error.
3. The request context bounds Redis calls too. If the request deadline is long, wrap cache calls in `context.WithTimeout(ctx, cacheTimeout)` so a slow Redis cannot use the whole request budget.
4. A TTL of 0 in `Set` means no expiry. Never pass 0 by accident from a missing config value; validate TTL > 0 at startup.
5. Run the tests until the read cases pass.

### Output
Read path implemented.

### Quality Gate
- `go test ./<pkg>/ -run Cache -v` shows the read cases as `--- PASS`.
- `go vet ./...` exits 0.

---

## Phase 3: Hook the Writers

### Entry Criteria
- Read cases pass.

### Actions
1. For each in-service writer, call `s.rdb.Del(ctx, key)` after `tx.Commit()` returns nil. Not before, and not in a `defer` that also runs on rollback. One writer per edit.
2. For `write-through` rows, read the committed row and `Set` it after commit.
3. Run `go test ./...` and `go test -race ./<pkg>/`. The race detector catches a shared client or map used unsafely across goroutines.

### Output
`cache_aside_change`.

### Quality Gate
- `go test ./...` exits 0.
- `go test -race ./<pkg>/` exits 0 with no `WARNING: DATA RACE` lines.
- The FastForward case passes, proving a TTL was set.

---

## Worked Example

Illustrative. Service using pgx, entry `product`, TTL 300 s.

Phase 1: `go.mod` has no redis. After `go get`, tests fail: `catalog_cache_test.go:41: repo calls = 2, want 1`.

Phase 2: edit `internal/catalog/store.go`. `go test ./internal/catalog/ -run Cache -v` prints `--- PASS: TestProductCache/second_read_hits_cache (0.00s)`.

Phase 3: `internal/catalog/admin.go` calls `Del` after `tx.Commit(ctx)`. `go test -race ./internal/catalog/` prints `ok  example.com/shop/internal/catalog 1.42s`.

---

## Exit Criteria

DONE when the hotspot reads through Redis with bounded deadlines, `redis.Nil` is treated as a miss, writers delete after commit, and tests including the race detector pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repo uses `github.com/go-redis/redis/v8` | **Adjust**: keep v8 for this change; the API differs mainly in import path. Plan the upgrade separately. |
| Phase 2 | Every read logs an error | **Adjust**: you are logging `redis.Nil`; check with `errors.Is(err, redis.Nil)`. |
| Phase 3 | `DATA RACE` reported | **Stop**: fix the shared state before continuing; do not remove `-race`. |
| Phase 3 | Existing test fails | **Retry**: revert the last edit and fix the cause; never skip the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
