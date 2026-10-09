import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "PharmaQC Intelligence | AI-Assisted QC Laboratory Decision Support",
  description: "Next-generation pharmaceutical batch conformance, OOS detection, and SOP intelligence platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#070b12] text-slate-100 font-sans antialiased flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
        {/* Subtle background ambient lighting */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 w-[600px] h-[350px] bg-emerald-500/5 rounded-full blur-[140px]" />
          <div className="absolute top-1/3 -right-20 w-[500px] h-[350px] bg-cyan-500/5 rounded-full blur-[140px]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-800/80 bg-[#060a10]/90 py-5 text-center text-xs text-slate-500 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>GMP Advisory Mode &bull; 21 CFR Part 11 Audit Trail Enabled</span>
              </div>
              <p>PharmaQC Intelligence &bull; Final QC Disposition Requires Authorized Sign-off</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
