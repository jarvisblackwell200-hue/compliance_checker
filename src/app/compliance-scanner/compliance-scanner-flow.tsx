"use client";

import { useState } from "react";
import ScannerClient from "./scanner-client";
import SelfAssessmentClient from "./self-assessment-client";
import ResultsDashboard from "./results-dashboard";
import EmailGateModal from "./email-gate-modal";
import { calculateScore } from "@/lib/scoring";
import { generatePdfReport } from "@/lib/pdf-report";
import type { DetectionResult, ScoringResult, SelfAssessmentAnswer } from "@/types";

type FlowPhase = "scan" | "self-assessment" | "results";

export default function ComplianceScannerFlow() {
  const [phase, setPhase] = useState<FlowPhase>("scan");
  const [scanUrl, setScanUrl] = useState("");
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>(
    []
  );
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(
    null
  );
  const [showEmailGate, setShowEmailGate] = useState(false);

  const handleScanComplete = (results: DetectionResult[]) => {
    setDetectionResults(results);
    setPhase("self-assessment");
  };

  const handleSelfAssessmentComplete = (answers: SelfAssessmentAnswer[]) => {
    const result = calculateScore(detectionResults, answers);
    setScoringResult(result);
    setPhase("results");
  };

  const handleDownloadPdf = () => {
    setShowEmailGate(true);
  };

  const handleEmailSubmit = (email: string, companyName: string) => {
    if (!scoringResult) return;

    const doc = generatePdfReport(
      scoringResult,
      companyName,
      scanUrl,
      "Nordic Exchange"
    );

    doc.save(
      `IR-Compliance-Report-${companyName || "scan"}-${new Date().toISOString().split("T")[0]}.pdf`
    );
    setShowEmailGate(false);
  };

  if (phase === "scan") {
    return (
      <ScannerClient
        onScanComplete={(results) => {
          handleScanComplete(results);
        }}
        onUrlCapture={(url) => setScanUrl(url)}
      />
    );
  }

  if (phase === "self-assessment") {
    return <SelfAssessmentClient onComplete={handleSelfAssessmentComplete} />;
  }

  if (phase === "results" && scoringResult) {
    return (
      <>
        <ResultsDashboard
          scoringResult={scoringResult}
          onDownloadPdf={handleDownloadPdf}
        />
        {showEmailGate && (
          <EmailGateModal
            onSubmit={handleEmailSubmit}
            onClose={() => setShowEmailGate(false)}
          />
        )}
      </>
    );
  }

  return null;
}
