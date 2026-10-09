"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-xl sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.943A4.5 4.5 0 0 1 15.912 17H8.088a4.5 4.5 0 0 1-2.318-.757L4.2 15.3m15.6 0c.342.205.6.51.745.874.32.802-.27 1.726-1.145 1.726H4.6c-.875 0-1.465-.924-1.145-1.726.145-.364.403-.669.745-.874"
                  />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">
                  Pharma<span className="text-emerald-400">QC</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Intelligence
                </span>
              </div>
            </Link>

            <nav className="flex items-center space-x-1">
              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-slate-800 text-emerald-300 shadow-inner border border-slate-700/60"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Right Status Badges */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Human In The Loop Mode</span>
            </div>
            <span className="hidden sm:inline-block text-xs text-slate-500 font-mono">
              Stage 1 Foundation
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
