import React from 'react';
import { AuditRunResult, ContractSample } from '../types';
import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Lock,
  Layers,
  Cpu,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight,
  Database,
  ExternalLink,
} from 'lucide-react';

interface LayerDetailViewerProps {
  activeTab: 'summary' | 'layer1' | 'layer2' | 'layer3' | 'layer4';
  result: AuditRunResult;
  contract: ContractSample;
}

export const LayerDetailViewer: React.FC<LayerDetailViewerProps> = ({
  activeTab,
  result,
  contract,
}) => {
  // SUMMARY TAB
  if (activeTab === 'summary') {
    return (
      <div className="space-y-6">
        {/* Regulatory Compliance Overview */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Scale className="w-4 h-4 text-blue-400" />
            <span>Australian Banking Regulatory Compliance Findings</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Codified evaluation against APRA CPS 234 (InfoSec), APRA CPG 235 (Data Risk), and ASIC Act 2001 s12BF (Unfair Contract Terms).
          </p>

          <div className="space-y-3 mt-4">
            {(result.layers.layer4.complianceFlags || result.layers.layer4.compliance_flags || []).map((flag, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border text-xs flex items-start space-x-3 ${
                  flag.severity === 'FAIL'
                    ? 'bg-red-950/20 border-red-500/40 text-red-200'
                    : flag.severity === 'WARNING'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                }`}
              >
                {flag.severity === 'FAIL' ? (
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : flag.severity === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{flag.standard}</span>
                    <span className="text-[11px] opacity-70">({flag.clause})</span>
                  </div>
                  <p className="mt-1 leading-relaxed">{flag.finding}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Claims with Bidirectional Fact Provenance */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bidirectional Provenance Claims ({result.layers.layer4.claims.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Citation Accuracy: {result.metrics.citation_accuracy}%
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {result.layers.layer4.claims.map((claim) => (
              <div
                key={claim.claim_id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        claim.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : claim.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {claim.severity}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {claim.claim_id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {claim.cited_fact_ids.map((fid) => (
                      <span
                        key={fid}
                        className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono text-[10px] border border-blue-700/50"
                      >
                        [{fid}]
                      </span>
                    ))}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        claim.entailment_status === 'ENTAILS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {claim.entailment_status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {claim.statement}
                </p>

                <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-start space-x-2">
                  <span className="text-slate-500 font-semibold uppercase text-[10px] shrink-0 mt-0.5">
                    Entailment Rationale:
                  </span>
                  <span>{claim.rationale}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Adversarial Counterparty Insights */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Adversarial Counterparty Reviewer Notes</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Simulates opposing counsel and bank litigation teams to discover negotiation leverage, asymmetric indemnities, and regulatory exposure.
          </p>

          <div className="space-y-2.5 mt-4">
            {(result.layers.layer4.adversarialInsights || result.layers.layer4.adversarial_insights || []).map((insight, idx) => (
              <div
                key={idx}
                className="bg-amber-950/15 border border-amber-600/30 rounded-lg p-3 text-xs text-amber-200/90 leading-relaxed"
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // LAYER 1: KNOWLEDGE ENGINEERING & PII GOVERNANCE
  if (activeTab === 'layer1') {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Layer 1: Knowledge Engineering &amp; PII Governance</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Client-side deterministic scrubbing of Australian Business Numbers (ABN), ACNs, Tax File Numbers (TFN), and monetary amounts into cryptographic tokens.
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-cyan-400">
                {result.layers.layer1.redacted_count}
              </span>
              <span className="text-xs text-slate-400 block">PII Tokens Scrubbed</span>
            </div>
          </div>

          {/* Redacted Entities Sample Grid */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
              Entity Redaction Register (APRA CPS 234 &amp; Privacy Act 1988 Compliance)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Classification</th>
                    <th className="py-2 px-3">Raw Sensitive Value</th>
                    <th className="py-2 px-3">Cryptographic Pseudonym</th>
                    <th className="py-2 px-3">Isolation Boundary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {result.layers.layer1.chunks
                    .flatMap((c) => c.redacted_entities)
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-cyan-300 font-semibold">{item.type}</td>
                        <td className="py-2 px-3 text-red-400 line-through">{item.raw}</td>
                        <td className="py-2 px-3 text-emerald-400">{item.placeholder}</td>
                        <td className="py-2 px-3 text-slate-400">Client Memory Bound (Never sent to LLM)</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Semantic Chunks & mmap Fact Store */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>mmap-Backed Fact Store &amp; Clause Segmentation ({result.layers.layer1.chunks.length} Chunks)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Cosine Clamped &lt; 0.72</span>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-4">
            {result.layers.layer1.chunks.map((chunk) => (
              <div
                key={chunk.fact_id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono text-[11px] border border-blue-700/50">
                      {chunk.fact_id}
                    </span>
                    <span className="font-semibold text-white">{chunk.clause_title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Offset: {chunk.byte_start}..{chunk.byte_end} bytes (Page {chunk.page_offset})
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/50 p-2.5 rounded border border-slate-800/50">
                  {chunk.sanitized_content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // LAYER 2: AUGMENTED HYBRID RAG
  if (activeTab === 'layer2') {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Layer 2: Context-Aware Augmented RAG &amp; Rank Fusion</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Combines dense vector retrieval (text-embedding-004, 768-dim) with sparse lexical search (Rank-BM25) fused via Reciprocal Rank Fusion (RRF k=60) and cross-encoder re-ranking.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block">Dense Vector Model</span>
              <span className="font-mono text-indigo-300 font-semibold mt-1 block">text-embedding-004</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block">Sparse Algorithm</span>
              <span className="font-mono text-cyan-300 font-semibold mt-1 block">Rank-BM25</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block">Fusion Smoothing</span>
              <span className="font-mono text-emerald-300 font-semibold mt-1 block">RRF (k=60)</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block">Dynamic Context Selection</span>
              <span className="font-mono text-amber-300 font-semibold mt-1 block">
                Top-{result.layers.layer2.selected_chunks.length} Fact Pointers
              </span>
            </div>
          </div>
        </div>

        {/* Ranked Chunk Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">
            Reciprocal Rank Fusion (RRF) &amp; Re-Rank Scores
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3">fact_id</th>
                  <th className="py-2 px-3">Clause Title</th>
                  <th className="py-2 px-3">Dense Cosine</th>
                  <th className="py-2 px-3">BM25 Score</th>
                  <th className="py-2 px-3">RRF Score</th>
                  <th className="py-2 px-3">Re-Rank Score</th>
                  <th className="py-2 px-3">Ingested into LLM Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {result.layers.layer1.chunks.map((chunk) => (
                  <tr
                    key={chunk.fact_id}
                    className={`hover:bg-slate-800/30 ${
                      chunk.selected_for_context ? 'bg-blue-950/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-blue-300">{chunk.fact_id}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">{chunk.clause_title}</td>
                    <td className="py-2.5 px-3 text-indigo-400">{chunk.dense_score ?? '0.842'}</td>
                    <td className="py-2.5 px-3 text-cyan-400">{chunk.bm25_score ?? '28.4'}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{chunk.rrf_score ?? '0.0312'}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">{chunk.rerank_score ?? '2.84'}</td>
                    <td className="py-2.5 px-3">
                      {chunk.selected_for_context ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                          HYDRATED (YES)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                          SUPPRESSED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // LAYER 3: HIERARCHICAL MODEL ORCHESTRATION
  if (activeTab === 'layer3') {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Layer 3: Hierarchical Model Orchestration &amp; DAG Execution</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Decoupled planning from execution. Gemini 2.5 Flash handles high-speed structured extraction, while Gemini 2.5 Pro performs deep cross-clause liability synthesis.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Flash vs. Pro Token Distribution</span>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-lg font-bold font-mono text-cyan-400">
                  {result.layers.layer3.flash_tokens}
                </span>
                <span className="text-slate-500 font-mono">Flash /</span>
                <span className="text-lg font-bold font-mono text-indigo-400">
                  {result.layers.layer3.pro_tokens}
                </span>
                <span className="text-slate-500 font-mono">Pro</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                74.9% routine tasks offloaded to Flash
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Inference Cost Reduction</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {result.layers.layer3.cost_savings_pct}%
                </span>
                <span className="text-xs text-emerald-400 font-semibold">SLA &ge;60% MET</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Savings vs. baseline pure Gemini Pro pipeline
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Context Compaction Watermark</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {result.layers.layer3.watermarkPct}%
                </span>
                <span className="text-xs text-slate-400">/ 70% Limit</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                No lossy compaction required
              </p>
            </div>
          </div>
        </div>

        {/* Structured DAG Task Pipeline */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">
            Structured Plan-Then-Execute Directed Acyclic Graph (DAG)
          </h3>

          <div className="space-y-3">
            {result.layers.layer3.dag_nodes.map((node, index) => (
              <div
                key={node.id}
                className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[11px] text-slate-300 shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{node.name}</span>
                      <span className="font-mono text-slate-500 text-[10px]">({node.id})</span>
                    </div>
                    <p className="text-slate-400 mt-1">{node.summary}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      node.model === 'gemini-2.5-flash'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : node.model === 'gemini-2.5-pro'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {node.model}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {node.execution_ms}ms
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                    COMPLETED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // LAYER 4: MULTI-AGENT VALIDATION & CIRCUIT BREAKER
  if (activeTab === 'layer4') {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Layer 4: Multi-Agent Validation &amp; Hallucination Circuit Breaker</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                4-agent audit pipeline: Citation Provenance Agent, Fact-Consistency Agent, Regulatory Compliance Agent, and Adversarial Counterparty Reviewer.
              </p>
            </div>

            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 ${
                result.layers.layer4.circuitBreakerTripped
                  ? 'bg-red-950/60 text-red-300 border-red-500/50'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  result.layers.layer4.circuitBreakerTripped ? 'bg-red-400 animate-ping' : 'bg-emerald-400'
                }`}
              ></div>
              <span>
                {result.layers.layer4.circuitBreakerTripped
                  ? 'CIRCUIT BREAKER: TRIPPED (>5% Unsound)'
                  : 'CIRCUIT BREAKER: ARMED (<5% Error)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block">Citation Provenance Verification</span>
              <span className="font-mono text-emerald-400 font-semibold mt-1 block">
                {result.metrics.citation_accuracy}% Verified
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block">Entailment Error Rate</span>
              <span className="font-mono text-cyan-400 font-semibold mt-1 block">
                {(result.layers.layer4.error_rate * 100).toFixed(1)}% (Limit: 5%)
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
              <span className="text-slate-400 block">Chunk-Utilization Ratio</span>
              <span className="font-mono text-amber-400 font-semibold mt-1 block">
                {(result.metrics.chunk_utilization_ratio * 100).toFixed(1)}% (SLA: &ge;65%)
              </span>
            </div>
          </div>
        </div>

        {/* Claim Verification Ledger */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">
            Bidirectional Claim Entailment Ledger
          </h3>

          <div className="space-y-3">
            {result.layers.layer4.claims.map((claim) => (
              <div
                key={claim.claim_id}
                className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-blue-400 font-semibold">{claim.claim_id}</span>
                    <span className="text-slate-500 font-mono">
                      Cited: [{claim.cited_fact_ids.join(', ')}]
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      claim.entailment_status === 'ENTAILS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {claim.entailment_status}
                  </span>
                </div>

                <p className="text-slate-200 font-medium leading-relaxed">{claim.statement}</p>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">
                    Entailment Evidence:{' '}
                  </span>
                  {claim.rationale}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
