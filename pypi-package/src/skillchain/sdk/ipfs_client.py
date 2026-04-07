"""
ipfs_client.py
==============

IPFS client for uploading, downloading, and pinning skill content.

Supports three backends:

1. **Pinata** (managed IPFS) -- for production use.  Requires
   ``PINATA_API_KEY`` and ``PINATA_SECRET_KEY`` environment variables.
2. **Local IPFS node** -- for development.  Connects to the Kubo HTTP
   API at ``http://localhost:5001`` (override with ``SKILLCHAIN_IPFS_API``).
3. **Public gateways** -- read-only fallback (ipfs.io, dweb.link, etc.).

Provider selection::

    SKILLCHAIN_IPFS_PROVIDER = "pinata" | "local" | "public" | "auto"

When set to ``auto`` (the default), the client probes in order:
Pinata env vars -> local daemon -> public gateways.

Usage::

    client = IPFSClient()          # auto-detect
    cid = client.upload(skill_bytes)
    data = client.download(cid)
"""

from __future__ import annotations

import hashlib
import json
import logging
import mimetypes
import os
import time
from pathlib import Path
from typing import List, Optional

import requests

from .exceptions import IPFSError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Public IPFS gateways for fallback reads
# ---------------------------------------------------------------------------

PUBLIC_GATEWAYS: List[str] = [
    "https://gateway.pinata.cloud/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
]

# Retry configuration
DEFAULT_RETRIES = 3
RETRY_BACKOFF = 1.0  # seconds, doubled on each retry


class IPFSClient:
    """Multi-backend IPFS client.

    Auto-detects the best available backend unless *provider* is given
    explicitly.

    Args:
        provider: ``"pinata"``, ``"local"``, ``"public"``, or ``"auto"``
            (default).  ``"auto"`` probes in order: Pinata -> local -> public.
        api_key: Pinata API key (falls back to ``PINATA_API_KEY`` env var).
        secret_key: Pinata secret key (falls back to
            ``PINATA_SECRET_KEY`` env var).
        gateway: IPFS gateway URL for reads.  Defaults to Pinata gateway
            or ``SKILLCHAIN_IPFS_GATEWAY`` env var.
        local_api: Local IPFS node API URL.  Defaults to
            ``SKILLCHAIN_IPFS_API`` or ``http://localhost:5001``.
        timeout: Per-request timeout in seconds.
        retries: Number of retry attempts for transient failures.
    """

    def __init__(
        self,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        gateway: Optional[str] = None,
        local_api: Optional[str] = None,
        timeout: int = 60,
        retries: int = DEFAULT_RETRIES,
        # Legacy kwargs for backward compatibility with old call-sites
        api_url: Optional[str] = None,
        gateway_url: Optional[str] = None,
    ) -> None:
        # Resolve env vars -------------------------------------------------
        self._api_key = api_key or os.environ.get("PINATA_API_KEY", "")
        self._secret_key = secret_key or os.environ.get("PINATA_SECRET_KEY", "")
        self._local_api = (
            local_api
            or os.environ.get("SKILLCHAIN_IPFS_API", "")
            or "http://localhost:5001"
        ).rstrip("/")

        # Gateway: explicit > env > default
        self._gateway = (
            gateway
            or gateway_url  # legacy kwarg
            or os.environ.get("SKILLCHAIN_IPFS_GATEWAY", "")
            or "https://gateway.pinata.cloud/ipfs/"
        )
        if not self._gateway.endswith("/"):
            self._gateway += "/"

        # Pinata API base (support legacy api_url kwarg)
        self._pinata_api = (api_url or "https://api.pinata.cloud").rstrip("/")

        self._timeout = timeout
        self._retries = retries
        self._session = requests.Session()

        # Detect provider ---------------------------------------------------
        requested = (
            provider
            or os.environ.get("SKILLCHAIN_IPFS_PROVIDER", "")
            or "auto"
        ).lower()
        self._provider = self._resolve_provider(requested)

        logger.info("IPFS client initialised: provider=%s", self._provider)

    # ------------------------------------------------------------------
    # Provider resolution
    # ------------------------------------------------------------------

    def _resolve_provider(self, requested: str) -> str:
        """Return the concrete provider name after probing if needed."""
        if requested in ("pinata", "local", "public"):
            return requested
        # "auto" -- probe in order
        if self._api_key and self._secret_key:
            return "pinata"
        if self._probe_local():
            return "local"
        return "public"

    def _probe_local(self) -> bool:
        """Return True if a local IPFS daemon is reachable."""
        try:
            resp = self._session.post(
                f"{self._local_api}/api/v0/id",
                timeout=3,
            )
            return resp.status_code == 200
        except Exception:
            return False

    # ------------------------------------------------------------------
    # Headers helpers
    # ------------------------------------------------------------------

    def _pinata_headers(self) -> dict:
        """Return Pinata auth headers."""
        return {
            "pinata_api_key": self._api_key,
            "pinata_secret_api_key": self._secret_key,
        }

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    def upload(self, data: bytes, filename: str = "skillpack") -> str:
        """Upload raw bytes to IPFS.

        Args:
            data: Raw content bytes.
            filename: Display name for the pin.

        Returns:
            IPFS CID string.

        Raises:
            IPFSError: On upload failure or if provider is read-only.
        """
        if self._provider == "public":
            raise IPFSError(
                "Cannot upload: public gateways are read-only. "
                "Set PINATA_API_KEY/PINATA_SECRET_KEY or run a local IPFS node."
            )
        return self._retry(lambda: self._upload_once(data, filename))

    def _upload_once(self, data: bytes, filename: str) -> str:
        if self._provider == "pinata":
            return self._upload_pinata(data, filename)
        return self._upload_local(data, filename)

    def _upload_pinata(self, data: bytes, filename: str) -> str:
        metadata = json.dumps({
            "name": filename,
            "keyvalues": {"source": "skillchain"},
        })
        resp = self._session.post(
            f"{self._pinata_api}/pinning/pinFileToIPFS",
            files={"file": (filename, data)},
            headers=self._pinata_headers(),
            data={
                "pinataMetadata": metadata,
                "pinataOptions": json.dumps({"cidVersion": 1}),
            },
            timeout=self._timeout,
        )
        resp.raise_for_status()
        cid = resp.json().get("IpfsHash")
        if not cid:
            raise IPFSError("No CID in Pinata upload response")
        logger.info("Uploaded to Pinata: %s (%d bytes)", cid, len(data))
        return cid

    def _upload_local(self, data: bytes, filename: str) -> str:
        resp = self._session.post(
            f"{self._local_api}/api/v0/add",
            files={"file": (filename, data)},
            params={"cid-version": "1"},
            timeout=self._timeout,
        )
        resp.raise_for_status()
        result = resp.json()
        cid = result.get("Hash")
        if not cid:
            raise IPFSError("No CID in local IPFS add response")
        logger.info("Uploaded to local IPFS: %s (%d bytes)", cid, len(data))
        return cid

    # -- File upload -------------------------------------------------------

    def upload_file(self, path: Path) -> str:
        """Upload a file to IPFS.

        Args:
            path: Path to the file.

        Returns:
            IPFS CID string.
        """
        path = Path(path)
        if not path.exists():
            raise IPFSError(f"File not found: {path}")
        return self.upload(path.read_bytes(), filename=path.name)

    # -- Directory upload --------------------------------------------------

    def upload_directory(self, path: Path) -> str:
        """Upload a directory to IPFS (as a single pinned DAG).

        Args:
            path: Path to the directory.

        Returns:
            IPFS CID of the directory root.

        Raises:
            IPFSError: On failure or if provider is read-only.
        """
        path = Path(path)
        if not path.is_dir():
            raise IPFSError(f"Not a directory: {path}")

        if self._provider == "public":
            raise IPFSError("Cannot upload directories: public gateways are read-only.")

        return self._retry(lambda: self._upload_directory_once(path))

    def _upload_directory_once(self, path: Path) -> str:
        if self._provider == "pinata":
            return self._upload_directory_pinata(path)
        return self._upload_directory_local(path)

    def _upload_directory_pinata(self, path: Path) -> str:
        files = []
        for file_path in sorted(path.rglob("*")):
            if file_path.is_file():
                rel = file_path.relative_to(path)
                files.append(("file", (str(rel), file_path.read_bytes())))

        if not files:
            raise IPFSError(f"Empty directory: {path}")

        metadata = json.dumps({
            "name": path.name,
            "keyvalues": {"source": "skillchain"},
        })
        resp = self._session.post(
            f"{self._pinata_api}/pinning/pinFileToIPFS",
            files=files,
            headers=self._pinata_headers(),
            data={
                "pinataMetadata": metadata,
                "pinataOptions": json.dumps({
                    "cidVersion": 1,
                    "wrapWithDirectory": True,
                }),
            },
            timeout=self._timeout * 2,
        )
        resp.raise_for_status()
        cid = resp.json().get("IpfsHash")
        if not cid:
            raise IPFSError("No CID in Pinata directory upload response")
        logger.info("Uploaded directory to Pinata: %s (%d files)", cid, len(files))
        return cid

    def _upload_directory_local(self, path: Path) -> str:
        files = []
        for file_path in sorted(path.rglob("*")):
            if file_path.is_file():
                rel = file_path.relative_to(path)
                files.append(("file", (str(rel), file_path.read_bytes())))

        if not files:
            raise IPFSError(f"Empty directory: {path}")

        resp = self._session.post(
            f"{self._local_api}/api/v0/add",
            files=files,
            params={"recursive": "true", "cid-version": "1", "wrap-with-directory": "true"},
            timeout=self._timeout * 2,
        )
        resp.raise_for_status()
        # The local IPFS API returns one JSON object per line (ndjson).
        # The last entry is the wrapping directory.
        lines = resp.text.strip().split("\n")
        last = json.loads(lines[-1])
        cid = last.get("Hash")
        if not cid:
            raise IPFSError("No CID in local IPFS directory add response")
        logger.info("Uploaded directory to local IPFS: %s (%d files)", cid, len(files))
        return cid

    # ------------------------------------------------------------------
    # Download
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_cid(cid: str) -> None:
        """Validate a CID string to prevent SSRF / path injection.

        CIDs are Base32 or Base58 encoded and must not contain
        directory separators, query strings, or fragment identifiers.

        Raises:
            IPFSError: If the CID is invalid.
        """
        if not cid or not isinstance(cid, str):
            raise IPFSError("Empty or invalid CID")
        forbidden = set("/\\?#&= \t\n\r")
        if any(c in forbidden for c in cid):
            raise IPFSError(f"Invalid characters in CID: {cid!r}")
        if ".." in cid:
            raise IPFSError(f"Suspicious CID (contains '..'): {cid!r}")
        if len(cid) > 128:
            raise IPFSError(f"CID too long ({len(cid)} chars): {cid[:32]}...")

    def download(self, cid: str) -> bytes:
        """Download content by CID with gateway fallback.

        Tries the configured gateway first, then public gateways.
        Verifies downloaded content is non-empty and passes basic
        integrity checks.

        Args:
            cid: IPFS content identifier.

        Returns:
            Raw content bytes.

        Raises:
            IPFSError: If all gateways fail or content is empty.
        """
        self._validate_cid(cid)

        # Build ordered gateway list
        gateways = [self._gateway] + [
            gw for gw in PUBLIC_GATEWAYS if gw != self._gateway
        ]

        # For local provider, prepend the local gateway
        if self._provider == "local":
            local_gw = f"{self._local_api}/ipfs/"
            gateways = [local_gw] + gateways

        last_error: Optional[Exception] = None
        for gw in gateways:
            url = f"{gw}{cid}"
            for attempt in range(self._retries):
                try:
                    resp = self._session.get(url, timeout=self._timeout)
                    resp.raise_for_status()
                    data = resp.content
                    if not data:
                        raise IPFSError(f"Empty content for CID {cid}")
                    if not self._verify_cid(data, cid):
                        logger.warning(
                            "CID verification uncertain for %s (non-fatal)", cid
                        )
                    logger.info(
                        "Downloaded from %s: %s (%d bytes)", gw, cid, len(data)
                    )
                    return data
                except requests.RequestException as exc:
                    last_error = exc
                    logger.debug(
                        "Gateway %s attempt %d failed for %s: %s",
                        gw, attempt + 1, cid, exc,
                    )
                    if attempt < self._retries - 1:
                        time.sleep(RETRY_BACKOFF * (2 ** attempt))
                    continue
                except IPFSError:
                    raise

        raise IPFSError(f"Download failed for CID {cid}: {last_error}") from last_error

    def download_to(self, cid: str, path: Path) -> Path:
        """Download content to a local file.

        Args:
            cid: IPFS content identifier.
            path: Destination file path.

        Returns:
            The written file path.
        """
        data = self.download(cid)
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        logger.info("Saved CID %s to %s", cid, path)
        return path

    # ------------------------------------------------------------------
    # Pin management
    # ------------------------------------------------------------------

    def pin(self, cid: str) -> bool:
        """Pin a CID to ensure persistence.

        Works with Pinata and local IPFS node.  No-op for public
        gateway provider.

        Args:
            cid: IPFS content identifier.

        Returns:
            True if pinned successfully, False otherwise.
        """
        self._validate_cid(cid)

        if self._provider == "public":
            logger.warning("Cannot pin on public gateway")
            return False

        try:
            if self._provider == "pinata":
                resp = self._session.post(
                    f"{self._pinata_api}/pinning/pinByHash",
                    headers=self._pinata_headers(),
                    json={"hashToPin": cid},
                    timeout=self._timeout,
                )
            else:  # local
                resp = self._session.post(
                    f"{self._local_api}/api/v0/pin/add",
                    params={"arg": cid},
                    timeout=self._timeout,
                )
            resp.raise_for_status()
            logger.info("Pinned CID: %s", cid)
            return True
        except requests.RequestException as exc:
            logger.warning("Pin failed for %s: %s", cid, exc)
            return False

    def unpin(self, cid: str) -> bool:
        """Unpin a CID.

        Args:
            cid: IPFS content identifier.

        Returns:
            True if unpinned successfully, False otherwise.
        """
        self._validate_cid(cid)

        if self._provider == "public":
            logger.warning("Cannot unpin on public gateway")
            return False

        try:
            if self._provider == "pinata":
                resp = self._session.delete(
                    f"{self._pinata_api}/pinning/unpin/{cid}",
                    headers=self._pinata_headers(),
                    timeout=self._timeout,
                )
            else:  # local
                resp = self._session.post(
                    f"{self._local_api}/api/v0/pin/rm",
                    params={"arg": cid},
                    timeout=self._timeout,
                )
            resp.raise_for_status()
            logger.info("Unpinned CID: %s", cid)
            return True
        except requests.RequestException as exc:
            logger.warning("Unpin failed for %s: %s", cid, exc)
            return False

    # ------------------------------------------------------------------
    # Status / availability
    # ------------------------------------------------------------------

    def is_available(self) -> bool:
        """Check if the IPFS backend is reachable.

        Returns:
            True if the configured provider responds to a health check.
        """
        try:
            if self._provider == "pinata":
                resp = self._session.get(
                    f"{self._pinata_api}/data/testAuthentication",
                    headers=self._pinata_headers(),
                    timeout=10,
                )
                return resp.status_code == 200
            elif self._provider == "local":
                return self._probe_local()
            else:
                # Public: just try to reach one gateway
                for gw in PUBLIC_GATEWAYS[:2]:
                    try:
                        resp = self._session.head(gw, timeout=5)
                        if resp.status_code < 500:
                            return True
                    except requests.RequestException:
                        continue
                return False
        except Exception:
            return False

    @property
    def provider(self) -> str:
        """The active provider name: ``pinata``, ``local``, or ``public``."""
        return self._provider

    @property
    def can_upload(self) -> bool:
        """Whether the current provider supports uploads."""
        return self._provider != "public"

    def pin_count(self) -> int:
        """Return the number of pinned items (Pinata/local only).

        Returns:
            Pin count, or -1 if unsupported/unavailable.
        """
        try:
            if self._provider == "pinata":
                resp = self._session.get(
                    f"{self._pinata_api}/data/pinList",
                    headers=self._pinata_headers(),
                    params={"status": "pinned", "pageLimit": 1},
                    timeout=self._timeout,
                )
                resp.raise_for_status()
                return resp.json().get("count", 0)
            elif self._provider == "local":
                resp = self._session.post(
                    f"{self._local_api}/api/v0/pin/ls",
                    params={"type": "recursive"},
                    timeout=self._timeout,
                )
                resp.raise_for_status()
                keys = resp.json().get("Keys", {})
                return len(keys)
            return -1
        except Exception:
            return -1

    # ------------------------------------------------------------------
    # Content verification
    # ------------------------------------------------------------------

    @staticmethod
    def _verify_cid(data: bytes, expected_cid: str) -> bool:
        """Best-effort CID verification.

        Full CID verification requires multihash/multicodec parsing.
        Here we do basic sanity checks:
        - Data must be non-empty.
        - SHA-256 hash is computed and cached for consistency checks.
        - CIDv0 (Qm...) and CIDv1 are recognised but not fully decoded
          without the ``multihash`` library.

        Returns:
            True if the data passes basic integrity checks.
        """
        if not data:
            return False
        # Compute SHA-256 for logging / downstream use
        _sha = hashlib.sha256(data).hexdigest()
        # CIDv0 starts with "Qm", CIDv1 starts with "b" (base32) or "z" (base58btc)
        # Without multihash we can only confirm data is non-empty
        return True

    @staticmethod
    def verify_content_hash(data: bytes, expected_hash: str) -> bool:
        """Verify content integrity via SHA-256 hash.

        Args:
            data: Downloaded content bytes.
            expected_hash: Expected hex-encoded SHA-256 hash.

        Returns:
            True if hashes match.
        """
        actual = hashlib.sha256(data).hexdigest()
        return actual == expected_hash

    # ------------------------------------------------------------------
    # Retry helper
    # ------------------------------------------------------------------

    def _retry(self, fn, retries: Optional[int] = None):
        """Execute *fn* with retries and exponential backoff."""
        max_attempts = retries or self._retries
        last_exc: Optional[Exception] = None
        for attempt in range(max_attempts):
            try:
                return fn()
            except (requests.RequestException, IPFSError) as exc:
                last_exc = exc
                if attempt < max_attempts - 1:
                    wait = RETRY_BACKOFF * (2 ** attempt)
                    logger.debug(
                        "Retry %d/%d after %.1fs: %s",
                        attempt + 1, max_attempts, wait, exc,
                    )
                    time.sleep(wait)
        raise IPFSError(f"Operation failed after {max_attempts} attempts: {last_exc}") from last_exc
