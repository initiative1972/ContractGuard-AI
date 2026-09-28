"""
ContractGuard AI — Layer 2: Context-Aware Augmented RAG
Module: hybrid_retriever.py
Purpose: Dual-path hybrid retrieval engine combining dense vector embeddings (text-embedding-004)
         with sparse lexical keyword frequency (Rank-BM25), merged using Reciprocal Rank Fusion (RRF, k=60).
         Supports metadata pre-filtering (e.g., jurisdiction, governing_law, contract_type, clause_range).
Compliant with: APRA CPG 235 (Traceable chunk retrieval, noise elimination, context token reduction)
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set, Tuple


@dataclass
class IndexedDocument:
    """Document chunk registered with the hybrid retriever."""
    fact_id: str
    clause_number: str
    clause_title: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    dense_vector: Optional[List[float]] = None
    tokenized_words: List[str] = field(default_factory=list)


@dataclass
class RetrievalCandidate:
    """Individual scored retrieval candidate."""
    fact_id: str
    dense_rank: Optional[int] = None
    sparse_rank: Optional[int] = None
    dense_score: float = 0.0
    sparse_score: float = 0.0
    rrf_score: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fact_id": self.fact_id,
            "dense_rank": self.dense_rank,
            "sparse_rank": self.sparse_rank,
            "dense_score": round(self.dense_score, 4),
            "sparse_score": round(self.sparse_score, 4),
            "rrf_score": round(self.rrf_score, 6),
            "metadata": self.metadata,
        }


class HybridRetriever:
    """
    Combines dense vector similarity with Rank-BM25 sparse lexical search.
    Applies metadata pre-filters before scoring to ensure CPS 234 information segregation
    and merges ranked candidate lists using Reciprocal Rank Fusion:
        RRF_Score(d) = sum_{m in models} 1 / (k + rank_m(d)), with k=60
    """

    def __init__(
        self,
        rrf_k: int = 60,
        dense_embed_fn: Optional[Callable[[List[str]], List[List[float]]]] = None,
    ):
        self.rrf_k = rrf_k
        self.dense_embed_fn = dense_embed_fn
        self._corpus: Dict[str, IndexedDocument] = {}
        self._bm25_model = None
        self._corpus_order: List[str] = []

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        """Normalized tokenization for lexical BM25 matching."""
        return re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())

    @staticmethod
    def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Standard cosine distance calculation."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot / (norm_a * norm_b)

    def add_document(
        self,
        fact_id: str,
        clause_number: str,
        clause_title: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        dense_vector: Optional[List[float]] = None,
    ) -> None:
        """Indexes an individual clause chunk into the hybrid store."""
        tokenized = self._tokenize(f"{clause_title} {text}")
        doc = IndexedDocument(
            fact_id=fact_id,
            clause_number=clause_number,
            clause_title=clause_title,
            text=text,
            metadata=metadata or {},
            dense_vector=dense_vector,
            tokenized_words=tokenized,
        )
        self._corpus[fact_id] = doc
        if fact_id not in self._corpus_order:
            self._corpus_order.append(fact_id)
        self._bm25_model = None  # Invalidate cached BM25 index

    def _build_bm25_index(self, filtered_ids: List[str]) -> Tuple[Any, List[str]]:
        """Constructs or retrieves a Rank-BM25 model over filtered documents."""
        try:
            from rank_bm25 import BM25Okapi
            tokenized_corpus = [self._corpus[fid].tokenized_words for fid in filtered_ids]
            bm25 = BM25Okapi(tokenized_corpus) if tokenized_corpus else None
            return bm25, filtered_ids
        except ImportError:
            # Zero-dependency TF-IDF fallback if rank_bm25 package is not available
            return None, filtered_ids

    def _score_bm25_fallback(self, query_tokens: List[str], filtered_ids: List[str]) -> List[Tuple[str, float]]:
        """Zero-dependency lexical term-overlap scorer."""
        scores: List[Tuple[str, float]] = []
        for fid in filtered_ids:
            doc_tokens = set(self._corpus[fid].tokenized_words)
            if not doc_tokens:
                scores.append((fid, 0.0))
                continue
            matches = sum(1 for q in query_tokens if q in doc_tokens)
            scores.append((fid, float(matches)))
        return scores

    def search(
        self,
        query: str,
        metadata_filters: Optional[Dict[str, Any]] = None,
        query_vector: Optional[List[float]] = None,
        candidate_pool_size: int = 14,
    ) -> List[RetrievalCandidate]:
        """
        Executes hybrid retrieval:
        1. Evaluates metadata pre-filters (CPS 234 information boundaries).
        2. Evaluates dense vector cosine similarity (text-embedding-004).
        3. Evaluates sparse lexical BM25 matching.
        4. Fuses rankings using Reciprocal Rank Fusion (RRF k=60).
        5. Returns top candidate_pool_size candidates for re-ranking.
        """
        if not self._corpus:
            return []

        # Step 1: Metadata Pre-Filtering
        filtered_ids: List[str] = []
        for fid, doc in self._corpus.items():
            match = True
            if metadata_filters:
                for filter_key, expected_val in metadata_filters.items():
                    doc_val = doc.metadata.get(filter_key)
                    if isinstance(expected_val, list):
                        if doc_val not in expected_val:
                            match = False
                            break
                    elif doc_val != expected_val:
                        match = False
                        break
            if match:
                filtered_ids.append(fid)

        if not filtered_ids:
            return []

        # Step 2: Dense Vector Path (text-embedding-004)
        dense_scores: Dict[str, float] = {}
        if query_vector is None and self.dense_embed_fn:
            try:
                query_vector = self.dense_embed_fn([query])[0]
            except Exception:
                query_vector = None

        if query_vector:
            for fid in filtered_ids:
                doc_vec = self._corpus[fid].dense_vector
                if doc_vec:
                    sim = self._cosine_similarity(query_vector, doc_vec)
                else:
                    sim = 0.0
                dense_scores[fid] = sim
        else:
            # Fallback: pseudo-dense score based on clause heading overlap
            for fid in filtered_ids:
                title = self._corpus[fid].clause_title.lower()
                overlap = sum(1 for w in self._tokenize(query) if w in title)
                dense_scores[fid] = 0.5 + min(0.45, overlap * 0.15)

        # Dense ranking
        dense_sorted = sorted(filtered_ids, key=lambda fid: dense_scores.get(fid, 0.0), reverse=True)
        dense_rank_map = {fid: rank + 1 for rank, fid in enumerate(dense_sorted)}

        # Step 3: Sparse Lexical Path (BM25)
        query_tokens = self._tokenize(query)
        sparse_scores: Dict[str, float] = {}

        bm25, valid_ids = self._build_bm25_index(filtered_ids)
        if bm25 and query_tokens:
            doc_scores = bm25.get_scores(query_tokens)
            for fid, score in zip(valid_ids, doc_scores):
                sparse_scores[fid] = float(score)
        else:
            fallback_scores = self._score_bm25_fallback(query_tokens, filtered_ids)
            for fid, score in fallback_scores:
                sparse_scores[fid] = score

        # Sparse ranking
        sparse_sorted = sorted(filtered_ids, key=lambda fid: sparse_scores.get(fid, 0.0), reverse=True)
        sparse_rank_map = {fid: rank + 1 for rank, fid in enumerate(sparse_sorted)}

        # Step 4: Reciprocal Rank Fusion (RRF k=60)
        candidates: List[RetrievalCandidate] = []
        for fid in filtered_ids:
            d_rank = dense_rank_map.get(fid, len(filtered_ids) + 1)
            s_rank = sparse_rank_map.get(fid, len(filtered_ids) + 1)

            # RRF Formula: sum(1 / (k + rank))
            rrf = (1.0 / (self.rrf_k + d_rank)) + (1.0 / (self.rrf_k + s_rank))

            candidate = RetrievalCandidate(
                fact_id=fid,
                dense_rank=d_rank,
                sparse_rank=s_rank,
                dense_score=dense_scores.get(fid, 0.0),
                sparse_score=sparse_scores.get(fid, 0.0),
                rrf_score=rrf,
                metadata=self._corpus[fid].metadata,
            )
            candidates.append(candidate)

        # Sort by final RRF score descending
        candidates.sort(key=lambda c: c.rrf_score, reverse=True)

        return candidates[:candidate_pool_size]


if __name__ == "__main__":
    retriever = HybridRetriever(rrf_k=60)
    retriever.add_document(
        fact_id="fact_001",
        clause_number="14.3",
        clause_title="Lineage and Audit",
        text="The Borrower must maintain permanent electronic general ledger reconciliation logs with complete audit trails under APRA CPG 235.",
        metadata={"jurisdiction": "AU-NSW", "governing_law": "Common Law"},
    )
    retriever.add_document(
        fact_id="fact_002",
        clause_number="19.3",
        clause_title="Prudential Compliance",
        text="The Borrower warrants compliance with superseded APRA Prudential Standard APS 231 neglecting current binding mandates under APRA CPS 234.",
        metadata={"jurisdiction": "AU-NSW", "governing_law": "Common Law"},
    )
    retriever.add_document(
        fact_id="fact_003",
        clause_number="24.1",
        clause_title="Indemnity Liabilities",
        text="Uncapped environmental indemnity surviving facility termination.",
        metadata={"jurisdiction": "AU-VIC", "governing_law": "Common Law"},
    )

    results = retriever.search(
        query="APRA CPS 234 information security compliance",
        metadata_filters={"jurisdiction": "AU-NSW"},
    )
    print("Hybrid Search Results with RRF (k=60):")
    for r in results:
        print(f"[{r.fact_id}] RRF: {r.rrf_score:.6f} | Dense Rank: {r.dense_rank} | Sparse Rank: {r.sparse_rank}")
