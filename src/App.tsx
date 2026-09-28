import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { FoundationFilesViewer } from './components/FoundationFilesViewer';
import { AuditWorkbench } from './components/AuditWorkbench';
import { TelemetrySpansViewer } from './components/TelemetrySpansViewer';
import { CircuitBreakerTester } from './components/CircuitBreakerTester';
import { ContractGuardEngine } from './services/contractguardEngine';
import { SAMPLE_CONTRACTS } from './data/contracts';
import { AuditRunResult } from './types';
import { ShieldCheck, Database, Layers, Terminal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workbench' | 'foundation' | 'telemetry' | 'circuit_breaker'>('foundation');
  const [currentAuditResult, setCurrentAuditResult] = useState<AuditRunResult>(() => {
    return ContractGuardEngine.runFullAudit(SAMPLE_CONTRACTS[0], false);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Banking Governance Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        circuitBreakerTripped={currentAuditResult.layers.layer4.circuitBreakerTripped}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'foundation' && (
          <FoundationFilesViewer />
        )}

        {activeTab === 'workbench' && (
          <AuditWorkbench
            onAuditCompleted={(result) => setCurrentAuditResult(result)}
          />
        )}

        {activeTab === 'telemetry' && (
          <TelemetrySpansViewer spans={currentAuditResult.spans} />
        )}

        {activeTab === 'circuit_breaker' && (
          <CircuitBreakerTester
            onTestExecuted={(result) => setCurrentAuditResult(result)}
          />
        )}
      </main>

      {/* Banking Compliance & Audit Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>
              <strong>ContractGuard AI</strong> — Regulated Tier-1 Australian Banking Governance Runtime
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span>APRA CPS 234 (InfoSec)</span>
            <span>•</span>
            <span>APRA CPG 235 (Data Risk)</span>
            <span>•</span>
            <span>ASIC Act s12BF (UCT)</span>
            <span>•</span>
            <span>Zero-SaaS OTel Lineage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
