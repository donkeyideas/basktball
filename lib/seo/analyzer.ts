import type { ParsedPage } from "./types";
import {
  CTA_KEYWORDS, TRUST_KEYWORDS, SOCIAL_PROOF_KEYWORDS,
  VALUE_PROP_KEYWORDS, SCHEMA_TYPES,
} from "./constants";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

// ─── AEO ANALYZERS ────────────────────────────────────────────

/**
 * Schema Richness (AEO 20%) - Variety and depth of JSON-LD schemas
 */
export function analyzeSchemaRichness(page: ParsedPage): number {
  const { jsonLdBlocks } = page;
  if (jsonLdBlocks.length === 0) return 0;

  let score = 0;

  // Points for having JSON-LD at all (10)
  score += 10;

  // Points for number of schema blocks (up to 20)
  score += Math.min(20, jsonLdBlocks.length * 5);

  // Points for variety of @type values (up to 40)
  const types = new Set<string>();
  for (const block of jsonLdBlocks) {
    const t = block["@type"];
    if (typeof t === "string") types.add(t);
    if (Array.isArray(t)) t.forEach((v) => { if (typeof v === "string") types.add(v); });
  }
  const knownTypes = [...types].filter((t) => SCHEMA_TYPES.includes(t as typeof SCHEMA_TYPES[number]));
  score += Math.min(40, knownTypes.length * 10);

  // Points for schema depth - properties beyond @type/@context (up to 20)
  let totalProps = 0;
  for (const block of jsonLdBlocks) {
    const props = Object.keys(block).filter((k) => !k.startsWith("@")).length;
    totalProps += props;
  }
  score += Math.min(20, totalProps * 2);

  // Bonus for having @id or sameAs links (10)
  const hasIds = jsonLdBlocks.some((b) => b["@id"] || b["sameAs"]);
  if (hasIds) score += 10;

  return clamp(score);
}

/**
 * FAQ Coverage (AEO 15%) - FAQ schema, Q&A pairs, question headings
 */
export function analyzeFaqCoverage(page: ParsedPage): number {
  const { jsonLdBlocks, headings, paragraphs } = page;
  let score = 0;

  // FAQPage schema present (30)
  const hasFaqSchema = jsonLdBlocks.some((b) => b["@type"] === "FAQPage" || b["@type"] === "QAPage");
  if (hasFaqSchema) {
    score += 30;
    // Count Q&A pairs in schema (up to 20)
    for (const block of jsonLdBlocks) {
      if (block["@type"] === "FAQPage" && Array.isArray(block["mainEntity"])) {
        score += Math.min(20, block["mainEntity"].length * 5);
      }
    }
  }

  // Question-style headings containing "?" or question words (up to 25)
  const questionHeadings = headings.filter((h) =>
    h.text.includes("?") || /^(what|how|why|when|where|who|which|can|do|does|is|are)\s/i.test(h.text)
  );
  score += Math.min(25, questionHeadings.length * 5);

  // Question marks in paragraph content (up to 15)
  const questionParagraphs = paragraphs.filter((p) => p.includes("?")).length;
  score += Math.min(15, questionParagraphs * 3);

  // Accordion/FAQ keyword patterns in content (10)
  const allText = paragraphs.join(" ").toLowerCase();
  if (/faq|frequently asked|common questions|q&a|questions and answers/i.test(allText)) {
    score += 10;
  }

  return clamp(score);
}

/**
 * Direct Answer Readiness (AEO 20%) - Definition sentences, concise paragraphs, lists
 */
export function analyzeDirectAnswerReadiness(page: ParsedPage): number {
  const { paragraphs, lists, firstParagraphText } = page;
  let score = 0;

  // Definition sentence in first paragraph ("X is a...", "X refers to...") (25)
  if (/\b(is a|is an|refers to|means|defined as|represents)\b/i.test(firstParagraphText)) {
    score += 25;
  }

  // Concise first paragraph (< 200 chars gets full points) (15)
  if (firstParagraphText.length > 0 && firstParagraphText.length <= 200) {
    score += 15;
  } else if (firstParagraphText.length > 0 && firstParagraphText.length <= 400) {
    score += 8;
  }

  // Average paragraph length - shorter is better for AI extraction (up to 20)
  if (paragraphs.length > 0) {
    const avgLen = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
    if (avgLen <= 150) score += 20;
    else if (avgLen <= 250) score += 15;
    else if (avgLen <= 400) score += 8;
  }

  // Has lists (ordered or unordered) (up to 20)
  if (lists.length > 0) {
    score += 10;
    if (lists.some((l) => l.type === "ol")) score += 5;
    if (lists.some((l) => l.items.length >= 3)) score += 5;
  }

  // Bold/strong key phrases (heuristic: check for patterns) (10)
  const boldPattern = /<(strong|b)>/gi;
  const boldCount = (page.html.match(boldPattern) || []).length;
  if (boldCount >= 2) score += 10;
  else if (boldCount >= 1) score += 5;

  // Has multiple paragraphs showing structured content (10)
  if (paragraphs.length >= 3) score += 10;
  else if (paragraphs.length >= 1) score += 5;

  return clamp(score);
}

/**
 * Entity Markup (AEO 15%) - Organization/Person/Product/Place schema completeness
 */
export function analyzeEntityMarkup(page: ParsedPage): number {
  const { jsonLdBlocks } = page;
  if (jsonLdBlocks.length === 0) return 0;

  let score = 0;
  const entityTypes = ["Organization", "Person", "SportsTeam", "SportsEvent", "Product", "Place"];

  // Check for entity schemas (up to 30)
  const entities = jsonLdBlocks.filter((b) => {
    const t = b["@type"];
    return typeof t === "string" && entityTypes.includes(t);
  });
  score += Math.min(30, entities.length * 10);

  // Check completeness of entity schemas (up to 40)
  const requiredProps: Record<string, string[]> = {
    Organization: ["name", "url", "logo", "description"],
    Person: ["name", "url", "description", "jobTitle"],
    SportsTeam: ["name", "url", "sport", "memberOf"],
    SportsEvent: ["name", "startDate", "location", "competitor"],
  };

  for (const entity of entities) {
    const type = entity["@type"] as string;
    const expected = requiredProps[type] || ["name", "url"];
    const present = expected.filter((prop) => entity[prop] != null).length;
    score += Math.round((present / expected.length) * 15);
  }
  score = Math.min(score, 70);

  // Has @id identifiers (15)
  const hasId = entities.some((e) => e["@id"]);
  if (hasId) score += 15;

  // Has sameAs links (15)
  const hasSameAs = entities.some((e) => e["sameAs"]);
  if (hasSameAs) score += 15;

  return clamp(score);
}

/**
 * Speakable Content (AEO 10%) - SpeakableSpecification, short sentences, readability
 */
export function analyzeSpeakableContent(page: ParsedPage): number {
  const { jsonLdBlocks, paragraphs } = page;
  let score = 0;

  // SpeakableSpecification schema (35)
  const hasSpeakable = jsonLdBlocks.some((b) =>
    b["@type"] === "SpeakableSpecification" ||
    (b["speakable"] != null)
  );
  if (hasSpeakable) score += 35;

  // Short sentence average (up to 30)
  if (paragraphs.length > 0) {
    const allSentences = paragraphs.join(". ").split(/[.!?]+/).filter((s) => s.trim().length > 5);
    if (allSentences.length > 0) {
      const avgWords = allSentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / allSentences.length;
      if (avgWords <= 15) score += 30;
      else if (avgWords <= 20) score += 20;
      else if (avgWords <= 25) score += 10;
    }
  }

  // Natural reading flow - no overly technical jargon density (20)
  const allText = paragraphs.join(" ").toLowerCase();
  const wordCount = allText.split(/\s+/).length;
  if (wordCount > 50) {
    // Check for pronounceable, natural language (simple heuristic)
    const simpleWords = allText.split(/\s+/).filter((w) => w.length <= 10).length;
    const simplicity = simpleWords / wordCount;
    if (simplicity >= 0.85) score += 20;
    else if (simplicity >= 0.75) score += 12;
    else score += 5;
  }

  // Has content suitable for voice (not empty) (15)
  if (paragraphs.length >= 2 && paragraphs[0].length >= 20) {
    score += 15;
  }

  return clamp(score);
}

/**
 * AI Snippet Compatibility (AEO 20%) - Concise paragraphs, tables, Q&A patterns, section tags
 */
export function analyzeAiSnippetCompatibility(page: ParsedPage): number {
  const { paragraphs, tableCount, lists, headings } = page;
  let score = 0;

  // Concise paragraphs (< 300 chars average) (20)
  if (paragraphs.length > 0) {
    const avgLen = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
    if (avgLen <= 200) score += 20;
    else if (avgLen <= 300) score += 15;
    else if (avgLen <= 500) score += 8;
  }

  // Has tables for structured data (15)
  if (tableCount > 0) score += 15;

  // Has lists (15)
  if (lists.length > 0) {
    score += 10;
    if (lists.length >= 2) score += 5;
  }

  // Heading-to-content mapping (headings followed by paragraphs) (20)
  if (headings.length >= 2 && paragraphs.length >= 2) {
    score += 15;
    if (headings.length >= 4) score += 5;
  }

  // Q&A patterns in content (15)
  const questionHeadings = headings.filter((h) => h.text.includes("?")).length;
  if (questionHeadings >= 2) score += 15;
  else if (questionHeadings >= 1) score += 8;

  // Has section/article semantic tags (15)
  const hasSections = /<(section|article|main|aside)/i.test(page.html);
  if (hasSections) score += 15;

  return clamp(score);
}


// ─── CRO ANALYZERS ────────────────────────────────────────────

/**
 * CTA Presence (CRO 20%) - CTA count, placement, styled buttons, specific text
 */
export function analyzeCtaPresence(page: ParsedPage): number {
  const { buttons, links } = page;
  let score = 0;

  // Collect all CTA elements
  const ctaElements: string[] = [];
  for (const btn of buttons) {
    if (CTA_KEYWORDS.some((kw) => btn.text.includes(kw))) {
      ctaElements.push(btn.text);
    }
  }
  for (const link of links) {
    if (CTA_KEYWORDS.some((kw) => link.text.includes(kw))) {
      ctaElements.push(link.text);
    }
  }

  const ctaCount = ctaElements.length;

  // CTA count scoring (optimal is 2-4) (35)
  if (ctaCount >= 2 && ctaCount <= 4) score += 35;
  else if (ctaCount === 1) score += 20;
  else if (ctaCount >= 5) score += 25; // Too many can be pushy
  // 0 CTAs = 0 points

  // Styled buttons vs plain links (20)
  const styledCtas = buttons.filter((b) =>
    b.isStyled && CTA_KEYWORDS.some((kw) => b.text.includes(kw))
  ).length;
  if (styledCtas >= 1) score += 20;

  // Specific vs generic CTA text (25)
  const specificCtas = ctaElements.filter((t) =>
    !["learn more", "click here", "read more"].includes(t)
  ).length;
  if (specificCtas >= 2) score += 25;
  else if (specificCtas >= 1) score += 15;

  // Has any buttons at all (even non-CTA) (20)
  if (buttons.length >= 2) score += 20;
  else if (buttons.length >= 1) score += 10;

  return clamp(score);
}

/**
 * Form Accessibility (CRO 10%) - Labels, placeholders, submit, aria, autocomplete
 */
export function analyzeFormAccessibility(page: ParsedPage): number {
  const { forms } = page;
  if (forms.length === 0) {
    // No forms on page - neutral score (not penalized)
    return 50;
  }

  let score = 0;
  let totalChecks = 0;
  let passedChecks = 0;

  for (const form of forms) {
    // Labels (20)
    totalChecks++;
    if (form.hasLabels) { passedChecks++; score += 15; }

    // Placeholders or aria-labels (20)
    totalChecks++;
    if (form.hasPlaceholders || form.hasAriaLabels) { passedChecks++; score += 15; }

    // Submit button (20)
    totalChecks++;
    if (form.hasSubmit) { passedChecks++; score += 20; }

    // Autocomplete (15)
    totalChecks++;
    if (form.hasAutocomplete) { passedChecks++; score += 10; }

    // Has multiple inputs (functioning form) (10)
    totalChecks++;
    if (form.inputCount >= 1) { passedChecks++; score += 10; }
  }

  // Normalize per form count
  if (forms.length > 1) {
    score = Math.round(score / forms.length);
  }

  // Bonus for error handling patterns
  const hasErrorPatterns = /aria-invalid|aria-describedby|error|invalid/i.test(page.html);
  if (hasErrorPatterns) score += 10;

  return clamp(score);
}

/**
 * Load Speed Impact (CRO 15%) - Response time scoring
 */
export function analyzeLoadSpeedImpact(responseTime: number): number {
  if (responseTime < 200) return 100;
  if (responseTime < 500) return 80;
  if (responseTime < 1000) return 60;
  if (responseTime < 2000) return 40;
  if (responseTime < 3000) return 20;
  return 0;
}

/**
 * Trust Signals (CRO 15%) - Trust keywords, badges, privacy links, contact info
 */
export function analyzeTrustSignals(page: ParsedPage): number {
  const { links, paragraphs } = page;
  const allText = paragraphs.join(" ").toLowerCase();
  let score = 0;

  // Trust keywords in content (up to 25)
  const matchedTrust = TRUST_KEYWORDS.filter((kw) => allText.includes(kw));
  score += Math.min(25, matchedTrust.length * 5);

  // Privacy/terms links (25)
  const hasPrivacyLink = links.some((l) => /privacy|terms|legal/i.test(l.href) || /privacy|terms/i.test(l.text));
  if (hasPrivacyLink) score += 25;

  // Contact info presence (20)
  const hasContact = links.some((l) => /contact|support|help/i.test(l.href) || /contact|support/i.test(l.text));
  if (hasContact) score += 20;

  // Trust badges or verification imagery (15)
  const hasBadges = /badge|verified|certified|seal|ssl|secure/i.test(page.html);
  if (hasBadges) score += 15;

  // Official/authoritative language (15)
  if (/official|authorized|licensed/i.test(allText)) score += 15;

  return clamp(score);
}

/**
 * Social Proof (CRO 15%) - Testimonials, user counts, ratings, partner logos
 */
export function analyzeSocialProof(page: ParsedPage): number {
  const { paragraphs } = page;
  const allText = paragraphs.join(" ").toLowerCase();
  let score = 0;

  // Social proof keywords (up to 25)
  const matchedProof = SOCIAL_PROOF_KEYWORDS.filter((kw) => allText.includes(kw));
  score += Math.min(25, matchedProof.length * 5);

  // Testimonials/blockquotes (25)
  const hasTestimonials = /<blockquote/i.test(page.html) || /testimonial|review|feedback/i.test(allText);
  if (hasTestimonials) score += 25;

  // User/member count mentions (20)
  const hasUserCounts = /\d+[\s,]*\+?\s*(users|members|fans|followers|subscribers|downloads|active)/i.test(allText)
    || /join\s+\d/i.test(allText);
  if (hasUserCounts) score += 20;

  // Rating/stars elements (15)
  const hasRatings = /★|⭐|rating|stars|score/i.test(page.html) || /data-rating|star-rating/i.test(page.html);
  if (hasRatings) score += 15;

  // Partner/trusted-by logos (15)
  const hasPartners = /partner|trusted.by|as.seen|featured.in/i.test(allText);
  if (hasPartners) score += 15;

  return clamp(score);
}

/**
 * Value Proposition (CRO 15%) - Benefit-oriented H1, value words, differentiation
 */
export function analyzeValueProposition(page: ParsedPage): number {
  const { headings, paragraphs } = page;
  let score = 0;

  // H1 with benefit language (30)
  const h1 = headings.find((h) => h.level === 1);
  if (h1) {
    const h1Lower = h1.text.toLowerCase();
    const hasBenefitWord = VALUE_PROP_KEYWORDS.some((kw) => h1Lower.includes(kw));
    if (hasBenefitWord) score += 30;
    else score += 10; // At least has an H1
  }

  // Value words in first 100 words (30)
  const first100Words = paragraphs.slice(0, 3).join(" ").toLowerCase().split(/\s+/).slice(0, 100).join(" ");
  const matchedValue = VALUE_PROP_KEYWORDS.filter((kw) => first100Words.includes(kw));
  score += Math.min(30, matchedValue.length * 6);

  // Differentiation language (20)
  const allText = paragraphs.join(" ").toLowerCase();
  const hasDiff = /only|unique|first|best|exclusive|unlike|better than|more than/i.test(allText);
  if (hasDiff) score += 20;

  // Clear value statement (concise H1 or subheading explaining what the page offers) (20)
  const h2 = headings.find((h) => h.level === 2);
  if (h1 && h1.text.length <= 80) score += 10;
  if (h2 && h2.text.length <= 100) score += 10;

  return clamp(score);
}

/**
 * Mobile CRO (CRO 10%) - Viewport meta, responsive hints, touch-friendly patterns
 */
export function analyzeMobileCro(page: ParsedPage): number {
  const { hasViewport, buttons } = page;
  let score = 0;

  // Viewport meta tag (30)
  if (hasViewport) score += 30;

  // Responsive design indicators (25)
  const hasResponsive = /@media|responsive|flex|grid/i.test(page.html)
    || /tailwind|tw-|className/i.test(page.html);
  if (hasResponsive) score += 25;

  // Touch-friendly buttons (enough buttons that are styled) (20)
  const styledButtons = buttons.filter((b) => b.isStyled).length;
  if (styledButtons >= 2) score += 20;
  else if (styledButtons >= 1) score += 10;

  // No fixed-width overflow indicators (15)
  const hasFixedWidth = /width:\s*\d{4,}px/i.test(page.html);
  if (!hasFixedWidth) score += 15;

  // Mobile-friendly navigation patterns (10)
  const hasMobileNav = /hamburger|mobile-menu|nav-toggle|menu-btn/i.test(page.html);
  if (hasMobileNav) score += 10;

  return clamp(score);
}
