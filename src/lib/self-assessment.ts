import type { SelfAssessmentQuestion } from "@/types";

export const SELF_ASSESSMENT_QUESTIONS: SelfAssessmentQuestion[] = [
  {
    checkId: "self_news_agency",
    layer: "MAR",
    question:
      "Do you distribute MAR press releases via an approved news agency BEFORE publishing on your website?",
    helpText:
      "MAR requires inside information to be disseminated via a media mechanism ensuring EU-wide reach (e.g., Cision, GlobeNewswire, MFN) before or simultaneously with website publication.",
    weight: 10,
    risk: "Critical",
    options: [
      { label: "Yes — always via approved agency first", score: 1 },
      { label: "Sometimes — depends on who publishes", score: 0.3 },
      { label: "No — we publish on website first", score: 0 },
      { label: "Not sure", score: 0 },
    ],
  },
  {
    checkId: "self_classification_process",
    layer: "MAR",
    question:
      "Do you have a documented process for classifying information as inside information?",
    helpText:
      "Before publishing any material news, someone must assess whether it constitutes inside information under MAR Art. 7. This decision should be documented.",
    weight: 8,
    risk: "Critical",
    options: [
      { label: "Yes — documented process with audit trail", score: 1 },
      { label: "Informal — CEO/CFO decides case by case", score: 0.4 },
      { label: "No formal process", score: 0 },
      { label: "Not sure", score: 0 },
    ],
  },
  {
    checkId: "self_delay_mechanism",
    layer: "MAR",
    question:
      "If you delay disclosure of inside information, do you document the delay decision per Art. 17(4)?",
    helpText:
      "Delayed disclosure requires: documented reason, confirmation that the 3 conditions are met, ongoing monitoring, and notification to FI upon eventual publication.",
    weight: 7,
    risk: "High",
    options: [
      { label: "Yes — full documentation and FI notification", score: 1 },
      {
        label: "Partially — we document but may miss FI notification",
        score: 0.5,
      },
      { label: "No formal delay process", score: 0 },
      { label: "We have never delayed disclosure", score: 0.7 },
    ],
  },
  {
    checkId: "self_insider_lists",
    layer: "MAR",
    question:
      "Do you maintain insider lists per Art. 18 and could produce them for FI within 24 hours?",
    helpText:
      "Permanent insider list + deal-specific lists when applicable. Must follow ITS format (EU 2016/347). FI can request them at any time.",
    weight: 8,
    risk: "Critical",
    options: [
      { label: "Yes — digital system, ITS-compliant format", score: 1 },
      { label: "Yes — but in Excel/manual format", score: 0.6 },
      {
        label: "Partially — we have lists but not sure about ITS format",
        score: 0.3,
      },
      { label: "No", score: 0 },
    ],
  },
  {
    checkId: "self_closed_periods",
    layer: "MAR",
    question:
      "Do you actively enforce closed period trading prohibitions for PDMRs?",
    helpText:
      "PDMRs may not trade during the 30 calendar days before interim or year-end report announcements. The company must notify PDMRs of these periods.",
    weight: 8,
    risk: "Critical",
    options: [
      {
        label: "Yes — PDMRs notified in advance, compliance tracked",
        score: 1,
      },
      {
        label: "Informally — we remind people but don't formally track",
        score: 0.4,
      },
      { label: "No active enforcement", score: 0 },
      { label: "Not sure", score: 0 },
    ],
  },
  {
    checkId: "self_pdmr_reporting",
    layer: "MAR",
    question:
      "Are PDMR transactions reported to FI within the required 3 business days?",
    helpText:
      "Both the PDMR and the company must notify FI of transactions exceeding €5,000/year. The company must also publish the notification.",
    weight: 7,
    risk: "High",
    options: [
      { label: "Yes — always within 3 days", score: 1 },
      { label: "Usually — but sometimes delayed", score: 0.4 },
      { label: "The PDMRs handle this themselves", score: 0.3 },
      { label: "Not sure", score: 0 },
    ],
  },
  {
    checkId: "self_archive_immutable",
    layer: "MAR",
    question:
      "Can published MAR press releases be edited or deleted on your website?",
    helpText:
      "MAR requires that published inside information remains available and unaltered for 5 years. If your CMS allows editing published MAR releases, this is a compliance risk.",
    weight: 9,
    risk: "Critical",
    options: [
      {
        label: "No — locked after publication, corrections published separately",
        score: 1,
      },
      {
        label: "Technically possible but we have a policy against it",
        score: 0.5,
      },
      { label: "Yes — anyone with CMS access can edit", score: 0 },
      { label: "Not sure", score: 0 },
    ],
  },
  {
    checkId: "self_bilingual_process",
    layer: "Exchange",
    question:
      "Are MAR press releases published simultaneously in Swedish and English?",
    helpText:
      "Spotlight requires bilingual publication. First North requires the language specified in listing agreement (typically both SV and EN for companies with international investors).",
    weight: 6,
    risk: "High",
    options: [
      { label: "Yes — both languages published simultaneously", score: 1 },
      {
        label: "Yes — but English version sometimes delayed by hours",
        score: 0.5,
      },
      { label: "Only one language", score: 0 },
      { label: "Not applicable (exchange doesn't require it)", score: 0.8 },
    ],
  },
  {
    checkId: "self_certified_adviser",
    layer: "Exchange",
    question:
      "Is your Certified Adviser / Mentor relationship disclosed on your IR site?",
    helpText:
      "First North companies must have a Certified Adviser and disclose the relationship. Spotlight companies must disclose their Mentor if applicable.",
    weight: 4,
    risk: "Medium",
    options: [
      { label: "Yes — clearly stated on the site", score: 1 },
      { label: "Mentioned somewhere but not prominently", score: 0.5 },
      { label: "No", score: 0 },
      { label: "Not applicable (not on First North/Spotlight)", score: 0.8 },
    ],
  },
  {
    checkId: "self_gdpr_subscription",
    layer: "Best Practice",
    question:
      "If you have an email subscription service, does it use double opt-in with GDPR consent?",
    helpText:
      "Investor email subscriptions must comply with GDPR: double opt-in, clear consent language, easy unsubscribe, and consent logging.",
    weight: 4,
    risk: "Medium",
    options: [
      { label: "Yes — double opt-in with consent tracking", score: 1 },
      { label: "Single opt-in only", score: 0.4 },
      { label: "No subscription service", score: 0 },
      { label: "Not sure about the technical setup", score: 0.2 },
    ],
  },
  {
    checkId: "self_data_hosting",
    layer: "Best Practice",
    question: "Is your IR website hosted within the EU/EEA?",
    helpText:
      "While not strictly required, EU data hosting reduces GDPR complexity and signals data sovereignty to investors. Relevant if processing investor subscription data.",
    weight: 3,
    risk: "Low",
    options: [
      { label: "Yes — EU/EEA hosting", score: 1 },
      { label: "Not sure", score: 0.3 },
      { label: "No — hosted outside EU", score: 0 },
    ],
  },
];
