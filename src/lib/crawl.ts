"use server";

import * as cheerio from "cheerio";
import type { CrawlResult, DiscoveredSections, SiteMap } from "@/types";

// ─── Section Discovery Patterns ──────────────────────────────────────────────

const SECTION_PATTERNS: Record<
  keyof Omit<DiscoveredSections, "archive">,
  { urlPatterns: RegExp[]; linkTextPatterns: RegExp[] }
> = {
  pressReleases: {
    urlPatterns: [
      /press/i,
      /nyheter/i,
      /news/i,
      /pressmeddelande/i,
      /releases/i,
      /regulatory/i,
      /regulatoriska/i,
      /announcements/i,
      /børsmelding/i,
      /pressemelding/i,
      /meldinger/i,
    ],
    linkTextPatterns: [
      /press\s*(releases|meddelanden)/i,
      /nyheter/i,
      /news/i,
      /regulatory/i,
      /regulatorisk/i,
      /announcements/i,
      /børsmelding/i,
      /pressemelding/i,
    ],
  },
  financialReports: {
    urlPatterns: [
      /reports?/i,
      /rapporter/i,
      /financial/i,
      /finansiell/i,
      /annual/i,
      /arsredovisning/i,
      /årsredovisning/i,
      /quarterly/i,
      /kvartals/i,
      /årsrapport/i,
    ],
    linkTextPatterns: [
      /financial\s*reports?/i,
      /rapporter/i,
      /annual\s*report/i,
      /årsredovisning/i,
      /interim/i,
      /delårsrapport/i,
      /årsrapport/i,
      /kvartalsrapport/i,
    ],
  },
  financialCalendar: {
    urlPatterns: [/calendar/i, /kalender/i, /events/i, /upcoming/i, /hendelser/i],
    linkTextPatterns: [
      /financial\s*calendar/i,
      /finansiell\s*kalender/i,
      /calendar/i,
      /kalender/i,
      /events/i,
      /hendelser/i,
    ],
  },
  shareInfo: {
    urlPatterns: [
      /share/i,
      /aktie/i,
      /stock/i,
      /kurs/i,
      /shareholders/i,
      /aktieägare/i,
      /ownership/i,
      /aksje/i,
      /aksjekurs/i,
      /aksjonær/i,
    ],
    linkTextPatterns: [
      /share/i,
      /aktie/i,
      /stock/i,
      /kurs/i,
      /shareholders/i,
      /aktieägare/i,
      /ägare/i,
      /aksje/i,
      /aksjonær/i,
    ],
  },
  governance: {
    urlPatterns: [
      /governance/i,
      /bolagsstyrning/i,
      /board/i,
      /styrelse/i,
      /management/i,
      /ledning/i,
      /styret/i,
      /ledelse/i,
      /selskapsstyring/i,
    ],
    linkTextPatterns: [
      /governance/i,
      /bolagsstyrning/i,
      /board/i,
      /styrelse/i,
      /management/i,
      /ledning/i,
      /styret/i,
      /ledelse/i,
    ],
  },
  insiderTransactions: {
    urlPatterns: [
      /insider/i,
      /insyn/i,
      /pdmr/i,
      /insyns/i,
      /innsidehandel/i,
      /meldepliktige/i,
      /primærinnsider/i,
    ],
    linkTextPatterns: [
      /insider/i,
      /insyn/i,
      /pdmr/i,
      /insynstransaktioner/i,
      /insider\s*transactions?/i,
      /innsidehandel/i,
    ],
  },
  subscription: {
    urlPatterns: [/subscribe/i, /prenumer/i, /alert/i, /notification/i],
    linkTextPatterns: [
      /subscribe/i,
      /prenumer/i,
      /alerts?/i,
      /notifications?/i,
      /sign\s*up/i,
    ],
  },
  contact: {
    urlPatterns: [/contact/i, /kontakt/i, /ir-contact/i, /investor.*contact/i],
    linkTextPatterns: [
      /ir\s*contact/i,
      /investor.*contact/i,
      /kontakt/i,
      /contact/i,
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function isSameDomain(baseUrl: string, testUrl: string): boolean {
  try {
    const base = new URL(baseUrl);
    const test = new URL(testUrl);
    return base.hostname === test.hostname;
  } catch {
    return false;
  }
}

function isHtmlUrl(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();
  const nonHtmlExtensions = [
    ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp",
    ".mp4", ".mp3", ".zip", ".doc", ".docx", ".xls", ".xlsx",
    ".ppt", ".pptx", ".csv", ".ico", ".woff", ".woff2", ".ttf", ".eot",
  ];
  return !nonHtmlExtensions.some((ext) => path.endsWith(ext));
}

function extractLinks($: cheerio.CheerioAPI, pageUrl: string): string[] {
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const normalized = normalizeUrl(pageUrl, href);
    if (normalized && isSameDomain(pageUrl, normalized)) {
      // Remove hash and trailing slash for deduplication
      const clean = normalized.split("#")[0].replace(/\/$/, "");
      if (clean) links.push(clean);
    }
  });
  return [...new Set(links)];
}

function extractPdfLinks($: cheerio.CheerioAPI, pageUrl: string): string[] {
  const pdfs: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const normalized = normalizeUrl(pageUrl, href);
    if (normalized && normalized.toLowerCase().endsWith(".pdf")) {
      pdfs.push(normalized);
    }
  });
  return [...new Set(pdfs)];
}

// ─── Robots.txt ──────────────────────────────────────────────────────────────

async function canCrawl(baseUrl: string): Promise<boolean> {
  try {
    const robotsUrl = new URL("/robots.txt", baseUrl).href;
    const res = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return true; // No robots.txt = allow

    const text = await res.text();
    const lines = text.split("\n");
    let relevantAgent = false;

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith("user-agent:")) {
        const agent = trimmed.replace("user-agent:", "").trim();
        relevantAgent = agent === "*";
      }
      if (relevantAgent && trimmed.startsWith("disallow:")) {
        const path = trimmed.replace("disallow:", "").trim();
        if (path === "/") return false;
      }
    }
    return true;
  } catch {
    return true; // If we can't fetch robots.txt, assume allowed
  }
}

// ─── Fetch a single page ─────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<CrawlResult | null> {
  try {
    const start = Date.now();
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent":
          "IRComplianceScanner/1.0 (compliance check; contact@irpages.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const ttfb = Date.now() - start;

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove scripts and styles for clean text extraction
    $("script, style, noscript").remove();

    return {
      url: res.url, // Use final URL after redirects
      title: $("title").first().text().trim(),
      html,
      text: $("body").text().replace(/\s+/g, " ").trim(),
      lang: $("html").attr("lang") || null,
      links: extractLinks($, res.url),
      statusCode: res.status,
      ttfb,
    };
  } catch {
    return null;
  }
}

// ─── Section Classification ──────────────────────────────────────────────────

interface LinkInfo {
  url: string;
  text: string;
}

function classifySections(links: LinkInfo[]): DiscoveredSections {
  const sections: DiscoveredSections = {
    pressReleases: null,
    financialReports: null,
    financialCalendar: null,
    shareInfo: null,
    governance: null,
    insiderTransactions: null,
    subscription: null,
    contact: null,
    archive: null,
  };

  for (const [sectionKey, patterns] of Object.entries(SECTION_PATTERNS)) {
    const key = sectionKey as keyof typeof SECTION_PATTERNS;
    for (const link of links) {
      const urlMatch = patterns.urlPatterns.some((p) => p.test(link.url));
      const textMatch = patterns.linkTextPatterns.some((p) =>
        p.test(link.text)
      );
      if (urlMatch || textMatch) {
        sections[key] = link.url;
        break;
      }
    }
  }

  return sections;
}

// ─── Main Crawl Function ─────────────────────────────────────────────────────

const MAX_PAGES = 50;
const CRAWL_TIMEOUT_MS = 30000;
const DELAY_BETWEEN_REQUESTS_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function crawlIRSite(url: string): Promise<SiteMap> {
  // Normalize input URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  // Check robots.txt
  const allowed = await canCrawl(normalizedUrl);
  if (!allowed) {
    // Return empty sitemap indicating blocked
    return {
      homepage: {
        url: normalizedUrl,
        title: "",
        html: "",
        text: "",
        lang: null,
        links: [],
        statusCode: 0,
      },
      pages: [],
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
      pdfLinks: [],
      blockedByCrawling: true,
    };
  }

  const startTime = Date.now();
  const visited = new Set<string>();
  const pages: CrawlResult[] = [];
  let allPdfLinks: string[] = [];

  // Fetch homepage
  const homepage = await fetchPage(normalizedUrl);
  if (!homepage) {
    return {
      homepage: {
        url: normalizedUrl,
        title: "",
        html: "",
        text: "",
        lang: null,
        links: [],
        statusCode: 0,
      },
      pages: [],
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
      pdfLinks: [],
      blockedByCrawling: false,
    };
  }

  visited.add(homepage.url.replace(/\/$/, ""));

  // Extract PDF links from homepage
  const $home = cheerio.load(homepage.html);
  allPdfLinks = extractPdfLinks($home, homepage.url);

  // Collect all links with their text for classification
  const linkInfos: LinkInfo[] = [];
  $home("a[href]").each((_, el) => {
    const href = $home(el).attr("href");
    const text = $home(el).text().trim();
    if (!href) return;
    const normalized = normalizeUrl(homepage.url, href);
    if (normalized && isSameDomain(homepage.url, normalized)) {
      linkInfos.push({ url: normalized.split("#")[0].replace(/\/$/, ""), text });
    }
  });

  // Classify sections from homepage links
  const discoveredSections = classifySections(linkInfos);

  // Build crawl queue: prioritize discovered section URLs
  const sectionUrls = Object.values(discoveredSections).filter(
    (u): u is string => u !== null
  );
  const otherUrls = homepage.links.filter((l) => !sectionUrls.includes(l));
  const crawlQueue = [...sectionUrls, ...otherUrls];

  // Crawl subpages
  for (const pageUrl of crawlQueue) {
    if (Date.now() - startTime > CRAWL_TIMEOUT_MS) break;
    if (pages.length >= MAX_PAGES) break;

    const cleanUrl = pageUrl.replace(/\/$/, "");
    if (visited.has(cleanUrl)) continue;
    if (!isHtmlUrl(pageUrl)) continue;

    visited.add(cleanUrl);
    await sleep(DELAY_BETWEEN_REQUESTS_MS);

    const page = await fetchPage(pageUrl);
    if (page) {
      pages.push(page);

      // Extract PDF links from subpages
      const $page = cheerio.load(page.html);
      allPdfLinks.push(...extractPdfLinks($page, page.url));

      // Also collect links from subpages for better section discovery
      $page("a[href]").each((_, el) => {
        const href = $page(el).attr("href");
        const text = $page(el).text().trim();
        if (!href) return;
        const normalized = normalizeUrl(page.url, href);
        if (normalized && isSameDomain(homepage.url, normalized)) {
          linkInfos.push({
            url: normalized.split("#")[0].replace(/\/$/, ""),
            text,
          });
        }
      });
    }
  }

  // Re-classify sections with all discovered links (including from subpages)
  const finalSections = classifySections(linkInfos);

  // Merge: prefer initially discovered sections, fill in newly found ones
  for (const key of Object.keys(finalSections) as (keyof DiscoveredSections)[]) {
    if (!discoveredSections[key] && finalSections[key]) {
      discoveredSections[key] = finalSections[key];
    }
  }

  return {
    homepage,
    pages,
    discoveredSections,
    pdfLinks: [...new Set(allPdfLinks)],
    blockedByCrawling: false,
  };
}
