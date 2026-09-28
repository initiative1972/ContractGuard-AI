"""
ContractGuard AI — Layer 4: Multi-Agent Validation & Circuit Breaker Package
"""

from layer4_validation.citation_agent import (
    CitationAgent,
    CitationVerificationReport,
    ExtractedClaim,
)
from layer4_validation.consistency_agent import (
    ConsistencyAgent,
    ConsistencyAuditReport,
    EntailmentResult,
)
from layer4_validation.adversarial_agent import (
    AdversarialCounselAgent,
    AdversarialReviewResult,
    AdversarialVulnerability,
)
from layer4_validation.circuit_breaker import (
    CircuitBreakerTelemetry,
    ComplianceAuditException,
    HallucinationCircuitBreaker,
)

__all__ = [
    "CitationAgent",
    "CitationVerificationReport",
    "ExtractedClaim",
    "ConsistencyAgent",
    "ConsistencyAuditReport",
    "EntailmentResult",
    "AdversarialCounselAgent",
    "AdversarialReviewResult",
    "AdversarialVulnerability",
    "CircuitBreakerTelemetry",
    "ComplianceAuditException",
    "HallucinationCircuitBreaker",
]
