try:
    import pytest
except ImportError:
    pytest = None

from layer4_validation.citation_agent import CitationAgent, ExtractedClaim, CitationVerificationReport
from layer4_validation.consistency_agent import ConsistencyAgent, EntailmentResult, ConsistencyAuditReport
from layer4_validation.adversarial_agent import AdversarialCounselAgent
from layer4_validation.circuit_breaker import HallucinationCircuitBreaker, ComplianceAuditException


def test_citation_agent_parsing():
    agent = CitationAgent(valid_fact_ids={"fact_001", "fact_002"})

    text = """
    - The facility amount is AUD $45,000,000 [fact_001].
    - An uncapped indemnity applies to borrower operations [fact_002].
    - Borrower must deliver audited financial statements within 30 days.
    - Notice must be given to unknown syndicates [fact_nonexistent_99].
    """
    report = agent.verify_citations(text)

    assert report.total_claims_count == 4
    assert report.sourced_claims_count == 2
    assert report.unsourced_claims_count == 2
    assert report.unsourced_rate_pct == 50.0

    claims_map = {c.claim_id: c for c in report.claims}
    # Claim 1 has fact_001
    assert claims_map["claim_001"].has_valid_citation is True
    # Claim 3 has no fact citation
    assert claims_map["claim_003"].has_valid_citation is False
    # Claim 4 has fictitious fact_nonexistent_99
    assert claims_map["claim_004"].has_valid_citation is False


def test_consistency_agent_bidirectional_entailment():
    agent = ConsistencyAgent(consistency_threshold=0.75)
    source_clause = (
        "Clause 19.3: The Borrower must notify the Lender of any material Information "
        "Security incident within 72 hours under APRA CPS 234 standards."
    )

    # Consistent claim
    res_good = agent.evaluate_claim_entailment(
        "c_good",
        "The Borrower must report material Information Security incidents within 72 hours [fact_001].",
        "fact_001",
        source_clause,
    )
    assert res_good.is_consistent is True
    assert res_good.bidirectional_score >= 0.75

    # Inconsistent / hallucinated claim
    res_bad = agent.evaluate_claim_entailment(
        "c_bad",
        "The Borrower unconditionally waives all defenses and grants uncapped indemnities within 2 hours.",
        "fact_001",
        source_clause,
    )
    assert res_bad.is_consistent is False
    assert len(res_bad.flagged_inaccuracies) > 0


def test_adversarial_counsel_agent():
    agent = AdversarialCounselAgent()
    contract_text = """
    14.1 The Lender may at its sole discretion unilaterally vary the margin terms.
    19.3 The Borrower warrants compliance with superseded standard APS 231.
    24.1 The Borrower provides an uncapped indemnity surviving contract termination.
    """
    review = agent.red_team_contract("AU-CBA-01", contract_text)

    assert review.risk_level == "CRITICAL"
    assert review.blind_spots_count >= 3
    categories = {v.category for v in review.vulnerabilities}
    assert "ASYMMETRIC_INDEMNITY" in categories
    assert "UCT_UNILATERAL_VARIATION" in categories
    assert "APRA_REGULATORY_DEFECT" in categories


def test_circuit_breaker_5_percent_threshold():
    breaker = HallucinationCircuitBreaker(max_hallucination_rate_pct=5.0)

    # 1. 20 claims, 0 defective -> Defect rate 0% (Passes)
    claims_pass = [ExtractedClaim(f"c_{i}", f"Text {i}", ["fact_1"], True) for i in range(20)]
    cit_pass = CitationVerificationReport(20, 20, 0, 0.0, claims_pass, [])
    results_pass = [EntailmentResult(f"c_{i}", "fact_1", 0.9, 0.9, 0.9, True) for i in range(20)]
    con_pass = ConsistencyAuditReport(20, 20, 0, 0.0, results_pass)

    tel = breaker.evaluate_and_enforce(cit_pass, con_pass, "AU-PASS-01")
    assert tel.is_tripped is False
    assert tel.hallucination_rate_pct == 0.0
    assert tel.status == "PASS_ENTERPRISE_ZERO_HALLUCINATION"

    # 2. 20 claims, 2 defective -> Defect rate 10.0% > 5.0% ceiling -> Must trip ComplianceAuditException
    claims_pass[0].has_valid_citation = False
    claims_pass[1].has_valid_citation = False
    cit_fail = CitationVerificationReport(20, 18, 2, 10.0, claims_pass, [])

    try:
        breaker.evaluate_and_enforce(cit_fail, con_pass, "AU-FAIL-01")
        assert False, "Circuit breaker should have raised ComplianceAuditException"
    except ComplianceAuditException as exc:
        assert exc.hallucination_rate_pct == 10.0
        assert exc.threshold_pct == 5.0
        assert exc.audit_payload["is_tripped"] is True


if __name__ == "__main__":
    print("Running Layer 4 Validation Tests...")
    test_citation_agent_parsing()
    print("✓ test_citation_agent_parsing PASSED")
    test_consistency_agent_bidirectional_entailment()
    print("✓ test_consistency_agent_bidirectional_entailment PASSED")
    test_adversarial_counsel_agent()
    print("✓ test_adversarial_counsel_agent PASSED")
    test_circuit_breaker_5_percent_threshold()
    print("✓ test_circuit_breaker_5_percent_threshold PASSED")
    print("All Layer 4 Validation tests successfully verified!")
