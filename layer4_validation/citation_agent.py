"""
ContractGuard AI — Layer 4: Multi-Agent Validation & Circuit Breaker
Module: citation_agent.py
Purpose: Strict assertion extraction and fact_id citation verification agent.
         Parses all declarative claims from generated review reports, extracts embedded
         citations (e.g., [fact_abc123], (fact_abc123), or fact_abc123), and validates
         that every claim references a registered, active fact_id from Layer 1/2.
Compliant with: APRA CPG 235 (Auditable provenance, zero-unreferenced claim policy)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple


@dataclass
class ExtractedClaim:
    """An atomic declarative assertion parsed from model output."""
    claim_id: str
    text: str
    cited_fact_ids: List[str]
    has_valid_citation: bool
    unresolved_fact_ids: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "claim_id": self.claim_id,
            "text": self.text,
            "cited_fact_ids": self.cited_fact_ids,
            "has_valid_citation": self.has_valid_citation,
            "unresolved_fact_ids": self.unresolved_fact_ids,
        }


@dataclass
class CitationVerificationReport:
    """Audit summary of citation integrity across the document."""
    total_claims_count: int
    sourced_claims_count: int
    unsourced_claims_count: int
    unsourced_rate_pct: float
    claims: List[ExtractedClaim]
    unreferenced_fact_ids: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_claims_count": self.total_claims_count,
            "sourced_claims_count": self.sourced_claims_count,
            "unsourced_claims_count": self.unsourced_claims_count,
            "unsourced_rate_pct": round(self.unsourced_rate_pct, 2),
            "claims": [c.to_dict() for c in self.claims],
            "unreferenced_fact_ids": self.unreferenced_fact_ids,
        }


class CitationAgent:
    """
    Parses natural language reports into discrete propositional claims.
    Verifies that every claim links to a valid fact_id present in the Fact Store.
    """

    # Matches patterns like [fact_abcdef01], [fact_001], (fact_12345678), or raw fact_abcdef01
    FACT_ID_PATTERN = re.compile(r"\b(fact_[a-zA-Z0-9_\-]{3,64})\b")

    def __init__(self, valid_fact_ids: Optional[Set[str]] = None):
        self.valid_fact_ids: Set[str] = valid_fact_ids or set()

    def register_valid_facts(self, fact_ids: List[str]) -> None:
        """Updates the agent's known fact registry."""
        self.valid_fact_ids.update(fact_ids)

    def extract_claims(self, generated_text: str) -> List[str]:
        """
        Splits output text into distinct analytical sentences / bullet points,
        filtering out non-assertive conversational padding.
        """
        # Clean markdown headers, bullet symbols, and numbered items
        lines = generated_text.splitlines()
        candidate_sentences: List[str] = []

        for line in lines:
            line_str = line.strip()
            if not line_str or line_str.startswith("#"):
                continue

            # Strip leading bullet tokens (-, *, 1., 2.)
            cleaned = re.sub(r"^(?:[\*\-\+]|\d+\.)\s+", "", line_str)

            # Split into individual sentence propositions if multi-sentence line
            sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\[])", cleaned)
            for s in sentences:
                s_strip = s.strip()
                if len(s_strip) > 20:  # Ignore trivial fragment words
                    candidate_sentences.append(s_strip)

        return candidate_sentences

    def verify_citations(
        self,
        generated_text: str,
        valid_fact_ids: Optional[Set[str]] = None,
    ) -> CitationVerificationReport:
        """
        Performs strict citation verification:
        1. Deconstructs text into discrete claims.
        2. Discovers all cited fact_ids.
        3. Cross-checks against the active fact store registry.
        """
        active_registry = valid_fact_ids if valid_fact_ids is not None else self.valid_fact_ids

        sentences = self.extract_claims(generated_text)
        claims: List[ExtractedClaim] = []
        all_cited_ids: Set[str] = set()

        for idx, sentence in enumerate(sentences, start=1):
            claim_id = f"claim_{idx:03d}"
            found_ids = list(set(self.FACT_ID_PATTERN.findall(sentence)))
            all_cited_ids.update(found_ids)

            # Determine validity
            unresolved = [fid for fid in found_ids if fid not in active_registry]
            valid_ids = [fid for fid in found_ids if fid in active_registry]

            # A claim is valid ONLY if it has at least one valid registered citation
            # and zero unresolvable fictitious fact_ids.
            is_valid = len(valid_ids) > 0 and len(unresolved) == 0

            claims.append(
                ExtractedClaim(
                    claim_id=claim_id,
                    text=sentence,
                    cited_fact_ids=valid_ids,
                    has_valid_citation=is_valid,
                    unresolved_fact_ids=unresolved,
                )
            )

        total_claims = len(claims)
        sourced_count = sum(1 for c in claims if c.has_valid_citation)
        unsourced_count = total_claims - sourced_count
        unsourced_rate = (unsourced_count / total_claims * 100.0) if total_claims > 0 else 0.0

        unreferenced_in_store = [fid for fid in active_registry if fid not in all_cited_ids]

        return CitationVerificationReport(
            total_claims_count=total_claims,
            sourced_claims_count=sourced_count,
            unsourced_claims_count=unsourced_count,
            unsourced_rate_pct=unsourced_rate,
            claims=claims,
            unreferenced_fact_ids=unreferenced_in_store,
        )


if __name__ == "__main__":
    registry = {"fact_cba_001", "fact_cba_002"}
    agent = CitationAgent(valid_fact_ids=registry)

    sample_report = """
    - The agreement mandates information security compliance under APRA CPS 234 [fact_cba_001].
    - An uncapped environmental indemnity persists indefinitely against all guarantors [fact_cba_002].
    - The borrower must also pay a penalty fee of 15% on late drawings with no grace period.
    - Data sovereignty requires local Australian failover storage [fact_unknown_999].
    """

    report = agent.verify_citations(sample_report)
    print("Citation Verification Report:")
    print(f"Total Claims: {report.total_claims_count}")
    print(f"Sourced Claims: {report.sourced_claims_count}")
    print(f"Unsourced Claims: {report.unsourced_claims_count} ({report.unsourced_rate_pct:.1f}%)")
    for c in report.claims:
        status = "VALID" if c.has_valid_citation else "UNSOURCED"
        print(f"[{status}] {c.claim_id}: {c.text[:60]}... -> Cited: {c.cited_fact_ids} | Unresolved: {c.unresolved_fact_ids}")
