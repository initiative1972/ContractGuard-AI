try:
    import pytest
except ImportError:
    pytest = None
from layer2_rag.hybrid_retriever import HybridRetriever
from layer2_rag.reranker import CrossEncoderReranker
from layer2_rag.dynamic_k import DynamicKSelector


def test_hybrid_retriever_metadata_filtering_and_rrf():
    retriever = HybridRetriever(rrf_k=60)
    retriever.add_document(
        fact_id="fact_cba_01",
        clause_number="19.3",
        clause_title="Prudential Compliance",
        text="The Borrower warrants compliance with superseded APRA APS 231 instead of APRA CPS 234.",
        metadata={"jurisdiction": "AU-NSW", "contract_type": "Commercial Loan"},
    )
    retriever.add_document(
        fact_id="fact_cba_02",
        clause_number="24.1",
        clause_title="Environmental Indemnity",
        text="Uncapped retroactive environmental indemnity on guarantor without notice.",
        metadata={"jurisdiction": "AU-NSW", "contract_type": "Commercial Loan"},
    )
    retriever.add_document(
        fact_id="fact_cba_03",
        clause_number="8.2",
        clause_title="Offshore Routing",
        text="Offshore data routing to Frankfurt or Singapore without Customer Bank consent.",
        metadata={"jurisdiction": "AU-VIC", "contract_type": "SaaS"},
    )

    # Test metadata filter: Only AU-NSW
    results = retriever.search(
        query="APRA CPS 234 compliance defect",
        metadata_filters={"jurisdiction": "AU-NSW"},
        candidate_pool_size=10,
    )

    assert len(results) == 2
    assert all(r.metadata["jurisdiction"] == "AU-NSW" for r in results)
    assert results[0].fact_id == "fact_cba_01"  # Highest lexical & semantic match
    assert results[0].rrf_score > 0.0


def test_reranker_and_dynamic_k_pipeline():
    retriever = HybridRetriever(rrf_k=60)
    for i in range(1, 10):
        retriever.add_document(
            fact_id=f"fact_{i:03d}",
            clause_number=f"Clause {i}.0",
            clause_title=f"General Terms {i}",
            text=f"Commercial lending provisions clause {i} regarding interest rate margin BBSY and default risk.",
            metadata={"jurisdiction": "AU-NSW"},
        )

    candidates = retriever.search("interest rate margin and cross-default risk")
    assert len(candidates) > 0

    reranker = CrossEncoderReranker()
    reranked = reranker.rerank(
        query="interest rate margin and cross-default risk",
        candidates=candidates,
        text_lookup_fn=lambda fid: f"Text for {fid}",
    )
    assert len(reranked) == len(candidates)
    assert reranked[0].rerank_score >= reranked[-1].rerank_score

    # Test Dynamic-K: Simple query yields K=2
    selector = DynamicKSelector(min_k=2, max_k=6)
    simple_ref_set = selector.select_fact_references("What is BBSY?", reranked)
    assert simple_ref_set.dynamic_k == 2
    assert len(simple_ref_set.fact_references) == 2
    assert len(simple_ref_set.retained_fact_ids) == 2

    # Test Dynamic-K: Complex multi-clause query yields K between 4 and 6
    complex_query = (
        "Analyze the cross-default liability conflict between Clause 14 interest covenants "
        "and Clause 28 default triggers with respect to APRA regulatory compliance."
    )
    complex_ref_set = selector.select_fact_references(complex_query, reranked)
    assert 4 <= complex_ref_set.dynamic_k <= 6
    assert complex_ref_set.complexity_category == "COMPLEX_MULTI_CLAUSE"
    # Verify the output is a FactReferenceSet containing only fact_id pointers, not raw text
    for ref in complex_ref_set.fact_references:
        assert hasattr(ref, "fact_id")
        assert not hasattr(ref, "raw_text")


if __name__ == "__main__":
    print("Running Layer 2 RAG Tests...")
    test_hybrid_retriever_metadata_filtering_and_rrf()
    print("✓ test_hybrid_retriever_metadata_filtering_and_rrf PASSED")
    test_reranker_and_dynamic_k_pipeline()
    print("✓ test_reranker_and_dynamic_k_pipeline PASSED")
    print("All Layer 2 RAG tests successfully verified!")
