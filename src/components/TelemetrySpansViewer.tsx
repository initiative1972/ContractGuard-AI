import React, { useState } from 'react';
import { SpanData } from '../types';
import {
  Activity,
  Download,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle,
  AlertCircle,
  FileCode,
  Tag,
} from 'lucide-react';

interface TelemetrySpansViewerProps {
  spans: SpanData[];
}

export const TelemetrySpansViewer: React.FC<TelemetrySpansViewerProps> = ({ spans }) => {
  const [selectedSpan, setSelectedSpan] = useState<SpanData | null>(spans[0] || null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'waterfall' | 'jsonl'>('waterfall');

  const rootSpan = spans.find((s) => s.parent_span_id === null) || spans[0];
  const totalDuration = rootSpan?.duration_ms || 100;

  const jsonlOutput = spans.map((s) => JSON.stringify(s)).join('\n');

  const handleCopyJsonl = () => {
    navigator.clipboard.writeText(jsonlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJsonl = () => {
    const blob = new Blob([jsonlOutput], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_spans_${rootSpan?.trace_id?.slice(0, 8) || 'trace'}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                OpenTelemetry Runtime Telemetry
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Trace: {rootSpan?.trace_id?.slice(0, 16)}...
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Zero-Dependency Audit Spans</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compliant with APRA CPG 235: Local append-only WORM JSON-L logs with full provenance lineage.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'waterfall' ? 'jsonl' : 'waterfall')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{viewMode === 'waterfall' ? 'View JSON-L' : 'View Waterfall'}</span>
            </button>

            <button
              onClick={handleCopyJsonl}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadJsonl}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .jsonl</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'waterfall' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Waterfall Timing Diagram */}
          <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center space-x-2">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Distributed Span Hierarchy &amp; Latency Waterfall</span>
              </span>
              <span className="font-mono text-slate-400">Total: {totalDuration.toFixed(1)}ms</span>
            </div>

            <div className="p-3 divide-y divide-slate-800/60">
              {spans.map((span) => {
                const isRoot = span.parent_span_id === null;
                const isSelected = selectedSpan?.span_id === span.span_id;
                const widthPct = Math.max(5, Math.min(100, (span.duration_ms / totalDuration) * 100));

                return (
                  <div
                    key={span.span_id}
                    onClick={() => setSelectedSpan(span)}
                    className={`py-3 px-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-950/40 border border-blue-500/40'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            span.status.code === 'OK' ? 'bg-emerald-400' : 'bg-red-400'
                          }`}
                        />
                        <span
                          className={`font-mono text-xs font-semibold ${
                            isRoot ? 'text-white' : 'text-slate-300 pl-3'
                          }`}
                        >
                          {span.name}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {span.duration_ms.toFixed(2)}ms
                      </span>
                    </div>

                    {/* Latency Bar */}
                    <div className="mt-2 w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all ${
                          span.status.code === 'OK'
                            ? isRoot
                              ? 'bg-blue-500'
                              : 'bg-cyan-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Span Attributes Inspector */}
          <div className="lg:col-span-5 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center space-x-2">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>OpenTelemetry Span Attributes</span>
              </span>
              {selectedSpan && (
                <span className="font-mono text-[11px] text-slate-400">
                  {selectedSpan.span_id.slice(0, 8)}
                </span>
              )}
            </div>

            {selectedSpan ? (
              <div className="p-4 space-y-4 max-h-[550px] overflow-y-auto text-xs">
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Span Metadata
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px] bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Span ID:</span>
                      <span className="text-slate-200">{selectedSpan.span_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Parent ID:</span>
                      <span className="text-slate-200">
                        {selectedSpan.parent_span_id || 'root'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Kind:</span>
                      <span className="text-slate-200">{selectedSpan.kind}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Status:</span>
                      <span
                        className={
                          selectedSpan.status.code === 'OK'
                            ? 'text-emerald-400 font-bold'
                            : 'text-red-400 font-bold'
                        }
                      >
                        {selectedSpan.status.code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banking Attributes */}
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Attributes
                  </h4>
                  <div className="space-y-1.5 mt-2 font-mono text-[11px]">
                    {Object.entries(selectedSpan.attributes).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex flex-col bg-slate-900/40 p-2 rounded border border-slate-800/80"
                      >
                        <span className="text-cyan-400 font-semibold">{key}</span>
                        <span className="text-slate-300 mt-0.5">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Events */}
                {selectedSpan.events && selectedSpan.events.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Events ({selectedSpan.events.length})
                    </h4>
                    <div className="space-y-2 mt-2">
                      {selectedSpan.events.map((evt, i) => (
                        <div
                          key={i}
                          className="bg-slate-900/40 p-2.5 rounded border border-slate-800 text-[11px]"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-amber-400 font-semibold">{evt.name}</span>
                            <span className="text-slate-500 text-[10px]">{evt.timestamp_iso}</span>
                          </div>
                          {evt.attributes && (
                            <pre className="text-slate-400 font-mono text-[10px] mt-1 bg-slate-950 p-1.5 rounded">
                              {JSON.stringify(evt.attributes, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select a span on the left to inspect its attributes.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Raw JSON-L Viewer */
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-slate-300">audit_spans.jsonl (WORM Audit Trail)</span>
            <span>{spans.length} records</span>
          </div>
          <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed">
              <code>{jsonlOutput}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
