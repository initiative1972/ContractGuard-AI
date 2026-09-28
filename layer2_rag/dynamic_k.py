"""
ContractGuard AI — Layer 2: Context-Aware Augmented RAG
Module: dynamic_k.py
Purpose: Adaptive candidate selection logic that dynamically tunes Top-K (between 2 and 6)
         based on query token complexity and semantic ambiguity. Emits a FactReferenceSet
         containing exclusively immutable fact_id pointers and clause references (never raw text).
Compliant with: APRA CPG 235 (Context window minimization, zero token waste, pointer-based hydration)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

from layer2_rag.reranker import ReRankedCandidate


@dataclass(frozen=True)
class FactReference:
    """
    Immutable pointer to a verified contract fact chunk.
    Carries zero raw text to prevent server-side memory bloat and context distraction.
    """
    fact_id: str
    relevance_score: float
    rank: int
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fact_id": self.fact_id,
            "relevance_score": round(self.relevance_score, 4),
            "rank": self.rank,
            "metadata": self.metadata,
        }


@dataclass
class FactReferenceSet:
    """
    Structured response emitted by Layer 2 to downstream Layer 3 model orchestration.
    Contains immutable fact pointers, query complexity metrics, and dynamic-K metadata.
    """
    query: str
    query_tokens: int
    dynamic_k: int
    complexity_category: str  # 'SIMPLE', 'STANDARD', 'COMPLEX_MULTI_CLAUSE'
    fact_references: List[FactReference]
    retained_fact_ids: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "query_tokens": self.query_tokens,
            "dynamic_k": self.dynamic_k,
            "complexity_category": self.complexity_category,
            "fact_references": [ref.to_dict() for ref in self.fact_references],
            "retained_fact_ids": self.retained_fact_ids,
        }


class DynamicKSelector:
    """
    Computes query complexity metrics and determines optimal Top-K clamped between [min_k, max_k]
    (default: 2 <= K <= 6).

    Complexity Drivers:
    - Token length of query
    - Multi-entity references (e.g. comparing Borrower vs Guarantor vs Facility Agent)
    - Cross-clause keywords (e.g., 'cross-default', 'indemnity', 'interplay', 'breach', 'conflict')
    - Regulatory regime inquiries ('APRA CPS 234', 'CPG 235', 'ASIC Act s12BF')
    """

    COMPLEXITY_KEYWORDS = {
        "cross-default",
        "conflict",
        "interplay",
        "indemnity",
        "uncapped",
        "superseded",
        "liability",
        "regulatory",
        "breach",
        "subordinated",
        "guarantor",
        "syndicate",
        "sovereignty",
        "failover",
        "unilateral",
        "variation",
    }

    def __init__(self, min_k: int = 2, max_k: int = 6):
        self.min_k = min_k
        self.max_k = max_k

    def calculate_query_complexity(self, query: str) -> Tuple[int, str]:
        """
        Analyzes query structure and returns (token_count, complexity_category).
        """
        tokens = re.findall(r"\b\w+\b", query.lower())
        token_count = len(tokens)

        # Count complex banking & regulatory keywords
        keyword_hits = sum(1 for t in tokens if t in self.COMPLEXITY_KEYWORDS)

        # Check for multiple section / clause mentions (e.g., 'Clause 14 and Clause 28')
        clause_mentions = len(re.findall(r"\b(?:clause|section|article)\s+[0-9]+", query, re.I))

        if token_count > 25 or keyword_hits >= 3 or clause_mentions >= 2:
            return token_count, "COMPLEX_MULTI_CLAUSE"
        elif token_count > 10 or keyword_hits >= 1 or clause_mentions == 1:
            return token_count, "STANDARD"
        else:
            return token_count, "SIMPLE"

    def determine_dynamic_k(self, query: str, total_available: int) -> int:
        """
        Calculates optimal K clamped strictly between self.min_k and self.max_k.
        """
        token_count, complexity = self.calculate_query_complexity(query)

        if complexity == "COMPLEX_MULTI_CLAUSE":
            raw_k = 6
        elif complexity == "STANDARD":
            raw_k = 4
        else:
            raw_k = 2

        # Scale slightly if query is extraordinarily long (> 30 tokens)
        if token_count > 30:
            raw_k = min(self.max_k, raw_k + 1)

        # Bound by available candidates
        clamped_k = max(self.min_k, min(self.max_k, raw_k, total_available))
        return clamped_k

    def select_fact_references(
        self,
        query: str,
        reranked_candidates: List[ReRankedCandidate],
    ) -> FactReferenceSet:
        """
        Filters re-ranked candidates down to the dynamically calculated Top-K
        and packages them into an immutable FactReferenceSet.
        """
        token_count, complexity = self.calculate_query_complexity(query)
        dynamic_k = self.determine_dynamic_k(query, len(reranked_candidates))

        selected = reranked_candidates[:dynamic_k]

        references: List[FactReference] = []
        for rank, cand in enumerate(selected, start=1):
            ref = FactReference(
                fact_id=cand.fact_id,
                relevance_score=cand.rerank_score,
                rank=rank,
                metadata=cand.metadata,
            )
            references.append(ref)

        retained_ids = [r.fact_id for r in references]

        return FactReferenceSet(
            query=query,
            query_tokens=token_count,
            dynamic_k=dynamic_k,
            complexity_category=complexity,
            fact_references=references,
            retained_fact_ids=retained_ids,
        )


if __name__ == "__main__":
    selector = DynamicKSelector(min_k=2, max_k=6)

    # 1. Simple query -> Dynamic K should be 2
    q1 = "What is the Facility Amount?"
    tok1, comp1 = selector.calculate_query_complexity(q1)
    k1 = selector.determine_dynamic_k(q1, 10)
    print(f"Query 1: '{q1}' -> {comp1} ({tok1} tokens) -> Dynamic-K: {k1}")

    # 2. Complex query -> Dynamic K should be 5 or 6
    q2 = "Analyze the interplay between Clause 14.1 interest cover covenants and Clause 28.3 cross-default triggers with respect to APRA CPG 235 regulatory compliance."
    tok2, comp2 = selector.calculate_query_complexity(q2)
    k2 = selector.determine_dynamic_k(q2, 10)
    print(f"Query 2: '{q2}' -> {comp2} ({tok2} tokens) -> Dynamic-K: {k2}")
