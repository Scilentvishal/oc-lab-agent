import {
  documents,
  specifications,
  batches,
  findings,
  getProduct,
  getBatchResults,
} from "@/lib/data";

export default function DashboardPage() {
  const stats = [
    {
      label: "Managed Documents",
      value: documents.length,
      sub: "SOPs, Specs & Test Methods",
      badge: "Vector Store Ready",
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Active Specifications",
      value: specifications.length,
      sub: "Registered Acceptance Limits",
      badge: "Deterministic",
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Batches Evaluated",
      value: batches.length,
      sub: "Production Lot Records",
      badge: "Analytical",
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: "Potential Findings",
      value: findings.length,
      sub: "Violations & Missing Tests",
      badge: "Attention",
      alert: findings.length > 0,
      icon: (
        <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800/80 shadow-xl shadow-black/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Stage 2 &bull; Pharma Data Models Connected
          </span>
          <span className="text-slate-500 text-xs">&bull;</span>
          <span className="text-slate-400 text-xs font-mono">lib/data.js</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Pharma QC Intelligence Agent
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Now consuming structured domain entities: <code className="text-emerald-400 font-mono text-xs">Product</code>, <code className="text-emerald-400 font-mono text-xs">Document</code>, <code className="text-emerald-400 font-mono text-xs">Specification</code>, <code className="text-emerald-400 font-mono text-xs">Batch</code>, <code className="text-emerald-400 font-mono text-xs">BatchResult</code>, and <code className="text-emerald-400 font-mono text-xs">Finding</code>.
        </p>
      </div>

      {/* KPI Cards — Derived dynamically from lib/data.js */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`p-5 rounded-2xl border transition-all ${
              stat.alert
                ? "bg-gradient-to-b from-rose-950/30 to-slate-900/80 border-rose-500/40 shadow-lg shadow-rose-950/20"
                : "bg-slate-900/70 border-slate-800/80 shadow-md shadow-black/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                {stat.icon}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  stat.alert
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700/60"
                }`}
              >
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

      {/* Batches & Documents Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batches Table (2 cols) */}
        <div className="lg:col-span-2 border border-slate-800/80 rounded-2xl bg-slate-900/60 backdrop-blur-md p-6 space-y-4 shadow-xl shadow-black/30">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Active Batches ({batches.length})</h2>
            <p className="text-xs text-slate-400">Queried dynamically from <code className="font-mono text-emerald-400">batches</code> store</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090d16]/70">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Product Formulation</th>
                  <th className="py-3 px-4">Tests Recorded</th>
                  <th className="py-3 px-4">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {batches.map((batch) => {
                  const product = getProduct(batch.productId);
                  const results = getBatchResults(batch.id);
                  const isUnderReview = batch.status === "Under Review";

                  return (
                    <tr key={batch.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          {batch.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{product?.name} ({product?.strength})</div>
                        <div className="text-[11px] text-slate-500 font-mono">Lot Size: {batch.batchSize}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {results.length} tests logged
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            isUnderReview
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {batch.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Knowledge Base Documents (1 col) */}
        <div className="border border-slate-800/80 rounded-2xl bg-slate-900/60 backdrop-blur-md p-6 space-y-4 shadow-xl shadow-black/30">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Registered Documents ({documents.length})</h2>
            <p className="text-xs text-slate-400">Queried from <code className="font-mono text-emerald-400">documents</code> model</p>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-[#090d16]/80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-200 text-xs leading-snug line-clamp-2">
                    {doc.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                    {doc.version}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span className="font-medium text-slate-400">{doc.type}</span>
                  <span className="text-emerald-400 font-semibold">● {doc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
