import asyncio
try:
    import pytest
except ImportError:
    pytest = None

from layer3_orchestration.router import DynamicModelRouter, ModelTier, TaskComplexity
from layer3_orchestration.dag_planner import DAGPlanner, ContractReviewDAG
from layer3_orchestration.stream_engine import ContextCompactor, StreamEngine


def test_model_router_allocations_and_cost_savings():
    router = DynamicModelRouter()

    # Routine tasks must route to Flash
    r_extract = router.route_task("t1", "Clause Extraction", "Extract covenants and definitions")
    assert r_extract.assigned_model == ModelTier.FLASH
    assert r_extract.task_complexity in (TaskComplexity.ROUTINE_EXTRACTION, TaskComplexity.SCHEMA_VALIDATION)

    # Complex reasoning must route to Pro
    r_reason = router.route_task("t2", "Indemnity Analysis", "Synthesize cross-clause liability conflict and legal ambiguity")
    assert r_reason.assigned_model == ModelTier.PRO
    assert r_reason.task_complexity in (TaskComplexity.CROSS_CLAUSE_CONFLICT, TaskComplexity.LEGAL_AMBIGUITY)

    # Cost savings test with hybrid mix
    decisions = [
        router.route_task("t1", "Extract 1", "Parse dates and amounts", 1200, 300),
        router.route_task("t2", "Extract 2", "Schema validation", 1000, 250),
        router.route_task("t3", "Pro Reasoning", "Legal ambiguity analysis", 400, 150),
    ]
    savings = router.calculate_cost_savings(decisions)
    assert savings["savings_pct"] >= 60.0
    assert savings["target_sla_passed"] is True


def test_dag_planner_acyclic_and_validation():
    planner = DAGPlanner()
    dag = planner.generate_plan(
        plan_id="plan_test_01",
        contract_id="AU-TEST-SYND",
        user_query="Audit loan covenants and cross-default risk under APRA CPS 234.",
    )

    assert isinstance(dag, ContractReviewDAG)
    assert len(dag.nodes) == 5
    assert dag.nodes[0].dependencies == []  # First task is root
    assert dag.nodes[1].dependencies == [dag.nodes[0].id]
    assert dag.estimated_cost_reduction_pct >= 50.0

    # Ensure model names are properly set
    models = {n.model for n in dag.nodes}
    assert "gemini-2.5-flash" in models or "gemini-2.5-pro" in models


def test_context_compactor_watermark():
    compactor = ContextCompactor(watermark_threshold=0.70, max_context_tokens=1000)

    # Saturation below 70% should NOT trigger compaction
    should_compact, sat = compactor.evaluate_watermark(500)
    assert should_compact is False
    assert sat == 0.50

    # Saturation at or above 70% SHOULD trigger compaction
    should_compact_high, sat_high = compactor.evaluate_watermark(750)
    assert should_compact_high is True
    assert sat_high == 0.75

    messages = [
        {"role": "system", "content": "You are ContractGuard AI."},
        {"role": "user", "content": "Evaluate agreement."},
        {"role": "model", "content": "Observation about fact_001 in clause 14.3. Long repetitive text... " * 50},
        {"role": "user", "content": "Next step."},
    ]
    fact_map = {"fact_001": "Clause 14.3 requires permanent electronic audit trails."}

    compacted, metrics = compactor.compact_context(messages, fact_map)
    assert metrics.compaction_triggered is True
    assert any("[COMPACTED_OBSERVATIONS_AT_70PCT_WATERMARK]" in m.get("content", "") for m in compacted)


def test_stream_engine_buffering():
    async def run_stream():
        async def fake_generator():
            tokens = ["Word1 ", "Word2 ", "Word3 ", "Word4 "]
            for t in tokens:
                yield t

        engine = StreamEngine(mtu_buffer_bytes=16, flush_window_ms=50)
        chunks = []
        async for chunk in engine.stream_generator(fake_generator()):
            chunks.append(chunk)

        assert len(chunks) >= 1
        full_text = b"".join(chunks).decode("utf-8")
        assert full_text == "Word1 Word2 Word3 Word4 "

    asyncio.run(run_stream())


if __name__ == "__main__":
    print("Running Layer 3 Orchestration Tests...")
    test_model_router_allocations_and_cost_savings()
    print("✓ test_model_router_allocations_and_cost_savings PASSED")
    test_dag_planner_acyclic_and_validation()
    print("✓ test_dag_planner_acyclic_and_validation PASSED")
    test_context_compactor_watermark()
    print("✓ test_context_compactor_watermark PASSED")
    test_stream_engine_buffering()
    print("✓ test_stream_engine_buffering PASSED")
    print("All Layer 3 Orchestration tests successfully verified!")
