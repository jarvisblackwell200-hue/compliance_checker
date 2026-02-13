"use client";

import { useState } from "react";
import { SELF_ASSESSMENT_QUESTIONS } from "@/lib/self-assessment";
import type { SelfAssessmentAnswer } from "@/types";

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

export default function SelfAssessmentClient({
  onComplete,
}: {
  onComplete: (answers: SelfAssessmentAnswer[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showHelp, setShowHelp] = useState(false);

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
      setCurrentIndex((prev) => prev + 1);
      setShowHelp(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Self-Assessment
        </h2>
        <p className="text-gray-600">
          Answer {totalQuestions} questions about your internal compliance
          processes
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-400 text-right mb-6">
        {answeredCount}/{totalQuestions} answered
      </p>

      {/* Question card */}
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-400 font-medium">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <LayerBadge layer={currentQuestion.layer} />
          <RiskBadge risk={currentQuestion.risk} />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {currentQuestion.question}
        </h3>

        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1"
        >
          {showHelp ? "Hide" : "Show"} guidance
          <span className="text-xs">{showHelp ? "▲" : "▼"}</span>
        </button>

        {showHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
            {currentQuestion.helpText}
          </div>
        )}

        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected =
              answers[currentQuestion.checkId] === option.score;
            return (
              <button
                key={option.label}
                onClick={() => handleAnswer(option.score)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            onClick={() => {
              setCurrentIndex((prev) => prev + 1);
              setShowHelp(false);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Skip
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className={`px-8 py-3 font-semibold rounded-lg transition-colors ${
              allAnswered
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            Get Full Report
          </button>
        )}
      </div>

      {/* Quick answer indicator */}
      <div className="flex justify-center gap-1 mt-6">
        {questions.map((q, i) => (
          <button
            key={q.checkId}
            onClick={() => {
              setCurrentIndex(i);
              setShowHelp(false);
            }}
            className={`w-3 h-3 rounded-full transition-colors ${
              i === currentIndex
                ? "bg-blue-600"
                : answers[q.checkId] !== undefined
                  ? "bg-green-400"
                  : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
