# Auth Go Argon2id Password Hashing

**One-line description:** Implements Argon2id password hashing in Go with `golang.org/x/crypto/argon2.IDKey`, encoding the result as a PHC string (`$argon2id$v=19$m=...,t=...,p=...$salt$hash`), comparing in constant time with `crypto/subtle`, flagging weaker parameters for rehash, and testing it with `go test`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the Go module root (contains `go.mod`).
- `auth_inventory` (object, required): Output of `auth-session-vs-token-decision`; its `password_hash` hits locate the current hashing code.

---

## Outputs

- `password_hashing_change` (object): Package path created, `golang.org/x/crypto` version, Argon2id parameters with source, rehash-on-login location, and `go test` output.

---

## Phase 1: Locate Current Hashing

### Entry Criteria
- `go.mod` exists at `repo_path`.

### Actions
1. Search: `rg -n "x/crypto/(bcrypt|argon2|scrypt|pbkdf2)|crypto/(md5|sha1|sha256)" --type go .`
2. Classify each hit: `bcrypt.GenerateFromPassword` (bcrypt, hand old rows to `auth-bcrypt-to-argon2id-migration`); `argon2.Key` (that is Argon2i, not Argon2id: migrate); `argon2.IDKey` (check parameters and encoding); `sha256.Sum256` on a password (critical finding).
3. Note: Go's `x/crypto/argon2` has no built-in encode or verify helpers. You must write the PHC encoding and decoding yourself. Do not import a third-party "argon2id" wrapper unless the user approves the dependency.

### Output
Classified call sites.

### Quality Gate
- Each hit is classified by the function name it calls.

---

## Phase 2: Implement Hash, Verify and NeedsRehash

### Entry Criteria
- Classification done.

### Actions
1. `go get golang.org/x/crypto@latest` and record the version written to `go.mod`.
2. Create `internal/password/password.go`:
   ```go
   package password

   import (
       "crypto/rand"
       "crypto/subtle"
       "encoding/base64"
       "errors"
       "fmt"
       "strings"

       "golang.org/x/crypto/argon2"
   )

   // OWASP Password Storage Cheat Sheet minimum: m=19456 KiB, t=2, p=1.
   type Params struct{ Memory uint32; Time uint32; Threads uint8; SaltLen, KeyLen uint32 }
   var Default = Params{Memory: 19456, Time: 2, Threads: 1, SaltLen: 16, KeyLen: 32}

   var ErrInvalidHash = errors.New("invalid argon2id hash")
   var b64 = base64.RawStdEncoding

   func Hash(plain string, p Params) (string, error) {
       salt := make([]byte, p.SaltLen)
       if _, err := rand.Read(salt); err != nil { return "", err }
       key := argon2.IDKey([]byte(plain), salt, p.Time, p.Memory, p.Threads, p.KeyLen)
       return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
           argon2.Version, p.Memory, p.Time, p.Threads, b64.EncodeToString(salt), b64.EncodeToString(key)), nil
   }

   func decode(enc string) (Params, []byte, []byte, error) {
       f := strings.Split(enc, "$") // "", "argon2id", "v=19", "m=..,t=..,p=..", salt, hash
       if len(f) != 6 || f[1] != "argon2id" { return Params{}, nil, nil, ErrInvalidHash }
       var v int
       if _, err := fmt.Sscanf(f[2], "v=%d", &v); err != nil || v != argon2.Version { return Params{}, nil, nil, ErrInvalidHash }
       var p Params
       if _, err := fmt.Sscanf(f[3], "m=%d,t=%d,p=%d", &p.Memory, &p.Time, &p.Threads); err != nil { return Params{}, nil, nil, ErrInvalidHash }
       salt, err := b64.DecodeString(f[4]); if err != nil { return Params{}, nil, nil, ErrInvalidHash }
       key, err := b64.DecodeString(f[5]); if err != nil { return Params{}, nil, nil, ErrInvalidHash }
       p.SaltLen, p.KeyLen = uint32(len(salt)), uint32(len(key))
       return p, salt, key, nil
   }

   func Verify(enc, plain string) (bool, error) {
       p, salt, key, err := decode(enc)
       if err != nil { return false, err }
       other := argon2.IDKey([]byte(plain), salt, p.Time, p.Memory, p.Threads, p.KeyLen)
       return subtle.ConstantTimeCompare(key, other) == 1, nil
   }

   func NeedsRehash(enc string, want Params) bool {
       p, _, _, err := decode(enc)
       return err != nil || p.Memory < want.Memory || p.Time < want.Time || p.Threads < want.Threads || p.KeyLen < want.KeyLen
   }
   ```
3. Do NOT compare with `bytes.Equal` or `==`; it leaks timing. Use `subtle.ConstantTimeCompare`.
4. Do NOT use `math/rand` for the salt. Use `crypto/rand`.
5. `argon2.Version` is the constant `0x13` (19). Do not hardcode another value.

### Output
`internal/password` package.

### Quality Gate
- `go vet ./internal/password/...` prints nothing and exits 0.
- `rg -n "math/rand" internal/password` has no hits.

---

## Phase 3: Wire Rehash on Login and Test

### Entry Criteria
- Package compiles: `go build ./...` exits 0.

### Actions
1. In the login handler: call `password.Verify`; on success, if `password.NeedsRehash(stored, password.Default)`, call `password.Hash` and update the user row before issuing the session.
2. Write `internal/password/password_test.go` with table-driven tests:
   - `Hash` output has prefix `$argon2id$v=19$m=19456,t=2,p=1$`.
   - `Verify` true for the right password, false for the wrong one.
   - `Verify` returns `ErrInvalidHash` for `$argon2i$...` and for a string with 5 fields.
   - `NeedsRehash` true for a hash made with `Params{Memory: 8192, Time: 1, Threads: 1, SaltLen: 16, KeyLen: 32}`.
3. Run `go test ./internal/password/... -run . -v -count=1` and read each `--- PASS` line.
4. Run `go test ./... -count=1` to confirm nothing else broke.

### Output
`password_hashing_change`.

### Quality Gate
- `go test` prints `ok` for the package and every new test shows `--- PASS`.
- Mutation check: change the `p.Memory < want.Memory` comparison to `false`, rerun, confirm the `NeedsRehash` test fails, revert.

---

## Worked Example

Illustrative only. A Go API uses `bcrypt.GenerateFromPassword(pw, 10)`.

Phase 1:
```
$ rg -n "x/crypto/bcrypt" --type go .
internal/auth/login.go:9:  "golang.org/x/crypto/bcrypt"
```
Classified bcrypt; old rows go to `auth-bcrypt-to-argon2id-migration`.

Phase 3:
```
$ go test ./internal/password/... -v -count=1
=== RUN   TestHashPrefix
--- PASS: TestHashPrefix (0.04s)
=== RUN   TestVerify
--- PASS: TestVerify (0.09s)
=== RUN   TestInvalidHash
--- PASS: TestInvalidHash (0.00s)
=== RUN   TestNeedsRehash
--- PASS: TestNeedsRehash (0.02s)
ok   example.com/api/internal/password  0.171s
```

---

## Exit Criteria

DONE when new hashes are Argon2id PHC strings at or above OWASP parameters, verification is constant time, weaker hashes are flagged and rehashed at login, and all tests plus the mutation check are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `go.mod` | **Stop**: this flow is for Go modules. |
| Phase 2 | `go get` blocked by proxy | **Adjust**: set `GOPROXY` per the organization's policy; do not vendor a copied file. |
| Phase 2 | Existing hashes use a different PHC field order | **Adjust**: extend `decode` to parse that order; add a test with one real sample prefix. |
| Phase 3 | Login latency too high under load | **Return**: report measured latency; offer another OWASP-listed parameter row; never go below it. |
| Phase 3 | Mutation check does not fail | **Stop**: rewrite the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
