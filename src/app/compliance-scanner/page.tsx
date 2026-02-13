import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IR Compliance Scanner | How compliant is your IR website?",
  description:
    "Free compliance scan for companies on Spotlight, First North & Euronext Growth. Checks 24 compliance points based on MAR EU 596/2014.",
};

export default function ComplianceScannerPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          How compliant is your IR website?
        </h1>
        <p className="text-lg text-center text-gray-600 mb-8">
          Free compliance scan for companies on Spotlight, First North &amp;
          Euronext Growth
        </p>
        <p className="text-center text-gray-500">
          Scanner coming soon — setup in progress.
        </p>
      </div>
    </main>
  );
}
