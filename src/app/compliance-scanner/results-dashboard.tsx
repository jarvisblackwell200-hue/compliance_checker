"use client";

import type { DetectionResult, Grade, LayerScore, ScoringResult } from "@/types";
import { SELF_ASSESSMENT_QUESTIONS } from "@/lib/self-assessment";

// ─── Grade Ring Chart ────────────────────────────────────────────────────────

function GradeRing({
  grade,
  score,
}: {
  grade: Grade;
  score: number;
}) {
  const gradeColors: Record<Grade, string> = {
    A: "#22c55e",
    B: "#84cc16",
    C: "#eab308",
    D: "#f97316",
    F: "#ef4444",
  };
  const color = gradeColors[grade];
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-5xl font-bold" style={{ color }}>
          {grade}
        </div>
        <div className="text-sm text-gray-500">{score}/100</div>
      </div>
    </div>
  );
}

// ─── Layer Score Card ────────────────────────────────────────────────────────

function LayerCard({
  title,
  layer,
  description,
}: {
  title: string;
  layer: LayerScore;
  description: string;
}) {
  const gradeColors: Record<Grade, string> = {
    A: "text-green-600 bg-green-50 border-green-200",
    B: "text-lime-600 bg-lime-50 border-lime-200",
    C: "text-yellow-600 bg-yellow-50 border-yellow-200",
    D: "text-orange-600 bg-orange-50 border-orange-200",
    F: "text-red-600 bg-red-50 border-red-200",
  };

  return (
    <div
      className={`rounded-xl border-2 p-5 ${gradeColors[layer.grade]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-2xl font-bold">{layer.grade}</span>
      </div>
      <div className="text-sm text-gray-600 mb-2">{description}</div>
      <div className="flex items-center justify-between text-xs">
        <span>
          {layer.passed}/{layer.total} checks passed
        </span>
        <span className="font-medium">{layer.score}%</span>
      </div>
      <div className="w-full bg-white/50 rounded-full h-2 mt-2">
        <div
          className="h-2 rounded-full bg-current transition-all duration-500"
          style={{ width: `${layer.score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Status Icon ─────────────────────────────────────────────────────────────

function StatusIcon({ passed }: { passed: boolean | "partial" | number }) {
  if (passed === true || (typeof passed === "number" && passed >= 0.8))
    return <span className="text-green-500 font-bold">&#10003;</span>;
  if (passed === "partial" || (typeof passed === "number" && passed >= 0.3))
    return <span className="text-yellow-500 font-bold">&#9888;</span>;
  return <span className="text-red-500 font-bold">&#10007;</span>;
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

// ─── Priority Actions ────────────────────────────────────────────────────────

function PriorityActions({
  recommendations,
}: {
  recommendations: string[];
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Priority Actions
      </h3>
      <div className="space-y-3">
        {recommendations.slice(0, 10).map((rec, i) => {
          const riskMatch = rec.match(/^\[(\w+)\]\s*/);
          const risk = riskMatch ? riskMatch[1] : "Medium";
          const text = riskMatch ? rec.replace(riskMatch[0], "") : rec;

          return (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-gray-400 font-mono mt-0.5">
                {i + 1}.
              </span>
              <div>
                <RiskBadge risk={risk} />
                <span className="ml-2 text-gray-700">{text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Full Checklist ──────────────────────────────────────────────────────────

function FullChecklist({
  scoringResult,
}: {
  scoringResult: ScoringResult;
}) {
  const layers = ["MAR", "Exchange", "Best Practice"] as const;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Full Compliance Checklist
      </h3>

      {layers.map((layer) => {
        const autoResults = scoringResult.automatedFindings.filter(
          (r) => r.layer === layer
        );
        const selfQuestions = SELF_ASSESSMENT_QUESTIONS.filter(
          (q) => q.layer === layer
        );

        return (
          <div key={layer} className="mb-6 last:mb-0">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {layer}
            </h4>
            <div className="space-y-2">
              {/* Automated checks */}
              {autoResults.map((result) => (
                <div
                  key={result.checkId}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50"
                >
                  <StatusIcon passed={result.passed} />
                  <span className="flex-1 text-sm text-gray-700">
                    {result.name}
                  </span>
                  <RiskBadge risk={result.risk} />
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {result.passed === true
                      ? "Passed"
                      : result.passed === "partial"
                        ? "Partial"
                        : "Failed"}
                  </span>
                </div>
              ))}
              {/* Self-assessment checks */}
              {selfQuestions.map((q) => {
                const answer = scoringResult.selfAssessmentResults.find(
                  (a) => a.checkId === q.checkId
                );
                const score = answer?.selectedScore ?? 0;
                return (
                  <div
                    key={q.checkId}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <StatusIcon passed={score} />
                    <span className="flex-1 text-sm text-gray-700">
                      {q.question.replace(/\?$/, "")}
                    </span>
                    <RiskBadge risk={q.risk} />
                    <span className="text-xs text-gray-400 w-16 text-right">
                      {score >= 0.8
                        ? "Good"
                        : score >= 0.3
                          ? "Partial"
                          : "At Risk"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CTASection({ grade, onDownloadPdf }: { grade: Grade; onDownloadPdf?: () => void }) {
  const messages: Record<Grade, string> = {
    A: "Your IR compliance is excellent! Stay ahead with automated monitoring.",
    B: "Good compliance posture with room for improvement.",
    C: "Several compliance gaps that should be addressed soon.",
    D: "Significant compliance risks that need immediate attention.",
    F: "Critical compliance gaps that put your company at regulatory risk.",
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-center text-white">
      <h3 className="text-2xl font-bold mb-2">
        Close these gaps with IRPages
      </h3>
      <p className="text-blue-100 mb-6 max-w-lg mx-auto">
        {messages[grade]}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
          Book a Demo
        </button>
        <button
          onClick={onDownloadPdf}
          className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
        >
          Download PDF Report
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function ResultsDashboard({
  scoringResult,
  onDownloadPdf,
}: {
  scoringResult: ScoringResult;
  onDownloadPdf?: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with overall grade */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Your IR Compliance Score
        </h2>
        <GradeRing
          grade={scoringResult.overallGrade}
          score={scoringResult.overallScore}
        />
        <p className="text-gray-500 mt-4">
          Based on {scoringResult.automatedFindings.length} automated checks and{" "}
          {scoringResult.selfAssessmentResults.length} self-assessment responses
        </p>
      </div>

      {/* Layer score cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <LayerCard
          title="MAR"
          layer={scoringResult.layerScores.mar}
          description="Market Abuse Regulation compliance (50% of total score)"
        />
        <LayerCard
          title="Exchange"
          layer={scoringResult.layerScores.exchange}
          description="Exchange-specific requirements (30% of total score)"
        />
        <LayerCard
          title="Best Practice"
          layer={scoringResult.layerScores.bestPractice}
          description="IR best practices (20% of total score)"
        />
      </div>

      {/* Priority actions */}
      <PriorityActions recommendations={scoringResult.recommendations} />

      {/* Full checklist */}
      <FullChecklist scoringResult={scoringResult} />

      {/* CTA */}
      <CTASection grade={scoringResult.overallGrade} onDownloadPdf={onDownloadPdf} />
    </div>
  );
}
