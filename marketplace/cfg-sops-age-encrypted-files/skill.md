# SOPS Encrypted Secret Files With age

**One-line description:** Keeps secrets in git as SOPS-encrypted YAML or dotenv files using age recipients (optionally plus a cloud KMS key), defines `.sops.yaml` creation rules per environment path, encrypts only values, edits and runs with `sops edit` and `sops exec-env`, re-keys with `updatekeys` and `rotate` when people leave, and blocks plaintext commits with a check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys; `secret` rows go into encrypted files.
- `store_decision` (object, required): Output of `cfg-choose-secret-store` with file names per environment.
- `repo_path` (string, required): Absolute path to the repository that will hold the encrypted files.

---

## Outputs

- `secret_store_config` (object): sops and age versions, `.sops.yaml` content, encrypted file paths, recipients per environment (public keys only), and the decrypt check output.
- `secret_access_policy` (string): The recipient list per environment with who or what holds each private key, and the plaintext-commit check command.

---

## Phase 1: Keys And Creation Rules

### Entry Criteria
- `sops --version` and `age --version` print versions. Install with `brew install sops age` or release binaries from github.com/getsops/sops and github.com/FiloSottile/age. Record the sops version: sops 3.9 added subcommands (`sops encrypt`, `sops decrypt`, `sops edit`); older versions use flags (`sops -e`, `sops -d`, plain `sops <file>` to edit). Use the form your version supports.

### Actions
1. Each human and each deploy system gets its own age key. A person runs `age-keygen -o ~/.config/sops/age/keys.txt` (Linux default location; macOS default is `~/Library/Application Support/sops/age/keys.txt`; or set `SOPS_AGE_KEY_FILE`). The command prints `Public key: age1...`. Only the public key is shared. Set file mode 600: `chmod 600 ~/.config/sops/age/keys.txt`.
2. Deploy systems: CI stores its age private key in its secret store (for example GitHub Actions secret `SOPS_AGE_KEY`, which sops reads from the environment variable of that name). For production on a cloud, prefer a KMS recipient (`kms:` for AWS KMS ARNs, `gcp_kms:`, `azure_keyvault:`) so decryption is controlled by IAM and logged.
3. Write `.sops.yaml` at the repo root. Rules are matched top to bottom; the first matching `path_regex` wins:
```yaml
creation_rules:
  - path_regex: secrets/prod/.*\.ya?ml$
    encrypted_regex: '^(data|stringData|password|api_key|token|.*_secret)$'
    age: >-
      age1prodci...,
      age1oncall...
    kms: arn:aws:kms:us-east-1:123456789012:key/<key-id>
  - path_regex: secrets/staging/.*
    age: >-
      age1stagingci...,
      age1dev1...,
      age1dev2...
```
   Prod recipients are only the deploy system and named on-call holders. Developers are recipients of staging and dev files, not prod.
4. `encrypted_regex` limits encryption to matching keys so non-secret structure stays readable in diffs; without it, sops encrypts every value. For Kubernetes Secret manifests use `^(data|stringData)$`.

### Output
Keys distributed (public halves) and `.sops.yaml` committed.

### Quality Gate
- `.sops.yaml` contains only `age1...` public keys and KMS ARNs (`rg -n 'AGE-SECRET-KEY' .sops.yaml` returns nothing).
- Every environment in `store_decision` matches exactly one `path_regex` (test each file path with a quick `rg` against the regex list).

---

## Phase 2: Encrypt, Edit, Run

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create a new secret file directly in the editor so plaintext never touches disk: `sops edit secrets/prod/billing.enc.yaml` (older: `sops secrets/prod/billing.enc.yaml`). sops opens `$EDITOR` on a temporary decrypted copy and encrypts on save.
2. To encrypt an existing plaintext file in place: `sops encrypt --in-place secrets/prod/billing.enc.yaml` (older: `sops -e -i ...`). If the plaintext was ever committed, it is a leak: run the leak response chain.
3. Inspect the result: values look like `ENC[AES256_GCM,data:...,iv:...,tag:...,type:str]` and a `sops:` block holds the encrypted data keys per recipient, `lastmodified` and `mac`. Never edit encrypted values by hand; the MAC check fails on the next decrypt.
4. Run the app with secrets as environment variables without writing them to disk: `sops exec-env secrets/prod/billing.enc.yaml 'node dist/index.js'`. For a dotenv-format file name it `*.env` so sops parses it as dotenv, or pass `--input-type dotenv`.
5. To decrypt for a tool that needs a file, use `sops exec-file secrets/prod/billing.enc.yaml 'tool --config {}'` (the `{}` is a temporary path removed afterward).

### Output
Encrypted files committed.

### Quality Gate
- `sops decrypt secrets/prod/billing.enc.yaml > /dev/null` exits 0 for a holder of a prod key (older: `sops -d`).
- `rg --files-without-match 'ENC\[AES256_GCM' secrets/` lists no file (every file under `secrets/` contains encrypted values).

---

## Phase 3: Re-keying, Removal And Plaintext Guard

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Adding a recipient: add the public key to `.sops.yaml`, then `sops updatekeys secrets/prod/billing.enc.yaml` for every affected file (it shows the change and asks to confirm; `-y` skips the prompt). Commit.
2. Removing a recipient (person leaves, CI key exposed): remove the key from `.sops.yaml`, run `sops updatekeys` on each file, then `sops rotate --in-place <file>` (older: `sops -r -i <file>`) to generate a new data key. Then rotate the secret values themselves with `cfg-rotate-leaked-secret`. The removed key can still decrypt every old version of the file in git history; re-encrypting does not take that away.
3. Add a plaintext guard to CI and pre-commit: fail when a file under `secrets/` lacks a `sops:` block:
```
for f in $(git ls-files 'secrets/*'); do
  rg -q '^sops:' "$f" || rg -q '"sops":' "$f" || rg -q '^sops_' "$f" || { echo "PLAINTEXT: $f"; exit 1; }
done
```
   YAML files carry a top-level `sops:` key, JSON a `"sops":` key, dotenv files `sops_` prefixed lines.
4. Record recipients per environment and who holds each private key in `secret_access_policy`.

### Output
`secret_store_config`, `secret_access_policy`.

### Quality Gate
- The guard exits 0 on the repository, and exits 1 when a temporary plaintext file is added under `secrets/` (mutation check; delete the file after).
- After a recipient removal, `sops decrypt` with the removed key fails on the current file (`Failed to get the data key`).

---

## Common Mistakes To Avoid

- Do not commit a private key (`AGE-SECRET-KEY-1...`) or `keys.txt`.
- Do not decrypt to a file inside the repository (`sops decrypt f > secrets.yaml`); it will be committed sooner or later.
- Do not treat recipient removal as revocation; rotate the values too.
- Do not give developers prod recipients "for debugging".

---

## Worked Example

Illustrative. Flux-based deploys, environments `staging` and `prod`, sops 3.9, age 1.2.

```
$ age-keygen -o ci-prod.key
Public key: age1qz5...prodci
$ sops edit secrets/prod/billing.enc.yaml        # typed stripe and db values
$ head -3 secrets/prod/billing.enc.yaml
stripe:
    api_key: ENC[AES256_GCM,data:Jf0...,iv:...,tag:...,type:str]
db:
$ SOPS_AGE_KEY_FILE=ci-prod.key sops exec-env secrets/prod/billing.enc.yaml 'node -e "console.log(Boolean(process.env.stripe_api_key))"'
true
```
(nested keys flatten to `stripe_api_key`; check the variable names `sops exec-env` produces for your file layout.) Guard run: `exit 0`; with a plaintext `secrets/tmp.yaml`: `PLAINTEXT: secrets/tmp.yaml`, exit 1.

---

## Exit Criteria

DONE when `.sops.yaml` maps each environment to its own recipients, all secret files are encrypted and decrypt for the right holders, runtime uses `exec-env` or `exec-file`, the plaintext guard is proven, and the re-key procedure is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `no matching creation rules found` | **Adjust**: the file path does not match any `path_regex`; fix the regex or the path. |
| Phase 2 | `Failed to get the data key required to decrypt the SOPS file` | **Retry**: your key is not a recipient or `SOPS_AGE_KEY_FILE` points elsewhere; check with `sops filestatus` and the `sops:` block recipients. |
| Phase 2 | `MAC mismatch` | **Stop**: the file was edited outside sops; restore from git and edit with `sops edit`. |
| Phase 3 | A removed recipient's key was exposed | **Return**: rotate every secret value that key could read, including old versions in history. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
