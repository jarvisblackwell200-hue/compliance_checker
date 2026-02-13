"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SELF_ASSESSMENT_QUESTIONS } from "@/lib/self-assessment";
import type { SelfAssessmentAnswer } from "@/types";

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

export default function SelfAssessmentClient({
  onComplete,
}: {
  onComplete: (answers: SelfAssessmentAnswer[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const questions = SELF_ASSESSMENT_QUESTIONS;
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  const handleAnswer = (score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.checkId]: score,
    }));

    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setShowHelp(false);
      }, 200);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      setShowHelp(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setShowHelp(false);
    }
  };

  const handleSubmit = () => {
    const selfAssessmentAnswers: SelfAssessmentAnswer[] = questions.map(
      (q) => ({
        checkId: q.checkId,
        selectedScore: answers[q.checkId] ?? 0,
      })
    );
    onComplete(selfAssessmentAnswers);
  };

  const allAnswered = answeredCount === totalQuestions;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-blue-300 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          Self-Assessment
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Internal Compliance Processes
        </motion.h2>
        <p className="text-slate-500 text-sm">
          {totalQuestions} questions about processes that can&apos;t be detected
          automatically
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/5 rounded-full h-1.5 mb-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600 mb-8">
        <span>
          Question {currentIndex + 1} of {totalQuestions}
        </span>
        <span>{answeredCount} answered</span>
      </div>

      {/* Question card with slide animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="glow-card rounded-2xl p-6 md:p-8 mb-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <LayerBadge layer={currentQuestion.layer} />
            <RiskBadge risk={currentQuestion.risk} />
          </div>

          <h3 className="text-lg font-semibold text-white mb-5 leading-relaxed">
            {currentQuestion.question}
          </h3>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs text-blue-400 hover:text-blue-300 mb-5 flex items-center gap-1.5 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${showHelp ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            {showHelp ? "Hide" : "Show"} regulatory guidance
          </button>

          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-xl p-4 mb-5 text-sm text-blue-200/70 leading-relaxed">
                  {currentQuestion.helpText}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2.5">
            {currentQuestion.options.map((option, optIdx) => {
              const isSelected =
                answers[currentQuestion.checkId] === option.score;
              return (
                <motion.button
                  key={option.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: optIdx * 0.05 }}
                  onClick={() => handleAnswer(option.score)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm ${
                    isSelected
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                      : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-blue-400 bg-blue-500"
                          : "border-slate-600"
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-white text-[10px]"
                        >
                          &#10003;
                        </motion.span>
                      )}
                    </span>
                    {option.label}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            Skip
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className={`px-8 py-3 font-semibold rounded-xl transition-all text-sm ${
              allAnswered
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                : "bg-white/5 text-slate-500 hover:bg-white/10"
            }`}
          >
            Get Full Report
          </motion.button>
        )}
      </div>

      {/* Dot navigation */}
      <div className="flex justify-center gap-1.5 mt-8">
        {questions.map((q, i) => (
          <button
            key={q.checkId}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
              setShowHelp(false);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "w-6 bg-blue-500"
                : answers[q.checkId] !== undefined
                  ? "w-1.5 bg-emerald-500/60"
                  : "w-1.5 bg-slate-700"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
