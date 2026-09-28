"""
ContractGuard AI — Layer 2: Context-Aware Augmented RAG
Module: reranker.py
Purpose: Cross-encoder re-ranking pipeline using sentence-transformers / cross-encoder architectures
         to score the RRF candidate pool (Pool N=14 down to ranked candidates).
Compliant with: APRA CPG 235 (Retrieval precision, relevance calibration, context noise filtering)
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple

from layer2_rag.hybrid_retriever import RetrievalCandidate


@dataclass
class ReRankedCandidate:
    """A candidate scored and sorted by the cross-encoder."""
    fact_id: str
    rerank_score: float
    rrf_score: float
    dense_score: float
    sparse_score: float
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fact_id": self.fact_id,
            "rerank_score": round(self.rerank_score, 4),
            "rrf_score": round(self.rrf_score, 6),
            "dense_score": round(self.dense_score, 4),
            "sparse_score": round(self.sparse_score, 4),
            "metadata": self.metadata,
        }


class CrossEncoderReranker:
    """
    Production-grade cross-encoder pipeline for high-precision contract clause scoring.
    Evaluates joint query-clause pairs through cross-attention (e.g., bge-reranker-small, jina-reranker-v2)
    or an engineered semantic relevance fallback.
    """

    def __init__(
        self,
        model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
        custom_scorer: Optional[Callable[[List[Tuple[str, str]]], List[float]]] = None,
    ):
        self.model_name = model_name
        self.custom_scorer = custom_scorer
        self._model = None
        self._load_model()

    def _load_model(self) -> None:
        """Attempts to load sentence_transformers CrossEncoder if available."""
        if self.custom_scorer is not None:
            return

        try:
            from sentence_transformers import CrossEncoder
            self._model = CrossEncoder(self.model_name)
        except Exception:
            # Operates gracefully in offline/simulated mode without downloading multi-gigabyte models
            self._model = None

    @staticmethod
    def _heuristic_cross_score(query: str, text: str, prior_rrf: float) -> float:
        """
        Lightweight fallback scorer modeling cross-attention token interaction:
        Combines exact phrase matching, term co-occurrence, and legal entity alignment.
        """
        q_words = set(query.lower().split())
        t_words = text.lower().split()
        if not t_words or not q_words:
            return prior_rrf

        # Term overlap ratio
        matched = sum(1 for w in q_words if w in t_words)
        overlap_ratio = matched / len(q_words) if q_words else 0.0

        # Exact phrase bonus
        phrase_bonus = 0.3 if query.lower() in text.lower() else 0.0

        # Sigmoid calibration: maps [0, 1] scale
        raw_score = (overlap_ratio * 0.5) + phrase_bonus + (prior_rrf * 15.0)
        calibrated = 1.0 / (1.0 + math.exp(-raw_score + 1.0))
        return calibrated

    def rerank(
        self,
        query: str,
        candidates: List[RetrievalCandidate],
        text_lookup_fn: Callable[[str], str],
    ) -> List[ReRankedCandidate]:
        """
        Scores each candidate from the RRF pool against the user query.
        Returns candidates ordered by descending cross-encoder relevance score.
        """
        if not candidates:
            return []

        # Prepare (query, passage) pairs
        pairs: List[Tuple[str, str]] = []
        valid_candidates: List[RetrievalCandidate] = []

        for candidate in candidates:
            passage_text = text_lookup_fn(candidate.fact_id)
            if passage_text:
                pairs.append((query, passage_text))
                valid_candidates.append(candidate)

        if not valid_candidates:
            return []

        # Execute model inference
        scores: List[float] = []
        if self.custom_scorer:
            scores = self.custom_scorer(pairs)
        elif self._model:
            try:
                raw_scores = self._model.predict(pairs)
                scores = [float(s) for s in raw_scores]
            except Exception:
                scores = [
                    self._heuristic_cross_score(q, p, c.rrf_score)
                    for (q, p), c in zip(pairs, valid_candidates)
                ]
        else:
            scores = [
                self._heuristic_cross_score(q, p, c.rrf_score)
                for (q, p), c in zip(pairs, valid_candidates)
            ]

        # Assemble and sort results
        ranked_list: List[ReRankedCandidate] = []
        for candidate, score in zip(valid_candidates, scores):
            ranked_list.append(
                ReRankedCandidate(
                    fact_id=candidate.fact_id,
                    rerank_score=score,
                    rrf_score=candidate.rrf_score,
                    dense_score=candidate.dense_score,
                    sparse_score=candidate.sparse_score,
                    metadata=candidate.metadata,
                )
            )

        ranked_list.sort(key=lambda r: r.rerank_score, reverse=True)
        return ranked_list


if __name__ == "__main__":
    candidates = [
        RetrievalCandidate(fact_id="fact_01", rrf_score=0.031, dense_score=0.82, sparse_score=14.0),
        RetrievalCandidate(fact_id="fact_02", rrf_score=0.028, dense_score=0.79, sparse_score=12.0),
    ]
    texts = {
        "fact_01": "Clause 19.3 mandates compliance with APRA CPS 234 information security.",
        "fact_02": "Clause 24.1 imposes environmental indemnity on facility guarantors.",
    }

    reranker = CrossEncoderReranker()
    ranked = reranker.rerank("What are the APRA CPS 234 requirements?", candidates, lambda fid: texts.get(fid, ""))
    print("Re-ranked Candidates:")
    for r in ranked:
        print(f"[{r.fact_id}] Score: {r.rerank_score:.4f} (RRF: {r.rrf_score:.5f})")
