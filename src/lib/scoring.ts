import type {
  ComplianceLayer,
  DetectionResult,
  Grade,
  LayerScore,
  ScoringResult,
  SelfAssessmentAnswer,
} from "@/types";
import { SELF_ASSESSMENT_QUESTIONS } from "@/lib/self-assessment";

function getGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 55) return "C";
  if (score >= 35) return "D";
  return "F";
}

function getCheckScore(passed: boolean | "partial"): number {
  if (passed === true) return 1;
  if (passed === "partial") return 0.5;
  return 0;
}

interface CheckWeight {
  earned: number;
  total: number;
  passed: number;
  count: number;
}

function calculateLayerScore(
  automatedResults: DetectionResult[],
  selfAssessmentAnswers: SelfAssessmentAnswer[],
  layer: ComplianceLayer
): LayerScore {
  const layerAutoResults = automatedResults.filter((r) => r.layer === layer);
  const layerSelfQuestions = SELF_ASSESSMENT_QUESTIONS.filter(
    (q) => q.layer === layer
  );

  let totalWeight = 0;
  let earnedWeight = 0;
  let passedCount = 0;
  let totalCount = 0;

  // Automated checks
  for (const result of layerAutoResults) {
    totalWeight += result.weight;
    earnedWeight += getCheckScore(result.passed) * result.weight;
    if (result.passed === true) passedCount++;
    totalCount++;
  }

  // Self-assessment checks
  for (const question of layerSelfQuestions) {
    const answer = selfAssessmentAnswers.find(
      (a) => a.checkId === question.checkId
    );
    totalWeight += question.weight;
    if (answer) {
      earnedWeight += answer.selectedScore * question.weight;
      if (answer.selectedScore >= 0.8) passedCount++;
    }
    totalCount++;
  }

  const score = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;

  return {
    score: Math.round(score),
    grade: getGrade(score),
    passed: passedCount,
    total: totalCount,
  };
}

export function calculateScore(
  automatedResults: DetectionResult[],
  selfAssessmentAnswers: SelfAssessmentAnswer[]
): ScoringResult {
  const mar = calculateLayerScore(automatedResults, selfAssessmentAnswers, "MAR");
  const exchange = calculateLayerScore(
    automatedResults,
    selfAssessmentAnswers,
    "Exchange"
  );
  const bestPractice = calculateLayerScore(
    automatedResults,
    selfAssessmentAnswers,
    "Best Practice"
  );

  // Weighted average: MAR 50%, Exchange 30%, Best Practice 20%
  const overallScore = Math.round(
    mar.score * 0.5 + exchange.score * 0.3 + bestPractice.score * 0.2
  );

  // Critical issues: failed checks sorted by weight descending
  const criticalIssues = automatedResults
    .filter((r) => r.passed === false || r.passed === "partial")
    .sort((a, b) => {
      const riskOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      const riskDiff = riskOrder[a.risk] - riskOrder[b.risk];
      if (riskDiff !== 0) return riskDiff;
      return b.weight - a.weight;
    });

  // Generate recommendations
  const recommendations: string[] = [];
  for (const issue of criticalIssues) {
    if (issue.passed === false) {
      recommendations.push(
        `[${issue.risk}] ${issue.name}: ${issue.details}`
      );
    }
  }
  for (const issue of criticalIssues) {
    if (issue.passed === "partial") {
      recommendations.push(
        `[${issue.risk}] Improve ${issue.name}: ${issue.details}`
      );
    }
  }

  // Also add recommendations for poorly-scored self-assessment
  for (const question of SELF_ASSESSMENT_QUESTIONS) {
    const answer = selfAssessmentAnswers.find(
      (a) => a.checkId === question.checkId
    );
    if (answer && answer.selectedScore < 0.5) {
      recommendations.push(
        `[${question.risk}] ${question.question.replace("?", "")}: ${question.helpText}`
      );
    }
  }

  return {
    overallScore,
    overallGrade: getGrade(overallScore),
    layerScores: {
      mar,
      exchange,
      bestPractice,
    },
    automatedFindings: automatedResults,
    selfAssessmentResults: selfAssessmentAnswers,
    criticalIssues,
    recommendations,
  };
}
