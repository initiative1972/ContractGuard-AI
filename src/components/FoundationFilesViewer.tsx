import React, { useState } from 'react';
import { Copy, Check, FileCode, Shield, Layers, Terminal } from 'lucide-react';

interface FoundationFilesViewerProps {
  onRunTestScript?: () => void;
}

export const FoundationFilesViewer: React.FC<FoundationFilesViewerProps> = () => {
  const [selectedFile, setSelectedFile] = useState<
    | 'main'
    | 'requirements'
    | 'config'
    | 'tracing'
    | 'chunker'
    | 'sanitizer'
    | 'fact_store'
    | 'hybrid_retriever'
    | 'reranker'
    | 'dynamic_k'
    | 'router'
    | 'dag_planner'
    | 'stream_engine'
    | 'citation_agent'
    | 'consistency_agent'
    | 'adversarial_agent'
    | 'circuit_breaker'
    | 'prd'
  >('main');
  const [copied, setCopied] = useState(false);

  const fileContents = {
    main: `"""
ContractGuard AI — Application Entry Point
Architecture: 4-Layer Enterprise Contract Review System for Australian Banking
Compliant with: APRA CPS 234 (InfoSec), APRA CPG 235 (Data Risk), Privacy Act 1988 (APPs)
"""

from __future__ import annotations
import asyncio, sys, time
from typing import AsyncIterator, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Core Foundation & 4 Architectural Layers
from config import settings
from tracing import tracer
from layer1_governance.fact_store import MmapFactStore
from layer1_governance.sanitizer import PIISanitizer
from layer1_governance.chunker import SemanticClauseChunker
from layer2_rag.hybrid_retriever import HybridRetriever
from layer2_rag.reranker import CrossEncoderReranker
from layer2_rag.dynamic_k import DynamicKSelector
from layer3_orchestration.router import DynamicModelRouter
from layer3_orchestration.dag_planner import DAGPlanner
from layer3_orchestration.stream_engine import StreamEngine, ContextCompactor
from layer4_validation.citation_agent import CitationAgent
from layer4_validation.consistency_agent import ConsistencyAgent
from layer4_validation.adversarial_agent import AdversarialCounselAgent
from layer4_validation.circuit_breaker import HallucinationCircuitBreaker, ComplianceAuditException

app = FastAPI(title="ContractGuard AI", version="1.0.0")
engine = ContractGuardEngine()

@app.post("/query/stream")
async def query_stream_endpoint(request_data: ContractQueryRequest):
    # 1. Layer 3 DAG Planning (Pydantic DAG)
    # 2. Layer 2 Hybrid RAG (Dense + BM25 Lexical + Cross-Encoder Re-Rank)
    # 3. Layer 2 Dynamic Top-K clamped between 2 and 6 (FactReferenceSet)
    # 4. Layer 3 Non-Materialized MTU Stream-Through
    # 5. Layer 4 Asynchronous Multi-Agent Validation (Citation + Consistency + Red-Team)
    # 6. Layer 4 Automated Trip-Switch: >5% defect raises ComplianceAuditException
    ...

def run_server():
    import uvicorn
    uvicorn.run(app, host=settings.APP_HOST, port=settings.APP_PORT)

if __name__ == "__main__":
    run_server()`,

    citation_agent: `"""
ContractGuard AI — Layer 4: Multi-Agent Validation & Circuit Breaker
Module: citation_agent.py
Purpose: Strict assertion extraction and fact_id citation verification agent.
         Parses all declarative claims from generated review reports, extracts embedded
         citations (e.g., [fact_abc123]), and validates against active fact registry.
Compliant with: APRA CPG 235 (Auditable provenance, zero-unreferenced claim policy)
"""

from __future__ import annotations
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

class CitationAgent:
    FACT_ID_PATTERN = re.compile(r"\\b(fact_[a-zA-Z0-9_\\-]{3,64})\\b")

    def verify_citations(self, generated_text: str, valid_fact_ids: Optional[Set[str]] = None) -> CitationVerificationReport:
        # Extracts claims and verifies every assertion cites an active, registered fact_id
        ...`,

    consistency_agent: `"""
ContractGuard AI — Layer 4: Multi-Agent Validation & Circuit Breaker
Module: consistency_agent.py
Purpose: Bidirectional entailment verification engine checking generated claims against
         the exact source clause text retrieved from the Fact Store via \`fact_id\`.
         Direction 1: Premise entails Claim. Direction 2: Claim does not hallucinate novel risk modifiers.
Compliant with: APRA CPG 235 (Factual consistency, verifiable evidence grounding)
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Tuple

class ConsistencyAgent:
    def __init__(self, consistency_threshold: float = 0.75):
        self.consistency_threshold = consistency_threshold

    def evaluate_claim_entailment(self, claim_id: str, claim_text: str, fact_id: str, fact_text: str) -> EntailmentResult:
        # Evaluates harmonic mean of forward entailment and reverse alignment
        ...`,

    adversarial_agent: `"""
ContractGuard AI — Layer 4: Multi-Agent Validation & Circuit Breaker
Module: adversarial_agent.py
Purpose: Specialized adversarial agent simulating aggressive opposing commercial banking counsel.
         Systematically probes generated reviews and proposed contract terms to identify:
         - Asymmetric indemnities
         - Unfair Contract Terms (UCT) under ASIC Act s12BF
         - Cross-default contagion triggers
         - APRA CPS 234 information security loopholes
Compliant with: APRA CPS 234 / CPG 235 & Australian Corporate Lending Best Practices
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List

class AdversarialCounselAgent:
    OPPOSING_COUNSEL_SYSTEM_PROMPT = """
You are Opposing Banking & Insolvency Counsel representing the aggressive counterparty in an Australian syndicated debt facility.
Your sole mission is to stress-test the agreement and uncover every operational loophole, asymmetric indemnity, and cross-default trigger.
"""
    def red_team_contract(self, contract_id: str, clauses_or_report_text: str) -> AdversarialReviewResult:
        # Runs red-teaming checks and produces actionable rebuttals
        ...`,

    circuit_breaker: `"""
ContractGuard AI — Layer 4: Multi-Agent Validation & Circuit Breaker
Module: circuit_breaker.py
Purpose: Enterprise-grade trip-switch logic calculating the composite hallucination and inaccuracy rate.
         If > 5% of assertions are UNSOURCED or FACTUALLY INACCURATE, immediately trips the circuit,
         raises a custom ComplianceAuditException, logs cryptographic audit telemetry,
         and locks the report for mandatory human-in-the-loop review.
Compliant with: APRA CPS 234 / CPG 235 & Zero-Hallucination Enterprise Policies
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

class ComplianceAuditException(Exception):
    # Raised when defect rate exceeds 5.0% enterprise ceiling
    ...

class HallucinationCircuitBreaker:
    def __init__(self, max_hallucination_rate_pct: float = 5.0):
        self.max_hallucination_rate_pct = max_hallucination_rate_pct

    def evaluate_and_enforce(self, citation_report, consistency_report, contract_id = "doc_unknown") -> CircuitBreakerTelemetry:
        # Computes defect union. If defect_rate > 5%, raises ComplianceAuditException
        ...`,

    router: `"""
ContractGuard AI — Layer 3: Hierarchical Model Orchestration
Module: router.py
Purpose: Dynamic model router mapping contract review sub-tasks to optimal Gemini models:
         - Gemini 2.5 Flash: Routine extraction, semantic classification, PII sanitization, schema parsing.
         - Gemini 2.5 Pro: Deep legal ambiguity analysis, cross-clause liability conflicts, regulatory deviation synthesis.
Compliant with: APRA CPS 234 / CPG 235 & Token Budget Optimization (Target SLA: >=60% cost reduction vs pure Pro).
"""

from __future__ import annotations
import enum
from dataclasses import dataclass
from typing import Any, Dict, List, Set

class DynamicModelRouter:
    def route_task(self, task_id: str, task_name: str, task_description: str, ...) -> RouteDecision:
        # Analyzes task complexity and assigns to gemini-2.5-flash or gemini-2.5-pro
        ...

    def calculate_cost_savings(self, decisions: List[RouteDecision]) -> Dict[str, Any]:
        # Verifies >= 60% inference cost reduction SLA vs baseline pure Gemini Pro
        ...`,

    dag_planner: `"""
ContractGuard AI — Layer 3: Hierarchical Model Orchestration
Module: dag_planner.py
Purpose: Plan-then-Execute DAG planner generating a Pydantic-validated JSON Directed Acyclic Graph
         of review sub-tasks, ensuring parallel asynchronous execution without circular deadlocks.
Compliant with: APRA CPG 235 (Auditable task decomposition, deterministic pipeline ordering)
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator
from layer3_orchestration.router import DynamicModelRouter

class DAGNode(BaseModel):
    id: str
    name: str
    description: str
    layer: int
    model: str
    dependencies: List[str] = []
    status: str = "PENDING"

class ContractReviewDAG(BaseModel):
    plan_id: str
    contract_id: str
    user_query: str
    nodes: List[DAGNode]

    @model_validator(mode="after")
    def validate_dag_integrity(self) -> "ContractReviewDAG":
        # Kahn's algorithm cycle detection: guarantees zero circular deadlocks
        ...`,

    stream_engine: `"""
ContractGuard AI — Layer 3: Hierarchical Model Orchestration
Module: stream_engine.py
Purpose: Non-materialized stream-through I/O handler piping Gemini async byte-streams
         directly to FastAPI's StreamingResponse using MTU-aligned adaptive buffers (~1,350 bytes or 30ms)
         to eliminate server heap allocation. Includes a 70% watermark context compactor.
Compliant with: APRA CPG 235 (Zero heap memory exfiltration, high-throughput non-materialized streaming)
"""

from __future__ import annotations
import asyncio, io, time
from typing import AsyncIterator, List, Tuple

class ContextCompactor:
    def __init__(self, watermark_threshold: float = 0.70, max_context_tokens: int = 32000):
        # Triggers at 70% watermark, condensing verbose tool observations into fact_id assertions
        ...

class StreamEngine:
    def __init__(self, mtu_buffer_bytes: int = 1350, flush_window_ms: int = 30):
        # Non-materialized streaming directly to FastAPI StreamingResponse
        ...`,

    hybrid_retriever: `"""
ContractGuard AI — Layer 2: Context-Aware Augmented RAG
Module: hybrid_retriever.py
Purpose: Dual-path hybrid retrieval engine combining dense vector embeddings (text-embedding-004)
         with sparse lexical keyword frequency (Rank-BM25), merged using Reciprocal Rank Fusion (RRF, k=60).
         Supports metadata pre-filtering (e.g., jurisdiction, governing_law, contract_type).
Compliant with: APRA CPG 235 (Traceable chunk retrieval, noise elimination, context token reduction)
"""

from __future__ import annotations
import math, re
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple

class HybridRetriever:
    def __init__(self, rrf_k: int = 60, dense_embed_fn = None):
        self.rrf_k = rrf_k
        self.dense_embed_fn = dense_embed_fn
        self._corpus: Dict[str, IndexedDocument] = {}

    def search(self, query: str, metadata_filters = None, query_vector = None, candidate_pool_size = 14) -> List[RetrievalCandidate]:
        # 1. Pre-filters structural metadata (CPS 234 segregation)
        # 2. Computes dense vector cosine similarity (text-embedding-004)
        # 3. Computes sparse lexical BM25 scores
        # 4. Fuses via RRF: sum(1 / (k + rank_m)), k=60
        ...`,

    reranker: `"""
ContractGuard AI — Layer 2: Context-Aware Augmented RAG
Module: reranker.py
Purpose: Cross-encoder re-ranking pipeline using sentence-transformers (e.g., bge-reranker-small)
         to score the RRF candidate pool (Pool N=14 down to ranked candidates).
Compliant with: APRA CPG 235 (Retrieval precision, relevance calibration, context noise filtering)
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Tuple
from layer2_rag.hybrid_retriever import RetrievalCandidate

class CrossEncoderReranker:
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2", custom_scorer = None):
        self.model_name = model_name
        self.custom_scorer = custom_scorer
        self._load_model()

    def rerank(self, query: str, candidates: List[RetrievalCandidate], text_lookup_fn) -> List[ReRankedCandidate]:
        # Evaluates joint query-clause pairs through cross-attention scoring
        ...`,

    dynamic_k: `"""
ContractGuard AI — Layer 2: Context-Aware Augmented RAG
Module: dynamic_k.py
Purpose: Adaptive candidate selection logic that dynamically tunes Top-K (between 2 and 6)
         based on query token complexity and semantic ambiguity. Emits a FactReferenceSet
         containing exclusively immutable fact_id pointers and clause references (never raw text).
Compliant with: APRA CPG 235 (Context window minimization, zero token waste, pointer-based hydration)
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict, List, Tuple
from layer2_rag.reranker import ReRankedCandidate

@dataclass(frozen=True)
class FactReference:
    fact_id: str
    relevance_score: float
    rank: int
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class FactReferenceSet:
    query: str
    query_tokens: int
    dynamic_k: int
    complexity_category: str  # 'SIMPLE', 'STANDARD', 'COMPLEX_MULTI_CLAUSE'
    fact_references: List[FactReference]
    retained_fact_ids: List[str]

class DynamicKSelector:
    def __init__(self, min_k: int = 2, max_k: int = 6):
        self.min_k = min_k
        self.max_k = max_k

    def determine_dynamic_k(self, query: str, total_available: int) -> int:
        # Clamps Top-K between 2 and 6 based on query length & banking risk terms
        ...

    def select_fact_references(self, query: str, reranked_candidates: List[ReRankedCandidate]) -> FactReferenceSet:
        # Returns immutable FactReferenceSet with fact_id pointers ONLY (zero raw text)
        ...`,

    chunker: `"""
ContractGuard AI — Layer 1: Knowledge Engineering & Governance
Module: chunker.py
Purpose: Semantic clause segmentation pipeline combining deterministic legal boundary cues
         with semantic cosine distance thresholding (< 0.72) and a max token window clamp (1,000 tokens).
Compliant with: APRA CPG 235 (Content-addressed chunk lineage, heading preservation, section provenance)
"""

from __future__ import annotations
import math, re
from dataclasses import dataclass, field
from typing import Callable, List, Optional, Tuple

@dataclass
class ClauseChunk:
    chunk_index: int
    clause_number: str
    clause_title: str
    text: str
    char_start: int
    char_end: int
    token_count_estimate: int
    split_reason: str
    metadata: dict = field(default_factory=dict)

class SemanticClauseChunker:
    LEGAL_BOUNDARY_PATTERNS = [
        re.compile(r"^(?:(?:CLAUSE|SECTION|ARTICLE|PART|SCHEDULE|ANNEXURE|EXHIBIT)\\s+([0-9A-Z]+(?:\\.[0-9A-Z]+)*))\\s*[:\\-\\.]?\\s*(.*)$", re.IGNORECASE),
        re.compile(r"^([0-9]{1,2}(?:\\.[0-9]{1,2}){0,3})\\.?\\s+([A-Z][A-Za-z0-9\\s,\\-\\(\\)&/]+)$"),
        re.compile(r"^(?:RECITALS|BACKGROUND|OPERATIVE PROVISIONS|SCHEDULE\\s+[0-9A-Z]+|EXECUTION PAGE)\\b", re.IGNORECASE),
    ]

    def __init__(self, cosine_threshold: float = 0.72, max_tokens: int = 1000, embedding_fn = None):
        self.cosine_threshold = cosine_threshold
        self.max_tokens = max_tokens
        self.embedding_fn = embedding_fn

    def chunk_contract(self, text: str, document_id: str = "doc_default") -> List[ClauseChunk]:
        # Segments contract paragraphs, evaluates legal boundaries, semantic cosine shifts (<0.72),
        # and clamps max token windows at 1,000 tokens.
        ...`,

    sanitizer: `"""
ContractGuard AI — Layer 1: Knowledge Engineering & Governance
Module: sanitizer.py
Purpose: Regex + spaCy/NLP deterministic PII redaction engine.
         Scrubs Australian Business Numbers (ABNs), Australian Company Numbers (ACNs),
         Tax File Numbers (TFNs), corporate entity names, and financial transactions,
         replacing them with deterministically indexed cryptographic placeholders
         (e.g., {{ENTITY_ORG_1}}, {{ENTITY_ABN_1}}, {{ENTITY_TFN_1}}).
Compliant with: APRA CPS 234 (Information Security) & Privacy Act 1988 (Australian Privacy Principles)
"""

from __future__ import annotations
import hashlib, re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

class PIISanitizer:
    ABN_PATTERN = re.compile(r"\\b(?:ABN[:\\s]*)?(\\d{2}\\s?\\d{3}\\s?\\d{3}\\s?\\d{3})\\b", re.I)
    ACN_PATTERN = re.compile(r"\\b(?:ACN[:\\s]+)(\\d{3}\\s?\\d{3}\\s?\\d{3})\\b", re.I)
    TFN_PATTERN = re.compile(r"\\b(?:TFN[:\\s]+|Tax\\s+File\\s+Number[:\\s]+)(\\d{3}\\s?\\d{3}\\s?\\d{2,3})\\b", re.I)
    AUD_CURRENCY_PATTERN = re.compile(r"(?:AUD\\s*|A\\s*)?\\$([0-9]{1,3}(?:,[0-9]{3})+(?:\\.[0-9]{2})?|\\b[0-9]{5,}\\b)", re.I)
    COMPANY_REGEX = re.compile(r"\\b([A-Z][A-Za-z0-9'&.,\\s]{2,45}?\\s+(?:Pty\\.?\\s+Ltd\\.?|Pty\\s+Limited|Ltd\\.?|Limited|Nominees|Holdings|Group))\\b")

    def sanitize(self, text: str) -> SanitizationResult:
        # Replaces PII with cryptographic placeholders and logs RedactedEntity audit trails
        ...`,

    fact_store: `"""
ContractGuard AI — Layer 1: Knowledge Engineering & Governance
Module: fact_store.py
Purpose: mmap-backed binary chunk storage engine with in-memory sparse offset index.
         Maps unique content-addressed \`fact_id\` to file offset, byte length, and metadata hash.
Compliant with: APRA CPG 235 (Data lineage, permanent provenance, content-addressable storage).
"""

from __future__ import annotations
import dataclasses, hashlib, json, mmap, os
from typing import Any, Dict, List, Optional

class MmapFactStore:
    def __init__(self, storage_dir: str = "./data/mmap_store"):
        self.storage_dir = storage_dir
        self.payload_path = os.path.join(storage_dir, "chunks.bin")
        self.index_path = os.path.join(storage_dir, "sparse_index.jsonl")
        self._index: Dict[str, FactIndexEntry] = {}
        self._bootstrap_store()

    def put_chunk(self, document_id: str, clause_number: str, text: str, metadata = None) -> str:
        # Appends binary payload to disk, maps in-memory offset index, returns content-addressed fact_id
        ...

    def get_chunk(self, fact_id: str) -> Optional[FactRecord]:
        # Demand-pages chunk text directly via mmap kernel slice without heap exhaustion
        ...`,
    requirements: `# ==============================================================================
# ContractGuard AI — Core Dependencies (Python 3.11+)
# Regulated Australian Banking Governance & Enterprise Contract Review Runtime
# Compliant with APRA CPS 234 / CPG 235 Data Sovereignty & Model Risk Controls
# ==============================================================================

# Google GenAI Official Unified SDK
google-genai==1.2.0

# High-Performance API & Async I/O Runtime
fastapi==0.115.6
uvicorn[standard]==0.34.0
httpx==0.28.1

# Data Validation, Governance & Typed Settings
pydantic==2.10.4
pydantic-settings==2.7.1
python-dotenv==1.0.1

# Hybrid RAG: Lexical & Dense Vector Retrieval
sentence-transformers==3.4.1
rank_bm25==0.2.2
numpy==2.2.1

# Natural Language Processing & PII / Legal Entity Extraction
spacy==3.8.3

# Testing & Golden Benchmark Verification
pytest==8.3.4
pytest-asyncio==0.25.0`,

    config: `"""
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


settings = Settings()`,

    tracing: `"""
ContractGuard AI — Zero-Dependency OpenTelemetry-Style Tracing & Telemetry Runtime
Compliant with: APRA CPG 235 (Full data lineage, traceability, and immutable audit trails)
Architecture Requirement: Zero SaaS monitoring dependencies. Local append-only JSON-L spans.
"""

from __future__ import annotations
import contextvars, dataclasses, enum, json, os, sys, time, uuid
from typing import Any, Dict, List, Optional, Set

# Full implementation featuring:
# - Span, SpanContextManager, Tracer
# - Chunk Utilization Ratio calculation: (Cited Chunks) / (Ingested Chunks) >= 65% SLA
# - Layer 3 Token Budget Optimization telemetry (>= 60% savings vs pure Pro)
# - Layer 4 Hallucination Circuit Breaker telemetry (< 5% error rate)
# - Local immutable JSON-L audit file append (APRA CPG 235 WORM lineage)`,

    prd: `# Product Requirements Document (PRD)
## Project: ContractGuard AI — Enterprise Contract Governance & Audit Runtime
Target Role: AI Engineer / Senior AI Systems Engineer (Banking & Financial Services)
Author: AI Engineering Portfolio Deliverable
Status: Approved for Implementation
Runtime: Python 3.11+, Google GenAI SDK, Google AI Studio -> Google Cloud Vertex AI
Target Domain: Regulated Financial Services (Commercial Loan Agreements, Merchant Facility Terms, SaaS Vendor Agreements)

... (Full PRD stored in /PRD.md with 4-Layer Architecture and SLA Targets)`,
  };

  const handleCopy = () => {
    const text = fileContents[selectedFile];
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Foundation Initialized
              </span>
              <span className="text-xs text-slate-400">Phase 1: Architecture & Base Configuration</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">ContractGuard AI Foundation Files</h1>
            <p className="text-sm text-slate-300 mt-0.5">
              Production configuration, strict versioning, and zero-dependency OpenTelemetry tracing engine for Australian banking.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy File Content'}</span>
            </button>
          </div>
        </div>

        {/* Regulatory Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            <span><strong>APRA CPG 235:</strong> Content-addressed <code>fact_id</code> data lineage</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <span><strong>APRA CPS 234:</strong> Client-side PII scrubbing before LLM</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Model Risk:</strong> Circuit breaker trips at &gt;5% unsourced claims</span>
          </div>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSelectedFile('main')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'main'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>main.py</span>
          <span className="text-[10px] bg-slate-800/80 text-emerald-300 px-1.5 py-0.2 rounded border border-slate-700">FastAPI App</span>
        </button>

        <button
          onClick={() => setSelectedFile('chunker')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'chunker'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer1/chunker.py</span>
          <span className="text-[10px] bg-slate-800/80 text-cyan-300 px-1.5 py-0.2 rounded border border-slate-700">Cosine &lt; 0.72</span>
        </button>

        <button
          onClick={() => setSelectedFile('sanitizer')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'sanitizer'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer1/sanitizer.py</span>
          <span className="text-[10px] bg-slate-800/80 text-emerald-300 px-1.5 py-0.2 rounded border border-slate-700">APRA CPS 234</span>
        </button>

        <button
          onClick={() => setSelectedFile('fact_store')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'fact_store'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer1/fact_store.py</span>
          <span className="text-[10px] bg-slate-800/80 text-amber-300 px-1.5 py-0.2 rounded border border-slate-700">mmap Store</span>
        </button>

        <button
          onClick={() => setSelectedFile('hybrid_retriever')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'hybrid_retriever'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer2/hybrid_retriever.py</span>
          <span className="text-[10px] bg-slate-800/80 text-indigo-300 px-1.5 py-0.2 rounded border border-slate-700">BM25 + RRF</span>
        </button>

        <button
          onClick={() => setSelectedFile('reranker')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'reranker'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer2/reranker.py</span>
          <span className="text-[10px] bg-slate-800/80 text-cyan-300 px-1.5 py-0.2 rounded border border-slate-700">Cross-Encoder</span>
        </button>

        <button
          onClick={() => setSelectedFile('dynamic_k')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'dynamic_k'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer2/dynamic_k.py</span>
          <span className="text-[10px] bg-slate-800/80 text-emerald-300 px-1.5 py-0.2 rounded border border-slate-700">Dynamic Top-K</span>
        </button>

        <button
          onClick={() => setSelectedFile('router')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'router'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer3/router.py</span>
          <span className="text-[10px] bg-slate-800/80 text-cyan-300 px-1.5 py-0.2 rounded border border-slate-700">Flash ↔ Pro</span>
        </button>

        <button
          onClick={() => setSelectedFile('dag_planner')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'dag_planner'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer3/dag_planner.py</span>
          <span className="text-[10px] bg-slate-800/80 text-amber-300 px-1.5 py-0.2 rounded border border-slate-700">Pydantic DAG</span>
        </button>

        <button
          onClick={() => setSelectedFile('stream_engine')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'stream_engine'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer3/stream_engine.py</span>
          <span className="text-[10px] bg-slate-800/80 text-purple-300 px-1.5 py-0.2 rounded border border-slate-700">MTU Streaming</span>
        </button>

        <button
          onClick={() => setSelectedFile('citation_agent')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'citation_agent'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer4/citation_agent.py</span>
          <span className="text-[10px] bg-slate-800/80 text-blue-300 px-1.5 py-0.2 rounded border border-slate-700">fact_id Audit</span>
        </button>

        <button
          onClick={() => setSelectedFile('consistency_agent')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'consistency_agent'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer4/consistency_agent.py</span>
          <span className="text-[10px] bg-slate-800/80 text-teal-300 px-1.5 py-0.2 rounded border border-slate-700">Entailment</span>
        </button>

        <button
          onClick={() => setSelectedFile('adversarial_agent')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'adversarial_agent'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer4/adversarial_agent.py</span>
          <span className="text-[10px] bg-slate-800/80 text-rose-300 px-1.5 py-0.2 rounded border border-slate-700">Opposing Counsel</span>
        </button>

        <button
          onClick={() => setSelectedFile('circuit_breaker')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'circuit_breaker'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>layer4/circuit_breaker.py</span>
          <span className="text-[10px] bg-slate-800/80 text-red-300 px-1.5 py-0.2 rounded border border-slate-700">&gt;5% Trip Switch</span>
        </button>

        <button
          onClick={() => setSelectedFile('config')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'config'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>config.py</span>
          <span className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">Pydantic Settings</span>
        </button>

        <button
          onClick={() => setSelectedFile('tracing')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'tracing'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>tracing.py</span>
          <span className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">Zero-SaaS OTel</span>
        </button>

        <button
          onClick={() => setSelectedFile('requirements')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'requirements'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>requirements.txt</span>
          <span className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">Strict Pinned</span>
        </button>

        <button
          onClick={() => setSelectedFile('prd')}
          className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-colors ${
            selectedFile === 'prd'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>PRD.md</span>
          <span className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">Product Spec</span>
        </button>
      </div>

      {/* Code Display Area */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="font-mono text-slate-300 ml-2">
              /{selectedFile === 'requirements'
                ? 'requirements.txt'
                : ['chunker', 'sanitizer', 'fact_store'].includes(selectedFile)
                ? `layer1_governance/${selectedFile}.py`
                : ['hybrid_retriever', 'reranker', 'dynamic_k'].includes(selectedFile)
                ? `layer2_rag/${selectedFile}.py`
                : ['router', 'dag_planner', 'stream_engine'].includes(selectedFile)
                ? `layer3_orchestration/${selectedFile}.py`
                : ['citation_agent', 'consistency_agent', 'adversarial_agent', 'circuit_breaker'].includes(selectedFile)
                ? `layer4_validation/${selectedFile}.py`
                : `${selectedFile}.${selectedFile === 'prd' ? 'md' : 'py'}`}
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            {selectedFile === 'main'
              ? 'FastAPI Application Entry Point & ASGI Runner'
              : ['chunker', 'sanitizer', 'fact_store'].includes(selectedFile)
              ? 'Layer 1: Knowledge Engineering & Governance'
              : ['hybrid_retriever', 'reranker', 'dynamic_k'].includes(selectedFile)
              ? 'Layer 2: Context-Aware Augmented RAG'
              : ['router', 'dag_planner', 'stream_engine'].includes(selectedFile)
              ? 'Layer 3: Hierarchical Model Orchestration'
              : ['citation_agent', 'consistency_agent', 'adversarial_agent', 'circuit_breaker'].includes(selectedFile)
              ? 'Layer 4: Multi-Agent Validation & Circuit Breaker'
              : selectedFile === 'tracing'
              ? 'Standard Library Only (Zero Dependencies)'
              : 'Python 3.11+ / Pydantic v2'}
          </span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            <code>{fileContents[selectedFile]}</code>
          </pre>
        </div>
      </div>

      {/* Architectural Deep-Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Why Zero-Dependency Tracing?</span>
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Australian prudential guidelines (APRA CPS 234 / CPG 235) prohibit sending banking audit logs, trace spans, or customer metadata to external third-party SaaS observability vendors (e.g. Datadog, Honeycomb) without rigorous cloud sovereignty certification. Our <code>tracing.py</code> emits pure WORM-compliant JSON-L spans locally.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Chunk-Utilization Ratio SLA</span>
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Standard RAG injects thousands of unread tokens into model prompts, wasting capital and distracting attention. ContractGuard AI enforces the metric:
            <br />
            <code className="text-cyan-300 block bg-slate-950 p-1.5 rounded mt-1.5 text-[11px]">
              (Cited Chunks) / (Ingested Context) &ge; 65%
            </code>
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Deterministic Circuit Breaker</span>
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Layer 4 runs bidirectional entailment checks between claims and cited <code>fact_id</code> chunks. If unverified claims exceed <strong>5%</strong>, an automated circuit breaker trips, drops the draft, and escalates to human risk counsel with an audit span log.
          </p>
        </div>
      </div>
    </div>
  );
};
