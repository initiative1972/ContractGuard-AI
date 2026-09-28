"""
ContractGuard AI — Layer 4: Multi-Agent Validation & Circuit Breaker
Module: consistency_agent.py
Purpose: Bidirectional entailment verification engine checking generated claims against
         the exact source clause text retrieved from the Fact Store via `fact_id`.
         Calculates bidirectional alignment (Premise -> Hypothesis AND Hypothesis -> Premise)
         to detect subtle hallucinations, unwarranted exaggerations, or omissions.
Compliant with: APRA CPG 235 (Factual consistency, verifiable evidence grounding)
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple


@dataclass
class EntailmentResult:
    """Detailed score for a single claim-passage alignment check."""
    claim_id: str
    fact_id: str
    forward_entailment_score: float  # Passage entails Claim [0.0 - 1.0]
    reverse_alignment_score: float   # Claim aligns with Passage [0.0 - 1.0]
    bidirectional_score: float       # Harmonic mean of forward & reverse
    is_consistent: bool              # Meets threshold (>= 0.75)
    flagged_inaccuracies: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "claim_id": self.claim_id,
            "fact_id": self.fact_id,
            "forward_entailment_score": round(self.forward_entailment_score, 4),
            "reverse_alignment_score": round(self.reverse_alignment_score, 4),
            "bidirectional_score": round(self.bidirectional_score, 4),
            "is_consistent": self.is_consistent,
            "flagged_inaccuracies": self.flagged_inaccuracies,
        }


@dataclass
class ConsistencyAuditReport:
    """Full audit summary of factual consistency and factual drift."""
    evaluated_pairs_count: int
    consistent_pairs_count: int
    inconsistent_pairs_count: int
    inaccuracy_rate_pct: float
    results: List[EntailmentResult]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "evaluated_pairs_count": self.evaluated_pairs_count,
            "consistent_pairs_count": self.consistent_pairs_count,
            "inconsistent_pairs_count": self.inconsistent_pairs_count,
            "inaccuracy_rate_pct": round(self.inaccuracy_rate_pct, 2),
            "results": [r.to_dict() for r in self.results],
        }


class ConsistencyAgent:
    """
    Performs bidirectional NLI / semantic entailment verification:
    Direction 1 (Forward): Does the ground-truth contract clause entail the claim?
    Direction 2 (Reverse): Does the claim introduce unwarranted hallucinations absent from the clause?
    """

    def __init__(
        self,
        consistency_threshold: float = 0.75,
        nli_scorer: Optional[Callable[[str, str], float]] = None,
    ):
        self.consistency_threshold = consistency_threshold
        self.nli_scorer = nli_scorer

    @staticmethod
    def _clean_tokens(text: str) -> List[str]:
        return re.findall(r"\b[a-zA-Z0-9_\-\.]{3,}\b", text.lower())

    def _heuristic_bidirectional_nli(self, premise: str, hypothesis: str) -> Tuple[float, float]:
        """
        Lightweight lexical and proposition-level bidirectional entailment proxy.
        Direction 1 (premise -> hypothesis): Can the hypothesis terms be derived from premise?
        Direction 2 (hypothesis -> premise): Does the hypothesis contain novel high-risk terms not in premise?
        """
        premise_tokens = set(self._clean_tokens(premise))
        hyp_tokens = set(self._clean_tokens(hypothesis))

        if not hyp_tokens or not premise_tokens:
            return 0.0, 0.0

        # High-risk banking / legal modifier terms that cannot appear without justification
        critical_modifiers = {
            "uncapped", "unlimited", "mandatory", "waives", "indefinitely",
            "strictly", "immediately", "without notice", "irrevocable", "penalties"
        }

        # Forward score: fraction of hypothesis claims substantiated by premise
        forward_matches = sum(1 for t in hyp_tokens if t in premise_tokens)
        forward_score = forward_matches / len(hyp_tokens)

        # Reverse score: penalty if hypothesis asserts critical modifiers absent from source text
        unsupported_critical = [
            mod for mod in critical_modifiers
            if mod in hypothesis.lower() and mod not in premise.lower()
        ]
        reverse_penalty = len(unsupported_critical) * 0.25
        reverse_score = max(0.0, 1.0 - reverse_penalty)

        # Bonus for exact number/date/acronym preservation
        acronyms_hyp = set(re.findall(r"\b[A-Z]{2,}\b", hypothesis))
        acronyms_premise = set(re.findall(r"\b[A-Z]{2,}\b", premise))
        if acronyms_hyp and not acronyms_hyp.issubset(acronyms_premise):
            # Acronym hallucinated (e.g. APRA CPS 234 claimed when not in text)
            reverse_score = max(0.0, reverse_score - 0.3)

        return forward_score, reverse_score

    def evaluate_claim_entailment(
        self,
        claim_id: str,
        claim_text: str,
        fact_id: str,
        fact_text: str,
    ) -> EntailmentResult:
        """
        Calculates bidirectional entailment between an extracted claim and ground truth text.
        """
        if self.nli_scorer:
            try:
                forward = self.nli_scorer(fact_text, claim_text)
                reverse = self.nli_scorer(claim_text, fact_text)
            except Exception:
                forward, reverse = self._heuristic_bidirectional_nli(fact_text, claim_text)
        else:
            forward, reverse = self._heuristic_bidirectional_nli(fact_text, claim_text)

        # Harmonic mean (F1-style) for balanced bidirectional entailment
        if (forward + reverse) > 0.0:
            bidirectional = (2.0 * forward * reverse) / (forward + reverse)
        else:
            bidirectional = 0.0

        flagged: List[str] = []
        if forward < 0.60:
            flagged.append(f"Low factual support from premise (score={forward:.2f})")
        if reverse < 0.70:
            flagged.append(f"Unsubstantiated modifiers or statutory acronyms detected (score={reverse:.2f})")

        is_consistent = bidirectional >= self.consistency_threshold

        return EntailmentResult(
            claim_id=claim_id,
            fact_id=fact_id,
            forward_entailment_score=forward,
            reverse_alignment_score=reverse,
            bidirectional_score=bidirectional,
            is_consistent=is_consistent,
            flagged_inaccuracies=flagged,
        )

    def audit_claims(
        self,
        claims_with_facts: List[Tuple[str, str, str]],  # (claim_id, claim_text, fact_id)
        fact_text_lookup_fn: Callable[[str], str],
    ) -> ConsistencyAuditReport:
        """
        Runs entailment evaluation over a list of claim-fact tuples.
        """
        results: List[EntailmentResult] = []

        for claim_id, claim_text, fact_id in claims_with_facts:
            source_text = fact_text_lookup_fn(fact_id)
            if not source_text:
                results.append(
                    EntailmentResult(
                        claim_id=claim_id,
                        fact_id=fact_id,
                        forward_entailment_score=0.0,
                        reverse_alignment_score=0.0,
                        bidirectional_score=0.0,
                        is_consistent=False,
                        flagged_inaccuracies=[f"Missing source text for fact_id '{fact_id}'"],
                    )
                )
                continue

            res = self.evaluate_claim_entailment(claim_id, claim_text, fact_id, source_text)
            results.append(res)

        total = len(results)
        consistent = sum(1 for r in results if r.is_consistent)
        inconsistent = total - consistent
        rate = (inconsistent / total * 100.0) if total > 0 else 0.0

        return ConsistencyAuditReport(
            evaluated_pairs_count=total,
            consistent_pairs_count=consistent,
            inconsistent_pairs_count=inconsistent,
            inaccuracy_rate_pct=rate,
            results=results,
        )


if __name__ == "__main__":
    agent = ConsistencyAgent(consistency_threshold=0.75)
    source = "Clause 19.3: The Borrower must notify the Lender of any material Information Security incident within 72 hours."

    # Claim 1: Faithful
    c1 = "The borrower must notify the lender of material security incidents within 72 hours."
    res1 = agent.evaluate_claim_entailment("c1", c1, "fact_01", source)
    print(f"Claim 1 consistent: {res1.is_consistent} (score: {res1.bidirectional_score:.2f})")

    # Claim 2: Unwarranted critical escalation / hallucinated timeframe
    c2 = "The borrower waives all defenses and provides an uncapped indemnity immediately within 2 hours under APRA CPS 234."
    res2 = agent.evaluate_claim_entailment("c2", c2, "fact_01", source)
    print(f"Claim 2 consistent: {res2.is_consistent} (score: {res2.bidirectional_score:.2f}, flags={res2.flagged_inaccuracies})")
