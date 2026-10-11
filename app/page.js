import Link from "next/link";
import { batchStore } from "@/lib/batches";
import { specificationStore } from "@/lib/specifications";
import { pharmaCorpus } from "@/lib/pharma-corpus";
import { toolDefinitions } from "@/lib/tools";

export default function DashboardPage() {
  const stats = [
    {
      label: "Managed Documents",
      value: pharmaCorpus.length,
      sub: "SOPs, Specs & Test Methods",
      badge: "Qdrant Vector Store",
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Active Specifications",
      value: specificationStore.length,
      sub: "Registered Acceptance Limits",
      badge: "Deterministic Rules",
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Production Batches",
      value: batchStore.length,
      sub: "Commercial Lot Records",
      badge: "Laboratory Data",
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: "Autonomous Tools",
      value: toolDefinitions.length,
      sub: "ReAct Agent Tool Registry",
      badge: "Full Agentic AI",
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 shadow-2xl shadow-black/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Complete Pharma AI Engineering Stack
              </span>
              <span className="text-slate-500 text-xs font-mono">Next.js &bull; Ollama &bull; Qdrant</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Pharma QC Intelligence Agent
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              An AI-assisted pharmaceutical Quality Control application. Combines zero-hallucination deterministic rule engines with an autonomous ReAct agent to investigate Out-of-Specification (OOS) batches, missing tests, and analytical calculation anomalies.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/analysis"
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Launch Agent Workspace
            </Link>
            <Link
              href="/documents"
              className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all flex items-center justify-center gap-2"
            >
              Explore Knowledge Base
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-md shadow-black/20"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                {stat.badge}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-slate-300 mt-1">{stat.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Batches Table with Direct AI Actions */}
      <div className="border border-slate-800/80 rounded-2xl bg-slate-900/60 backdrop-blur-md p-6 space-y-4 shadow-xl shadow-black/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Active Production Batches</h2>
            <p className="text-xs text-slate-400">Commercial release lots ready for autonomous AI quality review</p>
          </div>
          <Link href="/batches" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
            View All Batches &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090d16]/70">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Product Formulation</th>
                <th className="py-3 px-4">Analyst & Lot Size</th>
                <th className="py-3 px-4">Known Scenario</th>
                <th className="py-3 px-4 text-right">Autonomous Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {batchStore.map((batch) => {
                const isUnderReview = batch.status === "Under Review";
                const isOOS = batch.batchId === "B-2026-001";
                const isCalc = batch.batchId === "B-2026-004";

                return (
                  <tr key={batch.batchId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isUnderReview ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                        {batch.batchId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{batch.productName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{batch.productId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300">{batch.analyst}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{batch.batchSize}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-slate-300">
                        {isOOS && "🔴 Assay OOS (92.4%) + Missing Test"}
                        {isCalc && "🟣 Reported 99.5% vs Raw HPLC 94.5%"}
                        {batch.batchId === "B-2026-002" && "🟢 100% Compliant Batch"}
                        {batch.batchId === "B-2026-003" && "🟡 High Moisture Content (15.2%)"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href="/analysis"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-slate-700 transition-all"
                      >
                        <span>Analyze</span>
                        <span>&rarr;</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Architecture Showcase Card */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Architectural Core: The Hybrid Pharma AI Blueprint
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <span className="font-bold text-emerald-400 block text-sm">1. Deterministic Guardrails</span>
            <p className="text-[11px] text-slate-400">
              Pure JavaScript functions execute all mathematical comparisons, boundary checks, and HPLC calculations. 0% hallucination risk on limits.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <span className="font-bold text-cyan-400 block text-sm">2. Qdrant Vector Memory</span>
            <p className="text-[11px] text-slate-400">
              768-dimensional embeddings via nomic-embed-text. Automatically retrieves Phase I OOS SOPs and chromatographic test methods on-demand.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <span className="font-bold text-purple-400 block text-sm">3. Autonomous ReAct Agent</span>
            <p className="text-[11px] text-slate-400">
              Multi-step Reason + Act + Observe loop. Decides dynamically which tools to invoke and formats verified cGMP investigation reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
