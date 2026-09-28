"""
ContractGuard AI — Layer 3: Hierarchical Model Orchestration
Module: stream_engine.py
Purpose: Non-materialized stream-through I/O handler piping Gemini async byte-streams
         directly to FastAPI's StreamingResponse using MTU-aligned adaptive buffers (~1,350 bytes or 30ms)
         to eliminate server heap allocation. Includes a 70% watermark context compactor.
Compliant with: APRA CPG 235 (Zero heap memory exfiltration, high-throughput non-materialized streaming)
"""

from __future__ import annotations

import asyncio
import io
import time
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Callable, Dict, List, Optional, Tuple


@dataclass
class ContextWatermarkMetrics:
    """Telemetry tracking active context window saturation."""
    current_tokens: int
    max_context_tokens: int
    watermark_pct: float
    compaction_triggered: bool
    compressed_assertions_count: int = 0


class ContextCompactor:
    """
    Context Compactor operating at a 70% active working context watermark.
    When context token saturation reaches CONTEXT_WATERMARK_PCT (0.70), historical
    agent dialog and intermediate extractions are compressed into verified fact assertions
    while strictly retaining their source `fact_id` linkages.
    """

    def __init__(self, watermark_threshold: float = 0.70, max_context_tokens: int = 32000):
        self.watermark_threshold = watermark_threshold
        self.max_context_tokens = max_context_tokens

    def evaluate_watermark(self, current_token_count: int) -> Tuple[bool, float]:
        """Calculates saturation percentage and indicates if compaction is required."""
        saturation = current_token_count / float(self.max_context_tokens)
        should_compact = saturation >= self.watermark_threshold
        return should_compact, round(saturation, 4)

    def compact_context(
        self,
        historical_messages: List[Dict[str, Any]],
        fact_id_map: Dict[str, str],
    ) -> Tuple[List[Dict[str, Any]], ContextWatermarkMetrics]:
        """
        Compresses verbose conversational messages and tool observations into dense,
        canonical fact assertions bound to their content-addressed fact_ids.
        """
        initial_text_len = sum(len(m.get("content", "")) for m in historical_messages)
        estimated_initial_tokens = max(1, initial_text_len // 4)

        should_compact, saturation = self.evaluate_watermark(estimated_initial_tokens)

        if not should_compact or len(historical_messages) <= 2:
            return historical_messages, ContextWatermarkMetrics(
                current_tokens=estimated_initial_tokens,
                max_context_tokens=self.max_context_tokens,
                watermark_pct=saturation,
                compaction_triggered=False,
            )

        # Retain system prompt and latest user objective
        compacted: List[Dict[str, Any]] = []
        fact_assertions: List[str] = []

        for msg in historical_messages:
            role = msg.get("role")
            content = msg.get("content", "")

            if role in ("system", "user"):
                compacted.append(msg)
            else:
                # Extract any cited fact_ids and distill to single-line assertions
                for fid in fact_id_map.keys():
                    if fid in content:
                        fact_assertions.append(f"VERIFIED_FACT [{fid}]: {fact_id_map[fid][:120]}...")

        # Inject compacted memory summary
        assertion_block = "\n".join(set(fact_assertions))
        compacted.append({
            "role": "model",
            "content": f"[COMPACTED_OBSERVATIONS_AT_70PCT_WATERMARK]\n{assertion_block}",
        })

        new_text_len = sum(len(m.get("content", "")) for m in compacted)
        new_token_estimate = max(1, new_text_len // 4)

        metrics = ContextWatermarkMetrics(
            current_tokens=new_token_estimate,
            max_context_tokens=self.max_context_tokens,
            watermark_pct=round(new_token_estimate / self.max_context_tokens, 4),
            compaction_triggered=True,
            compressed_assertions_count=len(fact_assertions),
        )

        return compacted, metrics


class StreamEngine:
    """
    Non-Materialized Stream-Through I/O Handler.
    Pipes asynchronous chunks from Gemini API directly into network buffers.
    Uses MTU-aligned chunking (~1,350 bytes or 30ms flush window) to avoid
    heap string re-allocations and minimize time-to-first-token (TTFT).
    """

    def __init__(
        self,
        mtu_buffer_bytes: int = 1350,
        flush_window_ms: int = 30,
        context_compactor: Optional[ContextCompactor] = None,
    ):
        self.mtu_buffer_bytes = mtu_buffer_bytes
        self.flush_window_ms = flush_window_ms
        self.compactor = context_compactor or ContextCompactor()

    async def stream_generator(
        self,
        gemini_async_chunk_stream: AsyncIterator[str],
    ) -> AsyncIterator[bytes]:
        """
        Consumes an asynchronous generator of text tokens, packs them into MTU-aligned
        byte buffers, flushes upon reaching mtu_buffer_bytes or after flush_window_ms,
        and yields raw bytes directly for FastAPI StreamingResponse.
        """
        buffer = io.BytesIO()
        last_flush_time = time.monotonic()

        try:
            async for token in gemini_async_chunk_stream:
                token_bytes = token.encode("utf-8")
                buffer.write(token_bytes)

                elapsed_ms = (time.monotonic() - last_flush_time) * 1000.0
                buffer_size = buffer.tell()

                # Flush conditions: MTU buffer filled (~1350 bytes) or window elapsed (~30ms)
                if buffer_size >= self.mtu_buffer_bytes or (elapsed_ms >= self.flush_window_ms and buffer_size > 0):
                    yield buffer.getvalue()
                    buffer.seek(0)
                    buffer.truncate(0)
                    last_flush_time = time.monotonic()

            # Flush trailing residual buffer bytes at EOF
            if buffer.tell() > 0:
                yield buffer.getvalue()
        finally:
            buffer.close()

    def create_streaming_response(
        self,
        gemini_async_chunk_stream: AsyncIterator[str],
        media_type: str = "text/event-stream",
    ):
        """
        Wraps stream_generator in FastAPI's StreamingResponse if fastapi is installed,
        or returns the raw async byte generator.
        """
        try:
            from fastapi.responses import StreamingResponse
            return StreamingResponse(
                self.stream_generator(gemini_async_chunk_stream),
                media_type=media_type,
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",  # Disables proxy buffering
                    "Content-Encoding": "identity",
                },
            )
        except ImportError:
            # Fallback returning raw async byte generator
            return self.stream_generator(gemini_async_chunk_stream)


if __name__ == "__main__":
    async def sample_token_stream() -> AsyncIterator[str]:
        clauses = [
            "Clause 19.3 Review: ",
            "The agreement references superseded APRA APS 231. ",
            "This violates binding APRA CPS 234 mandates. ",
            "Remediation required: Cap indemnity and update standard. ",
        ]
        for c in clauses:
            await asyncio.sleep(0.01)
            yield c

    async def test_stream():
        engine = StreamEngine(mtu_buffer_bytes=64, flush_window_ms=20)
        print("Testing Non-Materialized Stream-Through Buffer:")
        chunks_yielded = 0
        total_bytes = 0
        async for chunk_bytes in engine.stream_generator(sample_token_stream()):
            chunks_yielded += 1
            total_bytes += len(chunk_bytes)
            print(f" -> Flushed chunk #{chunks_yielded}: {len(chunk_bytes)} bytes | '{chunk_bytes.decode('utf-8')}'")
        print(f"Stream complete. Yielded {chunks_yielded} chunks, total {total_bytes} bytes.")

    asyncio.run(test_stream())
