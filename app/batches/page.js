import Link from "next/link";
import { batchStore } from "@/lib/batches";
import { getSpecificationsByProduct } from "@/lib/specifications";

export default function BatchesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Stage 10 &bull; Laboratory Batch Records
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Production Batches & Lab Results</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered commercial manufacturing lots with quantitative and qualitative QC analytical test data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            {batchStore.length} Batches Logged
          </span>
        </div>
      </div>

      {/* Batches Grid / Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {batchStore.map((batch) => {
          const specs = getSpecificationsByProduct(batch.productId);
          const loggedTestKeys = Object.keys(batch.results);

          return (
            <div
              key={batch.batchId}
              className="border border-slate-800/80 rounded-2xl bg-slate-900/70 p-5 space-y-4 shadow-lg shadow-black/20 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Batch Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                      {batch.productId}
                    </span>
                    <h2 className="text-base font-bold text-white font-mono">{batch.batchId}</h2>
                    <div className="text-xs text-slate-300">{batch.productName}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      batch.status === "Under Review"
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>

                {/* Batch Metadata */}
                <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/70">
                  <div>
                    <span className="text-slate-500 block">Batch Size</span>
                    <span className="font-mono text-slate-300">{batch.batchSize}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Analyst</span>
                    <span className="font-medium text-slate-300">{batch.analyst}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mfg Date</span>
                    <span className="font-mono text-slate-300">{batch.mfgDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Expiry</span>
                    <span className="font-mono text-slate-300">{batch.expiryDate}</span>
                  </div>
                </div>

                {/* Logged Analytical Results */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Recorded Test Readings</span>
                    <span className="font-mono text-slate-500">({loggedTestKeys.length} tests)</span>
                  </div>

                  <div className="space-y-1.5">
                    {Object.entries(batch.results).map(([testKey, value]) => (
                      <div
                        key={testKey}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/50 border border-slate-800/60"
                      >
                        <span className="font-mono text-slate-400 text-[11px]">{testKey}</span>
                        <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {value} {typeof value === "number" ? "%" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action / Next Stage Hint */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  Applicable Specs: <span className="text-slate-300 font-mono">{specs.length}</span>
                </span>
                <span className="text-[11px] text-blue-400 hover:text-blue-300 font-medium">
                  Ready for QC Engine &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
