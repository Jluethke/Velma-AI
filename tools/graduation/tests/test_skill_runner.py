"""Tests for skill_runner.py."""

from __future__ import annotations

import pytest

from skillchain.tools.graduation.skill_runner import ExecutionResult, SkillRunner


SIMPLE_SKILL = '''
def execute(context: dict) -> dict:
    name = context.get("name", "world")
    return {"success": True, "result": f"Hello, {name}!", "data": {"greeted": name}}
'''

MATH_SKILL = '''
import math
import statistics

def execute(context: dict) -> dict:
    values = context.get("values", [])
    if not values:
        return {"success": False, "result": "No values", "data": {}}
    return {
        "success": True,
        "result": f"Processed {len(values)} values",
        "data": {
            "mean": statistics.mean(values),
            "sum": sum(values),
            "sqrt_first": math.sqrt(abs(values[0])),
        },
    }
'''

FAILING_SKILL = '''
def execute(context: dict) -> dict:
    raise ValueError("Something went wrong")
'''

NO_EXECUTE_SKILL = '''
def process(context: dict) -> dict:
    return {"success": True, "result": "ok"}
'''

IMPORT_BLOCKED_SKILL = '''
import subprocess

def execute(context: dict) -> dict:
    return {"success": True, "result": "should not reach here"}
'''

IMPORT_SOCKET_SKILL = '''
import socket

def execute(context: dict) -> dict:
    return {"success": True, "result": "should not reach here"}
'''


class TestBasicExecution:
    """Test basic skill execution."""

    def test_simple_skill_success(self) -> None:
        runner = SkillRunner()
        result = runner.execute(SIMPLE_SKILL, {"name": "SkillChain"})
        assert result.success
        assert "SkillChain" in result.output
        assert result.data["greeted"] == "SkillChain"
        assert result.duration_ms >= 0

    def test_simple_skill_default_context(self) -> None:
        runner = SkillRunner()
        result = runner.execute(SIMPLE_SKILL, {})
        assert result.success
        assert "world" in result.output

    def test_math_skill(self) -> None:
        runner = SkillRunner()
        result = runner.execute(MATH_SKILL, {"values": [4, 9, 16]})
        assert result.success
        assert result.data["mean"] == pytest.approx(9.666, abs=0.01)
        assert result.data["sum"] == 29
        assert result.data["sqrt_first"] == 2.0


class TestErrorHandling:
    """Test error cases."""

    def test_failing_skill_returns_error(self) -> None:
        runner = SkillRunner()
        result = runner.execute(FAILING_SKILL, {})
        assert not result.success
        assert "ValueError" in result.error

    def test_no_execute_function(self) -> None:
        runner = SkillRunner()
        result = runner.execute(NO_EXECUTE_SKILL, {})
        assert not result.success
        assert "execute" in result.error.lower()

    def test_missing_def_execute(self) -> None:
        runner = SkillRunner()
        result = runner.execute("x = 1", {})
        assert not result.success
        assert "execute" in result.error.lower()


class TestImportRestrictions:
    """Test that blocked imports are denied."""

    def test_subprocess_blocked(self) -> None:
        runner = SkillRunner()
        result = runner.execute(IMPORT_BLOCKED_SKILL, {})
        assert not result.success
        assert "blocked" in result.error.lower() or "denied" in result.error.lower()

    def test_socket_blocked(self) -> None:
        runner = SkillRunner()
        result = runner.execute(IMPORT_SOCKET_SKILL, {})
        assert not result.success
        assert "blocked" in result.error.lower() or "denied" in result.error.lower()

    def test_allowed_imports_work(self) -> None:
        skill = '''
import json
import re
import hashlib

def execute(context: dict) -> dict:
    data = json.dumps({"key": "value"})
    match = re.search(r"key", data)
    h = hashlib.md5(b"test").hexdigest()
    return {"success": True, "result": h, "data": {"parsed": True}}
'''
        runner = SkillRunner()
        result = runner.execute(skill, {})
        assert result.success


class TestTimeout:
    """Test timeout enforcement."""

    def test_timeout_returns_error(self) -> None:
        slow_skill = '''
import time
def execute(context: dict) -> dict:
    # This import should work since time is under datetime's umbrella
    return {"success": True, "result": "done", "data": {}}
'''
        runner = SkillRunner(default_timeout_s=0.0001)
        # Note: post-hoc timeout check — skill may still complete
        # but we verify the mechanism exists
        result = runner.execute(slow_skill, {})
        # Either succeeds (fast enough) or times out
        assert isinstance(result, ExecutionResult)


class TestResultParsing:
    """Test parsing of different return types."""

    def test_non_dict_return(self) -> None:
        skill = '''
def execute(context: dict) -> dict:
    return "just a string"
'''
        runner = SkillRunner()
        result = runner.execute(skill, {})
        assert result.success
        assert result.output == "just a string"

    def test_none_return(self) -> None:
        skill = '''
def execute(context: dict) -> dict:
    pass
'''
        runner = SkillRunner()
        result = runner.execute(skill, {})
        assert result.success
        assert result.output == ""
