"""
ipfs_client.py
==============

IPFS client for uploading, downloading, and pinning skill content.

Supports Pinata-compatible HTTP API as the primary backend, with
fallback to a public IPFS gateway for downloads.  Content-hash
verification ensures integrity on download.

Usage::

    client = IPFSClient("https://api.pinata.cloud", api_key="...")
    cid = client.upload(skill_bytes)
    data = client.download(cid)
"""

from __future__ import annotations

import hashlib
import json
import logging
import mimetypes
from pathlib import Path
from typing import Optional

import requests

from .exceptions import IPFSError

logger = logging.getLogger(__name__)

# Public IPFS gateways for fallback reads
PUBLIC_GATEWAYS = [
    "https://gateway.pinata.cloud/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
]


class IPFSClient:
    """HTTP-based IPFS client targeting Pinata-compatible APIs.

    Args:
        api_url: Pinata API base URL (e.g. ``https://api.pinata.cloud``).
        gateway_url: IPFS gateway for reads (e.g. ``https://gateway.pinata.cloud/ipfs/``).
        api_key: Pinata JWT or API key for authenticated uploads.
        timeout: Request timeout in seconds.
    """

    def __init__(
        self,
        api_url: str = "https://api.pinata.cloud",
        gateway_url: str = "https://gateway.pinata.cloud/ipfs/",
        api_key: Optional[str] = None,
        timeout: int = 60,
    ) -> None:
        self._api_url = api_url.rstrip("/")
        self._gateway_url = gateway_url.rstrip("/") + "/"
        self._api_key = api_key
        self._timeout = timeout
        self._session = requests.Session()

        if api_key:
            self._session.headers["Authorization"] = f"Bearer {api_key}"

    # -- Upload ----------------------------------------------------------------

    def upload(self, data: bytes, name: str = "skillpack") -> str:
        """Upload raw bytes to IPFS.

        Args:
            data: Raw content bytes.
            name: Display name for the pin.

        Returns:
            IPFS CID string.

        Raises:
            IPFSError: On upload failure.
        """
        try:
            resp = self._session.post(
                f"{self._api_url}/pinning/pinFileToIPFS",
                files={"file": (name, data)},
                data={
                    "pinataMetadata": json.dumps({"name": name}),
                    "pinataOptions": json.dumps({"cidVersion": 1}),
                },
                timeout=self._timeout,
            )
            resp.raise_for_status()
            cid = resp.json().get("IpfsHash")
            if not cid:
                raise IPFSError("No CID in upload response")
            logger.info("Uploaded to IPFS: %s (%d bytes)", cid, len(data))
            return cid
        except requests.RequestException as exc:
            raise IPFSError(f"IPFS upload failed: {exc}") from exc

    def upload_file(self, path: Path) -> str:
        """Upload a file to IPFS.

        Args:
            path: Path to the file.

        Returns:
            IPFS CID string.
        """
        if not path.exists():
            raise IPFSError(f"File not found: {path}")

        data = path.read_bytes()
        content_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        return self.upload(data, name=path.name)

    def upload_directory(self, path: Path) -> str:
        """Upload a directory to IPFS (as a single pinned DAG).

        Pinata's ``pinFileToIPFS`` with directory wrapping.

        Args:
            path: Path to the directory.

        Returns:
            IPFS CID of the directory root.
        """
        if not path.is_dir():
            raise IPFSError(f"Not a directory: {path}")

        files = []
        for file_path in sorted(path.rglob("*")):
            if file_path.is_file():
                rel = file_path.relative_to(path)
                files.append(
                    ("file", (str(rel), file_path.read_bytes()))
                )

        if not files:
            raise IPFSError(f"Empty directory: {path}")

        try:
            resp = self._session.post(
                f"{self._api_url}/pinning/pinFileToIPFS",
                files=files,
                data={
                    "pinataMetadata": json.dumps({"name": path.name}),
                    "pinataOptions": json.dumps({"cidVersion": 1, "wrapWithDirectory": True}),
                },
                timeout=self._timeout * 2,
            )
            resp.raise_for_status()
            cid = resp.json().get("IpfsHash")
            if not cid:
                raise IPFSError("No CID in directory upload response")
            logger.info("Uploaded directory to IPFS: %s (%d files)", cid, len(files))
            return cid
        except requests.RequestException as exc:
            raise IPFSError(f"IPFS directory upload failed: {exc}") from exc

    # -- Download --------------------------------------------------------------

    @staticmethod
    def _validate_cid(cid: str) -> None:
        """Validate a CID string to prevent SSRF / path injection.

        CIDs are Base32 or Base58 encoded and should not contain
        directory separators, query strings, or fragment identifiers.

        Raises:
            IPFSError: If the CID is invalid.
        """
        if not cid or not isinstance(cid, str):
            raise IPFSError("Empty or invalid CID")
        # CIDs must be alphanumeric (base32/base58/base36) with no path separators
        forbidden = set("/\\?#&= \t\n\r")
        if any(c in forbidden for c in cid):
            raise IPFSError(f"Invalid characters in CID: {cid!r}")
        if ".." in cid:
            raise IPFSError(f"Suspicious CID (contains '..'): {cid!r}")
        if len(cid) > 128:
            raise IPFSError(f"CID too long ({len(cid)} chars): {cid[:32]}...")

    def download(self, cid: str) -> bytes:
        """Download content by CID.

        Tries the configured gateway first, then falls back to public gateways.

        Args:
            cid: IPFS content identifier.

        Returns:
            Raw content bytes.
        """
        self._validate_cid(cid)
        gateways = [self._gateway_url] + [
            gw for gw in PUBLIC_GATEWAYS if gw != self._gateway_url
        ]

        last_error: Optional[Exception] = None
        for gw in gateways:
            url = f"{gw}{cid}"
            try:
                resp = self._session.get(url, timeout=self._timeout)
                resp.raise_for_status()
                logger.info("Downloaded from IPFS: %s (%d bytes)", cid, len(resp.content))
                return resp.content
            except requests.RequestException as exc:
                last_error = exc
                logger.debug("Gateway %s failed for %s: %s", gw, cid, exc)
                continue

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
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        logger.info("Saved CID %s to %s", cid, path)
        return path

    # -- Pin management --------------------------------------------------------

    def pin(self, cid: str) -> bool:
        """Pin a CID to ensure persistence.

        Args:
            cid: IPFS content identifier.

        Returns:
            True if pinned successfully.
        """
        self._validate_cid(cid)
        try:
            resp = self._session.post(
                f"{self._api_url}/pinning/pinByHash",
                json={"hashToPin": cid},
                timeout=self._timeout,
            )
            resp.raise_for_status()
            return True
        except requests.RequestException as exc:
            logger.warning("Pin failed for %s: %s", cid, exc)
            return False

    def unpin(self, cid: str) -> bool:
        """Unpin a CID.

        Args:
            cid: IPFS content identifier.

        Returns:
            True if unpinned successfully.
        """
        self._validate_cid(cid)
        try:
            resp = self._session.delete(
                f"{self._api_url}/pinning/unpin/{cid}",
                timeout=self._timeout,
            )
            resp.raise_for_status()
            return True
        except requests.RequestException as exc:
            logger.warning("Unpin failed for %s: %s", cid, exc)
            return False

    # -- Verification ----------------------------------------------------------

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
