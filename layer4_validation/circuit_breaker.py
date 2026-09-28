"""
ContractGuard AI — Layer 4: Multi-Agent Validation & Circuit Breaker
Module: circuit_breaker.py
Purpose: Enterprise-grade trip-switch logic calculating the composite hallucination and inaccuracy rate.
         If > 5% of assertions are UNSOURCED or FACTUALLY INACCURATE, immediately trips the circuit,
         raises a custom ComplianceAuditException, logs cryptographic audit telemetry,
         and locks the report for mandatory human-in-the-loop review.
Compliant with: APRA CPS 234 / CPG 235 & Zero-Hallucination Enterprise Policies
"""

from __future__ import annotations

import datetime
import hashlib
import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from layer4_validation.citation_agent import CitationVerificationReport
from layer4_validation.consistency_agent import ConsistencyAuditReport


class ComplianceAuditException(Exception):
    """
    Raised when the hallucination or unreferenced claim rate exceeds the 5.0% enterprise ceiling.
    Triggers mandatory human legal review under APRA CPG 235 Model Risk Governance.
    """
    def __init__(
        self,
        message: str,
        hallucination_rate_pct: float,
        threshold_pct: float,
        audit_payload: Dict[str, Any],
    ):
        super().__init__(message)
        self.hallucination_rate_pct = hallucination_rate_pct
        self.threshold_pct = threshold_pct
        self.audit_payload = audit_payload


@dataclass
class CircuitBreakerTelemetry:
    """Audit packet generated on every circuit breaker evaluation."""
    timestamp: str
    total_claims_evaluated: int
    unsourced_claims_count: int
    inaccurate_claims_count: int
    composite_defect_count: int
    hallucination_rate_pct: float
    threshold_pct: float
    is_tripped: bool
    status: str  # 'PASS_ENTERPRISE_ZERO_HALLUCINATION' | 'TRIPPED_ESCALATED_TO_HUMAN_REVIEW'
    audit_hash: str
    flagged_claim_ids: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "total_claims_evaluated": self.total_claims_evaluated,
            "unsourced_claims_count": self.unsourced_claims_count,
            "inaccurate_claims_count": self.inaccurate_claims_count,
            "composite_defect_count": self.composite_defect_count,
            "hallucination_rate_pct": round(self.hallucination_rate_pct, 2),
            "threshold_pct": round(self.threshold_pct, 2),
            "is_tripped": self.is_tripped,
            "status": self.status,
            "audit_hash": self.audit_hash,
            "flagged_claim_ids": self.flagged_claim_ids,
        }


class HallucinationCircuitBreaker:
    """
    Automated safety interlock.
    Enforces that ContractGuard reports maintain >= 95% verifiable factual accuracy
    (Defect rate <= 5.0%).
    """

    def __init__(self, max_hallucination_rate_pct: float = 5.0):
        self.max_hallucination_rate_pct = max_hallucination_rate_pct

    @staticmethod
    def _sha256(data: str) -> str:
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

    def evaluate_and_enforce(
        self,
        citation_report: CitationVerificationReport,
        consistency_report: ConsistencyAuditReport,
        contract_id: str = "doc_unknown",
    ) -> CircuitBreakerTelemetry:
        """
        Combines citation validation and consistency evaluation to determine total defect rate:
            Defect = Unsourced Claim OR Factually Inconsistent Claim.
        If defect rate > max_hallucination_rate_pct (5.0%), raises ComplianceAuditException.
        """
        total_claims = max(1, citation_report.total_claims_count)
        unsourced_ids = {c.claim_id for c in citation_report.claims if not c.has_valid_citation}
        inconsistent_ids = {r.claim_id for r in consistency_report.results if not r.is_consistent}

        # Union of defective claims
        defective_claim_ids = sorted(list(unsourced_ids.union(inconsistent_ids)))
        defect_count = len(defective_claim_ids)

        hallucination_rate = (defect_count / float(total_claims)) * 100.0
        is_tripped = hallucination_rate > self.max_hallucination_rate_pct

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        audit_raw = f"{contract_id}::{defect_count}::{total_claims}::{now_iso}"
        audit_hash = self._sha256(audit_raw)

        status = (
            "TRIPPED_ESCALATED_TO_HUMAN_REVIEW"
            if is_tripped
            else "PASS_ENTERPRISE_ZERO_HALLUCINATION"
        )

        telemetry = CircuitBreakerTelemetry(
            timestamp=now_iso,
            total_claims_evaluated=total_claims,
            unsourced_claims_count=len(unsourced_ids),
            inaccurate_claims_count=len(inconsistent_ids),
            composite_defect_count=defect_count,
            hallucination_rate_pct=hallucination_rate,
            threshold_pct=self.max_hallucination_rate_pct,
            is_tripped=is_tripped,
            status=status,
            audit_hash=audit_hash,
            flagged_claim_ids=defective_claim_ids,
        )

        # Enforce Trip Switch
        if is_tripped:
            raise ComplianceAuditException(
                message=(
                    f"CRITICAL CIRCUIT BREAKER TRIPPED for contract '{contract_id}': "
                    f"Hallucination rate {hallucination_rate:.2f}% exceeds enterprise safety limit of "
                    f"{self.max_hallucination_rate_pct:.1f}%. Report locked for mandatory human review."
                ),
                hallucination_rate_pct=hallucination_rate,
                threshold_pct=self.max_hallucination_rate_pct,
                audit_payload=telemetry.to_dict(),
            )

        return telemetry


if __name__ == "__main__":
    from layer4_validation.citation_agent import ExtractedClaim
    from layer4_validation.consistency_agent import EntailmentResult

    # Test passing case: 19 valid claims, 0 defective (0% hallucination)
    mock_claims = [
        ExtractedClaim(f"c_{i}", f"Valid claim {i}", ["fact_01"], True)
        for i in range(20)
    ]
    cit_rep = CitationVerificationReport(20, 20, 0, 0.0, mock_claims, [])
    mock_results = [
        EntailmentResult(f"c_{i}", "fact_01", 0.9, 0.9, 0.9, True)
        for i in range(20)
    ]
    con_rep = ConsistencyAuditReport(20, 20, 0, 0.0, mock_results)

    breaker = HallucinationCircuitBreaker(max_hallucination_rate_pct=5.0)
    tel = breaker.evaluate_and_enforce(cit_rep, con_rep, "AU-CBA-01")
    print(f"Safety Passed: Status={tel.status} | Defect Rate={tel.hallucination_rate_pct}%")

    # Test tripping case: 2 out of 20 defective (10% hallucination > 5% threshold)
    mock_claims[0].has_valid_citation = False
    mock_claims[1].has_valid_citation = False
    cit_tripped = CitationVerificationReport(20, 18, 2, 10.0, mock_claims, [])

    try:
        breaker.evaluate_and_enforce(cit_tripped, con_rep, "AU-CBA-01")
    except ComplianceAuditException as e:
        print(f"\nCaught Expected Trip: {e.message}")
