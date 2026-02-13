import type { Metadata } from "next";
import ComplianceScannerFlow from "./compliance-scanner-flow";

export const metadata: Metadata = {
  title: "IR Compliance Scanner | How compliant is your IR website?",
  description:
    "Free compliance scan for companies on Spotlight, First North & Euronext Growth. Checks 24 compliance points based on MAR EU 596/2014.",
};

export default function ComplianceScannerPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ComplianceScannerFlow />
      </div>
    </main>
  );
}
