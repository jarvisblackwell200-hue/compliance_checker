"use client";

import { useState } from "react";
import { runComplianceScan, type ScanActionResult } from "@/lib/actions";
import type { DetectionResult, ScanPhase } from "@/types";

// ─── Status Icon ─────────────────────────────────────────────────────────────

function StatusIcon({ passed }: { passed: boolean | "partial" }) {
  if (passed === true)
    return <span className="text-green-500 font-bold text-lg">&#10003;</span>;
  if (passed === "partial")
    return <span className="text-yellow-500 font-bold text-lg">&#9888;</span>;
  return <span className="text-red-500 font-bold text-lg">&#10007;</span>;
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    Critical: "bg-red-100 text-red-800",
    High: "bg-orange-100 text-orange-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[risk] || "bg-gray-100 text-gray-800"}`}
    >
      {risk}
    </span>
  );
}

function LayerBadge({ layer }: { layer: string }) {
  const colors: Record<string, string> = {
    MAR: "bg-purple-100 text-purple-800",
    Exchange: "bg-indigo-100 text-indigo-800",
    "Best Practice": "bg-teal-100 text-teal-800",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[layer] || "bg-gray-100 text-gray-800"}`}
    >
      {layer}
    </span>
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

  return (
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        How compliant is your IR website?
      </h1>
      <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
        Free compliance scan for companies on Spotlight, First North &amp;
        Euronext Growth
      </p>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your IR website URL..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          >
            <option value="spotlight">Spotlight</option>
            <option value="first_north">First North</option>
            <option value="euronext_growth">Euronext Growth</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={() => url.trim() && onScan(url.trim(), exchange)}
            disabled={!url.trim()}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Scan Now
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-500">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          Checks 24 compliance points
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          Based on MAR EU 596/2014
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          Takes 5 minutes
        </span>
      </div>
    </div>
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
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Scanning {url}...
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Analyzing your IR website for compliance indicators
      </p>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {checkNames.map((name, i) => {
          const result = completedChecks[i];
          const isRunning = i === completedChecks.length;
          const isPending = i > completedChecks.length;

          return (
            <div
              key={name}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                result
                  ? "bg-white"
                  : isRunning
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 opacity-50"
              }`}
            >
              {result ? (
                <StatusIcon passed={result.passed} />
              ) : isRunning ? (
                <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
              <span
                className={`${isPending ? "text-gray-400" : "text-gray-700"} ${isRunning ? "font-medium" : ""}`}
              >
                {name}
              </span>
              {result && (
                <span className="ml-auto text-xs text-gray-400">
                  {result.passed === true
                    ? "Passed"
                    : result.passed === "partial"
                      ? "Partial"
                      : "Failed"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-gray-400 mt-6">
        {completedChecks.length}/{totalChecks} automated checks complete
      </p>
    </div>
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

  // Group by layer
  const layers: Record<string, DetectionResult[]> = {};
  for (const r of results) {
    if (!layers[r.layer]) layers[r.layer] = [];
    layers[r.layer].push(r);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Automated Scan Results
        </h2>
        <p className="text-gray-600">
          {siteInfo.title && (
            <span className="font-medium">{siteInfo.title}</span>
          )}{" "}
          &mdash; {siteInfo.pagesFound} pages analyzed
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex justify-center gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-3 text-center">
          <div className="text-2xl font-bold text-green-700">{passed}</div>
          <div className="text-xs text-green-600">Passed</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-6 py-3 text-center">
          <div className="text-2xl font-bold text-yellow-700">{partial}</div>
          <div className="text-xs text-yellow-600">Partial</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-3 text-center">
          <div className="text-2xl font-bold text-red-700">{failed}</div>
          <div className="text-xs text-red-600">Failed</div>
        </div>
      </div>

      {/* Results by layer */}
      {["MAR", "Exchange", "Best Practice"].map((layer) => {
        const layerResults = layers[layer] || [];
        if (layerResults.length === 0) return null;
        return (
          <div key={layer} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <LayerBadge layer={layer} />
              {layer} Compliance
            </h3>
            <div className="space-y-3">
              {layerResults.map((result) => (
                <div
                  key={result.checkId}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <StatusIcon passed={result.passed} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {result.name}
                        </span>
                        <RiskBadge risk={result.risk} />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {result.evidence}
                      </p>
                      <p className="text-xs text-gray-400">{result.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* CTA to continue */}
      <div className="text-center mt-10 p-6 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-gray-700 mb-1">
          We found <span className="font-bold text-red-600">{failed + partial}</span> issues
          automatically.
        </p>
        <p className="text-gray-600 mb-4">
          Now answer 11 quick questions about your internal processes to get your
          full compliance score.
        </p>
        <button
          onClick={onContinue}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue to Self-Assessment
        </button>
      </div>
    </div>
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
    <div className="max-w-xl mx-auto text-center">
      <div className="text-red-500 text-5xl mb-4">!</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Scan Error
      </h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
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

      // Simulate progressive reveal of detection results
      setPhase("detecting");
      for (let i = 0; i < result.detectionResults.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setCompletedChecks((prev) => [...prev, result.detectionResults[i]]);
      }

      // Small delay before showing full results
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

  if (error && phase === "idle") {
    return <ErrorScreen error={error} onRetry={handleRetry} />;
  }

  if (phase === "idle") {
    return <LandingScreen onScan={handleScan} />;
  }

  if (phase === "crawling") {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Crawling {scanUrl}...
        </h2>
        <p className="text-gray-500 mb-8">
          Discovering IR pages and analyzing site structure
        </p>
        <div className="flex justify-center">
          <span className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (phase === "detecting" && !scanResult) {
    return (
      <ScanningScreen url={scanUrl} completedChecks={completedChecks} />
    );
  }

  if (scanResult) {
    return (
      <ResultsScreen
        results={scanResult.detectionResults}
        siteInfo={scanResult.siteMap}
        onContinue={handleContinue}
      />
    );
  }

  return null;
}
