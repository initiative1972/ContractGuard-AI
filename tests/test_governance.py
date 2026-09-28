try:
    import pytest
except ImportError:
    pytest = None

from layer1_governance.chunker import SemanticClauseChunker
from layer1_governance.sanitizer import PIISanitizer
from layer1_governance.fact_store import MmapFactStore
import os
import shutil

SAMPLE_CONTRACT = """
1. DEFINITIONS AND INTERPRETATION
1.1 Definitions
"Facility Amount" means AUD $45,000,000.
"Borrower ABN" means Commonwealth Bank ABN 48 123 123 124.
Borrower Tax File Number TFN: 492 881 029 is recorded.

4. DRAWDOWN CONDITIONS
4.1 The Borrower may request an Advance by delivering an irrevocable Drawdown Notice.
4.2 Minimum drawing quantum shall be AUD $2,500,000.

19. INFORMATION SECURITY & DATA GOVERNANCE
19.1 Information Security Management: The Borrower shall implement cyber resilience controls under APRA CPS 234.
"""

def test_sanitizer_scrubs_abn_and_tfn():
    sanitizer = PIISanitizer(use_spacy=False)
    res = sanitizer.sanitize(SAMPLE_CONTRACT)
    
    # ABN and TFN must not appear in cleartext
    assert "48 123 123 124" not in res.sanitized_text
    assert "492 881 029" not in res.sanitized_text
    assert "{{ENTITY_ABN_1}}" in res.sanitized_text
    assert "{{ENTITY_TFN_1}}" in res.sanitized_text
    assert res.total_redacted_count >= 2

def test_semantic_clause_chunker():
    chunker = SemanticClauseChunker(cosine_threshold=0.72, max_tokens=1000)
    chunks = chunker.chunk_contract(SAMPLE_CONTRACT, document_id="AU-TEST-01")
    
    assert len(chunks) >= 3
    for c in chunks:
        assert c.token_count_estimate <= 1000
        assert c.char_end > c.char_start

def test_mmap_fact_store(tmp_path):
    store_dir = str(tmp_path / "mmap_test")
    store = MmapFactStore(storage_dir=store_dir)
    
    fid = store.put_chunk(
        document_id="AU-TEST-01",
        clause_number="19.1",
        text="The Borrower shall implement cyber resilience controls under APRA CPS 234.",
    )
    
    assert fid.startswith("fact_")
    assert store.contains(fid)
    
    record = store.get_chunk(fid)
    assert record is not None
    assert record.clause_number == "19.1"
    assert "APRA CPS 234" in record.text
    
    store.close()


if __name__ == "__main__":
    import tempfile
    from pathlib import Path
    print("Running Layer 1 Governance Tests...")
    test_sanitizer_scrubs_abn_and_tfn()
    print("✓ test_sanitizer_scrubs_abn_and_tfn PASSED")
    test_semantic_clause_chunker()
    print("✓ test_semantic_clause_chunker PASSED")
    with tempfile.TemporaryDirectory() as td:
        test_mmap_fact_store(Path(td))
    print("✓ test_mmap_fact_store PASSED")
    print("All Layer 1 governance tests successfully verified!")
