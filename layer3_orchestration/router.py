"""
ContractGuard AI — Layer 3: Hierarchical Model Orchestration
Module: router.py
Purpose: Dynamic model router mapping contract review sub-tasks to optimal Gemini models:
         - Gemini 2.5 Flash: Routine extraction, semantic classification, PII sanitization, schema parsing.
         - Gemini 2.5 Pro: Deep legal ambiguity analysis, cross-clause liability conflicts, regulatory deviation synthesis.
Compliant with: APRA CPS 234 / CPG 235 & Token Budget Optimization (Target SLA: >=60% cost reduction vs pure Pro).
"""

from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set


class ModelTier(str, enum.Enum):
    """Supported model endpoints in the ContractGuard runtime."""
    FLASH = "gemini-2.5-flash"
    PRO = "gemini-2.5-pro"
    DETERMINISTIC = "deterministic-engine"


class TaskComplexity(str, enum.Enum):
    """Classification of analytical depth required for a legal sub-task."""
    ROUTINE_EXTRACTION = "ROUTINE_EXTRACTION"
    SCHEMA_VALIDATION = "SCHEMA_VALIDATION"
    PII_PSEUDONYMIZATION = "PII_PSEUDONYMIZATION"
    CROSS_CLAUSE_CONFLICT = "CROSS_CLAUSE_CONFLICT"
    LEGAL_AMBIGUITY = "LEGAL_AMBIGUITY"
    REGULATORY_DEVIATION = "REGULATORY_DEVIATION"
    ADVERSARIAL_COUNTERPARTY = "ADVERSARIAL_COUNTERPARTY"


@dataclass(frozen=True)
class RouteDecision:
    """Routing assignment for a DAG task node."""
    task_id: str
    task_name: str
    assigned_model: ModelTier
    task_complexity: TaskComplexity
    estimated_input_tokens: int
    estimated_output_tokens: int
    routing_rationale: str
    cost_weight: float  # Normalized cost factor (Flash=1.0, Pro=10.0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "task_name": self.task_name,
            "assigned_model": self.assigned_model.value,
            "task_complexity": self.task_complexity.value,
            "estimated_input_tokens": self.estimated_input_tokens,
            "estimated_output_tokens": self.estimated_output_tokens,
            "routing_rationale": self.routing_rationale,
            "cost_weight": self.cost_weight,
        }


class DynamicModelRouter:
    """
    Decoupled Model Routing Matrix.
    Directs queries and sub-tasks to the most cost-effective and analytically
    sound model. Automatically optimizes token expenditure to achieve the
    prescribed >= 60% inference savings compared to monolithic Gemini Pro usage.
    """

    # Keyword rules that trigger deep reasoning on Gemini 2.5 Pro
    PRO_REASONING_TRIGGERS: Set[str] = {
        "ambiguity",
        "conflict",
        "interplay",
        "uncapped indemnity",
        "cross-default",
        "liability cap",
        "regulatory deviation",
        "sovereignty breach",
        "unilateral variation",
        "unfair contract term",
        "uct",
        "counterparty risk",
        "subordination",
        "cure period",
    }

    # Routine task categories designated for Gemini 2.5 Flash
    FLASH_ROUTINE_TRIGGERS: Set[str] = {
        "extract",
        "parse",
        "classify",
        "metadata",
        "summarize clause",
        "schema",
        "sanitize",
        "dates",
        "amounts",
        "parties",
        "definitions",
    }

    def __init__(
        self,
        flash_model_alias: str = "gemini-2.5-flash",
        pro_model_alias: str = "gemini-2.5-pro",
    ):
        self.flash_model = ModelTier.FLASH
        self.pro_model = ModelTier.PRO

    def classify_task_complexity(self, task_name: str, task_description: str) -> TaskComplexity:
        """Classifies task complexity based on analytical intent."""
        text = f"{task_name} {task_description}".lower()

        # Check Pro indicators first
        if any(trigger in text for trigger in ["ambiguity", "interpretation", "vague"]):
            return TaskComplexity.LEGAL_AMBIGUITY
        if any(trigger in text for trigger in ["conflict", "cross-clause", "cross-default", "interplay"]):
            return TaskComplexity.CROSS_CLAUSE_CONFLICT
        if any(trigger in text for trigger in ["regulatory", "apra", "cps 234", "cpg 235", "asic", "breach"]):
            return TaskComplexity.REGULATORY_DEVIATION
        if any(trigger in text for trigger in ["adversarial", "opposing counsel", "counterparty"]):
            return TaskComplexity.ADVERSARIAL_COUNTERPARTY

        # Check Flash indicators
        if any(trigger in text for trigger in ["sanitize", "pii", "redact"]):
            return TaskComplexity.PII_PSEUDONYMIZATION
        if any(trigger in text for trigger in ["schema", "json", "format", "validate"]):
            return TaskComplexity.SCHEMA_VALIDATION

        return TaskComplexity.ROUTINE_EXTRACTION

    def route_task(
        self,
        task_id: str,
        task_name: str,
        task_description: str,
        input_token_estimate: int = 500,
        output_token_estimate: int = 150,
    ) -> RouteDecision:
        """
        Determines whether a sub-task is executed by Gemini 2.5 Flash or Gemini 2.5 Pro.
        """
        complexity = self.classify_task_complexity(task_name, task_description)

        if complexity in (
            TaskComplexity.LEGAL_AMBIGUITY,
            TaskComplexity.CROSS_CLAUSE_CONFLICT,
            TaskComplexity.REGULATORY_DEVIATION,
            TaskComplexity.ADVERSARIAL_COUNTERPARTY,
        ):
            assigned = self.pro_model
            rationale = (
                f"Assigned to {self.pro_model.value}: Task requires deep multi-step reasoning, "
                f"cross-clause liability synthesis, or statutory compliance evaluation ({complexity.value})."
            )
            cost_weight = 10.0
        else:
            assigned = self.flash_model
            rationale = (
                f"Assigned to {self.flash_model.value}: High-speed deterministic extraction, "
                f"sanitization, or structured JSON schema parsing ({complexity.value})."
            )
            cost_weight = 1.0

        return RouteDecision(
            task_id=task_id,
            task_name=task_name,
            assigned_model=assigned,
            task_complexity=complexity,
            estimated_input_tokens=input_token_estimate,
            estimated_output_tokens=output_token_estimate,
            routing_rationale=rationale,
            cost_weight=cost_weight,
        )

    def calculate_cost_savings(self, decisions: List[RouteDecision]) -> Dict[str, Any]:
        """
        Calculates the theoretical token expenditure reduction achieved by the router
        compared to executing all tasks uniformly on Gemini 2.5 Pro.
        """
        if not decisions:
            return {"savings_pct": 0.0, "target_sla_passed": False}

        total_tokens = sum(d.estimated_input_tokens + d.estimated_output_tokens for d in decisions)
        flash_tokens = sum(
            d.estimated_input_tokens + d.estimated_output_tokens
            for d in decisions
            if d.assigned_model == ModelTier.FLASH
        )
        pro_tokens = sum(
            d.estimated_input_tokens + d.estimated_output_tokens
            for d in decisions
            if d.assigned_model == ModelTier.PRO
        )

        # Baseline cost (pure Pro): 10 units per 1,000 tokens
        baseline_cost = (total_tokens / 1000.0) * 10.0

        # Routed cost: Flash @ 1 unit/1k, Pro @ 10 units/1k
        routed_cost = ((flash_tokens / 1000.0) * 1.0) + ((pro_tokens / 1000.0) * 10.0)

        savings_pct = (
            ((baseline_cost - routed_cost) / baseline_cost) * 100.0
            if baseline_cost > 0
            else 0.0
        )

        return {
            "total_tokens": total_tokens,
            "flash_tokens": flash_tokens,
            "pro_tokens": pro_tokens,
            "baseline_pro_cost_units": round(baseline_cost, 2),
            "routed_cost_units": round(routed_cost, 2),
            "savings_pct": round(savings_pct, 2),
            "target_sla_passed": savings_pct >= 60.0,
        }


if __name__ == "__main__":
    router = DynamicModelRouter()
    tasks = [
        ("task_01", "Clause Extraction", "Extract loan amounts and repayment dates into JSON schema"),
        ("task_02", "Entity Masking", "Sanitize ABNs and company identifiers"),
        ("task_03", "Indemnity Analysis", "Synthesize cross-clause liability conflict between Clause 24 and Clause 28"),
        ("task_04", "APRA CPS 234 Review", "Analyze regulatory deviation and legal ambiguity in data sovereignty failover"),
    ]

    decisions = [router.route_task(tid, name, desc) for tid, name, desc in tasks]
    print("=" * 70)
    print("Layer 3 Dynamic Model Router Allocations:")
    print("=" * 70)
    for d in decisions:
        print(f"[{d.assigned_model.value.upper()}] {d.task_name} -> {d.task_complexity.value}")
    savings = router.calculate_cost_savings(decisions)
    print("-" * 70)
    print(f"Inference Cost Savings: {savings['savings_pct']}% (Target >= 60% Met: {savings['target_sla_passed']})")
    print("=" * 70)
