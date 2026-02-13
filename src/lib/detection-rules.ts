import * as cheerio from "cheerio";
import type { CrawlResult, DetectionResult, SiteMap } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPageByUrl(
  siteMap: SiteMap,
  url: string | null
): CrawlResult | null {
  if (!url) return null;
  const clean = url.replace(/\/$/, "");
  if (siteMap.homepage.url.replace(/\/$/, "") === clean) return siteMap.homepage;
  return siteMap.pages.find((p) => p.url.replace(/\/$/, "") === clean) || null;
}

function countDateMatches(text: string): { count: number; oldest: Date | null } {
  // Match ISO dates: 2024-01-15
  const isoPattern = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  // Match Swedish/European dates: 15 januari 2024, 15 jan 2024
  const svMonths =
    /\b(\d{1,2})\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|jan|feb|mar|apr|jun|jul|aug|sep|okt|nov|dec)\s+(\d{4})\b/gi;
  // Match English dates: January 15, 2024
  const enMonths =
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})\b/gi;
  // Match DD.MM.YYYY or DD/MM/YYYY
  const dotPattern = /\b(\d{2})[./](\d{2})[./](\d{4})\b/g;

  const dates: Date[] = [];

  let match;
  while ((match = isoPattern.exec(text)) !== null) {
    const d = new Date(`${match[1]}-${match[2]}-${match[3]}`);
    if (!isNaN(d.getTime())) dates.push(d);
  }

  const svMonthMap: Record<string, number> = {
    januari: 0, jan: 0, februari: 1, feb: 1, mars: 2, mar: 2,
    april: 3, apr: 3, maj: 4, juni: 5, jun: 5, juli: 6, jul: 6,
    augusti: 7, aug: 7, september: 8, sep: 8, oktober: 9, okt: 9,
    november: 10, nov: 10, december: 11, dec: 11,
  };

  while ((match = svMonths.exec(text)) !== null) {
    const month = svMonthMap[match[2].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(parseInt(match[3]), month, parseInt(match[1]));
      if (!isNaN(d.getTime())) dates.push(d);
    }
  }

  const enMonthMap: Record<string, number> = {
    january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
    april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
    august: 7, aug: 7, september: 8, sep: 8, october: 9, oct: 9,
    november: 10, nov: 10, december: 11, dec: 11,
  };

  while ((match = enMonths.exec(text)) !== null) {
    const month = enMonthMap[match[1].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(parseInt(match[3]), month, parseInt(match[2]));
      if (!isNaN(d.getTime())) dates.push(d);
    }
  }

  while ((match = dotPattern.exec(text)) !== null) {
    const d = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) dates.push(d);
  }

  const oldest = dates.length > 0
    ? dates.reduce((min, d) => (d < min ? d : min))
    : null;

  return { count: dates.length, oldest };
}

function allPagesText(siteMap: SiteMap): string {
  return [siteMap.homepage.text, ...siteMap.pages.map((p) => p.text)].join(" ");
}

// ─── CHECK 1: Press Release Archive Exists ───────────────────────────────────

function checkPressArchive(siteMap: SiteMap): DetectionResult {
  const pressUrl = siteMap.discoveredSections.pressReleases;
  const pressPage = getPageByUrl(siteMap, pressUrl);

  if (pressPage) {
    const { count } = countDateMatches(pressPage.text);
    if (count > 2) {
      return {
        checkId: "auto_press_archive",
        name: "Press Release Archive",
        layer: "MAR",
        passed: true,
        confidence: "high",
        evidence: `Found press release page at ${new URL(pressPage.url).pathname} with ~${count} dated entries`,
        details: "Press release archive detected with multiple dated releases.",
        weight: 10,
        risk: "Critical",
        automatable: true,
      };
    }
    return {
      checkId: "auto_press_archive",
      name: "Press Release Archive",
      layer: "MAR",
      passed: "partial",
      confidence: "medium",
      evidence: `Press release page found at ${new URL(pressPage.url).pathname} but only ${count} dated entries detected`,
      details: "A press release section exists but may have limited content.",
      weight: 10,
      risk: "Critical",
      automatable: true,
    };
  }

  return {
    checkId: "auto_press_archive",
    name: "Press Release Archive",
    layer: "MAR",
    passed: false,
    confidence: "high",
    evidence: "No press release section detected on the site",
    details: "MAR requires inside information to be published and archived for at least 5 years.",
    weight: 10,
    risk: "Critical",
    automatable: true,
  };
}

// ─── CHECK 2: Archive Depth (5-Year Retention) ──────────────────────────────

function checkArchiveDepth(siteMap: SiteMap): DetectionResult {
  const pressUrl = siteMap.discoveredSections.pressReleases;
  const pressPage = getPageByUrl(siteMap, pressUrl);

  if (!pressPage) {
    return {
      checkId: "auto_archive_depth",
      name: "Archive Depth (5-Year Retention)",
      layer: "MAR",
      passed: false,
      confidence: "medium",
      evidence: "No press release page found to check archive depth",
      details: "Cannot assess archive depth without a press release page.",
      weight: 9,
      risk: "Critical",
      automatable: true,
    };
  }

  const { oldest } = countDateMatches(pressPage.text);
  if (!oldest) {
    return {
      checkId: "auto_archive_depth",
      name: "Archive Depth (5-Year Retention)",
      layer: "MAR",
      passed: false,
      confidence: "low",
      evidence: "No dates found on press release page",
      details: "Could not determine archive depth.",
      weight: 9,
      risk: "Critical",
      automatable: true,
    };
  }

  const now = new Date();
  const yearsDiff = (now.getTime() - oldest.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  if (yearsDiff >= 5) {
    return {
      checkId: "auto_archive_depth",
      name: "Archive Depth (5-Year Retention)",
      layer: "MAR",
      passed: true,
      confidence: "medium",
      evidence: `Archive dates back to ${oldest.toISOString().split("T")[0]} (${yearsDiff.toFixed(1)} years). Meets 5-year requirement.`,
      details: "Press release archive meets the 5-year retention requirement.",
      weight: 9,
      risk: "Critical",
      automatable: true,
    };
  }

  if (yearsDiff >= 3) {
    return {
      checkId: "auto_archive_depth",
      name: "Archive Depth (5-Year Retention)",
      layer: "MAR",
      passed: "partial",
      confidence: "medium",
      evidence: `Oldest visible release is ${oldest.toISOString().split("T")[0]} (${yearsDiff.toFixed(1)} years). May have deeper archive behind pagination.`,
      details: "Archive may not meet the 5-year retention requirement. Older content may exist behind pagination.",
      weight: 9,
      risk: "Critical",
      automatable: true,
    };
  }

  return {
    checkId: "auto_archive_depth",
    name: "Archive Depth (5-Year Retention)",
    layer: "MAR",
    passed: false,
    confidence: "medium",
    evidence: `Oldest release found is ${oldest.toISOString().split("T")[0]} (${yearsDiff.toFixed(1)} years). Does not meet 5-year requirement.`,
    details: "Archive does not appear to meet the MAR 5-year retention requirement.",
    weight: 9,
    risk: "Critical",
    automatable: true,
  };
}

// ─── CHECK 3: MAR Classification Visible ─────────────────────────────────────

function checkMARClassification(siteMap: SiteMap): DetectionResult {
  const pressUrl = siteMap.discoveredSections.pressReleases;
  const pressPage = getPageByUrl(siteMap, pressUrl);
  const searchPages = pressPage ? [pressPage] : [siteMap.homepage, ...siteMap.pages];

  const marKeywords = [
    /\bMAR\b/, /insiderinformation/i, /inside\s*information/i,
    /regulatorisk/i, /regulatory/i, /artikel\s*17/i, /article\s*17/i,
    /non[- ]?regulatory/i, /icke[- ]?regulatorisk/i,
  ];

  for (const page of searchPages) {
    for (const pattern of marKeywords) {
      if (pattern.test(page.text)) {
        return {
          checkId: "auto_mar_classification",
          name: "MAR Classification Visible",
          layer: "MAR",
          passed: true,
          confidence: "medium",
          evidence: `MAR classification indicator found: "${page.text.match(pattern)?.[0]}" on ${new URL(page.url).pathname}`,
          details: "Press releases appear to distinguish between regulatory and non-regulatory content.",
          weight: 8,
          risk: "High",
          automatable: true,
        };
      }
    }
  }

  // Check for filter/tag elements in HTML
  for (const page of searchPages) {
    const $ = cheerio.load(page.html);
    const filterText = $("[class*=filter], [class*=tag], [class*=label], [class*=badge], [class*=category]").text();
    const filterPatterns = [/regulatory/i, /regulatorisk/i, /MAR/];
    for (const p of filterPatterns) {
      if (p.test(filterText)) {
        return {
          checkId: "auto_mar_classification",
          name: "MAR Classification Visible",
          layer: "MAR",
          passed: true,
          confidence: "medium",
          evidence: `MAR classification filter/tag found on ${new URL(page.url).pathname}`,
          details: "Press releases tagged with regulatory/non-regulatory labels.",
          weight: 8,
          risk: "High",
          automatable: true,
        };
      }
    }
  }

  return {
    checkId: "auto_mar_classification",
    name: "MAR Classification Visible",
    layer: "MAR",
    passed: false,
    confidence: "medium",
    evidence: "No MAR classification visible on press releases",
    details: "Press releases should clearly distinguish between MAR-regulated inside information and other news.",
    weight: 8,
    risk: "High",
    automatable: true,
  };
}

// ─── CHECK 4: Financial Calendar Exists ──────────────────────────────────────

function checkFinancialCalendar(siteMap: SiteMap): DetectionResult {
  const calUrl = siteMap.discoveredSections.financialCalendar;
  const calPage = getPageByUrl(siteMap, calUrl);

  if (calPage) {
    const eventKeywords = [
      /delårsrapport/i, /årsstämma/i, /AGM/i, /annual\s*general\s*meeting/i,
      /interim\s*report/i, /annual\s*report/i, /Q[1-4]/i,
      /kvartalsrapport/i, /bokslutskommuniké/i, /year[- ]end\s*report/i,
    ];
    const matchCount = eventKeywords.filter((k) => k.test(calPage.text)).length;

    const { count: dateCount } = countDateMatches(calPage.text);

    if (dateCount > 0 && matchCount > 0) {
      return {
        checkId: "auto_financial_calendar",
        name: "Financial Calendar",
        layer: "Exchange",
        passed: true,
        confidence: "high",
        evidence: `Financial calendar found at ${new URL(calPage.url).pathname} with ${dateCount} dates and ${matchCount} event types`,
        details: "Financial calendar detected with upcoming events.",
        weight: 7,
        risk: "High",
        automatable: true,
      };
    }

    return {
      checkId: "auto_financial_calendar",
      name: "Financial Calendar",
      layer: "Exchange",
      passed: "partial",
      confidence: "medium",
      evidence: `Calendar page found at ${new URL(calPage.url).pathname} but limited event data detected`,
      details: "A calendar section exists but may have insufficient content.",
      weight: 7,
      risk: "High",
      automatable: true,
    };
  }

  return {
    checkId: "auto_financial_calendar",
    name: "Financial Calendar",
    layer: "Exchange",
    passed: false,
    confidence: "high",
    evidence: "No financial calendar page detected",
    details: "Exchange rules require a published financial calendar with upcoming report dates and AGM.",
    weight: 7,
    risk: "High",
    automatable: true,
  };
}

// ─── CHECK 5: Bilingual Content (SV + EN) ────────────────────────────────────

function checkBilingual(siteMap: SiteMap): DetectionResult {
  const $ = cheerio.load(siteMap.homepage.html);

  // Check for hreflang tags
  const hreflangs: string[] = [];
  $("link[hreflang]").each((_, el) => {
    const lang = $(el).attr("hreflang");
    if (lang) hreflangs.push(lang.toLowerCase());
  });

  // Check for language switcher
  const langSwitchPatterns = [
    /\b(EN|SV|Svenska|English)\b/,
  ];
  const navText = $("nav, header, [class*=lang], [class*=language]").text();
  const hasLangSwitcher = langSwitchPatterns.some((p) => p.test(navText));

  // Check for /en/ or /sv/ URL patterns in links
  const hasEnUrl = siteMap.homepage.links.some((l) => /\/(en|english)\//i.test(l));
  const hasSvUrl = siteMap.homepage.links.some((l) => /\/(sv|svenska)\//i.test(l));

  // Check html lang attribute
  const htmlLang = siteMap.homepage.lang?.toLowerCase() || "";

  const signals: string[] = [];
  if (hreflangs.length > 1) signals.push(`hreflang tags: ${hreflangs.join(", ")}`);
  if (hasLangSwitcher) signals.push("language switcher detected");
  if (hasEnUrl && hasSvUrl) signals.push("both /en/ and /sv/ URL paths found");
  else if (hasEnUrl) signals.push("/en/ URL path found");
  else if (hasSvUrl) signals.push("/sv/ URL path found");

  if (signals.length >= 2) {
    return {
      checkId: "auto_bilingual",
      name: "Bilingual Content (SV + EN)",
      layer: "Exchange",
      passed: true,
      confidence: "high",
      evidence: `Site available in multiple languages: ${signals.join("; ")}`,
      details: "Bilingual content detected with strong indicators.",
      weight: 8,
      risk: "High",
      automatable: true,
    };
  }

  if (signals.length === 1) {
    return {
      checkId: "auto_bilingual",
      name: "Bilingual Content (SV + EN)",
      layer: "Exchange",
      passed: "partial",
      confidence: "medium",
      evidence: `Partial bilingual indicators: ${signals.join("; ")}`,
      details: "Some bilingual indicators found but coverage may be limited.",
      weight: 8,
      risk: "High",
      automatable: true,
    };
  }

  return {
    checkId: "auto_bilingual",
    name: "Bilingual Content (SV + EN)",
    layer: "Exchange",
    passed: false,
    confidence: "medium",
    evidence: `Site appears to be single-language only (detected lang: ${htmlLang || "unknown"})`,
    details: "Exchange rules typically require IR content in both Swedish and English.",
    weight: 8,
    risk: "High",
    automatable: true,
  };
}

// ─── CHECK 6: Share/Stock Information Page ───────────────────────────────────

function checkShareInfo(siteMap: SiteMap): DetectionResult {
  const shareUrl = siteMap.discoveredSections.shareInfo;
  const sharePage = getPageByUrl(siteMap, shareUrl);

  if (sharePage) {
    const $ = cheerio.load(sharePage.html);

    // Check for stock chart embeds
    const hasChart = $("iframe").length > 0 ||
      $("[class*=chart], [class*=stock], [class*=graph], [id*=chart]").length > 0;

    // Check for ISIN
    const isinMatch = sharePage.text.match(/\b[A-Z]{2}[A-Z0-9]{10}\b/);

    // Check for stock-related keywords
    const stockKeywords = [
      /aktiekurs/i, /stock\s*price/i, /ISIN/i, /ticker/i,
      /kurs/i, /share\s*price/i, /börskurs/i,
    ];
    const keywordMatches = stockKeywords.filter((k) => k.test(sharePage.text)).length;

    if (hasChart && (isinMatch || keywordMatches > 0)) {
      return {
        checkId: "auto_share_info",
        name: "Share/Stock Information",
        layer: "Exchange",
        passed: true,
        confidence: "high",
        evidence: `Share info page with chart${isinMatch ? ` and ISIN ${isinMatch[0]}` : ""} at ${new URL(sharePage.url).pathname}`,
        details: "Share information page found with stock chart and identifying data.",
        weight: 5,
        risk: "Medium",
        automatable: true,
      };
    }

    if (keywordMatches > 0) {
      return {
        checkId: "auto_share_info",
        name: "Share/Stock Information",
        layer: "Exchange",
        passed: "partial",
        confidence: "medium",
        evidence: `Share page exists at ${new URL(sharePage.url).pathname} but no interactive chart detected`,
        details: "Share page exists but may lack interactive stock chart.",
        weight: 5,
        risk: "Medium",
        automatable: true,
      };
    }
  }

  return {
    checkId: "auto_share_info",
    name: "Share/Stock Information",
    layer: "Exchange",
    passed: false,
    confidence: "high",
    evidence: "No share information page found",
    details: "A dedicated share/stock information page with price data is expected for listed companies.",
    weight: 5,
    risk: "Medium",
    automatable: true,
  };
}

// ─── CHECK 7: Board & Management Page ────────────────────────────────────────

function checkGovernance(siteMap: SiteMap): DetectionResult {
  const govUrl = siteMap.discoveredSections.governance;
  const govPage = getPageByUrl(siteMap, govUrl);
  const searchPages = govPage ? [govPage] : [siteMap.homepage, ...siteMap.pages];

  const titlePatterns = [
    /\bCEO\b/, /\bCFO\b/, /\bCOO\b/, /\bCTO\b/,
    /\bVD\b/, /\bVerkställande\s*direktör/i,
    /styrelseordförande/i, /chairman/i,
    /board\s*member/i, /styrelseledamot/i,
    /ledamot/i, /management/i, /ledning/i,
  ];

  for (const page of searchPages) {
    const matchCount = titlePatterns.filter((p) => p.test(page.text)).length;

    if (matchCount >= 3) {
      return {
        checkId: "auto_governance",
        name: "Board & Management",
        layer: "Exchange",
        passed: true,
        confidence: "high",
        evidence: `Corporate governance page with multiple roles identified at ${new URL(page.url).pathname}`,
        details: "Board and management information found with multiple named roles.",
        weight: 5,
        risk: "Medium",
        automatable: true,
      };
    }

    if (matchCount >= 1) {
      return {
        checkId: "auto_governance",
        name: "Board & Management",
        layer: "Exchange",
        passed: "partial",
        confidence: "medium",
        evidence: `Some governance information found at ${new URL(page.url).pathname} but limited detail`,
        details: "Some management information found but may be incomplete.",
        weight: 5,
        risk: "Medium",
        automatable: true,
      };
    }
  }

  return {
    checkId: "auto_governance",
    name: "Board & Management",
    layer: "Exchange",
    passed: false,
    confidence: "high",
    evidence: "No governance or management information found",
    details: "Listed companies should present their board of directors and management team.",
    weight: 5,
    risk: "Medium",
    automatable: true,
  };
}

// ─── CHECK 8: Insider Transaction Log ────────────────────────────────────────

function checkInsiderTransactions(siteMap: SiteMap): DetectionResult {
  const insiderUrl = siteMap.discoveredSections.insiderTransactions;
  const insiderPage = getPageByUrl(siteMap, insiderUrl);

  if (insiderPage) {
    const keywords = [
      /insynstransaktioner/i, /insider\s*transactions?/i, /PDMR/i,
      /innsidehandel/i, /meldepliktige/i,
    ];
    const hasKeywords = keywords.some((k) => k.test(insiderPage.text));

    // Check for tabular data
    const $ = cheerio.load(insiderPage.html);
    const hasTables = $("table").length > 0;

    if (hasKeywords || hasTables) {
      return {
        checkId: "auto_insider_transactions",
        name: "Insider Transaction Log",
        layer: "Best Practice",
        passed: true,
        confidence: "medium",
        evidence: `Insider transactions page found at ${new URL(insiderPage.url).pathname}${hasTables ? " with tabular data" : ""}`,
        details: "Insider transaction log detected.",
        weight: 5,
        risk: "Medium",
        automatable: true,
      };
    }
  }

  return {
    checkId: "auto_insider_transactions",
    name: "Insider Transaction Log",
    layer: "Best Practice",
    passed: false,
    confidence: "high",
    evidence: "No insider transaction log found on the site",
    details: "Best practice is to publish PDMR/insider transactions on the IR website.",
    weight: 5,
    risk: "Medium",
    automatable: true,
  };
}

// ─── CHECK 9: Subscription/Alert Service ─────────────────────────────────────

function checkSubscription(siteMap: SiteMap): DetectionResult {
  const subUrl = siteMap.discoveredSections.subscription;
  const allPages = [siteMap.homepage, ...siteMap.pages];

  for (const page of allPages) {
    const $ = cheerio.load(page.html);

    // Look for subscription forms
    const forms = $("form");
    let hasSubscriptionForm = false;
    let hasGdprConsent = false;

    forms.each((_, form) => {
      const formHtml = $(form).html() || "";
      const formText = $(form).text().toLowerCase();
      const hasEmailInput = $(form).find("input[type=email], input[name*=email]").length > 0;
      const subKeywords = /prenumerera|subscribe|alert|notification|bevaka/i;

      if (hasEmailInput && (subKeywords.test(formText) || subKeywords.test(formHtml))) {
        hasSubscriptionForm = true;
        // Check for GDPR consent
        const hasCheckbox = $(form).find("input[type=checkbox]").length > 0;
        const gdprText = /gdpr|samtycke|consent|integritet|privacy|personuppgift/i;
        if (hasCheckbox || gdprText.test(formText)) {
          hasGdprConsent = true;
        }
      }
    });

    if (hasSubscriptionForm) {
      if (hasGdprConsent) {
        return {
          checkId: "auto_subscription",
          name: "Subscription/Alert Service",
          layer: "Best Practice",
          passed: true,
          confidence: "medium",
          evidence: `Email subscription form found with GDPR consent at ${new URL(page.url).pathname}`,
          details: "Press release subscription service with GDPR consent mechanism detected.",
          weight: 4,
          risk: "Low",
          automatable: true,
        };
      }
      return {
        checkId: "auto_subscription",
        name: "Subscription/Alert Service",
        layer: "Best Practice",
        passed: "partial",
        confidence: "medium",
        evidence: `Subscription form found at ${new URL(page.url).pathname} but no visible GDPR consent mechanism`,
        details: "Subscription form exists but may lack proper GDPR consent.",
        weight: 4,
        risk: "Low",
        automatable: true,
      };
    }
  }

  if (subUrl) {
    return {
      checkId: "auto_subscription",
      name: "Subscription/Alert Service",
      layer: "Best Practice",
      passed: "partial",
      confidence: "low",
      evidence: `Subscription page link found (${subUrl}) but form details could not be verified`,
      details: "A subscription page was discovered but could not be fully analyzed.",
      weight: 4,
      risk: "Low",
      automatable: true,
    };
  }

  return {
    checkId: "auto_subscription",
    name: "Subscription/Alert Service",
    layer: "Best Practice",
    passed: false,
    confidence: "high",
    evidence: "No press release subscription service found",
    details: "Best practice is to offer email alerts for new press releases.",
    weight: 4,
    risk: "Low",
    automatable: true,
  };
}

// ─── CHECK 10: IR Contact Information ────────────────────────────────────────

function checkIRContact(siteMap: SiteMap): DetectionResult {
  const allPages = [siteMap.homepage, ...siteMap.pages];

  for (const page of allPages) {
    const irContext =
      /ir|investor\s*relations?|investerarrelationer/i.test(page.text);
    const emailMatch = page.text.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );
    const phoneMatch = page.text.match(
      /\+?\d[\d\s()-]{7,}/
    );

    // Check for named IR contact (not just info@)
    const hasNamedContact =
      emailMatch && !emailMatch[0].startsWith("info@");

    if (irContext && emailMatch && phoneMatch && hasNamedContact) {
      return {
        checkId: "auto_ir_contact",
        name: "IR Contact Information",
        layer: "Best Practice",
        passed: true,
        confidence: "high",
        evidence: `Named IR contact found with email and phone at ${new URL(page.url).pathname}`,
        details: "Dedicated IR contact information with named person detected.",
        weight: 5,
        risk: "Medium",
        automatable: true,
      };
    }

    if (irContext && emailMatch) {
      return {
        checkId: "auto_ir_contact",
        name: "IR Contact Information",
        layer: "Best Practice",
        passed: "partial",
        confidence: "medium",
        evidence: `Contact email found (${emailMatch[0].startsWith("info@") ? "generic" : "specific"}) near IR content at ${new URL(page.url).pathname}`,
        details: emailMatch[0].startsWith("info@")
          ? "Generic contact email found but no dedicated IR contact person."
          : "IR contact email found but phone or named person may be missing.",
        weight: 5,
        risk: "Medium",
        automatable: true,
      };
    }
  }

  return {
    checkId: "auto_ir_contact",
    name: "IR Contact Information",
    layer: "Best Practice",
    passed: false,
    confidence: "medium",
    evidence: "No IR contact information found",
    details: "Best practice is to provide a named IR contact with direct email and phone.",
    weight: 5,
    risk: "Medium",
    automatable: true,
  };
}

// ─── CHECK 11: Financial Reports Available ───────────────────────────────────

function checkFinancialReports(siteMap: SiteMap): DetectionResult {
  const reportsUrl = siteMap.discoveredSections.financialReports;
  const reportsPage = getPageByUrl(siteMap, reportsUrl);

  const reportKeywords = [
    /årsredovisning/i, /annual\s*report/i, /delårsrapport/i,
    /interim\s*report/i, /Q[1-4]/i, /kvartalsrapport/i,
    /bokslutskommuniké/i, /year[- ]end\s*report/i, /årsrapport/i,
  ];

  if (reportsPage) {
    const keywordMatches = reportKeywords.filter((k) =>
      k.test(reportsPage.text)
    ).length;

    // Check for PDF links
    const $ = cheerio.load(reportsPage.html);
    const pdfLinks = $("a[href$='.pdf']").length;

    // Check for recent year
    const currentYear = new Date().getFullYear();
    const hasRecent =
      reportsPage.text.includes(String(currentYear)) ||
      reportsPage.text.includes(String(currentYear - 1));

    if (keywordMatches > 0 && (pdfLinks > 0 || hasRecent)) {
      return {
        checkId: "auto_financial_reports",
        name: "Financial Reports",
        layer: "Exchange",
        passed: true,
        confidence: "high",
        evidence: `Financial reports page with ${pdfLinks} PDF links and ${keywordMatches} report types at ${new URL(reportsPage.url).pathname}`,
        details: "Financial reports section found with downloadable reports.",
        weight: 7,
        risk: "High",
        automatable: true,
      };
    }

    return {
      checkId: "auto_financial_reports",
      name: "Financial Reports",
      layer: "Exchange",
      passed: "partial",
      confidence: "medium",
      evidence: `Reports section exists at ${new URL(reportsPage.url).pathname} but limited content detected`,
      details: "Reports section found but may lack recent or complete reports.",
      weight: 7,
      risk: "High",
      automatable: true,
    };
  }

  // Check for report keywords across all pages
  const fullText = allPagesText(siteMap);
  const anyMatches = reportKeywords.filter((k) => k.test(fullText)).length;
  if (anyMatches > 2 && siteMap.pdfLinks.length > 0) {
    return {
      checkId: "auto_financial_reports",
      name: "Financial Reports",
      layer: "Exchange",
      passed: "partial",
      confidence: "low",
      evidence: `Report-related content found across the site with ${siteMap.pdfLinks.length} PDF links, but no dedicated reports page`,
      details: "Some financial report content exists but not in a dedicated section.",
      weight: 7,
      risk: "High",
      automatable: true,
    };
  }

  return {
    checkId: "auto_financial_reports",
    name: "Financial Reports",
    layer: "Exchange",
    passed: false,
    confidence: "high",
    evidence: "No financial reports section found",
    details: "Listed companies must publish interim and annual reports.",
    weight: 7,
    risk: "High",
    automatable: true,
  };
}

// ─── CHECK 12: Page Performance & Mobile ─────────────────────────────────────

function checkPerformance(siteMap: SiteMap): DetectionResult {
  const $ = cheerio.load(siteMap.homepage.html);
  const ttfb = siteMap.homepage.ttfb || 0;

  // Viewport meta tag
  const hasViewport = $("meta[name=viewport]").length > 0;

  // SSL (we can only check if the URL is https)
  const hasSSL = siteMap.homepage.url.startsWith("https");

  // Responsive indicators
  const htmlContent = siteMap.homepage.html.toLowerCase();
  const hasResponsive =
    htmlContent.includes("@media") ||
    htmlContent.includes("flex") ||
    htmlContent.includes("grid") ||
    hasViewport;

  const issues: string[] = [];
  const passes: string[] = [];

  if (ttfb > 0 && ttfb < 3000) passes.push(`loads in ${(ttfb / 1000).toFixed(1)}s`);
  else if (ttfb >= 3000) issues.push(`slow loading (${(ttfb / 1000).toFixed(1)}s)`);

  if (hasViewport) passes.push("has viewport meta tag");
  else issues.push("no viewport meta tag");

  if (hasSSL) passes.push("valid SSL");
  else issues.push("no SSL");

  if (issues.length === 0) {
    return {
      checkId: "auto_performance",
      name: "Page Performance & Mobile",
      layer: "Best Practice",
      passed: true,
      confidence: "medium",
      evidence: `Site ${passes.join(", ")}`,
      details: "Good performance and mobile readiness indicators.",
      weight: 3,
      risk: "Low",
      automatable: true,
    };
  }

  if (passes.length >= issues.length) {
    return {
      checkId: "auto_performance",
      name: "Page Performance & Mobile",
      layer: "Best Practice",
      passed: "partial",
      confidence: "medium",
      evidence: `${passes.join(", ")}, but ${issues.join(", ")}`,
      details: "Some performance or mobile issues detected.",
      weight: 3,
      risk: "Low",
      automatable: true,
    };
  }

  return {
    checkId: "auto_performance",
    name: "Page Performance & Mobile",
    layer: "Best Practice",
    passed: false,
    confidence: "low",
    evidence: `Issues: ${issues.join(", ")}`,
    details: "Significant performance or mobile readiness issues detected.",
    weight: 3,
    risk: "Low",
    automatable: true,
  };
}

// ─── CHECK 13: Largest Shareholders ──────────────────────────────────────────

function checkShareholders(siteMap: SiteMap): DetectionResult {
  const shareUrl = siteMap.discoveredSections.shareInfo;
  const govUrl = siteMap.discoveredSections.governance;
  const pagesToCheck = [
    getPageByUrl(siteMap, shareUrl),
    getPageByUrl(siteMap, govUrl),
    ...siteMap.pages,
  ].filter((p): p is CrawlResult => p !== null);

  const shareholderKeywords = [
    /största\s*ägare/i, /largest\s*shareholders/i, /ägarförteckning/i,
    /ownership\s*structure/i, /aktieägare/i, /shareholders/i,
    /top\s*shareholders/i, /major\s*shareholders/i,
    /aksjonær/i, /eierstruktur/i,
  ];

  for (const page of pagesToCheck) {
    const hasKeywords = shareholderKeywords.some((k) => k.test(page.text));

    if (hasKeywords) {
      // Check for tabular data
      const $ = cheerio.load(page.html);
      const hasTables = $("table").length > 0;
      // Check for percentage signs (indicator of ownership data)
      const hasPercentages = /%/.test(page.text);

      if (hasTables || hasPercentages) {
        return {
          checkId: "auto_shareholders",
          name: "Largest Shareholders",
          layer: "Best Practice",
          passed: true,
          confidence: "medium",
          evidence: `Shareholder information found at ${new URL(page.url).pathname}${hasTables ? " with tabular data" : ""}`,
          details: "Largest shareholders / ownership structure information detected.",
          weight: 5,
          risk: "Medium",
          automatable: true,
        };
      }

      return {
        checkId: "auto_shareholders",
        name: "Largest Shareholders",
        layer: "Best Practice",
        passed: "partial",
        confidence: "low",
        evidence: `Shareholder-related text found at ${new URL(page.url).pathname} but no structured data`,
        details: "Some shareholder references found but may lack detailed ownership data.",
        weight: 5,
        risk: "Medium",
        automatable: true,
      };
    }
  }

  return {
    checkId: "auto_shareholders",
    name: "Largest Shareholders",
    layer: "Best Practice",
    passed: false,
    confidence: "medium",
    evidence: "No shareholder information found",
    details: "Best practice is to publish a list of largest shareholders.",
    weight: 5,
    risk: "Medium",
    automatable: true,
  };
}

// ─── Run All Checks ──────────────────────────────────────────────────────────

export function runAllDetectionRules(siteMap: SiteMap): DetectionResult[] {
  return [
    checkPressArchive(siteMap),
    checkArchiveDepth(siteMap),
    checkMARClassification(siteMap),
    checkFinancialCalendar(siteMap),
    checkBilingual(siteMap),
    checkShareInfo(siteMap),
    checkGovernance(siteMap),
    checkInsiderTransactions(siteMap),
    checkSubscription(siteMap),
    checkIRContact(siteMap),
    checkFinancialReports(siteMap),
    checkPerformance(siteMap),
    checkShareholders(siteMap),
  ];
}
