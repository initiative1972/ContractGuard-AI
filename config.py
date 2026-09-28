"""
ContractGuard AI — System Configuration Module
Architecture: 4-Layer Enterprise Contract Review System for Australian Banking
Compliant with: APRA CPS 234 (InfoSec), APRA CPG 235 (Data Risk), Privacy Act 1988 (APPs)
"""

import os
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Strongly-typed runtime configuration backed by environment variables (.env).
    Enforces architectural invariants and regulatory safety bounds.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # --------------------------------------------------------------------------
    # Foundation: API Credentials & Host Binding
    # --------------------------------------------------------------------------
    GEMINI_API_KEY: str = Field(
        default="",
        description="Google Gemini API Key for model inference and vector embeddings",
    )
    APP_ENV: str = Field(
        default="development",
        description="Runtime environment: 'development', 'staging', 'production'",
    )
    APP_PORT: int = Field(
        default=3000,
        description="Dev server and FastAPI application port",
    )
    APP_HOST: str = Field(
        default="0.0.0.0",
        description="Host interface for server bindings",
    )

    # --------------------------------------------------------------------------
    # Layer 3: Model Routing & Context Window Governance
    # --------------------------------------------------------------------------
    GEMINI_FLASH_MODEL: str = Field(
        default="gemini-2.5-flash",
        description="High-speed model for clause extraction, PII tokenization, and schema validation",
    )
    GEMINI_PRO_MODEL: str = Field(
        default="gemini-2.5-pro",
        description="Flagship model for deep legal risk synthesis, ambiguity, and liability conflict analysis",
    )
    CONTEXT_WATERMARK_PCT: float = Field(
        default=0.70,
        ge=0.10,
        le=0.95,
        description="Context compaction watermark (70% active working context trigger)",
    )
    MTU_STREAM_BUFFER_BYTES: int = Field(
        default=1350,
        description="MTU-aligned buffer size (~1,350 bytes) for non-materialized streaming",
    )
    STREAM_FLUSH_WINDOW_MS: int = Field(
        default=30,
        description="Max flush latency window in milliseconds for token stream piping",
    )
    ASYNC_DAG_MAX_WORKERS: int = Field(
        default=4,
        description="Maximum concurrent asynchronous tasks in DAG plan-then-execute engine",
    )

    # --------------------------------------------------------------------------
    # Layer 1: Knowledge Engineering & PII Governance
    # --------------------------------------------------------------------------
    SEMANTIC_COSINE_THRESHOLD: float = Field(
        default=0.72,
        ge=0.0,
        le=1.0,
        description="Cosine similarity threshold for clause boundary semantic splitting",
    )
    MAX_CHUNK_TOKENS: int = Field(
        default=1000,
        description="Maximum clamped token window per contract clause chunk",
    )
    PII_PSEUDONYMIZATION_ENABLED: bool = Field(
        default=True,
        description="Mandatory APRA CPS 234 / Privacy Act 1988 client-side PII scrubbing switch",
    )
    MMAP_STORE_DIRECTORY: str = Field(
        default="./data/mmap_store",
        description="Filesystem location for mmap-backed binary chunk payloads and sparse offset index",
    )

    # --------------------------------------------------------------------------
    # Layer 2: Hybrid Augmented RAG (Dense + Lexical BM25)
    # --------------------------------------------------------------------------
    DENSE_EMBEDDING_MODEL: str = Field(
        default="text-embedding-004",
        description="768-dimensional dense vector embedding model",
    )
    RRF_K_CONSTANT: int = Field(
        default=60,
        description="Reciprocal Rank Fusion smoothing constant (RRF k=60)",
    )
    RERANKER_CANDIDATE_POOL: int = Field(
        default=14,
        description="High-candidate pool size N retrieved before cross-encoder re-ranking",
    )
    DYNAMIC_K_MIN: int = Field(
        default=2,
        description="Lower bound for dynamic Top-K selected chunks based on query complexity",
    )
    DYNAMIC_K_MAX: int = Field(
        default=6,
        description="Upper bound for dynamic Top-K selected chunks based on query complexity",
    )

    # --------------------------------------------------------------------------
    # Layer 4: Multi-Agent Validation & Circuit Breaker Limits
    # --------------------------------------------------------------------------
    HALLUCINATION_CIRCUIT_BREAKER_TOLERANCE: float = Field(
        default=0.05,
        ge=0.0,
        le=0.20,
        description="Maximum permissible unverified/unsourced claims (5% failure trips circuit breaker)",
    )
    TARGET_CITATION_ACCURACY: float = Field(
        default=0.95,
        description="SLA target for citation provenance verification (>= 95%)",
    )
    TARGET_CHUNK_UTILIZATION_RATIO: float = Field(
        default=0.65,
        description="Target ratio: (Chunks Cited in Final Report) / (Total Chunks Ingested into Context) >= 65%",
    )
    REGULATORY_REGIMES: List[str] = Field(
        default_factory=lambda: [
            "APRA CPS 234 (Information Security)",
            "APRA CPG 235 (Managing Data Risk)",
            "ASIC Act 2001 s12BF (Unfair Contract Terms)",
            "Privacy Act 1988 (Australian Privacy Principles)",
        ],
        description="Active Australian regulatory compliance frameworks evaluated during validation",
    )

    # --------------------------------------------------------------------------
    # Zero-Dependency Telemetry & Audit Lineage
    # --------------------------------------------------------------------------
    AUDIT_SPAN_LOG_PATH: str = Field(
        default="audit_spans.jsonl",
        description="Immutable append-only JSON-L telemetry destination (APRA CPG 235 lineage compliance)",
    )
    ENABLE_CONSOLE_SPANS: bool = Field(
        default=True,
        description="Emit formatted OpenTelemetry span summary logs to stdout during runtime execution",
    )


# Global singleton instance loaded once at module initialization
settings = Settings()

if __name__ == "__main__":
    import json
    print("=" * 70)
    print("ContractGuard AI — System Configuration Initialized")
    print("=" * 70)
    print(f"Gemini Flash Model:     {settings.GEMINI_FLASH_MODEL}")
    print(f"Gemini Pro Model:       {settings.GEMINI_PRO_MODEL}")
    print(f"Context Watermark:      {settings.CONTEXT_WATERMARK_PCT * 100:.0f}%")
    print(f"Circuit Breaker Limit:  {settings.HALLUCINATION_CIRCUIT_BREAKER_TOLERANCE * 100:.1f}%")
    print(f"Chunk Utilization SLA:  {settings.TARGET_CHUNK_UTILIZATION_RATIO * 100:.0f}%")
    print(f"Regulatory Regimes:     {len(settings.REGULATORY_REGIMES)} frameworks active")
    print(f"Audit Log Destination:  {settings.AUDIT_SPAN_LOG_PATH}")
    print("=" * 70)
