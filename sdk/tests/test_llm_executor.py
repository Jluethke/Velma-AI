# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Proprietary and Confidential.

"""Tests for LLMStepExecutor."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from skillchain.sdk.exceptions import SkillChainError
from skillchain.sdk.llm_executor import (
    LLMStepExecutor,
    _parse_response,
    _resolve_skill,
)
from skillchain.sdk.skill_chain import SkillChain, SkillStep


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------

class TestParseResponse:
    """Test JSON extraction from LLM responses."""

    def test_json_code_fence(self):
        text = 'Here is the result:\n\n```json\n{"meals": ["pasta", "salad"]}\n```\n\nDone.'
        result = _parse_response(text)
        assert result == {"meals": ["pasta", "salad"]}

    def test_raw_json(self):
        text = '{"budget": 500, "categories": ["food", "rent"]}'
        result = _parse_response(text)
        assert result == {"budget": 500, "categories": ["food", "rent"]}

    def test_plain_text_fallback(self):
        text = "I could not produce JSON because the input was unclear."
        result = _parse_response(text)
        assert result == {"result": text}

    def test_json_fence_with_nested_objects(self):
        obj = {"plan": {"week1": ["task1"], "week2": ["task2"]}, "total": 14}
        text = f"Output:\n```json\n{json.dumps(obj, indent=2)}\n```"
        result = _parse_response(text)
        assert result == obj

    def test_malformed_json_in_fence_falls_through(self):
        text = '```json\n{invalid json here}\n```'
        result = _parse_response(text)
        assert "result" in result  # fell through to plain text

    def test_json_with_leading_text(self):
        text = 'Sure! {"answer": 42}'
        result = _parse_response(text)
        # Not valid — starts with "Sure", not "{"
        assert result == {"result": text}

    def test_empty_response(self):
        result = _parse_response("")
        assert result == {"result": ""}


# ---------------------------------------------------------------------------
# Skill resolution
# ---------------------------------------------------------------------------

class TestSkillResolver:
    """Test skill.md filesystem resolution."""

    def test_marketplace_resolution(self):
        content = _resolve_skill("daily-planner")
        assert content is not None
        assert "Daily Planner" in content

    def test_unknown_skill_returns_none(self):
        content = _resolve_skill("nonexistent-skill-xyz-999")
        assert content is None

    def test_meal_planner_exists(self):
        content = _resolve_skill("meal-planner")
        assert content is not None
        assert "Meal Planner" in content

    def test_scam_detector_exists(self):
        content = _resolve_skill("scam-detector")
        assert content is not None


# ---------------------------------------------------------------------------
# Prompt building
# ---------------------------------------------------------------------------

class TestPromptBuilding:
    """Test that prompts are constructed correctly."""

    def _make_executor(self):
        """Create executor with a mock API key (doesn't call LLM)."""
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test-fake"}):
            with patch("skillchain.sdk.llm_executor.LLMStepExecutor._init_sdk_client"):
                return LLMStepExecutor()

    def test_basic_prompt_includes_skill_and_context(self):
        executor = self._make_executor()
        step = SkillStep(skill_name="daily-planner", alias="planner")
        prompt = executor._build_prompt(
            step,
            "# Daily Planner\nPlans your day.",
            {"tasks": ["buy groceries"]},
        )
        assert "Daily Planner" in prompt
        assert "buy groceries" in prompt
        assert "```json" in prompt

    def test_phase_filter_included(self):
        executor = self._make_executor()
        step = SkillStep(
            skill_name="daily-planner",
            alias="planner",
            phase_filter=["OBSERVE", "REASON"],
        )
        prompt = executor._build_prompt(step, "# Skill", {"x": 1})
        assert "OBSERVE" in prompt
        assert "REASON" in prompt
        assert "Execute only these phases" in prompt

    def test_step_config_included(self):
        executor = self._make_executor()
        step = SkillStep(
            skill_name="email-writer",
            alias="email",
            config={"tone": "professional"},
        )
        prompt = executor._build_prompt(step, "# Skill", {})
        assert "professional" in prompt

    def test_internal_keys_stripped_from_context(self):
        executor = self._make_executor()
        step = SkillStep(skill_name="x", alias="x")
        prompt = executor._build_prompt(
            step, "# Skill",
            {"user_data": "keep", "_skill": "strip", "_alias": "strip", "processed": True},
        )
        assert "user_data" in prompt
        assert "_skill" not in prompt
        assert "_alias" not in prompt


# ---------------------------------------------------------------------------
# Executor with mocked LLM
# ---------------------------------------------------------------------------

class TestExecutorRun:
    """Test the full run() method with a mocked LLM."""

    def _make_executor_with_mock_llm(self, response_text: str):
        """Create an executor that returns a canned response."""
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test-fake"}):
            with patch("skillchain.sdk.llm_executor.LLMStepExecutor._init_sdk_client"):
                executor = LLMStepExecutor()
                executor._call_llm = MagicMock(return_value=response_text)
                return executor

    def test_successful_run(self):
        response = '```json\n{"schedule": ["9am: meeting", "10am: deep work"]}\n```'
        executor = self._make_executor_with_mock_llm(response)
        step = SkillStep(skill_name="daily-planner", alias="planner")

        result = executor.run(step, {"tasks": ["meeting", "deep work"]})

        assert result["schedule"] == ["9am: meeting", "10am: deep work"]
        assert result["_skill"] == "daily-planner"
        assert result["_alias"] == "planner"

    def test_unknown_skill_raises(self):
        executor = self._make_executor_with_mock_llm("")
        step = SkillStep(skill_name="totally-fake-skill", alias="fake")

        with pytest.raises(SkillChainError, match="not found"):
            executor.run(step, {})

    def test_plain_text_response_graceful(self):
        executor = self._make_executor_with_mock_llm("I did the thing but no JSON sorry")
        step = SkillStep(skill_name="daily-planner", alias="planner")

        result = executor.run(step, {})
        assert "result" in result
        assert "no JSON" in result["result"]

    def test_metadata_tags_added(self):
        executor = self._make_executor_with_mock_llm('{"output": "done"}')
        step = SkillStep(skill_name="meal-planner", alias="meals")

        result = executor.run(step, {})
        assert result["_skill"] == "meal-planner"
        assert result["_alias"] == "meals"


# ---------------------------------------------------------------------------
# Chain integration
# ---------------------------------------------------------------------------

class TestChainIntegration:
    """Test LLMStepExecutor integrated into a SkillChain."""

    def test_chain_with_mocked_executor(self):
        chain = SkillChain("test-chain", description="Test")
        chain.add("daily-planner", alias="plan")
        chain.add("meal-planner", alias="meals", depends_on="plan")

        call_count = 0

        def mock_llm(prompt):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return '```json\n{"schedule": "planned"}\n```'
            return '```json\n{"meals": "chicken monday"}\n```'

        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-test-fake"}):
            with patch("skillchain.sdk.llm_executor.LLMStepExecutor._init_sdk_client"):
                executor = LLMStepExecutor()
                executor._call_llm = MagicMock(side_effect=mock_llm)
                chain.set_executor(executor)

        result = chain.execute(initial_context={"user": "test"})
        assert result.success
        assert len(result.steps) == 2
        assert result.steps[0].status == "completed"
        assert result.steps[1].status == "completed"
        # Downstream step should have received upstream data
        assert "schedule" in result.final_output or "meals" in result.final_output


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class TestAuth:
    """Test credential resolution."""

    def test_no_credentials_raises(self):
        with patch.dict("os.environ", {}, clear=True):
            os.environ.pop("ANTHROPIC_API_KEY", None)
            with patch("skillchain.sdk.llm_executor._find_oauth_token", return_value=None):
                with pytest.raises(SkillChainError, match="No API credentials"):
                    LLMStepExecutor()

    def test_api_key_from_env(self):
        with patch.dict("os.environ", {"ANTHROPIC_API_KEY": "sk-ant-test123"}):
            with patch("skillchain.sdk.llm_executor.LLMStepExecutor._init_sdk_client"):
                executor = LLMStepExecutor()
                assert executor._api_key == "sk-ant-test123"

    def test_oauth_fallback(self):
        with patch.dict("os.environ", {}, clear=True):
            os.environ.pop("ANTHROPIC_API_KEY", None)
            with patch("skillchain.sdk.llm_executor._find_oauth_token", return_value="oat-test-token"):
                executor = LLMStepExecutor()
                assert executor._oauth_token == "oat-test-token"


import os
