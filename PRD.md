# Product Requirements Document (PRD)
## Project: ContractGuard AI — Enterprise Contract Governance & Audit Runtime

**Target Role:** AI Engineer / Senior AI Systems Engineer (Banking & Financial Services)  
**Author:** AI Engineering Portfolio Deliverable  
**Status:** Approved for Implementation  
**Runtime:** Python 3.11+, Google GenAI SDK, Google AI Studio (Prototyping) -> Google Cloud Vertex AI (Production Architecture)  
**Target Domain:** Regulated Financial Services (Commercial Loan Agreements, Merchant Facility Terms, SaaS Vendor Agreements)

---

## 1. Executive Summary & Architectural Philosophy

ContractGuard AI is a 4-layer contract intelligence and regulatory compliance runtime engineered for Tier-1 financial institutions. Standard LLM deployments in banking suffer from 20-30% factual hallucination rates, severe token I/O waste, non-deterministic reasoning, and opaque audit trails that breach regulatory standards (APRA CPS 234, CPG 235).

ContractGuard AI rejects prompt-only engineering in favor of a Systems-First AI Architecture:
1. Minimizing expensive token movement through demand-paged fact hydration.
2. Eliminating retrieval noise via multi-stage hybrid search and context compression.
3. Decoupling planning from execution using structured DAG orchestration.
4. Guaranteeing auditability through strict bidirectional provenance verification and automated circuit breakers.

---

## 2. Regulatory & Banking Governance Drivers

| Standard / Regulation | Mandate Requirement | ContractGuard AI Architectural Solution |
| :--- | :--- | :--- |
| **APRA CPG 235** (Data Risk) | Full data lineage, traceability, and structured lifecycle governance. | Permanent Content-Addressed Chunk Identifiers (`fact_id`) bound to source offset, clause, and document revision. |
| **APRA CPS 234** (InfoSec) | Protection of confidential customer and institutional assets against exfiltration. | Client-side PII scrubbing, synthetic pseudonymization engine, and isolation of unmasked payloads. |
| **Privacy Act 1988 (APPs)** | Prohibition against processing unconsented personal identifiers through external APIs. | Deterministic regex + spaCy/transformer entity recognition to tokenize NRIC, ABN, TFN, names, and monetary terms prior to retrieval ingestion. |
| **Model Risk Governance** | Replicability, human-in-the-loop auditability, and deterministic failure modes. | Multi-agent validation pipeline with deterministic hallucination circuit breaker (<5% tolerance) and immutable JSON-L audit spans. |

---

## 3. Four-Layer System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Multi-Agent Validation & Audit Layer                          │
│  - Citation Provenance Checker    - Fact-Consistency Verifier          │
│  - Regulatory Compliance Agent    - Adversarial Counterparty Reviewer  │
│  - Deterministic Hallucination Circuit Breaker (Reject if >5% Unsound) │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Hierarchical Model Orchestration Layer                        │
│  - DAG Plan-then-Execute Engine   - Non-Materialized Stream-Through    │
│  - Dynamic Model Router           - Fact-ID Pointer Hydration          │
│    (Gemini 2.5 Flash ↔ Gemini 2.5 Pro)                                 │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Context-Aware Augmented RAG Layer                             │
│  - Metadata Pre-Filter (CPS 234)  - Dense Vector (text-embedding-004)  │
│  - Sparse Lexical (BM25)          - Reciprocal Rank Fusion (RRF)       │
│  - Cross-Encoder Re-Ranking       - Adaptive Top-K Selection           │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Knowledge Engineering & Governance Layer                      │
│  - Legal Clause Segmentation      - Entity Redaction & Tokenization    │
│  - mmap-backed Chunk Storage      - Document Lineage & Provenance Log  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Layer-by-Layer Technical Specification

### Layer 1: Knowledge Engineering & Governance Layer
* **Document Parsing:** Layout-aware PDF and text parsing preserving heading hierarchy, clause numbering (e.g., Section 14.2(a)), and table definitions.
* **Clause Segmentation (Semantic Chunking):** Dynamic splitting based on legal boundary cues and semantic embedding distance changes (cosine threshold < 0.72) rather than arbitrary token lengths. Max window clamped at 1,000 tokens.
* **PII & Data Governance Engine:** Regex + NER identification of Australian Business Numbers (ABNs), Australian Company Numbers (ACNs), Tax File Numbers (TFNs), company names, and transaction values. Values are replaced with deterministically indexed cryptographic placeholders (e.g., `{{ENTITY_ORG_1}}`) before embedding or model processing.
* **Fact Storage:** Implements an `mmap`-backed binary payload store with an in-memory sparse index (`fact_id` -> file offset, byte length, metadata hash). Prevents heap exhaustion when indexing enterprise-scale contract repositories.

### Layer 2: Context-Aware Augmented RAG Layer
* **Metadata Pre-Filtering:** Queries are evaluated for structural metadata filters (e.g., `jurisdiction == 'AU-VIC'`, `governing_law == 'Common Law'`, `contract_type == 'Merchant Agreement'`) before executing similarity searches.
* **Hybrid Retrieval (Dense + Sparse):**
  * Dense Path: `text-embedding-004` (768-dim) generating vector embeddings.
  * Sparse Path: Rank-BM25 calculating lexical term frequencies on contract terms of art.
* **Rank Fusion:** Reciprocal Rank Fusion (RRF, $k=60$) dynamically merges dense and sparse result lists.
* **Cross-Encoder Re-Ranking:** High-candidate pool ($N=14$) re-ranked via a fast cross-encoder (`jina-reranker-v2` or `bge-reranker-small`) down to an adaptive Top-K ($K \in [2, 6]$ based on query complexity).
* **Contextual Fact Pointers:** Retriever returns `FactReferenceSet` containing immutable `fact_id` hashes and clause citations. Raw text is only resolved on demand by the downstream execution stage.

### Layer 3: Hierarchical Model Orchestration Layer
* **Dynamic Model Router:**
  * Gemini 2.5 Flash: Routine clause extraction, semantic chunking, metadata classification, synthetic PII generation, and JSON schema extraction.
  * Gemini 2.5 Pro: Legal ambiguity analysis, cross-clause liability conflicts, regulatory deviation identification, and multi-step reasoning.
* **DAG Planning & Execution Engine:** Decouples high-level task planning from execution. The Planner emits a validated, structured JSON DAG of review tasks. Sub-tasks without cross-dependencies are executed asynchronously in parallel.
* **Non-Materialized Stream-Through I/O:** Streaming responses from the Gemini API are piped directly to FastAPI's asynchronous byte-stream response writer (`StreamingResponse`) using an adaptive MTU-aligned buffer (~1,350 bytes or 30ms flush window), eliminating intermediate string concatenations on the server heap.
* **Context Compaction:** Monitored at a 70% active working context watermark. When reached, historical agent observations are compressed into verified fact assertions while retaining their source `fact_id` linkages.

### Layer 4: Multi-Agent Validation & Audit Layer
* **Citation Provenance Agent:** Parses all assertions in the draft review and verifies that every factual claim explicitly cites a valid, active `fact_id`.
* **Fact-Consistency Agent:** Performs bidirectional entailment checks between the generated claim and the exact text segment retrieved via the `fact_id`. Distortions, scope inflations, or inverted clauses are flagged as `UNSUPPORTED`.
* **Regulatory Compliance Agent:** Cross-references flagged terms against codified compliance rules (e.g., unfair contract terms legislation under ASIC Act, APRA outsourcing covenants).
* **Adversarial Counterparty Agent:** Simulates an adversarial opposing counsel / regulator to identify omissions, unmitigated indemnities, and systemic bank liabilities.
* **Circuit Breaker:** If $>5\%$ of generated claims are flagged as `UNSOURCED` or `INACCURATE`, the runtime trips an automated circuit breaker, drops the generation, and routes the document to manual human-in-the-loop review with a diagnostic audit payload.

---

## 5. Telemetry & Observable Metrics

| Metric | Target SLA | Verification Method |
| :--- | :--- | :--- |
| **Citation Accuracy** | $\ge 95\%$ | Automated multi-agent provenance assertion test suite. |
| **Hallucination Rate** | $< 5\%$ | Entailment evaluation against ground-truth contract clauses. |
| **Chunk Utilization Ratio** | $\ge 65\%$ | Telemetry tracking: $(\text{Chunks Cited in Final Report}) / (\text{Total Chunks Ingested into Context})$. |
| **End-to-End Latency** | $< 25\text{s}$ (50-page contract) | Distributed span duration breakdown (`tracing.py`). |
| **Inference Cost Reduction** | $\ge 60\%$ | Token telemetry comparing Gemini Flash/Pro hybrid routing vs. baseline pure Gemini Pro. |
| **Test Coverage** | $\ge 85\%$ | Pytest suite covering unit, integration, and golden-dataset benchmarks. |
