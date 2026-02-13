"use server";

import { crawlIRSite } from "@/lib/crawl";
import { runAllDetectionRules } from "@/lib/detection-rules";
import type { DetectionResult, DiscoveredSections, SiteMap } from "@/types";

export interface ScanActionResult {
  siteMap: {
    url: string;
    title: string;
    pagesFound: number;
    discoveredSections: DiscoveredSections;
    blockedByCrawling: boolean;
  };
  detectionResults: DetectionResult[];
  error?: string;
}

export async function runComplianceScan(
  url: string
): Promise<ScanActionResult> {
  try {
    const siteMap: SiteMap = await crawlIRSite(url);

    if (siteMap.blockedByCrawling) {
      return {
        siteMap: {
          url: siteMap.homepage.url,
          title: "",
          pagesFound: 0,
          discoveredSections: siteMap.discoveredSections,
          blockedByCrawling: true,
        },
        detectionResults: [],
        error:
          "This site blocks automated crawling. You can still complete the self-assessment manually.",
      };
    }

    const detectionResults = runAllDetectionRules(siteMap);

    return {
      siteMap: {
        url: siteMap.homepage.url,
        title: siteMap.homepage.title,
        pagesFound: siteMap.pages.length + 1,
        discoveredSections: siteMap.discoveredSections,
        blockedByCrawling: false,
      },
      detectionResults,
    };
  } catch (err) {
    return {
      siteMap: {
        url,
        title: "",
        pagesFound: 0,
        discoveredSections: {
          pressReleases: null,
          financialReports: null,
          financialCalendar: null,
          shareInfo: null,
          governance: null,
          insiderTransactions: null,
          subscription: null,
          contact: null,
          archive: null,
        },
        blockedByCrawling: false,
      },
      detectionResults: [],
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
