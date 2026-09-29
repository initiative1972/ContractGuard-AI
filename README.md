# ContractGuard AI: Enterprise Contract Governance Runtime

An enterprise-grade, 4-layer contract intelligence and regulatory compliance runtime engineered for Tier-1 financial institutions.

## 📖 Project Overview

Standard LLM deployments in banking suffer from ~28% factual hallucination rates, severe token I/O waste, and opaque audit trails that breach regulatory standards. ContractGuard AI rejects simple prompt engineering in favor of a Systems-First AI Architecture designed to solve the core pain points of using general-purpose LLMs in legal workflows.

This system prioritizes control, auditability, and data privacy over raw model capability, making it safe for commercial loan agreements, vendor contracts, and merchant onboarding documentation.

## 🏗️ 4-Layer Systems Architecture

The system follows a strict 4-layer separation-of-concerns design:

### 1. Knowledge Engineering & Governance Layer

* **Automated Clause Segmentation:** Parses standard contract categories (indemnity, liability, governing law) using semantic boundary detection.


* **PII Sanitization:** Auto-redaction of company names, financial figures, and personal identifiers to maintain data privacy compliance (APRA CPG 235).


* **mmap-Backed Fact Storage:** Immutable `fact_id` binding to every knowledge chunk for end-to-end traceability.



### 2. Context-Aware Augmented RAG Layer

* **Metadata Pre-Filtering:** Filters by jurisdiction, effective date, and contract type before executing semantic retrieval.


* **Hybrid Search Pipeline:** Combines BM25 keyword search with dense semantic vector search via Reciprocal Rank Fusion.


* **Cross-Encoder Re-Ranking:** Improves top-k relevance, ensuring precise, clause-level retrieval instead of generic document chunks.



### 3. Hierarchical Model Orchestration Layer

* **Dynamic Model Router:** Assigns tasks by complexity to optimize cost and speed. Routine tagging runs on high-speed models, while complex risk trade-offs route to advanced reasoning models.


* **Stream-Through I/O:** Eliminates heap exhaustion by piping non-materialized byte streams directly to the client.
* **DAG Orchestration:** End-to-end workflow planning and execution.



### 4. Multi-Agent Validation & Audit Layer

* **Citation Validation Agent:** Verifies every factual claim has a corresponding source in the knowledge base; flags unsourced statements.


* **Fact Consistency Agent:** Checks that generated text accurately reflects source document meaning and does not distort clauses.


* **Compliance Check Agent:** Validates output against internal policies and regulatory requirements.


* **Adversarial Review Agent:** Acts as opposing counsel to identify blind spots and unstated risks.


* **Hallucination Circuit Breaker:** Automatically rejects output if >5% of claims are unsubstantiated.



## 📊 Target Performance Metrics

* **Citation Accuracy:** $\ge 94\%$ with full source traceability.


* **Factual Hallucination Rate:** $< 6\%$.


* **Review Cycle Time:** $< 30$ seconds for a standard 50-page commercial agreement.


* **Inference Cost Reduction:** $68\%$ reduction compared to pure large-model workflows.



## 🛠️ Technology Stack

* **AI Platform:** Google GenAI SDK, Google AI Studio (Prototyping) $\rightarrow$ Google Cloud Vertex AI (Production)


* **Models:** Gemini 2.5 Flash, Gemini 2.5 Pro, `text-embedding-004`

* **Orchestration:** FastAPI, Pydantic, Python 3.11+
* **Retrieval:** Rank-BM25, Sentence-Transformers, Local Vector Store (Chroma/mmap)



## 🚀 Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/ContractGuard-AI.git
cd ContractGuard-AI

```


2. **Configure environment:**
Copy `.env.example` to `.env` and add your Google AI Studio API key.
```bash
GEMINI_API_KEY="your_api_key_here"

```


3. **Install dependencies:**
```bash
pip install -r requirements.txt

```


4. **Launch the API:**
```bash
uvicorn main:app --reload

```


5. **Test the streaming endpoint:**
Navigate to `[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)` to test the `/query/stream` endpoint with a sample contract.

---

## 👨‍💻 Author & Project Context

**Henry Yan**

*Data Steward & AI Engineer | Lean Six Sigma Black Belt*

ContractGuard AI was developed to bridge the gap between theoretical LLM capabilities and the rigorous data governance frameworks required in the Australian financial services sector. Drawing on extensive experience managing Critical Data Elements and enterprise regulatory compliance frameworks, this project demonstrates how AI can be safely operationalized under strict prudential standards. Supported by the Google AI Professional certification, this architecture emphasizes measurable risk reduction, verifiable data lineage, and production-ready engineering over simple prompt manipulation.
