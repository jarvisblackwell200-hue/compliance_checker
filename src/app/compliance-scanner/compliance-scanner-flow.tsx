"use client";

import { useState } from "react";
import ScannerClient from "./scanner-client";
import type { DetectionResult } from "@/types";

type FlowPhase = "scan" | "self-assessment" | "results";

export default function ComplianceScannerFlow() {
  const [phase, setPhase] = useState<FlowPhase>("scan");
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>(
    []
  );

  const handleScanComplete = (results: DetectionResult[]) => {
    setDetectionResults(results);
    setPhase("self-assessment");
  };

  if (phase === "scan") {
    return <ScannerClient onScanComplete={handleScanComplete} />;
  }

  if (phase === "self-assessment") {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Self-Assessment
        </h2>
        <p className="text-gray-600 mb-6">
          Answer 11 questions about your internal compliance processes.
        </p>
        <p className="text-gray-400">
          Self-assessment module coming in Issue #5...
        </p>
      </div>
    );
  }

  return null;
}
