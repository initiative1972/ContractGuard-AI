"""
ContractGuard AI — Layer 2: Context-Aware Augmented RAG Package
"""

from layer2_rag.hybrid_retriever import HybridRetriever, IndexedDocument, RetrievalCandidate
from layer2_rag.reranker import CrossEncoderReranker, ReRankedCandidate
from layer2_rag.dynamic_k import DynamicKSelector, FactReference, FactReferenceSet

__all__ = [
    "HybridRetriever",
    "IndexedDocument",
    "RetrievalCandidate",
    "CrossEncoderReranker",
    "ReRankedCandidate",
    "DynamicKSelector",
    "FactReference",
    "FactReferenceSet",
]
