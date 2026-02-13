"use client";

import { useState } from "react";
import ScannerClient from "./scanner-client";
import SelfAssessmentClient from "./self-assessment-client";
import ResultsDashboard from "./results-dashboard";
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
    return <ResultsDashboard scoringResult={scoringResult} />;
  }

  return null;
}
