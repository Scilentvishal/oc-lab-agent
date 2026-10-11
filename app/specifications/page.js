"use client";

import { useState } from "react";
import { specificationStore, SUPPORTED_SPEC_TYPES } from "@/lib/specifications";

export default function SpecificationsPage() {
  const [selectedType, setSelectedType] = useState("all");

  const filteredSpecs =
    selectedType === "all"
      ? specificationStore
      : specificationStore.filter((s) => s.type === selectedType);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Stage 9 &bull; Standardized Acceptance Criteria
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Pharmaceutical Specifications Library
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Registered deterministic acceptance limits across range, minimum, maximum, exact, and pass/fail criteria.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              {specificationStore.length} Registered Specifications
            </span>
          </div>
        </div>
      </div>

      {/* Type Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedType("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            selectedType === "all"
              ? "bg-slate-800 text-emerald-400 border border-slate-700"
              : "text-slate-400 hover:text-white bg-slate-900/60"
          }`}
        >
          All Types ({specificationStore.length})
        </button>
        {SUPPORTED_SPEC_TYPES.map((type) => {
          const count = specificationStore.filter((s) => s.type === type).length;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                selectedType === type
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800"
              }`}
            >
              {type} ({count})
            </button>
          );
        })}
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSpecs.map((spec) => (
          <div
            key={spec.id}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-3 shadow-lg shadow-black/20 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                    {spec.productId}
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {spec.testLabel}
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800 shrink-0">
                  {spec.type}
                </span>
              </div>

              {/* Criteria Box */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-white">
                <span className="text-slate-500 text-[10px] uppercase block font-sans">Acceptance Limit</span>
                <div className="font-bold text-emerald-400 text-sm mt-0.5">
                  {spec.type === "range" && `${spec.min}${spec.unit} – ${spec.max}${spec.unit}`}
                  {spec.type === "minimum" && `Not Less Than (NLT) ${spec.min}${spec.unit}`}
                  {spec.type === "maximum" && `Not More Than (NMT) ${spec.max}${spec.unit}`}
                  {spec.type === "exact" && `Exact: "${spec.expected}"`}
                  {spec.type === "pass_fail" && `Status: "${spec.expected}"`}
                </div>
              </div>
            </div>

            {/* Document Citation Footer */}
            <div className="pt-2 border-t border-slate-800/70 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="font-mono text-slate-400">{spec.documentRef}</span>
              {spec.isMandatory && (
                <span className="text-rose-400 font-semibold text-[10px] uppercase bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  Mandatory
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
