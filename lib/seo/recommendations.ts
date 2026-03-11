import type { PageAnalysis, AeoCroRecommendation } from "./types";
import { LEGAL_PAGES } from "./constants";

export function generateAeoRecommendations(pages: PageAnalysis[]): AeoCroRecommendation[] {
  const recs: AeoCroRecommendation[] = [];

  // 1. Missing speakable content markup
  const lowSpeakable = pages.filter((p) => p.aeoScores.speakableContent < 20);
  if (lowSpeakable.length > 0) {
    recs.push({
      id: "aeo-speakable",
      severity: "warning",
      category: "AEO",
      title: "Missing speakable content markup",
      description: `${lowSpeakable.length} page(s) lack SpeakableSpecification schema and have poor voice-readiness. Voice assistants and AI engines prefer content marked as speakable.`,
      impact: "medium",
      fix: "Add SpeakableSpecification JSON-LD to key pages, use short pronounceable sentences, and ensure a concise summary paragraph at the top of each page.",
      affectedPages: lowSpeakable.map((p) => p.path),
    });
  }

  // 2. Low FAQ coverage
  const lowFaq = pages.filter((p) => p.aeoScores.faqCoverage < 30 && p.wordCount >= 300);
  if (lowFaq.length > 0) {
    recs.push({
      id: "aeo-faq",
      severity: "warning",
      category: "AEO",
      title: "Low FAQ coverage",
      description: `${lowFaq.length} content-rich page(s) have little to no FAQ structure. AI answer engines prioritize Q&A formatted content for direct answers.`,
      impact: "medium",
      fix: "Add FAQPage JSON-LD schema with at least 3-5 relevant Q&A pairs. Use question-style headings (H2/H3) and provide concise answers directly below.",
      affectedPages: lowFaq.map((p) => p.path),
    });
  }

  // 3. Poor direct answer readiness
  const lowDirectAnswer = pages.filter((p) => p.aeoScores.directAnswerReadiness < 30);
  if (lowDirectAnswer.length > 0) {
    recs.push({
      id: "aeo-direct-answer",
      severity: "info",
      category: "AEO",
      title: "Poor direct answer readiness",
      description: `${lowDirectAnswer.length} page(s) are not well-structured for AI answer extraction. Content should lead with definitions and use concise, scannable formats.`,
      impact: "low",
      fix: "Start pages with a definition sentence (\"X is a...\"), use short paragraphs (<200 chars), add bulleted/numbered lists, and bold key phrases.",
      affectedPages: lowDirectAnswer.map((p) => p.path),
    });
  }

  // 4. Schema markup lacks depth
  const lowSchema = pages.filter((p) => p.aeoScores.schemaRichness < 40);
  if (lowSchema.length > 0) {
    recs.push({
      id: "aeo-schema",
      severity: "warning",
      category: "AEO",
      title: "Schema markup lacks depth",
      description: `${lowSchema.length} page(s) have minimal or missing JSON-LD structured data. Rich schemas help AI engines understand and cite your content.`,
      impact: "medium",
      fix: "Add diverse JSON-LD schemas: Organization, WebSite, BreadcrumbList, FAQPage, Person (for players), SportsTeam, SportsEvent. Include @id and sameAs properties.",
      affectedPages: lowSchema.map((p) => p.path),
    });
  }

  // 5. Missing entity markup on key pages
  const keyPages = pages.filter((p) => p.path === "/" || p.path === "/about" || p.path === "/contact");
  const lowEntityKey = keyPages.filter((p) => p.aeoScores.entityMarkup < 20);
  if (lowEntityKey.length > 0) {
    recs.push({
      id: "aeo-entity",
      severity: "info",
      category: "AEO",
      title: "Missing entity markup on key pages",
      description: `Key pages (${lowEntityKey.map((p) => p.path).join(", ")}) lack entity schema markup. This hurts your site's knowledge graph presence.`,
      impact: "low",
      fix: "Add Organization schema with name, url, logo, description, sameAs (social profiles), and contactPoint on the homepage and about page.",
      affectedPages: lowEntityKey.map((p) => p.path),
    });
  }

  // 6. Low AI snippet compatibility
  const lowSnippet = pages.filter((p) => p.aeoScores.aiSnippetCompatibility < 40);
  if (lowSnippet.length > 0) {
    recs.push({
      id: "aeo-snippet",
      severity: "warning",
      category: "AEO",
      title: "Low AI snippet compatibility",
      description: `${lowSnippet.length} page(s) are poorly structured for AI snippet extraction. Content needs better formatting for AI consumption.`,
      impact: "medium",
      fix: "Use concise paragraphs (<300 chars), add data tables, use semantic HTML (section/article tags), create heading-to-content patterns, and add numbered/bulleted lists.",
      affectedPages: lowSnippet.map((p) => p.path),
    });
  }

  return recs;
}

export function generateCroRecommendations(pages: PageAnalysis[]): AeoCroRecommendation[] {
  const recs: AeoCroRecommendation[] = [];
  const nonLegalPages = pages.filter((p) => !LEGAL_PAGES.some((lp) => p.path.startsWith(lp)));

  // 1. No CTA found
  const noCta = nonLegalPages.filter((p) => p.ctaCount === 0);
  if (noCta.length > 0) {
    recs.push({
      id: "cro-no-cta",
      severity: "critical",
      category: "CRO",
      title: "No CTA found on page",
      description: `${noCta.length} non-legal page(s) have no call-to-action elements. Without CTAs, visitors have no clear path to convert.`,
      impact: "high",
      fix: "Add 2-4 clear CTAs per page: a primary action above the fold (e.g., 'Sign Up Free', 'Explore Stats') and secondary actions throughout the content.",
      affectedPages: noCta.map((p) => p.path),
    });
  }

  // 2. CTA quality needs improvement
  const lowCtaQuality = nonLegalPages.filter((p) => p.croScores.ctaPresence < 40 && p.ctaCount > 0);
  if (lowCtaQuality.length > 0) {
    recs.push({
      id: "cro-cta-quality",
      severity: "warning",
      category: "CRO",
      title: "CTA quality needs improvement",
      description: `${lowCtaQuality.length} page(s) have CTAs but they lack specificity or proper styling. Generic CTAs like "Learn More" convert poorly.`,
      impact: "medium",
      fix: "Replace generic CTAs with specific action-oriented text ('Start Tracking Stats', 'Join The Court'). Ensure CTAs are styled as prominent buttons, not plain links.",
      affectedPages: lowCtaQuality.map((p) => p.path),
    });
  }

  // 3. Missing form on conversion page
  const conversionPages = pages.filter((p) => /contact|sign|register|join/i.test(p.path));
  const noFormConversion = conversionPages.filter((p) => p.formCount === 0);
  if (noFormConversion.length > 0) {
    recs.push({
      id: "cro-missing-form",
      severity: "warning",
      category: "CRO",
      title: "Missing form on conversion page",
      description: `Conversion-oriented pages (${noFormConversion.map((p) => p.path).join(", ")}) lack forms. These pages should capture user information.`,
      impact: "medium",
      fix: "Add accessible forms with labeled inputs, placeholder text, clear submit buttons, and error handling. Keep forms short (3-5 fields max).",
      affectedPages: noFormConversion.map((p) => p.path),
    });
  }

  // 4. Weak trust signals
  const weakTrust = nonLegalPages.filter((p) => p.croScores.trustSignals < 30);
  const keyWeakTrust = weakTrust.filter((p) => ["/" , "/contact", "/register", "/login"].includes(p.path));
  if (keyWeakTrust.length > 0) {
    recs.push({
      id: "cro-weak-trust",
      severity: "warning",
      category: "CRO",
      title: "Weak trust signals on key pages",
      description: `Key conversion pages (${keyWeakTrust.map((p) => p.path).join(", ")}) lack trust indicators. Users need reassurance before taking action.`,
      impact: "medium",
      fix: "Add trust badges, security indicators, privacy policy links, and contact information. Use language like 'secure', 'verified', 'official NBA data'.",
      affectedPages: keyWeakTrust.map((p) => p.path),
    });
  }

  // 5. Missing social proof
  const lowSocialProof = pages.filter((p) => p.croScores.socialProof < 30 && p.path === "/");
  if (lowSocialProof.length > 0) {
    recs.push({
      id: "cro-social-proof",
      severity: "info",
      category: "CRO",
      title: "Missing social proof on homepage",
      description: "The homepage lacks social proof elements like user counts, testimonials, or community metrics. Social proof increases trust and conversion rates.",
      impact: "low",
      fix: "Add user/community metrics ('Join 10,000+ basketball fans'), testimonials or featured reviews, partner logos, or 'as seen on' badges.",
      affectedPages: ["/"],
    });
  }

  // 6. Weak value proposition
  const weakValueHome = pages.filter((p) => p.path === "/" && p.croScores.valueProposition < 40);
  if (weakValueHome.length > 0) {
    recs.push({
      id: "cro-weak-value",
      severity: "warning",
      category: "CRO",
      title: "Weak value proposition on homepage",
      description: "The homepage H1 and intro content don't clearly communicate the unique value. Visitors should immediately understand what Basktball offers.",
      impact: "medium",
      fix: "Craft a benefit-oriented H1 (e.g., 'Real-Time NBA Stats, Live Scores & Community'). Include value words like 'free', 'live', 'comprehensive' in the first 100 words.",
      affectedPages: ["/"],
    });
  }

  // 7. Slow load time on conversion pages
  const slowConversion = nonLegalPages.filter((p) => p.responseTime > 1000);
  if (slowConversion.length > 0) {
    recs.push({
      id: "cro-slow-load",
      severity: "critical",
      category: "CRO",
      title: "Slow page load impacting conversions",
      description: `${slowConversion.length} page(s) take over 1 second to load. Each second of delay reduces conversions by up to 7%.`,
      impact: "high",
      fix: "Optimize images, enable lazy loading, minimize JavaScript bundles, use Next.js ISR/SSG where possible, and ensure CDN is properly configured.",
      affectedPages: slowConversion.map((p) => p.path),
    });
  }

  // 8. Low mobile conversion readiness
  const lowMobile = nonLegalPages.filter((p) => p.croScores.mobileCro < 50);
  if (lowMobile.length > 0) {
    recs.push({
      id: "cro-mobile",
      severity: "warning",
      category: "CRO",
      title: "Low mobile conversion readiness",
      description: `${lowMobile.length} page(s) have poor mobile CRO signals. Over 60% of web traffic is mobile, so mobile optimization directly impacts conversions.`,
      impact: "medium",
      fix: "Ensure viewport meta tag is present, use responsive layouts, make buttons/CTAs touch-friendly (min 44x44px), and avoid fixed-width elements.",
      affectedPages: lowMobile.map((p) => p.path),
    });
  }

  return recs;
}
