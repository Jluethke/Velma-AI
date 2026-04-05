"""Tests for skill_composer.py."""

from __future__ import annotations

import pytest

from skillchain.graduation.skill_composer import CompositeSkill, SkillComposer
from skillchain.graduation.skill_runner import SkillRunner


SKILL_A_CODE = '''
def execute(context: dict) -> dict:
    """Produces 'price_data' from a 'ticker' input."""
    ticker = context.get("ticker", "SPY")
    return {
        "success": True,
        "result": f"Fetched {ticker}",
        "data": {"price_data": [100, 101, 102], "ticker_used": ticker},
    }
'''

SKILL_B_CODE = '''
import statistics

def execute(context: dict) -> dict:
    """Consumes 'price_data' and produces 'analysis'."""
    prices = context.get("price_data", [])
    if not prices:
        return {"success": False, "result": "No price data", "data": {}}
    avg = statistics.mean(prices)
    return {
        "success": True,
        "result": f"Average price: {avg}",
        "data": {"analysis": {"mean": avg, "count": len(prices)}},
    }
'''

SKILL_C_CODE = '''
def execute(context: dict) -> dict:
    """Consumes 'analysis' and produces 'report'."""
    analysis = context.get("analysis", {})
    report = f"Report: mean={analysis.get('mean', 'N/A')}"
    return {
        "success": True,
        "result": report,
        "data": {"report": report},
    }
'''


class TestContractInference:
    """Test input/output contract inference from code."""

    def test_infer_inputs_from_context_get(self) -> None:
        composer = SkillComposer()
        contract = composer.register_skill("a", "skill_a", SKILL_A_CODE, "trading")
        assert contract is not None
        assert "ticker" in contract.inputs

    def test_infer_outputs_from_data(self) -> None:
        composer = SkillComposer()
        contract = composer.register_skill("a", "skill_a", SKILL_A_CODE, "trading")
        assert contract is not None
        assert "price_data" in contract.outputs or "ticker_used" in contract.outputs

    def test_no_contract_for_empty_code(self) -> None:
        composer = SkillComposer()
        contract = composer.register_skill("x", "empty", "", "misc")
        assert contract is None


class TestChainDiscovery:
    """Test automatic chain discovery."""

    def test_discover_two_step_chain(self) -> None:
        composer = SkillComposer()
        composer.register_skill("a", "fetch_prices", SKILL_A_CODE, "trading")
        composer.register_skill("b", "analyze_prices", SKILL_B_CODE, "trading")

        chains = composer.discover_chains()
        # Should find a->b (price_data output matches price_data input)
        assert len(chains) >= 1
        found = any(
            c.chain == ["a", "b"] for c in chains
        )
        assert found, f"Expected chain [a, b], got: {[c.chain for c in chains]}"

    def test_no_chain_without_matching_io(self) -> None:
        unrelated_code = '''
def execute(context: dict) -> dict:
    x = context.get("completely_unrelated_input", "")
    return {"success": True, "result": "ok", "data": {"unrelated_output": x}}
'''
        composer = SkillComposer()
        composer.register_skill("a", "fetch_prices", SKILL_A_CODE, "trading")
        composer.register_skill("z", "unrelated", unrelated_code, "misc")

        chains = composer.discover_chains()
        has_az = any(c.chain == ["a", "z"] for c in chains)
        assert not has_az, "Should not chain skills with no matching I/O"

    def test_composite_skill_has_contract(self) -> None:
        composer = SkillComposer()
        composer.register_skill("a", "fetch_prices", SKILL_A_CODE, "trading")
        composer.register_skill("b", "analyze_prices", SKILL_B_CODE, "trading")

        chains = composer.discover_chains()
        for chain in chains:
            if chain.chain == ["a", "b"]:
                assert chain.inferred_contract is not None
                assert chain.domain != ""
                break


class TestChainExecution:
    """Test executing skill chains."""

    def test_execute_two_step_chain(self) -> None:
        runner = SkillRunner()
        composer = SkillComposer(runner=runner)
        composer.register_skill("a", "fetch_prices", SKILL_A_CODE, "trading")
        composer.register_skill("b", "analyze_prices", SKILL_B_CODE, "trading")

        chain = CompositeSkill(
            name="fetch_then_analyze",
            chain=["a", "b"],
            domain="trading",
        )

        result = composer.execute_chain(chain, {"ticker": "AAPL"})
        assert result.success
        assert "analysis" in result.data

    def test_chain_stops_on_failure(self) -> None:
        failing_code = '''
def execute(context: dict) -> dict:
    return {"success": False, "result": "Intentional failure", "data": {}}
'''
        runner = SkillRunner()
        composer = SkillComposer(runner=runner)
        composer.register_skill("fail", "failing", failing_code, "test")
        composer.register_skill("b", "analyze", SKILL_B_CODE, "test")

        chain = CompositeSkill(name="fail_chain", chain=["fail", "b"], domain="test")
        result = composer.execute_chain(chain, {})
        assert not result.success

    def test_chain_depth_limit(self) -> None:
        runner = SkillRunner()
        composer = SkillComposer(runner=runner, max_chain_depth=2)
        composer.register_skill("a", "a", SKILL_A_CODE, "test")
        composer.register_skill("b", "b", SKILL_B_CODE, "test")
        composer.register_skill("c", "c", SKILL_C_CODE, "test")

        chain = CompositeSkill(
            name="too_long", chain=["a", "b", "c"], domain="test"
        )
        result = composer.execute_chain(chain, {})
        assert not result.success
        assert "depth" in result.error.lower()

    def test_no_runner_returns_error(self) -> None:
        composer = SkillComposer(runner=None)
        chain = CompositeSkill(name="test", chain=["a"], domain="test")
        result = composer.execute_chain(chain, {})
        assert not result.success
        assert "runner" in result.error.lower()
