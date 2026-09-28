import React, { useState } from 'react';
import { SAMPLE_CONTRACTS } from '../data/contracts';
import { ContractGuardEngine } from '../services/contractguardEngine';
import { AuditRunResult, ContractSample } from '../types';
import {
  Play,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Building,
  CheckCircle2,
  Clock,
  Zap,
  Eye,
  FileText,
  Lock,
} from 'lucide-react';
import { LayerDetailViewer } from './LayerDetailViewer';

interface AuditWorkbenchProps {
  onAuditCompleted?: (result: AuditRunResult) => void;
}

export const AuditWorkbench: React.FC<AuditWorkbenchProps> = ({ onAuditCompleted }) => {
  const [selectedContract, setSelectedContract] = useState<ContractSample>(SAMPLE_CONTRACTS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeLayerTab, setActiveLayerTab] = useState<'summary' | 'layer1' | 'layer2' | 'layer3' | 'layer4'>('summary');
  const [auditResult, setAuditResult] = useState<AuditRunResult | null>(() => {
    // Initial run for immediate visualization
    return ContractGuardEngine.runFullAudit(SAMPLE_CONTRACTS[0]);
  });
  const [showOriginalText, setShowOriginalText] = useState(false);

  const handleRunAudit = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = ContractGuardEngine.runFullAudit(selectedContract, false);
      setAuditResult(result);
      setIsRunning(false);
      if (onAuditCompleted) {
        onAuditCompleted(result);
      }
    }, 600);
  };

  const handleContractChange = (contract: ContractSample) => {
    setSelectedContract(contract);
    setIsRunning(true);
    setTimeout(() => {
      const result = ContractGuardEngine.runFullAudit(contract, false);
      setAuditResult(result);
      setIsRunning(false);
      if (onAuditCompleted) {
        onAuditCompleted(result);
      }
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Top Contract Selector & Action Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Regulated Contract Governance
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {selectedContract.id}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {selectedContract.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {selectedContract.summary}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowOriginalText(!showOriginalText)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showOriginalText ? 'Hide Source' : 'View Source Clause'}</span>
            </button>

            <button
              onClick={handleRunAudit}
              disabled={isRunning}
              className={`px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all ${
                isRunning ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Executing 4-Layer DAG...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute 4-Layer Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contract Switcher Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
          {SAMPLE_CONTRACTS.map((contract) => (
            <button
              key={contract.id}
              onClick={() => handleContractChange(contract)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedContract.id === contract.id
                  ? 'bg-blue-950/40 border-blue-500/60 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-[11px] text-slate-400">{contract.type}</span>
                {selectedContract.id === contract.id && (
                  <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                {contract.title}
              </p>
              <div className="flex items-center space-x-1.5 mt-2 text-[11px] text-slate-400">
                <Building className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{contract.parties.bank.split('(')[0]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Raw Contract Text Slideout/Collapsible */}
      {showOriginalText && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="font-mono text-slate-300 font-semibold flex items-center space-x-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Source Document Clauses (Prior to PII Scrubbing)</span>
            </span>
            <span className="text-slate-500 text-[11px]">APRA CPS 234 Confidential Payload</span>
          </div>
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap mt-3 max-h-72 overflow-y-auto leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-800/70">
            {selectedContract.originalText}
          </pre>
        </div>
      )}

      {/* Core Telemetry & SLA Metric Banner */}
      {auditResult && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Metric 1: Chunk Utilization Ratio */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Chunk Utilization</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                SLA &ge;65%
              </span>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white">
                {(auditResult.metrics.chunk_utilization_ratio * 100).toFixed(1)}%
              </span>
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  auditResult.metrics.chunk_utilization_passed
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-amber-400 bg-amber-500/10'
                }`}
              >
                {auditResult.metrics.chunk_utilization_passed ? 'SLA MET' : 'DEFICIT'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {auditResult.layers.layer4.claims.reduce((acc, c) => acc + c.cited_fact_ids.length, 0)} cited /{' '}
              {auditResult.layers.layer2.selected_chunks.length} in context
            </p>
          </div>

          {/* Metric 2: Citation Accuracy */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Citation Accuracy</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                SLA &ge;95%
              </span>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {auditResult.metrics.citation_accuracy}%
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active fact_id provenance verified
            </p>
          </div>

          {/* Metric 3: Hallucination Rate */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Hallucination Rate</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                SLA &lt;5%
              </span>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {auditResult.metrics.hallucination_rate.toFixed(1)}%
              </span>
              <span className="text-xs text-emerald-400 font-medium">0 Unsourced</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Zero unverified legal assertions
            </p>
          </div>

          {/* Metric 4: Inference Cost Reduction */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Cost Reduction</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                SLA &ge;60%
              </span>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-indigo-400">
                {auditResult.metrics.token_cost_reduction}%
              </span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Flash ↔ Pro DAG routing savings
            </p>
          </div>

          {/* Metric 5: Hallucination Circuit Breaker */}
          <div
            className={`border rounded-xl p-3.5 shadow-sm ${
              auditResult.layers.layer4.circuitBreakerTripped
                ? 'bg-red-950/40 border-red-500/50'
                : 'bg-emerald-950/20 border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span
                className={`font-medium ${
                  auditResult.layers.layer4.circuitBreakerTripped
                    ? 'text-red-300'
                    : 'text-emerald-300'
                }`}
              >
                Circuit Breaker
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300">
                Tol: 5%
              </span>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              {auditResult.layers.layer4.circuitBreakerTripped ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-lg font-bold text-red-400">TRIPPED</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400">ENGAGED</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {auditResult.layers.layer4.circuitBreakerTripped
                ? 'Generation dropped; escalated to HITL'
                : 'Deterministic safety boundary intact'}
            </p>
          </div>
        </div>
      )}

      {/* Layer Navigation Tabs */}
      <div className="border-b border-slate-800 flex flex-wrap gap-2 pt-2">
        <button
          onClick={() => setActiveLayerTab('summary')}
          className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
            activeLayerTab === 'summary'
              ? 'bg-slate-900 text-white border-t border-x border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Audit Findings Summary</span>
        </button>

        <button
          onClick={() => setActiveLayerTab('layer1')}
          className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
            activeLayerTab === 'layer1'
              ? 'bg-slate-900 text-white border-t border-x border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Layer 1: Knowledge &amp; PII Scrubbing</span>
        </button>

        <button
          onClick={() => setActiveLayerTab('layer2')}
          className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
            activeLayerTab === 'layer2'
              ? 'bg-slate-900 text-white border-t border-x border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Layer 2: Hybrid RAG &amp; RRF</span>
        </button>

        <button
          onClick={() => setActiveLayerTab('layer3')}
          className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
            activeLayerTab === 'layer3'
              ? 'bg-slate-900 text-white border-t border-x border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Layer 3: Hierarchical Model DAG</span>
        </button>

        <button
          onClick={() => setActiveLayerTab('layer4')}
          className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
            activeLayerTab === 'layer4'
              ? 'bg-slate-900 text-white border-t border-x border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Layer 4: Multi-Agent Validation</span>
        </button>
      </div>

      {/* Layer Content Viewer */}
      {auditResult && (
        <LayerDetailViewer
          activeTab={activeLayerTab}
          result={auditResult}
          contract={selectedContract}
        />
      )}
    </div>
  );
};
