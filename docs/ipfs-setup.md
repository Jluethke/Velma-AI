# IPFS Setup Guide

SkillChain uses IPFS to store and distribute `.skillpack` files. The SDK
supports three backends and auto-detects the best available one.

## Option 1: Pinata (Recommended for Production)

Pinata provides managed IPFS pinning with a free tier (1 GB storage, 100 pins).

1. Sign up at <https://pinata.cloud> and create an account.
2. Navigate to **API Keys** in the Pinata dashboard.
3. Create a new key with `pinFileToIPFS` and `pinByHash` permissions.
4. Set environment variables:

   ```bash
   # Linux / macOS
   export PINATA_API_KEY=your_api_key_here
   export PINATA_SECRET_KEY=your_secret_key_here

   # Windows (cmd)
   set PINATA_API_KEY=your_api_key_here
   set PINATA_SECRET_KEY=your_secret_key_here

   # Windows (PowerShell)
   $env:PINATA_API_KEY = "your_api_key_here"
   $env:PINATA_SECRET_KEY = "your_secret_key_here"
   ```

5. Verify connectivity:

   ```bash
   skillchain ipfs status
   ```

   Expected output:

   ```
   Provider:   pinata
   Gateway:    https://gateway.pinata.cloud/ipfs/
   Status:     connected
   Can upload: yes
   Pin count:  0
   ```

## Option 2: Local IPFS Node (Development)

Run your own Kubo (go-ipfs) daemon for fully decentralised development.

1. Install IPFS / Kubo: <https://docs.ipfs.tech/install/>
2. Initialise and start the daemon:

   ```bash
   ipfs init
   ipfs daemon
   ```

3. The SDK connects to `http://localhost:5001` by default. Override with:

   ```bash
   export SKILLCHAIN_IPFS_API=http://localhost:5001
   ```

4. Verify:

   ```bash
   skillchain ipfs status
   ```

   Expected output:

   ```
   Provider:   local
   Gateway:    http://localhost:5001/ipfs/
   Status:     connected
   Can upload: yes
   ```

## Option 3: Public Gateway (Read-Only)

No setup needed. When neither Pinata keys nor a local node are detected,
the SDK falls back to public IPFS gateways for downloads. Skills can be
**downloaded** but not **published**.

```bash
skillchain ipfs status
```

```
Provider:   public
Gateway:    https://gateway.pinata.cloud/ipfs/
Status:     connected
Can upload: no (read-only)
```

## Forcing a Specific Provider

Override auto-detection with:

```bash
export SKILLCHAIN_IPFS_PROVIDER=pinata   # or "local" or "public"
```

## CLI Commands

| Command                          | Description                        |
|----------------------------------|------------------------------------|
| `skillchain ipfs status`         | Show provider, gateway, pin count  |
| `skillchain ipfs upload <path>`  | Upload file or directory, get CID  |
| `skillchain ipfs download <cid>` | Download content by CID            |
| `skillchain ipfs pin <cid>`      | Pin content for persistence        |
| `skillchain ipfs unpin <cid>`    | Remove a pin                       |

## Gateway Configuration

Override the default read gateway:

```bash
export SKILLCHAIN_IPFS_GATEWAY=https://my-gateway.example.com/ipfs/
```

## Troubleshooting

- **"Cannot upload: public gateways are read-only"** -- Set Pinata keys
  or start a local IPFS daemon.
- **Timeouts on download** -- The SDK retries up to 3 times with
  exponential backoff and falls through multiple gateways automatically.
- **CID verification warnings** -- These are non-fatal. Full CID
  verification requires the `multihash` Python package (optional).
