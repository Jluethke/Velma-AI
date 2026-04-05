"""
test_ipfs_client.py
===================

Tests for the multi-backend IPFS client.

Covers:
- Provider auto-detection (pinata / local / public)
- Upload and download with mocked HTTP responses
- CID validation and content verification
- Gateway fallback chain
- Timeout and retry handling
- Pin / unpin operations
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
import requests

from skillchain.sdk.ipfs_client import IPFSClient, PUBLIC_GATEWAYS
from skillchain.sdk.exceptions import IPFSError


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _env_clean(monkeypatch):
    """Remove IPFS-related env vars so tests start clean."""
    for key in (
        "PINATA_API_KEY", "PINATA_SECRET_KEY",
        "SKILLCHAIN_IPFS_PROVIDER", "SKILLCHAIN_IPFS_API",
        "SKILLCHAIN_IPFS_GATEWAY",
    ):
        monkeypatch.delenv(key, raising=False)


def _mock_response(status=200, json_data=None, content=b"", text=""):
    resp = MagicMock(spec=requests.Response)
    resp.status_code = status
    resp.content = content
    resp.text = text or content.decode("utf-8", errors="replace")
    resp.json.return_value = json_data or {}
    resp.raise_for_status = MagicMock()
    if status >= 400:
        resp.raise_for_status.side_effect = requests.HTTPError(response=resp)
    return resp


# ---------------------------------------------------------------------------
# Provider auto-detection
# ---------------------------------------------------------------------------

class TestProviderDetection:
    def test_pinata_detected_from_env(self, monkeypatch):
        _env_clean(monkeypatch)
        monkeypatch.setenv("PINATA_API_KEY", "test_key")
        monkeypatch.setenv("PINATA_SECRET_KEY", "test_secret")
        client = IPFSClient()
        assert client.provider == "pinata"

    def test_pinata_explicit(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(
            provider="pinata",
            api_key="k", secret_key="s",
        )
        assert client.provider == "pinata"

    def test_local_detected_when_daemon_running(self, monkeypatch):
        _env_clean(monkeypatch)
        with patch.object(IPFSClient, "_probe_local", return_value=True):
            client = IPFSClient()
            assert client.provider == "local"

    def test_public_fallback(self, monkeypatch):
        _env_clean(monkeypatch)
        with patch.object(IPFSClient, "_probe_local", return_value=False):
            client = IPFSClient()
            assert client.provider == "public"

    def test_explicit_provider_overrides_env(self, monkeypatch):
        _env_clean(monkeypatch)
        monkeypatch.setenv("PINATA_API_KEY", "k")
        monkeypatch.setenv("PINATA_SECRET_KEY", "s")
        client = IPFSClient(provider="public")
        assert client.provider == "public"

    def test_env_provider_var(self, monkeypatch):
        _env_clean(monkeypatch)
        monkeypatch.setenv("SKILLCHAIN_IPFS_PROVIDER", "local")
        client = IPFSClient()
        assert client.provider == "local"

    def test_can_upload_pinata(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")
        assert client.can_upload is True

    def test_cannot_upload_public(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public")
        assert client.can_upload is False


# ---------------------------------------------------------------------------
# Upload tests
# ---------------------------------------------------------------------------

class TestUpload:
    def test_upload_pinata(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")

        mock_resp = _mock_response(json_data={"IpfsHash": "QmTestCid123"})
        with patch.object(client._session, "post", return_value=mock_resp):
            cid = client.upload(b"hello world", filename="test.txt")
            assert cid == "QmTestCid123"

    def test_upload_local(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="local")

        mock_resp = _mock_response(json_data={"Hash": "bafy_local_cid"})
        with patch.object(client._session, "post", return_value=mock_resp):
            cid = client.upload(b"local content")
            assert cid == "bafy_local_cid"

    def test_upload_public_raises(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public")
        with pytest.raises(IPFSError, match="read-only"):
            client.upload(b"data")

    def test_upload_file(self, monkeypatch, tmp_path):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")

        f = tmp_path / "skill.skillpack"
        f.write_bytes(b"skillpack data")

        mock_resp = _mock_response(json_data={"IpfsHash": "QmFileCid"})
        with patch.object(client._session, "post", return_value=mock_resp):
            cid = client.upload_file(f)
            assert cid == "QmFileCid"

    def test_upload_file_not_found(self, monkeypatch, tmp_path):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")
        with pytest.raises(IPFSError, match="not found"):
            client.upload_file(tmp_path / "nonexistent.zip")

    def test_upload_no_cid_in_response(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s", retries=1)
        mock_resp = _mock_response(json_data={"status": "ok"})  # no IpfsHash
        with patch.object(client._session, "post", return_value=mock_resp):
            with pytest.raises(IPFSError, match="No CID"):
                client.upload(b"data")


# ---------------------------------------------------------------------------
# Directory upload tests
# ---------------------------------------------------------------------------

class TestDirectoryUpload:
    def test_upload_directory_pinata(self, monkeypatch, tmp_path):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")

        (tmp_path / "a.txt").write_text("file a")
        (tmp_path / "sub").mkdir()
        (tmp_path / "sub" / "b.txt").write_text("file b")

        mock_resp = _mock_response(json_data={"IpfsHash": "QmDirCid"})
        with patch.object(client._session, "post", return_value=mock_resp):
            cid = client.upload_directory(tmp_path)
            assert cid == "QmDirCid"

    def test_upload_directory_local(self, monkeypatch, tmp_path):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="local")

        (tmp_path / "file.txt").write_text("content")

        ndjson = '{"Hash":"bafy_file","Name":"file.txt"}\n{"Hash":"bafy_dir","Name":""}\n'
        mock_resp = _mock_response(text=ndjson)
        mock_resp.json.return_value = {"Hash": "bafy_dir", "Name": ""}
        with patch.object(client._session, "post", return_value=mock_resp):
            cid = client.upload_directory(tmp_path)
            assert cid == "bafy_dir"

    def test_upload_empty_directory_raises(self, monkeypatch, tmp_path):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")
        empty = tmp_path / "empty"
        empty.mkdir()
        with pytest.raises(IPFSError, match="Empty directory"):
            client.upload_directory(empty)

    def test_upload_directory_not_a_dir(self, monkeypatch, tmp_path):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")
        f = tmp_path / "file.txt"
        f.write_text("not a dir")
        with pytest.raises(IPFSError, match="Not a directory"):
            client.upload_directory(f)

    def test_upload_directory_public_raises(self, monkeypatch, tmp_path):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public")
        (tmp_path / "f.txt").write_text("x")
        with pytest.raises(IPFSError, match="read-only"):
            client.upload_directory(tmp_path)


# ---------------------------------------------------------------------------
# Download tests
# ---------------------------------------------------------------------------

class TestDownload:
    def test_download_from_configured_gateway(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public")

        mock_resp = _mock_response(content=b"skill content")
        with patch.object(client._session, "get", return_value=mock_resp):
            data = client.download("QmValidCid")
            assert data == b"skill content"

    def test_download_fallback_chain(self, monkeypatch):
        """First gateway fails, second succeeds."""
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public", retries=1)

        fail_resp = _mock_response(status=503)
        ok_resp = _mock_response(content=b"found it")

        call_count = 0
        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise requests.ConnectionError("gateway down")
            return ok_resp

        with patch.object(client._session, "get", side_effect=side_effect):
            data = client.download("QmFallbackTest")
            assert data == b"found it"
            assert call_count >= 2

    def test_download_all_gateways_fail(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public", retries=1)

        with patch.object(
            client._session, "get",
            side_effect=requests.ConnectionError("all down"),
        ):
            with pytest.raises(IPFSError, match="Download failed"):
                client.download("QmNoGateway")

    def test_download_empty_content_raises(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public", retries=1)

        mock_resp = _mock_response(content=b"")
        with patch.object(client._session, "get", return_value=mock_resp):
            with pytest.raises(IPFSError, match="Empty content"):
                client.download("QmEmptyCid")

    def test_download_to_file(self, monkeypatch, tmp_path):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public")

        mock_resp = _mock_response(content=b"file data")
        with patch.object(client._session, "get", return_value=mock_resp):
            out = tmp_path / "out.bin"
            result = client.download_to("QmToFile", out)
            assert result == out
            assert out.read_bytes() == b"file data"

    def test_download_local_prepends_local_gateway(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="local", local_api="http://localhost:5001")

        mock_resp = _mock_response(content=b"local data")
        urls_called = []

        original_get = client._session.get
        def track_get(url, **kwargs):
            urls_called.append(url)
            return mock_resp

        with patch.object(client._session, "get", side_effect=track_get):
            data = client.download("QmLocalTest")
            assert data == b"local data"
            assert any("localhost:5001" in u for u in urls_called)


# ---------------------------------------------------------------------------
# CID validation
# ---------------------------------------------------------------------------

class TestCIDValidation:
    def test_empty_cid(self):
        with pytest.raises(IPFSError, match="Empty"):
            IPFSClient._validate_cid("")

    def test_none_cid(self):
        with pytest.raises(IPFSError):
            IPFSClient._validate_cid(None)

    def test_path_traversal_with_slash(self):
        # Slash is caught first as invalid character
        with pytest.raises(IPFSError, match="Invalid characters"):
            IPFSClient._validate_cid("Qm../etc/passwd")

    def test_path_traversal_without_slash(self):
        with pytest.raises(IPFSError, match="Suspicious"):
            IPFSClient._validate_cid("Qm..abcdef")

    def test_slash_in_cid(self):
        with pytest.raises(IPFSError, match="Invalid characters"):
            IPFSClient._validate_cid("Qm/injected/path")

    def test_query_string(self):
        with pytest.raises(IPFSError, match="Invalid characters"):
            IPFSClient._validate_cid("QmValid?evil=true")

    def test_too_long_cid(self):
        with pytest.raises(IPFSError, match="too long"):
            IPFSClient._validate_cid("Q" * 200)

    def test_valid_cidv0(self):
        IPFSClient._validate_cid("QmYwAPJzv5CZsnN625s3Xf2nemtYgPpHdWEz79ojWnPbdG")

    def test_valid_cidv1(self):
        IPFSClient._validate_cid("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi")


# ---------------------------------------------------------------------------
# Content verification
# ---------------------------------------------------------------------------

class TestVerification:
    def test_verify_non_empty_data(self):
        assert IPFSClient._verify_cid(b"hello", "QmTest") is True

    def test_verify_empty_data_fails(self):
        assert IPFSClient._verify_cid(b"", "QmTest") is False

    def test_verify_content_hash_match(self):
        import hashlib
        data = b"test data"
        h = hashlib.sha256(data).hexdigest()
        assert IPFSClient.verify_content_hash(data, h) is True

    def test_verify_content_hash_mismatch(self):
        assert IPFSClient.verify_content_hash(b"test", "badhash") is False


# ---------------------------------------------------------------------------
# Pin / unpin
# ---------------------------------------------------------------------------

class TestPinning:
    def test_pin_pinata(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")
        mock_resp = _mock_response()
        with patch.object(client._session, "post", return_value=mock_resp):
            assert client.pin("QmTestPin") is True

    def test_pin_local(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="local")
        mock_resp = _mock_response()
        with patch.object(client._session, "post", return_value=mock_resp):
            assert client.pin("QmLocalPin") is True

    def test_pin_public_returns_false(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public")
        assert client.pin("QmNoPinPublic") is False

    def test_unpin_pinata(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")
        mock_resp = _mock_response()
        with patch.object(client._session, "delete", return_value=mock_resp):
            assert client.unpin("QmTestUnpin") is True

    def test_unpin_local(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="local")
        mock_resp = _mock_response()
        with patch.object(client._session, "post", return_value=mock_resp):
            assert client.unpin("QmLocalUnpin") is True

    def test_unpin_public_returns_false(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public")
        assert client.unpin("QmNope") is False

    def test_pin_failure_returns_false(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")
        with patch.object(
            client._session, "post",
            side_effect=requests.ConnectionError("down"),
        ):
            assert client.pin("QmFail") is False


# ---------------------------------------------------------------------------
# Availability / status
# ---------------------------------------------------------------------------

class TestAvailability:
    def test_is_available_pinata(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")
        mock_resp = _mock_response()
        with patch.object(client._session, "get", return_value=mock_resp):
            assert client.is_available() is True

    def test_is_available_local(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="local")
        with patch.object(client, "_probe_local", return_value=True):
            assert client.is_available() is True

    def test_not_available_when_down(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")
        with patch.object(
            client._session, "get",
            side_effect=requests.ConnectionError("down"),
        ):
            assert client.is_available() is False

    def test_pin_count_pinata(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s")
        mock_resp = _mock_response(json_data={"count": 42})
        with patch.object(client._session, "get", return_value=mock_resp):
            assert client.pin_count() == 42

    def test_pin_count_local(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="local")
        mock_resp = _mock_response(json_data={"Keys": {"cid1": {}, "cid2": {}}})
        with patch.object(client._session, "post", return_value=mock_resp):
            assert client.pin_count() == 2

    def test_pin_count_public_returns_negative(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="public")
        assert client.pin_count() == -1


# ---------------------------------------------------------------------------
# Retry behaviour
# ---------------------------------------------------------------------------

class TestRetry:
    def test_upload_retries_on_failure(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s", retries=3)

        call_count = 0
        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise requests.ConnectionError("transient")
            return _mock_response(json_data={"IpfsHash": "QmRetried"})

        with patch.object(client._session, "post", side_effect=side_effect):
            cid = client.upload(b"retry data")
            assert cid == "QmRetried"
            assert call_count == 3

    def test_upload_exhausts_retries(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(provider="pinata", api_key="k", secret_key="s", retries=2)

        with patch.object(
            client._session, "post",
            side_effect=requests.ConnectionError("always fails"),
        ):
            with pytest.raises(IPFSError, match="failed after"):
                client.upload(b"doomed")


# ---------------------------------------------------------------------------
# Legacy / backward compatibility
# ---------------------------------------------------------------------------

class TestLegacyCompat:
    def test_legacy_api_url_kwarg(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(
            provider="pinata",
            api_key="k", secret_key="s",
            api_url="https://custom-pinata.example.com",
        )
        assert client._pinata_api == "https://custom-pinata.example.com"

    def test_legacy_gateway_url_kwarg(self, monkeypatch):
        _env_clean(monkeypatch)
        client = IPFSClient(
            provider="public",
            gateway_url="https://my-gw.example.com/ipfs/",
        )
        assert client._gateway == "https://my-gw.example.com/ipfs/"
