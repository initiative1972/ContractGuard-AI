import React from 'react';
import { ShieldCheck, Cpu, Activity, FileCode, AlertOctagon } from 'lucide-react';

interface NavbarProps {
  activeTab: 'workbench' | 'foundation' | 'telemetry' | 'circuit_breaker';
  setActiveTab: (tab: 'workbench' | 'foundation' | 'telemetry' | 'circuit_breaker') => void;
  circuitBreakerTripped?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  circuitBreakerTripped,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">ContractGuard</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">
                  AI Runtime
                </span>
                <span className="text-xs text-slate-400 hidden md:inline">Tier-1 AU Banking</span>
              </div>
              <p className="text-[11px] text-slate-400">
                4-Layer Governance • APRA CPS 234 / CPG 235 • Zero-SaaS Telemetry
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('foundation')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'foundation'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Foundation Files</span>
            </button>

            <button
              onClick={() => setActiveTab('workbench')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'workbench'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>4-Layer Workbench</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'telemetry'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>OpenTelemetry Spans</span>
            </button>

            <button
              onClick={() => setActiveTab('circuit_breaker')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'circuit_breaker'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : circuitBreakerTripped
                  ? 'text-red-400 bg-red-950/40 border border-red-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Circuit Breaker Test</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
