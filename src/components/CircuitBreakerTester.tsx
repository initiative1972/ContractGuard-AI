import React, { useState } from 'react';
import { SAMPLE_CONTRACTS } from '../data/contracts';
import { ContractGuardEngine } from '../services/contractguardEngine';
import { AuditRunResult } from '../types';
import {
  AlertOctagon,
  ShieldCheck,
  RotateCcw,
  Zap,
  ArrowRight,
  AlertTriangle,
  FileWarning,
  UserCheck,
} from 'lucide-react';

interface CircuitBreakerTesterProps {
  onTestExecuted?: (result: AuditRunResult) => void;
}

export const CircuitBreakerTester: React.FC<CircuitBreakerTesterProps> = ({
  onTestExecuted,
}) => {
  const [injectHallucinations, setInjectHallucinations] = useState(true);
  const [tolerancePct, setTolerancePct] = useState(0.05); // 5% standard
  const [testResult, setTestResult] = useState<AuditRunResult | null>(() => {
    return ContractGuardEngine.runFullAudit(SAMPLE_CONTRACTS[0], true);
  });

  const handleRunSimulation = () => {
    const result = ContractGuardEngine.runFullAudit(
      SAMPLE_CONTRACTS[0],
      injectHallucinations
    );
    setTestResult(result);
    if (onTestExecuted) {
      onTestExecuted(result);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Model Risk Governance
              </span>
              <span className="text-xs text-slate-400">Layer 4 Circuit Breaker Verification</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Deterministic Hallucination Circuit Breaker Stress Test
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Australian banking regulations (APRA CPG 235 / CPS 234) mandate automated circuit breakers that reject generative outputs if unsourced assertions exceed the 5% tolerance threshold.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white text-xs font-semibold rounded-lg shadow-md flex items-center space-x-2 transition-all shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rerun Breaker Simulation</span>
          </button>
        </div>

        {/* Control Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Adversarial Injection Mode</span>
              <span className="text-slate-400 text-[11px]">
                Inject phantom claims with fabricated <code>fact_ids</code>
              </span>
            </div>
            <button
              onClick={() => {
                setInjectHallucinations(!injectHallucinations);
              }}
              className={`px-3 py-1 rounded font-semibold text-xs transition-colors ${
                injectHallucinations
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {injectHallucinations ? 'INJECTED (TRIP)' : 'CLEAN (PASS)'}
            </button>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Breaker Threshold: {(tolerancePct * 100).toFixed(0)}%</span>
              <span className="text-slate-400 text-[11px]">
                Trip switch triggers if unverified claims &gt; 5%
              </span>
            </div>
            <span className="font-mono text-xs px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300">
              CPS 234 Bound
            </span>
          </div>
        </div>
      </div>

      {/* Circuit Breaker Status Banner */}
      {testResult && (
        <div
          className={`border rounded-xl p-5 shadow-lg ${
            testResult.layers.layer4.circuitBreakerTripped
              ? 'bg-red-950/30 border-red-500/60'
              : 'bg-emerald-950/30 border-emerald-500/60'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div
                className={`p-3 rounded-xl ${
                  testResult.layers.layer4.circuitBreakerTripped
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {testResult.layers.layer4.circuitBreakerTripped ? (
                  <AlertOctagon className="w-8 h-8 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-8 h-8" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      testResult.layers.layer4.circuitBreakerTripped
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {testResult.layers.layer4.circuitBreakerTripped
                      ? 'CIRCUIT BREAKER TRIPPED — OUTPUT REJECTED'
                      : 'CIRCUIT BREAKER PASSED — ARMED'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {testResult.layers.layer4.circuitBreakerTripped
                    ? `Hallucination rate ${(testResult.layers.layer4.error_rate * 100).toFixed(1)}% exceeds 5.0% threshold.`
                    : 'All claims 100% corroborated against content-addressed fact chunks.'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {testResult.layers.layer4.circuitBreakerTripped
                    ? 'Action taken: Generative contract review discarded. Draft quarantined and routed to human-in-the-loop banking risk counsel with diagnostic audit payload.'
                    : 'System verified: Zero ungrounded assertions detected. Ready for legal sign-off.'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-mono">Unverified Claims</span>
              <span className="text-2xl font-bold font-mono text-red-400">
                {testResult.layers.layer4.unverified_count} / {testResult.layers.layer4.claims.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Error Rate: {(testResult.layers.layer4.error_rate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quarantined Assertions Ledger */}
      {testResult && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
            <FileWarning className="w-4 h-4 text-amber-400" />
            <span>Claim Provenance &amp; Quarantined Hallucinations</span>
          </h3>

          <div className="space-y-3">
            {testResult.layers.layer4.claims.map((claim) => (
              <div
                key={claim.claim_id}
                className={`p-3.5 rounded-lg border text-xs ${
                  !claim.provenance_valid
                    ? 'bg-red-950/30 border-red-500/50 text-red-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold">{claim.claim_id}</span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      Cited: [{claim.cited_fact_ids.join(', ')}]
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      !claim.provenance_valid
                        ? 'bg-red-500 text-white'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {!claim.provenance_valid ? 'UNVERIFIED / PHANTOM' : 'VERIFIED PROVENANCE'}
                  </span>
                </div>

                <p className="mt-2 font-medium leading-relaxed">{claim.statement}</p>
                <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Audit Finding: </span>
                  {claim.rationale}
                </div>
              </div>
            ))}
          </div>

          {testResult.layers.layer4.circuitBreakerTripped && (
            <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-amber-500/40 flex items-start space-x-3 text-xs">
              <UserCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">
                  Human-In-The-Loop Escalation Route Active
                </span>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  As required by Model Risk Governance policies, the automated system refused to emit an unsound audit. The diagnostic payload has been flagged for Senior Legal Counsel manual review.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
