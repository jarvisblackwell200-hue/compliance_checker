"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Grade, LayerScore, ScoringResult } from "@/types";
import { SELF_ASSESSMENT_QUESTIONS } from "@/lib/self-assessment";

// ─── Animated Counter ────────────────────────────────────────────────────────

function AnimatedCounter({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = target;
    const stepTime = (duration * 1000) / end;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{count}</>;
}

// ─── Grade Ring Chart ────────────────────────────────────────────────────────

function GradeRing({ grade, score }: { grade: Grade; score: number }) {
  const gradeColors: Record<Grade, string> = {
    A: "#22c55e",
    B: "#84cc16",
    C: "#eab308",
    D: "#f97316",
    F: "#ef4444",
  };
  const gradeLabels: Record<Grade, string> = {
    A: "Excellent",
    B: "Good",
    C: "Needs Work",
    D: "At Risk",
    F: "Critical",
  };
  const color = gradeColors[grade];
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative inline-flex items-center justify-center"
    >
      {/* Glow background */}
      <div
        className="absolute w-40 h-40 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: color }}
      />
      <svg width="200" height="200" className="-rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
        />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-5xl font-bold"
          style={{ color }}
        >
          {grade}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-slate-500"
        >
          <AnimatedCounter target={score} /> / 100
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs mt-1"
          style={{ color }}
        >
          {gradeLabels[grade]}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Layer Score Card ────────────────────────────────────────────────────────

function LayerCard({
  title,
  layer,
  weight,
  index,
}: {
  title: string;
  layer: LayerScore;
  weight: string;
  index: number;
}) {
  const gradeColors: Record<Grade, string> = {
    A: "#22c55e", B: "#84cc16", C: "#eab308", D: "#f97316", F: "#ef4444",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.15 }}
      className="glow-card rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">{title}</h3>
        <span
          className="text-xl font-bold"
          style={{ color: gradeColors[layer.grade] }}
        >
          {layer.grade}
        </span>
      </div>
      <div className="text-xs text-slate-500 mb-3">{weight}</div>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span>
          {layer.passed}/{layer.total} passed
        </span>
        <span className="font-mono">{layer.score}%</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: gradeColors[layer.grade] }}
          initial={{ width: 0 }}
          animate={{ width: `${layer.score}%` }}
          transition={{ duration: 1, delay: 0.6 + index * 0.15, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

// ─── Status Icon ─────────────────────────────────────────────────────────────

function StatusIcon({ passed }: { passed: boolean | "partial" | number }) {
  const isPassed = passed === true || (typeof passed === "number" && passed >= 0.8);
  const isPartial = passed === "partial" || (typeof passed === "number" && passed >= 0.3 && passed < 0.8);

  if (isPassed)
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
        &#10003;
      </span>
    );
  if (isPartial)
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">
        &#9888;
      </span>
    );
  return (
    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px]">
      &#10007;
    </span>
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

// ─── Priority Actions ────────────────────────────────────────────────────────

function PriorityActions({ recommendations }: { recommendations: string[] }) {
  if (recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="glow-card rounded-xl p-6 mb-8"
    >
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-5 h-5 rounded bg-red-500/20 text-red-400 flex items-center justify-center text-[10px]">
          !
        </span>
        Priority Actions
      </h3>
      <div className="space-y-3">
        {recommendations.slice(0, 8).map((rec, i) => {
          const riskMatch = rec.match(/^\[(\w+)\]\s*/);
          const risk = riskMatch ? riskMatch[1] : "Medium";
          const text = riskMatch ? rec.replace(riskMatch[0], "") : rec;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.05 }}
              className="flex items-start gap-3 text-sm"
            >
              <span className="text-slate-600 font-mono text-xs mt-0.5 w-5 text-right flex-shrink-0">
                {i + 1}
              </span>
              <div>
                <RiskBadge risk={risk} />
                <span className="ml-2 text-slate-400">{text}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Full Checklist ──────────────────────────────────────────────────────────

function FullChecklist({ scoringResult }: { scoringResult: ScoringResult }) {
  const layers = ["MAR", "Exchange", "Best Practice"] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="glow-card rounded-xl p-6 mb-8"
    >
      <h3 className="text-sm font-semibold text-white mb-5">
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
          <div key={layer} className="mb-5 last:mb-0">
            <h4 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">
              {layer}
            </h4>
            <div className="space-y-1">
              {autoResults.map((result) => (
                <div
                  key={result.checkId}
                  className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
                >
                  <StatusIcon passed={result.passed} />
                  <span className="flex-1 text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                    {result.name}
                  </span>
                  <RiskBadge risk={result.risk} />
                  <span
                    className={`text-[10px] w-12 text-right font-medium ${
                      result.passed === true
                        ? "text-emerald-500"
                        : result.passed === "partial"
                          ? "text-amber-500"
                          : "text-red-500"
                    }`}
                  >
                    {result.passed === true
                      ? "Pass"
                      : result.passed === "partial"
                        ? "Partial"
                        : "Fail"}
                  </span>
                </div>
              ))}
              {selfQuestions.map((q) => {
                const answer = scoringResult.selfAssessmentResults.find(
                  (a) => a.checkId === q.checkId
                );
                const score = answer?.selectedScore ?? 0;
                return (
                  <div
                    key={q.checkId}
                    className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
                  >
                    <StatusIcon passed={score} />
                    <span className="flex-1 text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                      {q.question.replace(/\?$/, "").slice(0, 60)}
                      {q.question.length > 60 ? "..." : ""}
                    </span>
                    <RiskBadge risk={q.risk} />
                    <span
                      className={`text-[10px] w-12 text-right font-medium ${
                        score >= 0.8
                          ? "text-emerald-500"
                          : score >= 0.3
                            ? "text-amber-500"
                            : "text-red-500"
                      }`}
                    >
                      {score >= 0.8 ? "Good" : score >= 0.3 ? "Partial" : "Risk"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CTASection({
  grade,
  onDownloadPdf,
}: {
  grade: Grade;
  onDownloadPdf?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.3 }}
      className="relative rounded-2xl overflow-hidden p-8 text-center"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-blue-600/20 bg-gradient-animated" />
      <div className="absolute inset-0 glass" />

      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-white mb-3">
          Close these gaps with IRPages
        </h3>
        <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm">
          The IR platform built for Nordic growth companies. MAR-compliant
          publishing, bilingual content, and investor tools out of the box.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
          >
            Book a Demo
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDownloadPdf}
            className="px-8 py-3.5 glass text-slate-300 font-semibold rounded-xl hover:text-white transition-colors"
          >
            Download PDF Report
          </motion.button>
        </div>
      </div>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-blue-300 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Scan Complete
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-8"
        >
          Your IR Compliance Score
        </motion.h2>
        <GradeRing
          grade={scoringResult.overallGrade}
          score={scoringResult.overallScore}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-slate-500 text-sm mt-6"
        >
          Based on {scoringResult.automatedFindings.length} automated checks and{" "}
          {scoringResult.selfAssessmentResults.length} self-assessment responses
        </motion.p>
      </div>

      {/* Layer score cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <LayerCard
          title="MAR"
          layer={scoringResult.layerScores.mar}
          weight="50% of total"
          index={0}
        />
        <LayerCard
          title="Exchange Rules"
          layer={scoringResult.layerScores.exchange}
          weight="30% of total"
          index={1}
        />
        <LayerCard
          title="Best Practice"
          layer={scoringResult.layerScores.bestPractice}
          weight="20% of total"
          index={2}
        />
      </div>

      <PriorityActions recommendations={scoringResult.recommendations} />
      <FullChecklist scoringResult={scoringResult} />
      <CTASection
        grade={scoringResult.overallGrade}
        onDownloadPdf={onDownloadPdf}
      />
    </motion.div>
  );
}
