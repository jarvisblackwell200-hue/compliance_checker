# IR Compliance Scanner — Claude Code Implementation Spec

## Overview

Build a hybrid IR compliance scanner that:
1. Accepts a company IR website URL
2. Automatically crawls and analyzes the site for detectable compliance indicators
3. Presents automated findings + remaining self-assessment questions
4. Generates a scored report with letter grade and prioritized action list
5. Ends with a CTA to book an IRPages demo

This is a lead-gen tool for IRPages. The goal is to create urgency by showing Nordic growth companies how many compliance gaps their current IR site has.

## Tech Stack

- **Next.js** (matches existing IRPages codebase)
- **Route**: `/compliance-scanner` (SV: `/sv/compliance-scanner`, EN: `/en/compliance-scanner`)
- **Server actions** for the crawling/analysis (no separate backend needed)
- **Cheerio** for HTML parsing (server-side)
- **React** for the interactive UI

## Architecture

```
User enters URL
      ↓
Server action: crawlIRSite(url)
      ↓
Fetch homepage + discover subpages (max 50 pages, 30s timeout)
      ↓
Run detection rules against page content
      ↓
Return automated findings
      ↓
Client shows: automated results + self-assessment questions
      ↓
User completes self-assessment
      ↓
Generate final score + report
      ↓
CTA: Book demo / Download PDF report (email gate)
```

## Page Discovery Logic

The crawler needs to find IR-relevant subpages. Don't crawl the entire corporate site — focus on IR sections.

```typescript
// server/crawl.ts

interface CrawlResult {
  url: string;
  title: string;
  html: string;
  text: string;
  lang: string | null;
  links: string[];
  statusCode: number;
}

interface SiteMap {
  homepage: CrawlResult;
  pages: CrawlResult[];
  discoveredSections: {
    pressReleases: string | null;    // URL of press release listing page
    financialReports: string | null;
    financialCalendar: string | null;
    shareInfo: string | null;
    governance: string | null;
    insiderTransactions: string | null;
    subscription: string | null;
    contact: string | null;
    archive: string | null;
  };
}
```

### Discovery heuristics

From the homepage, extract all internal links and classify them by matching URL patterns and link text against known IR section patterns:

```typescript
const SECTION_PATTERNS = {
  pressReleases: {
    urlPatterns: [
      /press/, /nyheter/, /news/, /pressmeddelande/, /releases/,
      /regulatory/, /regulatoriska/, /announcements/
    ],
    linkTextPatterns: [
      /press\s*(releases|meddelanden)/i, /nyheter/i, /news/i,
      /regulatory/i, /regulatorisk/i, /announcements/i
    ]
  },
  financialReports: {
    urlPatterns: [
      /reports?/, /rapporter/, /financial/, /finansiell/,
      /annual/, /arsredovisning/, /quarterly/, /kvartals/
    ],
    linkTextPatterns: [
      /financial\s*reports?/i, /rapporter/i, /annual\s*report/i,
      /årsredovisning/i, /interim/i, /delårsrapport/i
    ]
  },
  financialCalendar: {
    urlPatterns: [
      /calendar/, /kalender/, /events/, /upcoming/
    ],
    linkTextPatterns: [
      /financial\s*calendar/i, /finansiell\s*kalender/i,
      /calendar/i, /kalender/i, /events/i
    ]
  },
  shareInfo: {
    urlPatterns: [
      /share/, /aktie/, /stock/, /kurs/, /shareholders/,
      /aktieägare/, /ownership/
    ],
    linkTextPatterns: [
      /share/i, /aktie/i, /stock/i, /kurs/i, /shareholders/i,
      /aktieägare/i, /ägare/i
    ]
  },
  governance: {
    urlPatterns: [
      /governance/, /bolagsstyrning/, /board/, /styrelse/,
      /management/, /ledning/
    ],
    linkTextPatterns: [
      /governance/i, /bolagsstyrning/i, /board/i, /styrelse/i,
      /management/i, /ledning/i
    ]
  },
  insiderTransactions: {
    urlPatterns: [
      /insider/, /insyn/, /pdmr/, /insyns/
    ],
    linkTextPatterns: [
      /insider/i, /insyn/i, /pdmr/i, /insynstransaktioner/i,
      /insider\s*transactions?/i
    ]
  },
  subscription: {
    urlPatterns: [
      /subscribe/, /prenumer/, /alert/, /notification/
    ],
    linkTextPatterns: [
      /subscribe/i, /prenumer/i, /alerts?/i, /notifications?/i,
      /sign\s*up/i, /email/i
    ]
  },
  contact: {
    urlPatterns: [
      /contact/, /kontakt/, /ir-contact/, /investor.*contact/
    ],
    linkTextPatterns: [
      /ir\s*contact/i, /investor.*contact/i, /kontakt/i, /contact/i
    ]
  }
};
```

### Crawl limits

- Max 50 pages fetched per scan
- 30 second total timeout
- Respect robots.txt (fetch and parse it first)
- 500ms delay between requests (be polite)
- Only follow links within the same domain
- Skip non-HTML resources (PDFs, images, etc.) but note their existence

---

## Detection Rules

Each rule returns a `DetectionResult`:

```typescript
interface DetectionResult {
  checkId: string;
  passed: boolean;
  confidence: 'high' | 'medium' | 'low';
  evidence: string;         // What was found or not found
  details: string;          // Human-readable explanation
  automatable: true;        // This check was automated
}
```

### CHECK 1: Press Release Archive Exists
```
ID: auto_press_archive
Layer: MAR
Weight: 10
Risk: Critical

Detection:
- discoveredSections.pressReleases is not null
- Page contains multiple links with dates (regex: /\d{4}-\d{2}-\d{2}/ or Swedish date formats)
- Count distinct press releases found

Evidence examples:
- PASS: "Found press release page at /nyheter with 47 releases"
- FAIL: "No press release section detected on the site"
```

### CHECK 2: Archive Depth (5-Year Retention)
```
ID: auto_archive_depth
Layer: MAR
Weight: 9
Risk: Critical

Detection:
- From the press release listing page, find the oldest visible date
- Parse all dates found on the page
- Calculate: does the archive go back at least 5 years from today?
- Also check for pagination/archive links that might contain older content

Evidence examples:
- PASS: "Archive dates back to 2019-03-15 (6.9 years). Meets 5-year requirement."
- PARTIAL: "Oldest visible release is 2022-06-01 (3.7 years). May have deeper archive behind pagination."
- FAIL: "Oldest release found is 2024-01-15 (1.1 years). Does not meet 5-year requirement."
```

### CHECK 3: MAR Classification Visible
```
ID: auto_mar_classification
Layer: MAR
Weight: 8
Risk: High

Detection:
- On press release listing/detail pages, look for MAR indicators:
  - Text containing: "MAR", "insiderinformation", "inside information",
    "regulatorisk", "regulatory", "artikel 17", "article 17"
  - Tags/badges/labels distinguishing regulatory from non-regulatory
  - Filtered views (e.g., "Visa regulatoriska" / "Show regulatory")

Evidence examples:
- PASS: "Press releases tagged with 'Regulatory' / 'Non-regulatory' labels"
- FAIL: "No MAR classification visible on press releases"
```

### CHECK 4: Financial Calendar Exists
```
ID: auto_financial_calendar
Layer: Exchange
Weight: 7
Risk: High

Detection:
- discoveredSections.financialCalendar is not null
- Page contains future dates with event descriptions
- Look for keywords: "delårsrapport", "årsstämma", "AGM",
  "interim report", "annual report", "Q1", "Q2", "Q3", "Q4"

Evidence examples:
- PASS: "Financial calendar found at /kalender with 5 upcoming events"
- FAIL: "No financial calendar page detected"
```

### CHECK 5: Bilingual Content (SV + EN)
```
ID: auto_bilingual
Layer: Exchange
Weight: 8
Risk: High

Detection:
- Check for language switcher elements:
  - Links/buttons with text "EN", "SV", "English", "Svenska"
  - hreflang tags in <head>
  - /en/ or /sv/ URL patterns in navigation
  - lang attribute on <html> tag
- Verify both languages actually have content (not just empty shells):
  - Fetch the English equivalent of a Swedish page (or vice versa)
  - Check that it has substantial content (not just navigation)

Evidence examples:
- PASS: "Site available in Swedish (/sv/) and English (/en/) with hreflang tags"
- PARTIAL: "Language switcher found but English pages appear to have limited content"
- FAIL: "Site only available in one language"
```

### CHECK 6: Share/Stock Information Page
```
ID: auto_share_info
Layer: Exchange
Weight: 5
Risk: Medium

Detection:
- discoveredSections.shareInfo is not null
- Page contains stock-related elements:
  - Chart/iframe (Millistream, Infront, TradingView embeds)
  - Price data, ticker symbol, ISIN code
  - Keywords: "aktiekurs", "stock price", "ISIN", ticker patterns (e.g., "PLEJD")

Evidence examples:
- PASS: "Share information page found with stock chart and ISIN SE0009806607"
- PARTIAL: "Share page exists but no interactive chart detected"
- FAIL: "No share information page found"
```

### CHECK 7: Board & Management Page
```
ID: auto_governance
Layer: Exchange
Weight: 5
Risk: Medium

Detection:
- discoveredSections.governance is not null
- Page contains person-related content:
  - Multiple names with titles (CEO, CFO, VD, styrelseordförande, board member)
  - Structured list/grid of people with roles
  - Keywords: "styrelse", "board", "ledning", "management"

Evidence examples:
- PASS: "Corporate governance page with 6 board members and 4 management team members"
- PARTIAL: "Management page found but no board of directors section"
- FAIL: "No governance or management information found"
```

### CHECK 8: Insider Transaction Log
```
ID: auto_insider_transactions
Layer: Best Practice
Weight: 5
Risk: Medium

Detection:
- discoveredSections.insiderTransactions is not null
- Page contains transaction-related data:
  - Table with columns matching: name, position, date, volume, price
  - Keywords: "insynstransaktioner", "insider transactions", "PDMR"

Evidence examples:
- PASS: "Insider transactions page found with 12 logged transactions"
- FAIL: "No insider transaction log found on the site"
```

### CHECK 9: Subscription/Alert Service
```
ID: auto_subscription
Layer: Best Practice
Weight: 4
Risk: Low

Detection:
- discoveredSections.subscription is not null OR
- Any page contains email subscription form:
  - <form> with email input + submit related to press releases
  - Keywords near form: "prenumerera", "subscribe", "alerts", "notifications"
  - GDPR consent checkbox present

Evidence examples:
- PASS: "Email subscription form found with GDPR consent checkbox"
- PARTIAL: "Subscription form found but no visible GDPR consent mechanism"
- FAIL: "No press release subscription service found"
```

### CHECK 10: IR Contact Information
```
ID: auto_ir_contact
Layer: Best Practice
Weight: 5
Risk: Medium

Detection:
- Look across all crawled pages for IR-specific contact info:
  - Email addresses near "IR", "investor relations", "investerarrelationer"
  - Phone numbers near same keywords
  - Dedicated contact section/page
  - Named IR contact person (not just generic info@)

Evidence examples:
- PASS: "Named IR contact found: 'Erik Hallberg, IR Manager, erik@company.se, +46 XX XXX XX XX'"
- PARTIAL: "Generic contact email found (info@company.se) but no dedicated IR contact"
- FAIL: "No IR contact information found"
```

### CHECK 11: Financial Reports Available
```
ID: auto_financial_reports
Layer: Exchange
Weight: 7
Risk: High

Detection:
- discoveredSections.financialReports is not null
- Page contains PDF links to reports:
  - Links to .pdf files with report-related names
  - Keywords: "årsredovisning", "annual report", "delårsrapport",
    "interim report", "Q1", "Q2", "kvartalsrapport"
- Check for recent reports (current or previous year)

Evidence examples:
- PASS: "Financial reports page with 8 reports including Annual Report 2024"
- PARTIAL: "Reports section exists but most recent report is from 2023"
- FAIL: "No financial reports section found"
```

### CHECK 12: Page Performance & Mobile
```
ID: auto_performance
Layer: Best Practice
Weight: 3
Risk: Low

Detection:
- Measure time-to-first-byte (TTFB) from the crawl
- Check for viewport meta tag (mobile responsiveness indicator)
- Check for responsive CSS indicators (media queries, flex/grid usage)
- SSL certificate valid

Evidence examples:
- PASS: "Site loads in 1.2s, has viewport meta tag, and valid SSL"
- PARTIAL: "Site loads in 4.8s (slow), but has mobile viewport"
- FAIL: "Site loads in 8.2s, no viewport meta tag, poor mobile experience"
```

### CHECK 13: Largest Shareholders
```
ID: auto_shareholders
Layer: Best Practice
Weight: 5
Risk: Medium

Detection:
- On shareInfo page or governance page, look for:
  - Table with shareholder names + percentage/number of shares
  - Keywords: "största ägare", "largest shareholders", "ägarförteckning",
    "ownership structure", "aktieägare"

Evidence examples:
- PASS: "Top shareholders table found with 10 entries"
- FAIL: "No shareholder information found"
```

---

## Self-Assessment Questions (Non-Automatable)

After the automated scan completes, present these remaining questions. Group them by layer.

```typescript
interface SelfAssessmentQuestion {
  checkId: string;
  layer: 'MAR' | 'Exchange' | 'Best Practice';
  question: string;
  helpText: string;
  weight: number;
  risk: 'Critical' | 'High' | 'Medium' | 'Low';
  options: {
    label: string;
    score: number;  // 0 = no, 0.5 = partial, 1 = yes
  }[];
}

const SELF_ASSESSMENT_QUESTIONS: SelfAssessmentQuestion[] = [
  {
    checkId: "self_news_agency",
    layer: "MAR",
    question: "Do you distribute MAR press releases via an approved news agency BEFORE publishing on your website?",
    helpText: "MAR requires inside information to be disseminated via a media mechanism ensuring EU-wide reach (e.g., Cision, GlobeNewswire, MFN) before or simultaneously with website publication.",
    weight: 10,
    risk: "Critical",
    options: [
      { label: "Yes — always via approved agency first", score: 1 },
      { label: "Sometimes — depends on who publishes", score: 0.3 },
      { label: "No — we publish on website first", score: 0 },
      { label: "Not sure", score: 0 }
    ]
  },
  {
    checkId: "self_classification_process",
    layer: "MAR",
    question: "Do you have a documented process for classifying information as inside information?",
    helpText: "Before publishing any material news, someone must assess whether it constitutes inside information under MAR Art. 7. This decision should be documented.",
    weight: 8,
    risk: "Critical",
    options: [
      { label: "Yes — documented process with audit trail", score: 1 },
      { label: "Informal — CEO/CFO decides case by case", score: 0.4 },
      { label: "No formal process", score: 0 },
      { label: "Not sure", score: 0 }
    ]
  },
  {
    checkId: "self_delay_mechanism",
    layer: "MAR",
    question: "If you delay disclosure of inside information, do you document the delay decision per Art. 17(4)?",
    helpText: "Delayed disclosure requires: documented reason, confirmation that the 3 conditions are met, ongoing monitoring, and notification to FI upon eventual publication.",
    weight: 7,
    risk: "High",
    options: [
      { label: "Yes — full documentation and FI notification", score: 1 },
      { label: "Partially — we document but may miss FI notification", score: 0.5 },
      { label: "No formal delay process", score: 0 },
      { label: "We have never delayed disclosure", score: 0.7 }
    ]
  },
  {
    checkId: "self_insider_lists",
    layer: "MAR",
    question: "Do you maintain insider lists per Art. 18 and could produce them for FI within 24 hours?",
    helpText: "Permanent insider list + deal-specific lists when applicable. Must follow ITS format (EU 2016/347). FI can request them at any time.",
    weight: 8,
    risk: "Critical",
    options: [
      { label: "Yes — digital system, ITS-compliant format", score: 1 },
      { label: "Yes — but in Excel/manual format", score: 0.6 },
      { label: "Partially — we have lists but not sure about ITS format", score: 0.3 },
      { label: "No", score: 0 }
    ]
  },
  {
    checkId: "self_closed_periods",
    layer: "MAR",
    question: "Do you actively enforce closed period trading prohibitions for PDMRs?",
    helpText: "PDMRs may not trade during the 30 calendar days before interim or year-end report announcements. The company must notify PDMRs of these periods.",
    weight: 8,
    risk: "Critical",
    options: [
      { label: "Yes — PDMRs notified in advance, compliance tracked", score: 1 },
      { label: "Informally — we remind people but don't formally track", score: 0.4 },
      { label: "No active enforcement", score: 0 },
      { label: "Not sure", score: 0 }
    ]
  },
  {
    checkId: "self_pdmr_reporting",
    layer: "MAR",
    question: "Are PDMR transactions reported to FI within the required 3 business days?",
    helpText: "Both the PDMR and the company must notify FI of transactions exceeding €5,000/year. The company must also publish the notification.",
    weight: 7,
    risk: "High",
    options: [
      { label: "Yes — always within 3 days", score: 1 },
      { label: "Usually — but sometimes delayed", score: 0.4 },
      { label: "The PDMRs handle this themselves", score: 0.3 },
      { label: "Not sure", score: 0 }
    ]
  },
  {
    checkId: "self_archive_immutable",
    layer: "MAR",
    question: "Can published MAR press releases be edited or deleted on your website?",
    helpText: "MAR requires that published inside information remains available and unaltered for 5 years. If your CMS allows editing published MAR releases, this is a compliance risk.",
    weight: 9,
    risk: "Critical",
    options: [
      { label: "No — locked after publication, corrections published separately", score: 1 },
      { label: "Technically possible but we have a policy against it", score: 0.5 },
      { label: "Yes — anyone with CMS access can edit", score: 0 },
      { label: "Not sure", score: 0 }
    ]
  },
  {
    checkId: "self_bilingual_process",
    layer: "Exchange",
    question: "Are MAR press releases published simultaneously in Swedish and English?",
    helpText: "Spotlight requires bilingual publication. First North requires the language specified in listing agreement (typically both SV and EN for companies with international investors).",
    weight: 6,
    risk: "High",
    options: [
      { label: "Yes — both languages published simultaneously", score: 1 },
      { label: "Yes — but English version sometimes delayed by hours", score: 0.5 },
      { label: "Only one language", score: 0 },
      { label: "Not applicable (exchange doesn't require it)", score: 0.8 }
    ]
  },
  {
    checkId: "self_certified_adviser",
    layer: "Exchange",
    question: "Is your Certified Adviser / Mentor relationship disclosed on your IR site?",
    helpText: "First North companies must have a Certified Adviser and disclose the relationship. Spotlight companies must disclose their Mentor if applicable.",
    weight: 4,
    risk: "Medium",
    options: [
      { label: "Yes — clearly stated on the site", score: 1 },
      { label: "Mentioned somewhere but not prominently", score: 0.5 },
      { label: "No", score: 0 },
      { label: "Not applicable (not on First North/Spotlight)", score: 0.8 }
    ]
  },
  {
    checkId: "self_gdpr_subscription",
    layer: "Best Practice",
    question: "If you have an email subscription service, does it use double opt-in with GDPR consent?",
    helpText: "Investor email subscriptions must comply with GDPR: double opt-in, clear consent language, easy unsubscribe, and consent logging.",
    weight: 4,
    risk: "Medium",
    options: [
      { label: "Yes — double opt-in with consent tracking", score: 1 },
      { label: "Single opt-in only", score: 0.4 },
      { label: "No subscription service", score: 0 },
      { label: "Not sure about the technical setup", score: 0.2 }
    ]
  },
  {
    checkId: "self_data_hosting",
    layer: "Best Practice",
    question: "Is your IR website hosted within the EU/EEA?",
    helpText: "While not strictly required, EU data hosting reduces GDPR complexity and signals data sovereignty to investors. Relevant if processing investor subscription data.",
    weight: 3,
    risk: "Low",
    options: [
      { label: "Yes — EU/EEA hosting", score: 1 },
      { label: "Not sure", score: 0.3 },
      { label: "No — hosted outside EU", score: 0 }
    ]
  }
];
```

---

## Scoring Model

```typescript
interface ScoringResult {
  overallScore: number;            // 0-100
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  layerScores: {
    mar: { score: number; grade: string; passed: number; total: number };
    exchange: { score: number; grade: string; passed: number; total: number };
    bestPractice: { score: number; grade: string; passed: number; total: number };
  };
  automatedFindings: DetectionResult[];
  selfAssessmentResults: SelfAssessmentResult[];
  criticalIssues: Issue[];         // Sorted by risk, weight
  recommendations: Recommendation[];
}

// Grading scale
// A: 90-100 — Excellent
// B: 75-89  — Good
// C: 55-74  — Needs Work
// D: 35-54  — At Risk
// F: 0-34   — Critical

// Score calculation:
// Each check has a weight (3-10).
// Automated checks: passed = full weight, partial = 50% weight, failed = 0
// Self-assessment: score multiplied by weight
// Layer score = (earned weight / total weight) * 100
// Overall score = weighted average of layers:
//   MAR: 50% weight (it's the legal baseline)
//   Exchange: 30% weight
//   Best Practice: 20% weight
```

---

## UI Flow

### Screen 1: Landing
```
[Hero section]
"How compliant is your IR website?"
"Free compliance scan for companies on Spotlight, First North & Euronext Growth"

[URL input field]  [Select exchange dropdown]  [Scan Now button]

[Trust badges: "Checks 24 compliance points" | "Based on MAR EU 596/2014" | "Takes 5 minutes"]
```

### Screen 2: Scanning (loading state)
```
"Scanning [company-name].se..."

[Animated progress showing each check being run]
✅ Press release archive found
✅ Bilingual content detected (SV + EN)
⏳ Checking financial calendar...
❌ No insider transaction log found
...

[Progress bar: 8/13 automated checks complete]
```

Show each check result in real-time as they complete (stream results via server-sent events or poll). This creates anticipation and demonstrates thoroughness.

### Screen 3: Automated Results + Self-Assessment
```
[Automated scan results — show what was found/not found with evidence]

"We found 5 issues automatically. Now answer 11 quick questions
about your internal processes to get your full score."

[Self-assessment questions — one at a time or grouped by layer]
[Progress: 3/11 questions answered]

[Get Full Report button]
```

### Screen 4: Results Dashboard
```
[Overall grade: big letter + ring chart]
[Three layer cards with individual scores]
[Priority actions list — critical items first]
[Full checklist with pass/fail/partial for all 24 items]
[CTA section: "Close these gaps with IRPages" + Book Demo button]

[Optional: Download PDF Report — email-gated for lead capture]
```

---

## Report PDF Generation (Email-gated)

When the user clicks "Download Report", show an email capture form. Then generate a branded PDF containing:

1. Company name, exchange, scan date
2. Overall grade + layer breakdown
3. Full checklist with all findings and evidence
4. Regulatory references for each failed item
5. "How IRPages solves this" column mapping each gap to an IRPages feature
6. CTA page with pricing and demo booking link

This PDF becomes a sales asset that the IR manager can share with their CFO or board.

---

## Data Model (if persisting results)

```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  company_name TEXT,
  url TEXT NOT NULL,
  exchange TEXT,
  email TEXT,                    -- Captured at PDF download
  overall_score INTEGER,
  overall_grade TEXT,
  mar_score INTEGER,
  exchange_score INTEGER,
  best_practice_score INTEGER,
  automated_results JSONB,
  self_assessment_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This gives you a pipeline of scored leads with their specific compliance gaps — incredibly valuable for sales outreach. You know exactly which pain points to lead with for each prospect.

---

## Edge Cases & Error Handling

- **Site blocks crawling**: If robots.txt disallows or the site returns 403, show a message: "We couldn't scan this site automatically. You can still complete the self-assessment manually." Fall back to full self-assessment mode.
- **Non-IR URL**: If the URL doesn't appear to be an IR site (no financial/press content detected), suggest: "This doesn't appear to be an IR website. Please enter the URL of your investor relations section."
- **Timeout**: If crawling takes > 30s, return partial results and continue with what was found.
- **Rate limiting**: One scan per URL per 24 hours (use URL hash + date as cache key). Show cached results if re-scanned within window.
- **International sites**: Focus on Swedish/English content. If site is Norwegian, detection rules should also match Norwegian terms (e.g., "børsmeldinger" for press releases, "finansiell kalender", "aksjonærer").

---

## Norwegian Language Additions

For Euronext Growth Oslo companies, add these detection patterns:

```typescript
const NORWEGIAN_PATTERNS = {
  pressReleases: [/børsmelding/, /pressemelding/, /nyheter/, /meldinger/],
  financialReports: [/årsrapport/, /kvartalsrapport/, /delårsrapport/],
  financialCalendar: [/finansiell kalender/, /hendelser/],
  shareInfo: [/aksje/, /aksjekurs/, /aksjonær/],
  governance: [/styret/, /ledelse/, /selskapsstyring/],
  insiderTransactions: [/innsidehandel/, /meldepliktige/, /primærinnsider/],
};
```

---

## SEO & Lead Gen Pages

Create supporting content pages that drive traffic to the scanner:

- `/mar-compliance-checklist` — Static version of the checklist (indexable by Google)
- `/spotlight-ir-requirements` — Exchange-specific guide for Spotlight-listed companies
- `/first-north-ir-requirements` — Exchange-specific guide for First North companies
- `/euronext-growth-ir-requirements` — Guide for Euronext Growth Oslo

Each page should end with a CTA to run the scanner.

---

## Implementation Priority

1. **Phase 1**: Automated crawler + 13 detection rules + results display
2. **Phase 2**: Self-assessment questions + combined scoring
3. **Phase 3**: PDF report generation (email-gated)
4. **Phase 4**: Persist results to database + sales dashboard
5. **Phase 5**: SEO content pages

Start with Phase 1 — the automated scan alone is impressive enough to demo and creates immediate urgency.
