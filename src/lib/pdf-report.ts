import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ScoringResult, Grade } from "@/types";
import { SELF_ASSESSMENT_QUESTIONS } from "@/lib/self-assessment";

function getGradeLabel(grade: Grade): string {
  const labels: Record<Grade, string> = {
    A: "Excellent",
    B: "Good",
    C: "Needs Work",
    D: "At Risk",
    F: "Critical",
  };
  return labels[grade];
}

function getPassedLabel(passed: boolean | "partial"): string {
  if (passed === true) return "Passed";
  if (passed === "partial") return "Partial";
  return "Failed";
}

function getScoreLabel(score: number): string {
  if (score >= 0.8) return "Good";
  if (score >= 0.3) return "Partial";
  return "At Risk";
}

export function generatePdfReport(
  scoringResult: ScoringResult,
  companyName: string,
  url: string,
  exchange: string
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // ─── Header ────────────────────────────────────────────────────────────────
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("IR Compliance Report", pageWidth / 2, y, { align: "center" });
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-GB")} | Powered by IRPages`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 15;

  // ─── Company Info ──────────────────────────────────────────────────────────
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("Company:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(companyName || "N/A", 65, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Website:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(url, 65, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Exchange:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(exchange || "N/A", 65, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Scan Date:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("en-GB"), 65, y);
  y += 15;

  // ─── Overall Grade ─────────────────────────────────────────────────────────
  doc.setDrawColor(200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Overall Compliance Score", 20, y);
  y += 12;

  // Grade box
  const gradeColors: Record<Grade, [number, number, number]> = {
    A: [34, 197, 94],
    B: [132, 204, 22],
    C: [234, 179, 8],
    D: [249, 115, 22],
    F: [239, 68, 68],
  };
  const [r, g, b] = gradeColors[scoringResult.overallGrade];

  doc.setFillColor(r, g, b);
  doc.roundedRect(20, y, 40, 30, 3, 3, "F");
  doc.setFontSize(28);
  doc.setTextColor(255);
  doc.text(
    scoringResult.overallGrade,
    40,
    y + 21,
    { align: "center" }
  );

  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${scoringResult.overallScore}/100 — ${getGradeLabel(scoringResult.overallGrade)}`,
    70,
    y + 12
  );

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    "Weighted: MAR (50%) + Exchange Rules (30%) + Best Practice (20%)",
    70,
    y + 22
  );

  y += 40;

  // ─── Layer Breakdown ───────────────────────────────────────────────────────
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Score Breakdown by Layer", 20, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Layer", "Grade", "Score", "Checks Passed", "Weight"]],
    body: [
      [
        "MAR (Market Abuse Regulation)",
        scoringResult.layerScores.mar.grade,
        `${scoringResult.layerScores.mar.score}%`,
        `${scoringResult.layerScores.mar.passed}/${scoringResult.layerScores.mar.total}`,
        "50%",
      ],
      [
        "Exchange Requirements",
        scoringResult.layerScores.exchange.grade,
        `${scoringResult.layerScores.exchange.score}%`,
        `${scoringResult.layerScores.exchange.passed}/${scoringResult.layerScores.exchange.total}`,
        "30%",
      ],
      [
        "Best Practice",
        scoringResult.layerScores.bestPractice.grade,
        `${scoringResult.layerScores.bestPractice.score}%`,
        `${scoringResult.layerScores.bestPractice.passed}/${scoringResult.layerScores.bestPractice.total}`,
        "20%",
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 20, right: 20 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // ─── Automated Findings ────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Automated Scan Findings", 20, y);
  y += 8;

  const autoRows = scoringResult.automatedFindings.map((f) => [
    f.name,
    f.layer,
    getPassedLabel(f.passed),
    f.risk,
    f.evidence.slice(0, 80) + (f.evidence.length > 80 ? "..." : ""),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Check", "Layer", "Status", "Risk", "Evidence"]],
    body: autoRows,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: "auto" },
    },
    styles: { fontSize: 8 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // ─── Self-Assessment Results ───────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Self-Assessment Results", 20, y);
  y += 8;

  const selfRows = SELF_ASSESSMENT_QUESTIONS.map((q) => {
    const answer = scoringResult.selfAssessmentResults.find(
      (a) => a.checkId === q.checkId
    );
    const score = answer?.selectedScore ?? 0;
    return [
      q.question.slice(0, 60) + (q.question.length > 60 ? "..." : ""),
      q.layer,
      getScoreLabel(score),
      q.risk,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Question", "Layer", "Status", "Risk"]],
    body: selfRows,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 8 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // ─── Priority Recommendations ──────────────────────────────────────────────
  if (scoringResult.recommendations.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Priority Recommendations", 20, y);
    y += 8;

    const recRows = scoringResult.recommendations.slice(0, 10).map((rec, i) => {
      const riskMatch = rec.match(/^\[(\w+)\]\s*/);
      const risk = riskMatch ? riskMatch[1] : "Medium";
      const text = riskMatch ? rec.replace(riskMatch[0], "") : rec;
      return [`${i + 1}`, risk, text.slice(0, 100) + (text.length > 100 ? "..." : "")];
    });

    autoTable(doc, {
      startY: y,
      head: [["#", "Risk", "Recommendation"]],
      body: recRows,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: "auto" },
      },
      styles: { fontSize: 8 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // ─── CTA Page ──────────────────────────────────────────────────────────────
  doc.addPage();
  y = 40;

  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 100, "F");

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255);
  doc.text("Close your compliance gaps", pageWidth / 2, 35, {
    align: "center",
  });
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("with IRPages — the IR platform built for Nordic growth companies", pageWidth / 2, 50, {
    align: "center",
  });

  y = 120;
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("How IRPages helps:", 20, y);
  y += 10;

  const features = [
    "MAR-compliant press release publishing with automatic archiving",
    "Bilingual (SV/EN) content management with simultaneous publication",
    "Built-in financial calendar with automatic reminders",
    "Insider transaction logging with FI-ready reporting",
    "GDPR-compliant investor subscription management",
    "Mobile-responsive IR website with 99.9% uptime",
    "Shareholder register integration and ownership display",
    "PDF report generation for board and regulatory reporting",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const feature of features) {
    doc.text(`  •  ${feature}`, 25, y);
    y += 8;
  }

  y += 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Book a demo: irpages.com/demo", pageWidth / 2, y, {
    align: "center",
  });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("hello@irpages.com | irpages.com", pageWidth / 2, y, {
    align: "center",
  });

  return doc;
}
