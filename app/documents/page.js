"use client";

import { useState } from "react";
import { pharmaCorpus } from "@/lib/pharma-corpus";

export default function DocumentsPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState(null);

  const sampleQueries = [
    "What are the immediate steps if an analytical assay test fails specification?",
    "What is the dissolution acceptance limit for Paracetamol 500mg tablets?",
    "What are the HPLC system suitability criteria for TM-HPLC-012?",
    "How long must finished product retention samples be maintained under ICH SOP-QC-018?",
  ];

  async function handleSearch(searchQuery) {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=3`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState(null);

  async function handleIngest() {
    setIngesting(true);
    setIngestStatus(null);
    setError(null);
    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingestion failed");
      setIngestStatus(`Synced ${data.metrics?.totalChunksCreated || 5} chunks to Qdrant!`);
    } catch (err) {
      setError(`Ingest error: ${err.message}`);
    } finally {
      setIngesting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Stages 5 & 6 &bull; Qdrant Vector Semantic Memory
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Pharma Regulatory Documents & Semantic Search
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Search across SOPs, Test Methods, and Specifications indexed in Qdrant Vector DB.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleIngest}
              disabled={ingesting}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {ingesting ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Syncing to Qdrant...
                </>
              ) : (
                <>⚡ Sync / Populate Qdrant</>
              )}
            </button>
            <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              {pharmaCorpus.length} Documents
            </span>
          </div>
        </div>
        {ingestStatus && (
          <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            ✓ {ingestStatus}
          </div>
        )}
      </div>

      {/* Semantic Search Box */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-xl shadow-black/20">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Semantic Vector Query (Natural Language Search)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. What is the Phase I investigation procedure for an OOS result?"
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            />
            <button
              onClick={() => handleSearch()}
              disabled={searching || !query.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {searching ? "Searching..." : "Vector Search"}
            </button>
          </div>
        </div>

        {/* Sample Queries */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Try standard regulatory inquiries:</span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sq);
                  handleSearch(sq);
                }}
                className="text-[11px] text-slate-400 hover:text-emerald-300 bg-slate-950/70 hover:bg-slate-900 px-3 py-1 rounded-lg border border-slate-800/70 transition-all text-left"
              >
                &ldquo;{sq}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results Display */}
      {searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Found <strong>{searchResults.resultsCount}</strong> verified regulatory procedure(s) for: &ldquo;{searchResults.query}&rdquo;</span>
            <span className="font-mono text-slate-500">Retrieval latency: {searchResults.durationMs}ms</span>
          </div>

          <div className="space-y-4">
            {searchResults.results.map((res, idx) => {
              // Clean up raw chunk breadcrumb tags like [SPEC-PAR-500 | Title | Section]
              const cleanedText = res.excerpt
                ? res.excerpt.replace(/^\[.*?\]\s*/, "").trim()
                : "";

              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl shadow-black/30 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30 font-mono">
                        {res.documentId}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {res.title}
                      </span>
                      <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {res.version}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {Math.round(res.similarityScore * 100)}% Match
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {res.sectionTitle}
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/60 text-sm text-slate-200 leading-relaxed font-sans space-y-2">
                      {cleanedText.split("\n\n").map((paragraph, pIdx) => (
                        <p key={pIdx} className="text-slate-300 text-xs md:text-sm leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Governing Standard: FDA 21 CFR Part 211 / EU GMP</span>
                    <span className="font-mono text-emerald-400/80">Source Grounded</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Managed Documents Repository */}
      <div className="space-y-4 pt-4 border-t border-slate-800/60">
        <h2 className="text-base font-bold text-white">Active Document Knowledge Base</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pharmaCorpus.map((doc) => (
            <div
              key={doc.documentId}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">{doc.documentType}</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{doc.title}</h3>
                </div>
                <span className="font-mono text-xs bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                  {doc.version}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Department: <span className="text-slate-300">{doc.department}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Document ID: {doc.documentId} &bull; Effective: {doc.effectiveDate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
