// ─── Crawl Types ─────────────────────────────────────────────────────────────

export interface CrawlResult {
  url: string;
  title: string;
  html: string;
  text: string;
  lang: string | null;
  links: string[];
  statusCode: number;
  ttfb?: number; // Time to first byte in ms
}

export interface DiscoveredSections {
  pressReleases: string | null;
  financialReports: string | null;
  financialCalendar: string | null;
  shareInfo: string | null;
  governance: string | null;
  insiderTransactions: string | null;
  subscription: string | null;
  contact: string | null;
  archive: string | null;
}

export interface SiteMap {
  homepage: CrawlResult;
  pages: CrawlResult[];
  discoveredSections: DiscoveredSections;
  pdfLinks: string[];
  blockedByCrawling: boolean;
}

// ─── Detection Types ─────────────────────────────────────────────────────────

export type ComplianceLayer = "MAR" | "Exchange" | "Best Practice";
export type RiskLevel = "Critical" | "High" | "Medium" | "Low";
export type Confidence = "high" | "medium" | "low";

export interface DetectionResult {
  checkId: string;
  name: string;
  layer: ComplianceLayer;
  passed: boolean | "partial";
  confidence: Confidence;
  evidence: string;
  details: string;
  weight: number;
  risk: RiskLevel;
  automatable: true;
}

// ─── Self-Assessment Types ───────────────────────────────────────────────────

export interface SelfAssessmentOption {
  label: string;
  score: number; // 0 = no, 0.5 = partial, 1 = yes
}

export interface SelfAssessmentQuestion {
  checkId: string;
  layer: ComplianceLayer;
  question: string;
  helpText: string;
  weight: number;
  risk: RiskLevel;
  options: SelfAssessmentOption[];
}

export interface SelfAssessmentAnswer {
  checkId: string;
  selectedScore: number;
}

// ─── Scoring Types ───────────────────────────────────────────────────────────

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface LayerScore {
  score: number;
  grade: Grade;
  passed: number;
  total: number;
}

export interface ScoringResult {
  overallScore: number; // 0-100
  overallGrade: Grade;
  layerScores: {
    mar: LayerScore;
    exchange: LayerScore;
    bestPractice: LayerScore;
  };
  automatedFindings: DetectionResult[];
  selfAssessmentResults: SelfAssessmentAnswer[];
  criticalIssues: DetectionResult[];
  recommendations: string[];
}

// ─── Scan State Types ────────────────────────────────────────────────────────

export type ScanPhase =
  | "idle"
  | "crawling"
  | "detecting"
  | "self-assessment"
  | "results";

export interface ScanProgress {
  phase: ScanPhase;
  completedChecks: DetectionResult[];
  currentCheck: string | null;
  totalChecks: number;
  error: string | null;
}

export interface ScanRequest {
  url: string;
  exchange?: string;
}
