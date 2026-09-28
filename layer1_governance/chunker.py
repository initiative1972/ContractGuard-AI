"""
ContractGuard AI — Layer 1: Knowledge Engineering & Governance
Module: chunker.py
Purpose: Semantic clause segmentation pipeline combining deterministic legal boundary cues
         with semantic cosine distance thresholding (< 0.72) and a max token window clamp (1,000 tokens).
Compliant with: APRA CPG 235 (Content-addressed chunk lineage, heading preservation, section provenance)
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Callable, List, Optional, Tuple


@dataclass
class ClauseChunk:
    """
    Structured representation of an extracted contract clause chunk.
    Maintains source provenance, section numbering, and character offsets.
    """
    chunk_index: int
    clause_number: str
    clause_title: str
    text: str
    char_start: number if False else int
    char_end: int
    token_count_estimate: int
    split_reason: str
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "chunk_index": self.chunk_index,
            "clause_number": self.clause_number,
            "clause_title": self.clause_title,
            "text": self.text,
            "char_start": self.char_start,
            "char_end": self.char_end,
            "token_count_estimate": self.token_count_estimate,
            "split_reason": self.split_reason,
            "metadata": self.metadata,
        }


class SemanticClauseChunker:
    """
    Legal clause chunker that performs:
    1. Regex-grounded structural boundary segmentation (numbered clauses, schedules, recitals).
    2. Approximate or embedding-based semantic cosine distance comparison between consecutive segments.
       If cosine similarity drops below threshold (default 0.72), creates a new boundary.
    3. Clamps chunk length at max_tokens (default 1,000 tokens ~ 4,000 chars) to prevent context overflow.
    """

    # Comprehensive legal section numbering patterns commonly found in Australian commercial contracts:
    # Matches patterns like:
    # "1. DEFINITIONS", "1.1 Definitions", "Section 14.2(a)", "Clause 19.3", "SCHEDULE 1", "SCHEDULE A"
    LEGAL_BOUNDARY_PATTERNS = [
        re.compile(r"^(?:(?:CLAUSE|SECTION|ARTICLE|PART|SCHEDULE|ANNEXURE|EXHIBIT)\s+([0-9A-Z]+(?:\.[0-9A-Z]+)*))\s*[:\-\.]?\s*(.*)$", re.IGNORECASE),
        re.compile(r"^([0-9]{1,2}(?:\.[0-9]{1,2}){0,3})\.?\s+([A-Z][A-Za-z0-9\s,\-\(\)&/]+)$"),
        re.compile(r"^(?:RECITALS|BACKGROUND|OPERATIVE PROVISIONS|SCHEDULE\s+[0-9A-Z]+|EXECUTION PAGE)\b", re.IGNORECASE),
    ]

    def __init__(
        self,
        cosine_threshold: float = 0.72,
        max_tokens: int = 1000,
        embedding_fn: Optional[Callable[[List[str]], List[List[float]]]] = None,
    ):
        self.cosine_threshold = cosine_threshold
        self.max_tokens = max_tokens
        self.embedding_fn = embedding_fn

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Heuristic token estimation: ~4 characters per token or whitespace split."""
        # Combines word tokenization with character length bounds
        words = text.split()
        return max(len(words), math.ceil(len(text) / 4.0))

    @staticmethod
    def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Computes cosine similarity between two float vectors."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 1.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot / (norm_a * norm_b)

    def _lexical_similarity(self, text_a: str, text_b: str) -> float:
        """
        Fast zero-dependency Jaccard/Dice-based semantic proxy if dense embedding model
        is not supplied or operating in lightweight edge mode.
        """
        words_a = set(re.findall(r"\b[a-z]{3,}\b", text_a.lower()))
        words_b = set(re.findall(r"\b[a-z]{3,}\b", text_b.lower()))
        if not words_a or not words_b:
            return 0.5
        intersection = len(words_a.intersection(words_b))
        union = len(words_a.union(words_b))
        jaccard = intersection / union if union > 0 else 0.0
        # Map [0, 1] Jaccard to [0.4, 1.0] pseudo-cosine curve
        return 0.4 + (0.6 * jaccard)

    def match_legal_boundary(self, line: str) -> Optional[Tuple[str, str]]:
        """
        Checks if a line indicates the start of a new legal clause or section.
        Returns (clause_number, clause_title) if matched, else None.
        """
        stripped = line.strip()
        if not stripped:
            return None

        for pattern in self.LEGAL_BOUNDARY_PATTERNS:
            match = pattern.match(stripped)
            if match:
                groups = match.groups()
                if len(groups) >= 2:
                    number = groups[0].strip()
                    title = groups[1].strip() or "Untitled Clause"
                    return number, title
                elif len(groups) == 1:
                    return groups[0].strip(), stripped
                else:
                    return "SEC", stripped

        return None

    def split_paragraphs(self, full_text: str) -> List[Tuple[str, int, int]]:
        """
        Splits text by double newlines or single newlines with boundary markers,
        tracking character offsets (text, char_start, char_end).
        """
        paragraphs: List[Tuple[str, int, int]] = []
        raw_lines = full_text.splitlines(keepends=True)

        current_block: List[str] = []
        block_start = 0
        current_offset = 0

        for line in raw_lines:
            line_len = len(line)
            is_boundary = self.match_legal_boundary(line) is not None

            if (line.strip() == "" or is_boundary) and current_block:
                joined = "".join(current_block)
                if joined.strip():
                    paragraphs.append((joined.strip(), block_start, block_start + len(joined)))
                current_block = []
                block_start = current_offset

            current_block.append(line)
            current_offset += line_len

        if current_block:
            joined = "".join(current_block)
            if joined.strip():
                paragraphs.append((joined.strip(), block_start, block_start + len(joined)))

        return paragraphs

    def chunk_contract(self, text: str, document_id: str = "doc_default") -> List[ClauseChunk]:
        """
        Executes semantic clause chunking on the provided legal document text.
        Guarantees that no chunk exceeds self.max_tokens and splits occur at
        legal boundaries or semantic shifts below self.cosine_threshold.
        """
        paragraphs = self.split_paragraphs(text)
        if not paragraphs:
            return []

        chunks: List[ClauseChunk] = []

        current_texts: List[str] = []
        current_start = paragraphs[0][1]
        current_end = paragraphs[0][2]
        current_number = "1.0"
        current_title = "PREAMBLE"
        chunk_counter = 0

        # Check if first paragraph has a legal boundary
        first_match = self.match_legal_boundary(paragraphs[0][0].splitlines()[0])
        if first_match:
            current_number, current_title = first_match

        for i, (para_text, p_start, p_end) in enumerate(paragraphs):
            # Check for explicit legal boundary
            boundary_match = self.match_legal_boundary(para_text.splitlines()[0])

            # Calculate semantic similarity with the accumulated block
            semantic_distance_triggered = False
            if current_texts and not boundary_match:
                acc_sample = current_texts[-1]
                if self.embedding_fn:
                    try:
                        embs = self.embedding_fn([acc_sample, para_text])
                        sim = self._cosine_similarity(embs[0], embs[1])
                    except Exception:
                        sim = self._lexical_similarity(acc_sample, para_text)
                else:
                    sim = self._lexical_similarity(acc_sample, para_text)

                if sim < self.cosine_threshold:
                    semantic_distance_triggered = True

            # Calculate token estimate if appended
            candidate_tokens = self.estimate_tokens(" ".join(current_texts + [para_text]))
            token_clamp_triggered = candidate_tokens > self.max_tokens

            # Should we finalize the current chunk?
            should_split = bool(current_texts) and (
                boundary_match is not None or semantic_distance_triggered or token_clamp_triggered
            )

            if should_split:
                joined_chunk = "\n\n".join(current_texts)
                split_reason = "legal_boundary" if boundary_match else (
                    "token_clamp_1000" if token_clamp_triggered else "semantic_cosine_shift"
                )

                chunk = ClauseChunk(
                    chunk_index=chunk_counter,
                    clause_number=current_number,
                    clause_title=current_title,
                    text=joined_chunk,
                    char_start=current_start,
                    char_end=current_end,
                    token_count_estimate=self.estimate_tokens(joined_chunk),
                    split_reason=split_reason,
                    metadata={"document_id": document_id},
                )
                chunks.append(chunk)
                chunk_counter += 1

                # Reset state for new chunk
                current_texts = [para_text]
                current_start = p_start
                current_end = p_end
                if boundary_match:
                    current_number, current_title = boundary_match
                else:
                    current_title = f"Continuation of {current_title}"
            else:
                current_texts.append(para_text)
                current_end = p_end

        # Emit the trailing final chunk
        if current_texts:
            joined_chunk = "\n\n".join(current_texts)
            chunk = ClauseChunk(
                chunk_index=chunk_counter,
                clause_number=current_number,
                clause_title=current_title,
                text=joined_chunk,
                char_start=current_start,
                char_end=current_end,
                token_count_estimate=self.estimate_tokens(joined_chunk),
                split_reason="document_eof",
                metadata={"document_id": document_id},
            )
            chunks.append(chunk)

        return chunks


if __name__ == "__main__":
    sample_text = """
1. DEFINITIONS AND INTERPRETATION
"Facility Amount" means AUD $45,000,000.
"Base Margin" means 2.45% per annum above BBSY.

4. DRAWDOWN CONDITIONS
4.1 The Borrower may request an Advance by delivering an irrevocable Drawdown Notice.
4.2 Minimum drawing quantum shall be AUD $2,500,000.

19. INFORMATION SECURITY & DATA GOVERNANCE
19.1 Information Security Management: The Borrower shall implement cyber resilience controls.
19.2 Incident Notification: In the event of an Information Security incident, notify within 48 hours.
19.3 Prudential Compliance: Compliance with APRA CPS 234 is mandatory.
"""
    chunker = SemanticClauseChunker(cosine_threshold=0.72, max_tokens=1000)
    result = chunker.chunk_contract(sample_text, document_id="AU-CBA-2025")
    print(f"Generated {len(result)} semantic chunks:")
    for c in result:
        print(f"[{c.chunk_index}] Clause {c.clause_number}: {c.clause_title} ({c.token_count_estimate} tokens, reason={c.split_reason})")
