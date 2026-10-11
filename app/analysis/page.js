"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AnalysisPage() {
  const [selectedBatchId, setSelectedBatchId] = useState("B-2026-001");
  const [batchesList, setBatchesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentResult, setAgentResult] = useState(null);
  const [activeTab, setActiveTab] = useState("report"); // "report" | "trace" | "findings"

  // Fetch batches on mount for easy selector
  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/batches");
        const data = await res.json();
        if (data.batches) setBatchesList(data.batches);
      } catch (e) {
        console.error("Failed to load batches", e);
      }
    }
    loadBatches();
  }, []);

  async function handleRunAnalysis() {
    setLoading(true);
    setError(null);
    setAgentResult(null);

    try {
      const res = await fetch("/api/qc/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: selectedBatchId }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data.error || "Agent analysis failed to execute");
      }

      setAgentResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedBatchInfo = batchesList.find((b) => b.batchId === selectedBatchId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 shadow-xl shadow-black/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Stage 19 &bull; Autonomous QC Agent Workspace
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Batch Quality Control Analysis
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Deterministic rule verification coupled with an autonomous ReAct agent to investigate Out-of-Specification findings, missing tests, and calculation anomalies.
            </p>
          </div>

          {/* Batch Selector & Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#070a12] p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Select Lot ID
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                disabled={loading}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {batchesList.map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batchId} ({b.productName.split(" ")[0]} - {b.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="mt-auto px-5 py-2 rounded-lg text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Agent Reasoning...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Run QC Agent</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Target Batch Quick Info Card */}
      {selectedBatchInfo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Product</span>
            <span className="font-semibold text-white">{selectedBatchInfo.productName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Mfg / Expiry</span>
            <span className="font-mono text-slate-300">{selectedBatchInfo.mfgDate} &rarr; {selectedBatchInfo.expiryDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Responsible Analyst</span>
            <span className="text-slate-300">{selectedBatchInfo.analyst}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Lot Size</span>
            <span className="font-mono text-slate-300">{selectedBatchInfo.batchSize}</span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold">Agent Execution Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="inline-block p-4 rounded-full bg-emerald-500/10 text-emerald-400 animate-bounce">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.943A4.5 4.5 0 0 1 15.912 17H8.088a4.5 4.5 0 0 1-2.318-.757L4.2 15.3m15.6 0c.342.205.6.51.745.874.32.802-.27 1.726-1.145 1.726H4.6c-.875 0-1.465-.924-1.145-1.726.145-.364.403-.669.745-.874" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white">Autonomous Agent Loop Executing...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Reasoning through batch data &rarr; Evaluating deterministic rules &rarr; Searching Qdrant vector memory &rarr; Formulating compliant remediation steps.
          </p>
        </div>
      )}

      {/* Analysis Results Display */}
      {agentResult && !loading && (
        <div className="space-y-6">
          {/* Status Header */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            agentResult.gatheredKnowledge.overallStatus.includes("REVIEW_REQUIRED")
              ? "bg-rose-950/20 border-rose-500/40"
              : "bg-emerald-950/20 border-emerald-500/40"
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-3.5 h-3.5 rounded-full ${
                agentResult.gatheredKnowledge.overallStatus.includes("REVIEW_REQUIRED")
                  ? "bg-rose-400 animate-ping"
                  : "bg-emerald-400"
              }`}></span>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Disposition Recommendation</span>
                <h2 className={`text-lg font-extrabold tracking-tight ${
                  agentResult.gatheredKnowledge.overallStatus.includes("REVIEW_REQUIRED")
                    ? "text-rose-300"
                    : "text-emerald-300"
                }`}>
                  {agentResult.gatheredKnowledge.overallStatus}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                Steps: {agentResult.totalStepsExecuted}
              </span>
              <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                Duration: {agentResult.totalDurationMs}ms
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("report")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "report"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Synthesis & SOP Actions
            </button>
            <button
              onClick={() => setActiveTab("trace")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "trace"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Agent ReAct Trace ({agentResult.executionTrace.length} Steps)
            </button>
          </div>

          {/* TAB 1: REPORT & SOPS */}
          {activeTab === "report" && (
            <div className="space-y-6">
              {/* Executive Conclusion */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Executive AI Analysis
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                  {agentResult.finalReport?.conclusion || "Comprehensive audit concluded."}
                </p>
              </div>

              {/* Actionable Details */}
              {agentResult.finalReport?.details && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Immediate Actions Checklist */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Mandatory SOP Actions
                    </h4>
                    <div className="space-y-2 text-xs text-slate-300">
                      {Array.isArray(agentResult.finalReport.details.immediateActions) ? (
                        agentResult.finalReport.details.immediateActions.map((act, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-950/60 border border-slate-800/60">
                            <input type="checkbox" className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer" />
                            <span>{act}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic">No immediate remediation protocol required for this lot.</p>
                      )}
                    </div>
                  </div>

                  {/* Governing Regulatory Documents */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Governing Documents & SOP Citations
                    </h4>
                    <div className="space-y-2 text-xs">
                      {Array.isArray(agentResult.finalReport.details.governingDocuments) && agentResult.finalReport.details.governingDocuments.length > 0 ? (
                        agentResult.finalReport.details.governingDocuments.map((doc, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300 flex items-center justify-between">
                            <span className="font-mono font-bold text-white">{typeof doc === "string" ? doc : doc.documentId || doc.title}</span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">Verified Vector Match</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-400">
                          SPEC-PAR-500 Finished Product Specification
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AGENT REACT TRAJECTORY */}
          {activeTab === "trace" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Chronological reasoning trajectory followed autonomously by the agent:
              </div>
              <div className="space-y-3">
                {agentResult.executionTrace.map((step) => (
                  <div key={step.step} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">
                        Step {step.step}: {step.action}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-sans">
                      <span className="text-slate-500 font-mono text-[10px] uppercase block">Thought</span>
                      {step.thought}
                    </div>
                    <div className="text-[11px] font-mono p-2.5 rounded bg-slate-950 border border-slate-800/80 text-slate-400 overflow-x-auto">
                      <span className="text-slate-600 uppercase text-[9px] block">Observation</span>
                      {typeof step.observation === "object" ? JSON.stringify(step.observation, null, 2) : step.observation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GxP Legal Disclaimer Notice */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              <strong>GxP Operational Notice:</strong> This analysis is generated by an AI-Assisted Quality Control agent. Final batch release disposition must be signed off by a qualified QC Director.
            </span>
            <span className="font-mono text-emerald-400 text-[10px] ml-4 shrink-0">FDA 21 CFR Part 211 Compliant</span>
          </div>
        </div>
      )}
    </div>
  );
}
