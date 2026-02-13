"use client";

import { useState } from "react";
import ScannerClient from "./scanner-client";
import SelfAssessmentClient from "./self-assessment-client";
import { calculateScore } from "@/lib/scoring";
import type { DetectionResult, ScoringResult, SelfAssessmentAnswer } from "@/types";

type FlowPhase = "scan" | "self-assessment" | "results";

export default function ComplianceScannerFlow() {
  const [phase, setPhase] = useState<FlowPhase>("scan");
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>(
    []
  );
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(
    null
  );

  const handleScanComplete = (results: DetectionResult[]) => {
    setDetectionResults(results);
    setPhase("self-assessment");
  };

  const handleSelfAssessmentComplete = (answers: SelfAssessmentAnswer[]) => {
    const result = calculateScore(detectionResults, answers);
    setScoringResult(result);
    setPhase("results");
  };

  if (phase === "scan") {
    return <ScannerClient onScanComplete={handleScanComplete} />;
  }

  if (phase === "self-assessment") {
    return <SelfAssessmentClient onComplete={handleSelfAssessmentComplete} />;
  }

  if (phase === "results" && scoringResult) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Your Compliance Score
        </h2>
        <div className="text-8xl font-bold text-blue-600 mb-2">
          {scoringResult.overallGrade}
        </div>
        <p className="text-xl text-gray-600 mb-6">
          {scoringResult.overallScore}/100
        </p>
        <p className="text-gray-400">
          Full results dashboard coming in Issue #6...
        </p>
      </div>
    );
  }

  return null;
}
