export interface SpanEvent {
  name: string;
  timestamp_ns: number;
  timestamp_iso: string;
  attributes: Record<string, any>;
}

export interface SpanData {
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  name: string;
  kind: 'INTERNAL' | 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER';
  start_time_ns: number;
  end_time_ns: number;
  duration_ms: number;
  status: {
    code: 'OK' | 'ERROR' | 'UNSET';
    description: string;
  };
  attributes: Record<string, any>;
  events: SpanEvent[];
  children?: SpanData[];
}

export interface ContractSample {
  id: string;
  title: string;
  type: string;
  jurisdiction: string;
  regulations: string[];
  parties: {
    bank: string;
    borrower: string;
    guarantors: string[];
  };
  originalText: string;
  summary: string;
  simulatedDefects: string[];
}

export interface SemanticChunk {
  fact_id: string;
  clause_id: string;
  clause_title: string;
  page_offset: number;
  byte_start: number;
  byte_end: number;
  sanitized_content: string;
  original_content: string;
  redacted_entities: Array<{
    type: string;
    raw: string;
    placeholder: string;
  }>;
  dense_score?: number;
  bm25_score?: number;
  rrf_score?: number;
  rerank_score?: number;
  selected_for_context?: boolean;
}

export interface DAGTaskNode {
  id: string;
  name: string;
  layer: number;
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'deterministic-engine';
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  execution_ms?: number;
  summary?: string;
  tokens_input?: number;
  tokens_output?: number;
}

export interface ClaimVerification {
  claim_id: string;
  statement: string;
  cited_fact_ids: string[];
  provenance_valid: boolean;
  entailment_status: 'ENTAILS' | 'CONTRADICTS' | 'NEUTRAL_UNVERIFIED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  regulatory_impact?: string;
  rationale: string;
}

export interface AuditRunResult {
  trace_id: string;
  contract_id: string;
  timestamp: string;
  duration_ms: number;
  layers: {
    layer1: {
      total_chunks: number;
      redacted_count: number;
      chunks: SemanticChunk[];
    };
    layer2: {
      candidates_pool: number;
      rrf_k: number;
      selected_chunks: SemanticChunk[];
    };
    layer3: {
      dag_nodes: DAGTaskNode[];
      flash_tokens: number;
      pro_tokens: number;
      cost_savings_pct: number;
      context_watermark_pct: number;
      watermarkPct?: number;
    };
    layer4: {
      claims: ClaimVerification[];
      unverified_count: number;
      error_rate: number;
      circuit_breaker_tripped: boolean;
      circuitBreakerTripped?: boolean;
      compliance_flags: Array<{
        standard: string;
        clause: string;
        finding: string;
        severity: 'FAIL' | 'WARNING' | 'PASS';
      }>;
      complianceFlags?: Array<{
        standard: string;
        clause: string;
        finding: string;
        severity: 'FAIL' | 'WARNING' | 'PASS';
      }>;
      adversarial_insights: string[];
      adversarialInsights?: string[];
    };
  };
  metrics: {
    chunk_utilization_ratio: number;
    chunk_utilization_passed: boolean;
    citation_accuracy: number;
    hallucination_rate: number;
    token_cost_reduction: number;
  };
  spans: SpanData[];
}
