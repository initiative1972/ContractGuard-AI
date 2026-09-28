"""
ContractGuard AI — Zero-Dependency OpenTelemetry-Style Tracing & Telemetry Runtime
Compliant with: APRA CPG 235 (Full data lineage, traceability, and immutable audit trails)
Architecture Requirement: Zero SaaS monitoring dependencies. Local append-only JSON-L spans.
"""

from __future__ import annotations

import contextvars
import dataclasses
import enum
import json
import os
import sys
import time
import uuid
from typing import Any, Dict, List, Optional, Set


class SpanStatusCode(str, enum.Enum):
    """OpenTelemetry-standard status codes."""
    UNSET = "UNSET"
    OK = "OK"
    ERROR = "ERROR"


class SpanKind(str, enum.Enum):
    """OpenTelemetry-standard span classifications."""
    INTERNAL = "INTERNAL"
    SERVER = "SERVER"
    CLIENT = "CLIENT"
    PRODUCER = "PRODUCER"
    CONSUMER = "CONSUMER"


@dataclasses.dataclass
class SpanEvent:
    """An annotated point in time within a span's lifetime."""
    name: str
    timestamp_ns: int
    attributes: Dict[str, Any] = dataclasses.field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "timestamp_ns": self.timestamp_ns,
            "timestamp_iso": time.strftime(
                "%Y-%m-%dT%H:%M:%SZ", time.gmtime(self.timestamp_ns / 1_000_000_000)
            ),
            "attributes": self.attributes,
        }


@dataclasses.dataclass
class Span:
    """
    OpenTelemetry-compatible Span object tracking execution units,
    parent-child hierarchies, banking audit attributes, and chunk metrics.
    """
    name: str
    trace_id: str
    span_id: str
    parent_span_id: Optional[str] = None
    kind: SpanKind = SpanKind.INTERNAL
    start_time_ns: int = dataclasses.field(default_factory=lambda: time.time_ns())
    end_time_ns: Optional[int] = None
    status_code: SpanStatusCode = SpanStatusCode.UNSET
    status_description: str = ""
    attributes: Dict[str, Any] = dataclasses.field(default_factory=dict)
    events: List[SpanEvent] = dataclasses.field(default_factory=list)

    @property
    def duration_ms(self) -> float:
        """Calculates span duration in fractional milliseconds."""
        if self.end_time_ns is None:
            current_ns = time.time_ns()
            return (current_ns - self.start_time_ns) / 1_000_000.0
        return (self.end_time_ns - self.start_time_ns) / 1_000_000.0

    def set_attribute(self, key: str, value: Any) -> Span:
        """Sets a key-value attribute on the span."""
        self.attributes[key] = value
        return self

    def set_attributes(self, attributes: Dict[str, Any]) -> Span:
        """Bulk assigns attributes to the span."""
        self.attributes.update(attributes)
        return self

    def add_event(self, name: str, attributes: Optional[Dict[str, Any]] = None) -> Span:
        """Records an event with a timestamp and optional metadata."""
        event = SpanEvent(
            name=name,
            timestamp_ns=time.time_ns(),
            attributes=attributes or {},
        )
        self.events.append(event)
        return self

    def set_status(self, code: SpanStatusCode, description: str = "") -> Span:
        """Sets the span execution status (OK or ERROR with explanation)."""
        self.status_code = code
        self.status_description = description
        return self

    def record_exception(self, exception: BaseException, escaped: bool = True) -> Span:
        """Standardized OpenTelemetry exception recording."""
        self.set_status(SpanStatusCode.ERROR, str(exception))
        self.add_event(
            name="exception",
            attributes={
                "exception.type": exception.__class__.__name__,
                "exception.message": str(exception),
                "exception.escaped": escaped,
            },
        )
        return self

    def end(self) -> None:
        """Finalizes span end time if not already terminated."""
        if self.end_time_ns is None:
            self.end_time_ns = time.time_ns()
            if self.status_code == SpanStatusCode.UNSET:
                self.status_code = SpanStatusCode.OK

    def to_dict(self) -> Dict[str, Any]:
        """Serializes span into OpenTelemetry JSON representation."""
        return {
            "trace_id": self.trace_id,
            "span_id": self.span_id,
            "parent_span_id": self.parent_span_id,
            "name": self.name,
            "kind": self.kind.value,
            "start_time_ns": self.start_time_ns,
            "end_time_ns": self.end_time_ns,
            "duration_ms": round(self.duration_ms, 3),
            "status": {
                "code": self.status_code.value,
                "description": self.status_description,
            },
            "attributes": self.attributes,
            "events": [event.to_dict() for event in self.events],
        }


# Context variable maintaining active span hierarchy across threads/async coroutines
_ACTIVE_SPAN_CONTEXT: contextvars.ContextVar[Optional[Span]] = contextvars.ContextVar(
    "active_span_context", default=None
)


class SpanContextManager:
    """
    Context manager supporting both synchronous (`with`) and asynchronous (`async with`)
    usage to automatically open, bind, and finalize span lifecycles.
    """

    def __init__(self, tracer: Tracer, span: Span):
        self.tracer = tracer
        self.span = span
        self.token: Optional[contextvars.Token] = None

    def __enter__(self) -> Span:
        self.token = _ACTIVE_SPAN_CONTEXT.set(self.span)
        return self.span

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_val is not None:
            self.span.record_exception(exc_val)
        self.span.end()
        self.tracer._export_span(self.span)
        if self.token is not None:
            _ACTIVE_SPAN_CONTEXT.reset(self.token)

    async def __aenter__(self) -> Span:
        return self.__enter__()

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        self.__exit__(exc_type, exc_val, exc_tb)


class Tracer:
    """
    ContractGuard Zero-Dependency OpenTelemetry-Style Tracer.
    Tracks distributed spans, APRA CPG 235 lineage, and banking-specific metrics
    including Chunk-Utilization Ratio and Token Budget Optimization.
    """

    def __init__(
        self,
        service_name: str = "contractguard-ai",
        audit_log_path: str = "audit_spans.jsonl",
        enable_stdout: bool = True,
    ):
        self.service_name = service_name
        self.audit_log_path = audit_log_path
        self.enable_stdout = enable_stdout
        self._in_memory_spans: List[Span] = []
        self._max_in_memory_spans = 2000

    @staticmethod
    def _generate_trace_id() -> str:
        """Generates 32-character hex trace identifier."""
        return uuid.uuid4().hex

    @staticmethod
    def _generate_span_id() -> str:
        """Generates 16-character hex span identifier."""
        return uuid.uuid4().hex[:16]

    def get_current_span(self) -> Optional[Span]:
        """Returns the currently active span in context."""
        return _ACTIVE_SPAN_CONTEXT.get()

    def start_as_current_span(
        self,
        name: str,
        attributes: Optional[Dict[str, Any]] = None,
        kind: SpanKind = SpanKind.INTERNAL,
    ) -> SpanContextManager:
        """
        Creates and enters a new span as the current context. Automatically
        inherits trace_id and sets parent_span_id from enclosing span.
        """
        current_span = self.get_current_span()

        if current_span is not None:
            trace_id = current_span.trace_id
            parent_span_id = current_span.span_id
        else:
            trace_id = self._generate_trace_id()
            parent_span_id = None

        span_id = self._generate_span_id()
        span = Span(
            name=name,
            trace_id=trace_id,
            span_id=span_id,
            parent_span_id=parent_span_id,
            kind=kind,
            attributes={
                "service.name": self.service_name,
                **(attributes or {}),
            },
        )

        return SpanContextManager(self, span)

    # --------------------------------------------------------------------------
    # Specialized Banking Metrics & Governance Telemetry
    # --------------------------------------------------------------------------

    def track_chunk_utilization(
        self,
        ingested_fact_ids: List[str],
        cited_fact_ids: List[str],
        target_sla: float = 0.65,
    ) -> float:
        """
        Calculates and records the core ContractGuard AI metric:
        Chunk Utilization Ratio = (Unique Chunks Cited) / (Total Unique Chunks Ingested into Context)

        Guarantees APRA CPG 235 traceability and flags token waste when < 65%.
        """
        ingested_set: Set[str] = set(ingested_fact_ids)
        cited_set: Set[str] = set(cited_fact_ids)

        # Intersection ensures we only count citations that actually came from context
        valid_cited = cited_set.intersection(ingested_set)
        total_ingested = len(ingested_set)

        ratio = (len(valid_cited) / total_ingested) if total_ingested > 0 else 0.0

        current_span = self.get_current_span()
        if current_span:
            current_span.set_attributes({
                "contractguard.chunks.ingested_count": total_ingested,
                "contractguard.chunks.cited_count": len(valid_cited),
                "contractguard.chunks.unused_count": total_ingested - len(valid_cited),
                "contractguard.chunks.utilization_ratio": round(ratio, 4),
                "contractguard.chunks.sla_passed": ratio >= target_sla,
                "contractguard.chunks.target_sla": target_sla,
            })
            current_span.add_event(
                "chunk_utilization_evaluated",
                {
                    "ratio": round(ratio, 4),
                    "sla_passed": ratio >= target_sla,
                    "cited_facts": list(valid_cited),
                },
            )

        return ratio

    def track_token_budget_optimization(
        self,
        flash_tokens: int,
        pro_tokens: int,
        baseline_pure_pro_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Calculates inference cost reduction achieved by Layer 3 Dynamic Model Routing
        (Gemini 2.5 Flash for extraction/sanitization vs. Gemini 2.5 Pro for synthesis)
        Target SLA: >= 60% cost reduction vs pure Pro baseline.
        """
        # Baseline assumption: without router, all tokens would hit Gemini Pro
        total_actual_tokens = flash_tokens + pro_tokens
        baseline = baseline_pure_pro_tokens or total_actual_tokens

        # Relative cost weights (Flash is roughly ~10x-15x more cost-efficient than Pro)
        # Using normalized units: Flash = 1 unit/1k, Pro = 10 units/1k
        flash_cost_units = (flash_tokens / 1000.0) * 1.0
        pro_cost_units = (pro_tokens / 1000.0) * 10.0
        actual_cost_units = flash_cost_units + pro_cost_units

        baseline_cost_units = (baseline / 1000.0) * 10.0
        savings_pct = (
            ((baseline_cost_units - actual_cost_units) / baseline_cost_units)
            if baseline_cost_units > 0
            else 0.0
        )

        metrics = {
            "tokens.flash": flash_tokens,
            "tokens.pro": pro_tokens,
            "tokens.total": total_actual_tokens,
            "tokens.cost_savings_pct": round(savings_pct * 100, 2),
            "tokens.target_60pct_met": savings_pct >= 0.60,
        }

        current_span = self.get_current_span()
        if current_span:
            current_span.set_attributes(metrics)
            current_span.add_event("token_budget_analyzed", metrics)

        return metrics

    def track_circuit_breaker(
        self,
        total_claims: int,
        unverified_claims: int,
        tolerance_pct: float = 0.05,
    ) -> bool:
        """
        Evaluates Layer 4 Deterministic Hallucination Circuit Breaker.
        Trips when unverified/unsourced claims exceed tolerance threshold (default < 5%).
        """
        error_rate = (unverified_claims / total_claims) if total_claims > 0 else 0.0
        tripped = error_rate > tolerance_pct

        current_span = self.get_current_span()
        if current_span:
            current_span.set_attributes({
                "circuit_breaker.total_claims": total_claims,
                "circuit_breaker.unverified_claims": unverified_claims,
                "circuit_breaker.error_rate": round(error_rate, 4),
                "circuit_breaker.tolerance_pct": tolerance_pct,
                "circuit_breaker.tripped": tripped,
            })
            if tripped:
                current_span.set_status(
                    SpanStatusCode.ERROR,
                    f"Circuit Breaker TRIPPED: {unverified_claims}/{total_claims} claims "
                    f"({error_rate*100:.1f}%) unsourced. Exceeds {tolerance_pct*100:.1f}% threshold.",
                )
                current_span.add_event(
                    "circuit_breaker_tripped",
                    {
                        "error_rate": round(error_rate, 4),
                        "unverified_count": unverified_claims,
                        "action": "ROUTE_TO_HUMAN_IN_THE_LOOP_AUDIT",
                    },
                )
            else:
                current_span.add_event(
                    "circuit_breaker_passed",
                    {"error_rate": round(error_rate, 4)},
                )

        return tripped

    # --------------------------------------------------------------------------
    # Export & Persistence Pipeline
    # --------------------------------------------------------------------------

    def _export_span(self, span: Span) -> None:
        """Appends finished span to in-memory buffer and immutable JSON-L disk log."""
        self._in_memory_spans.append(span)
        if len(self._in_memory_spans) > self._max_in_memory_spans:
            self._in_memory_spans.pop(0)

        # Append to immutable JSON-L audit log
        try:
            span_record = span.to_dict()
            with open(self.audit_log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(span_record) + "\n")
        except Exception as e:
            # Audit recording must never crash primary business flow
            if self.enable_stdout:
                sys.stderr.write(f"[ContractGuard Tracing Error] Failed to write span: {e}\n")

        # Emit high-visibility span summary to stdout
        if self.enable_stdout:
            status_indicator = "✓" if span.status_code == SpanStatusCode.OK else "✗"
            print(
                f"[TRACE] {status_indicator} [{span.trace_id[:8]}..] "
                f"{span.name} ({span.duration_ms:.2f}ms) "
                f"status={span.status_code.value}"
            )

    def get_recent_spans(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns recent spans formatted for API and UI telemetry inspection."""
        return [s.to_dict() for s in self._in_memory_spans[-limit:]]

    def get_trace_tree(self, trace_id: str) -> List[Dict[str, Any]]:
        """
        Builds a hierarchical parent-child execution tree for a specific trace_id.
        Powers the interactive distributed span waterfall visualization.
        """
        matching = [s.to_dict() for s in self._in_memory_spans if s.trace_id == trace_id]
        if not matching:
            return []

        span_map = {s["span_id"]: {**s, "children": []} for s in matching}
        root_spans: List[Dict[str, Any]] = []

        for s in matching:
            parent_id = s.get("parent_span_id")
            if parent_id and parent_id in span_map:
                span_map[parent_id]["children"].append(span_map[s["span_id"]])
            else:
                root_spans.append(span_map[s["span_id"]])

        return root_spans


# Global tracer singleton instance
tracer = Tracer(
    service_name="contractguard-runtime",
    audit_log_path="audit_spans.jsonl",
    enable_stdout=True,
)


if __name__ == "__main__":
    print("=" * 70)
    print("ContractGuard AI — Zero-Dependency OpenTelemetry Tracer Self-Test")
    print("=" * 70)

    # 1. Execute simulated 4-Layer Contract Review Trace
    with tracer.start_as_current_span("contract_audit.commercial_loan_facility") as root:
        root.set_attribute("contract.id", "AU-CBA-2025-LN-8812")
        root.set_attribute("contract.type", "Commercial Syndicated Facility")
        root.set_attribute("jurisdiction", "AU-NSW")

        # Layer 1: Knowledge Engineering & PII Tokenization
        with tracer.start_as_current_span("layer1_governance.sanitize_and_chunk") as l1:
            l1.set_attribute("sanitizer.abn_redacted_count", 4)
            l1.set_attribute("sanitizer.acn_redacted_count", 2)
            l1.set_attribute("chunks.created_count", 8)
            time.sleep(0.015)
            l1.add_event("pii_sanitization_complete", {"scrubbed_entities": ["ABN", "ACN", "AUD_VAL"]})

        # Layer 2: Hybrid RAG (Dense + BM25 Lexical + Cross-Encoder Re-Rank)
        with tracer.start_as_current_span("layer2_rag.hybrid_retrieve") as l2:
            l2.set_attribute("rag.rrf_k", 60)
            l2.set_attribute("rag.candidates_retrieved", 14)
            l2.set_attribute("rag.dynamic_top_k", 5)
            time.sleep(0.020)
            l2.add_event("reranking_complete", {"cross_encoder": "bge-reranker-small"})

        # Layer 3: Dynamic Model Orchestration (Flash + Pro)
        with tracer.start_as_current_span("layer3_orchestration.dag_execution") as l3:
            l3.set_attribute("router.flash_tasks", ["clause_extraction", "metadata_parse"])
            l3.set_attribute("router.pro_tasks", ["liability_synthesis", "regulatory_conflict"])
            time.sleep(0.035)

            # Record token budget optimization
            tracer.track_token_budget_optimization(
                flash_tokens=1850,
                pro_tokens=620,
                baseline_pure_pro_tokens=2470,
            )

        # Layer 4: Multi-Agent Validation & Circuit Breaker
        with tracer.start_as_current_span("layer4_validation.multi_agent_audit") as l4:
            ingested = [f"fact_chunk_{i:03d}" for i in range(1, 6)]
            cited = ["fact_chunk_001", "fact_chunk_002", "fact_chunk_004", "fact_chunk_005"]

            # Evaluate chunk utilization ratio
            utilization = tracer.track_chunk_utilization(ingested, cited, target_sla=0.65)
            print(f"Calculated Chunk-Utilization Ratio: {utilization * 100:.1f}% (Target: >=65%)")

            # Check circuit breaker
            tripped = tracer.track_circuit_breaker(total_claims=20, unverified_claims=0, tolerance_pct=0.05)
            print(f"Hallucination Circuit Breaker: {'TRIPPED' if tripped else 'PASSED (<5% threshold)'}")
            time.sleep(0.010)

    print("-" * 70)
    print(f"Trace completed. Root span ID: {root.span_id}")
    print(f"Trace JSON-L written to: {tracer.audit_log_path}")
    tree = tracer.get_trace_tree(root.trace_id)
    print(f"Span tree nodes count: {len(tree[0]['children']) + 1} spans recorded.")
    print("=" * 70)
