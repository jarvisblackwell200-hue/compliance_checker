"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { runComplianceScan, type ScanActionResult } from "@/lib/actions";
import type { DetectionResult, ScanPhase } from "@/types";

// ─── Shared Components ───────────────────────────────────────────────────────

function StatusIcon({ passed }: { passed: boolean | "partial" }) {
  if (passed === true)
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-sm"
      >
        &#10003;
      </motion.span>
    );
  if (passed === "partial")
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-sm"
      >
        &#9888;
      </motion.span>
    );
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-sm"
    >
      &#10007;
    </motion.span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    Critical: "bg-red-500/15 text-red-400 border-red-500/20",
    High: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    Medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Low: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${colors[risk] || "bg-slate-500/15 text-slate-400"}`}
    >
      {risk}
    </span>
  );
}

function LayerBadge({ layer }: { layer: string }) {
  const colors: Record<string, string> = {
    MAR: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    Exchange: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
    "Best Practice": "bg-teal-500/15 text-teal-400 border-teal-500/20",
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${colors[layer] || "bg-slate-500/15 text-slate-400"}`}
    >
      {layer}
    </span>
  );
}

// ─── Floating Particles ──────────────────────────────────────────────────────

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-blue-400/30"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
      {/* Gradient orbs */}
      <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl" />
    </div>
  );
}

// ─── Landing Screen ──────────────────────────────────────────────────────────

function LandingScreen({
  onScan,
}: {
  onScan: (url: string, exchange: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [exchange, setExchange] = useState("spotlight");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative text-center py-8">
      <FloatingParticles />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-blue-300 mb-8"
      >
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        Free Compliance Scanner
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl md:text-6xl font-bold text-white mb-5 tracking-tight leading-tight"
      >
        How compliant is your
        <br />
        <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
          IR website?
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg text-slate-400 mb-12 max-w-xl mx-auto"
      >
        Instant compliance scan for companies on Spotlight, First North &amp;
        Euronext Growth
      </motion.p>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className={`max-w-2xl mx-auto glow-card rounded-2xl p-6 md:p-8 transition-all duration-500 ${
          isFocused ? "shadow-[0_0_60px_rgba(59,130,246,0.15)]" : ""
        }`}
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) =>
                e.key === "Enter" && url.trim() && onScan(url.trim(), exchange)
              }
              placeholder="Enter your IR website URL..."
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
          >
            <option value="spotlight">Spotlight</option>
            <option value="first_north">First North</option>
            <option value="euronext_growth">Euronext Growth</option>
            <option value="other">Other</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => url.trim() && onScan(url.trim(), exchange)}
            disabled={!url.trim()}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            Scan Now
          </motion.button>
        </div>
      </motion.div>

      {/* Trust Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-slate-500"
      >
        {[
          { icon: "24", label: "Compliance Points Checked" },
          { icon: "EU", label: "Based on MAR 596/2014" },
          { icon: "5m", label: "Takes 5 Minutes" },
        ].map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-2.5 px-4 py-2 rounded-lg glass"
          >
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {badge.icon}
            </span>
            <span>{badge.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Crawling State ──────────────────────────────────────────────────────────

function CrawlingScreen({ url }: { url: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto text-center py-16"
    >
      {/* Orbital animation */}
      <div className="relative w-24 h-24 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
        <div className="absolute inset-2 rounded-full border-2 border-purple-500/10" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="orbit-dot absolute top-1/2 left-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full bg-blue-400"
            style={{ animationDelay: `${i * 0.66}s` }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        Crawling your site...
      </h2>
      <p className="text-slate-400 mb-2 font-mono text-sm">{url}</p>
      <p className="text-slate-500 text-sm">
        Discovering IR pages and analyzing site structure
      </p>

      {/* Shimmer lines */}
      <div className="mt-10 space-y-3 max-w-md mx-auto">
        {[1, 0.8, 0.6].map((width, i) => (
          <div
            key={i}
            className="h-2 rounded-full shimmer bg-white/5"
            style={{ width: `${width * 100}%`, animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Scanning Progress Screen ────────────────────────────────────────────────

function ScanningScreen({
  url,
  completedChecks,
}: {
  url: string;
  completedChecks: DetectionResult[];
}) {
  const totalChecks = 13;
  const progress = (completedChecks.length / totalChecks) * 100;

  const checkNames = [
    "Press Release Archive",
    "Archive Depth (5-Year Retention)",
    "MAR Classification",
    "Financial Calendar",
    "Bilingual Content (SV + EN)",
    "Share/Stock Information",
    "Board & Management",
    "Insider Transaction Log",
    "Subscription/Alert Service",
    "IR Contact Information",
    "Financial Reports",
    "Page Performance & Mobile",
    "Largest Shareholders",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Analyzing compliance...
        </h2>
        <p className="text-slate-500 font-mono text-sm">{url}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/5 rounded-full h-1.5 mb-8 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2">
        {checkNames.map((name, i) => {
          const result = completedChecks[i];
          const isRunning = i === completedChecks.length;
          const isPending = i > completedChecks.length;

          return (
            <motion.div
              key={name}
              initial={result ? { opacity: 0, x: -10 } : {}}
              animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                result
                  ? "glow-card"
                  : isRunning
                    ? "glass border-blue-500/30"
                    : "bg-transparent"
              }`}
            >
              {result ? (
                <StatusIcon passed={result.passed} />
              ) : isRunning ? (
                <span className="flex items-center justify-center w-6 h-6">
                  <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </span>
              ) : (
                <span className="flex items-center justify-center w-6 h-6">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                </span>
              )}
              <span
                className={`text-sm ${isPending ? "text-slate-600" : isRunning ? "text-blue-300 font-medium" : "text-slate-300"}`}
              >
                {name}
              </span>
              {result && (
                <span
                  className={`ml-auto text-xs font-medium ${
                    result.passed === true
                      ? "text-emerald-400"
                      : result.passed === "partial"
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {result.passed === true
                    ? "Passed"
                    : result.passed === "partial"
                      ? "Partial"
                      : "Failed"}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-600 mt-6 font-mono">
        {completedChecks.length}/{totalChecks} checks complete
      </p>
    </motion.div>
  );
}

// ─── Results Screen ──────────────────────────────────────────────────────────

function ResultsScreen({
  results,
  siteInfo,
  onContinue,
}: {
  results: DetectionResult[];
  siteInfo: ScanActionResult["siteMap"];
  onContinue: () => void;
}) {
  const passed = results.filter((r) => r.passed === true).length;
  const partial = results.filter((r) => r.passed === "partial").length;
  const failed = results.filter((r) => r.passed === false).length;

  const layers: Record<string, DetectionResult[]> = {};
  for (const r of results) {
    if (!layers[r.layer]) layers[r.layer] = [];
    layers[r.layer].push(r);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Automated Scan Results
        </motion.h2>
        <p className="text-slate-500 text-sm">
          {siteInfo.title && (
            <span className="text-slate-400">{siteInfo.title}</span>
          )}{" "}
          &mdash; {siteInfo.pagesFound} pages analyzed
        </p>
      </div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center gap-4 mb-10"
      >
        {[
          { count: passed, label: "Passed", color: "emerald" },
          { count: partial, label: "Partial", color: "amber" },
          { count: failed, label: "Failed", color: "red" },
        ].map((item) => (
          <div
            key={item.label}
            className={`glow-card rounded-xl px-6 py-4 text-center min-w-[100px]`}
          >
            <div className={`text-3xl font-bold text-${item.color}-400`}>
              {item.count}
            </div>
            <div className={`text-xs text-${item.color}-400/60 mt-1`}>
              {item.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Results by layer */}
      {["MAR", "Exchange", "Best Practice"].map((layer, layerIdx) => {
        const layerResults = layers[layer] || [];
        if (layerResults.length === 0) return null;
        return (
          <motion.div
            key={layer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + layerIdx * 0.1 }}
            className="mb-8"
          >
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <LayerBadge layer={layer} />
              {layer} Compliance
            </h3>
            <div className="space-y-2">
              {layerResults.map((result, i) => (
                <motion.div
                  key={result.checkId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + layerIdx * 0.1 + i * 0.05 }}
                  className="glow-card rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <StatusIcon passed={result.passed} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">
                          {result.name}
                        </span>
                        <RiskBadge risk={result.risk} />
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {result.evidence}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* CTA to continue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-center mt-10 p-8 glass rounded-2xl"
      >
        <p className="text-slate-300 mb-1">
          Found{" "}
          <span className="font-bold text-red-400">{failed + partial}</span>{" "}
          issues automatically.
        </p>
        <p className="text-slate-500 text-sm mb-6">
          Answer 11 questions about your internal processes to get your full
          score.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
        >
          Continue to Self-Assessment
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Error Screen ────────────────────────────────────────────────────────────

function ErrorScreen({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto text-center py-16"
    >
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
        <span className="text-red-400 text-2xl">!</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Scan Error</h2>
      <p className="text-slate-400 mb-8">{error}</p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRetry}
        className="px-6 py-2.5 glow-card rounded-xl text-blue-400 hover:text-blue-300 font-medium transition-colors"
      >
        Try Again
      </motion.button>
    </motion.div>
  );
}

// ─── Main Scanner Component ──────────────────────────────────────────────────

export default function ScannerClient({
  onScanComplete,
  onUrlCapture,
}: {
  onScanComplete: (results: DetectionResult[]) => void;
  onUrlCapture?: (url: string) => void;
}) {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [scanUrl, setScanUrl] = useState("");
  const [completedChecks, setCompletedChecks] = useState<DetectionResult[]>([]);
  const [scanResult, setScanResult] = useState<ScanActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (url: string, exchange: string) => {
    setScanUrl(url);
    onUrlCapture?.(url);
    setPhase("crawling");
    setCompletedChecks([]);
    setError(null);

    try {
      const result = await runComplianceScan(url);

      if (result.error) {
        setError(result.error);
        setPhase("idle");
        return;
      }

      setPhase("detecting");
      for (let i = 0; i < result.detectionResults.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setCompletedChecks((prev) => [...prev, result.detectionResults[i]]);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      setScanResult(result);
      setPhase("detecting");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setPhase("idle");
    }
  };

  const handleContinue = () => {
    if (scanResult) {
      onScanComplete(scanResult.detectionResults);
    }
  };

  const handleRetry = () => {
    setPhase("idle");
    setError(null);
    setCompletedChecks([]);
    setScanResult(null);
  };

  return (
    <AnimatePresence mode="wait">
      {error && phase === "idle" ? (
        <ErrorScreen key="error" error={error} onRetry={handleRetry} />
      ) : phase === "idle" ? (
        <LandingScreen key="landing" onScan={handleScan} />
      ) : phase === "crawling" ? (
        <CrawlingScreen key="crawling" url={scanUrl} />
      ) : phase === "detecting" && !scanResult ? (
        <ScanningScreen
          key="scanning"
          url={scanUrl}
          completedChecks={completedChecks}
        />
      ) : scanResult ? (
        <ResultsScreen
          key="results"
          results={scanResult.detectionResults}
          siteInfo={scanResult.siteMap}
          onContinue={handleContinue}
        />
      ) : null}
    </AnimatePresence>
  );
}
