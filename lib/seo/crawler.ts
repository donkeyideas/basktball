import * as cheerio from "cheerio";
import type { CrawlResult, ParsedPage } from "./types";
import { CRAWL_PAGES, CRAWL_TIMEOUT_MS, CRAWL_DELAY_MS, MAX_HTML_SIZE } from "./constants";

const SITE_URL = process.env.SITE_URL || "https://www.basktball.com";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function crawlPages(): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];

  for (const path of CRAWL_PAGES) {
    const url = `${SITE_URL}${path}`;
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CRAWL_TIMEOUT_MS);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "BasktballSeoBot/1.0",
          "Accept": "text/html",
        },
      });
      clearTimeout(timeout);

      const responseTime = Date.now() - start;
      let html = await res.text();

      // Truncate oversized HTML
      if (html.length > MAX_HTML_SIZE) {
        html = html.slice(0, MAX_HTML_SIZE);
      }

      results.push({ url, path, html, statusCode: res.status, responseTime });
    } catch (err) {
      results.push({
        url,
        path,
        html: "",
        statusCode: 0,
        responseTime: Date.now() - start,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Polite delay between requests
    if (path !== CRAWL_PAGES[CRAWL_PAGES.length - 1]) {
      await delay(CRAWL_DELAY_MS);
    }
  }

  return results;
}

export function parseHtml(crawlResult: CrawlResult): ParsedPage {
  const { url, path, html, responseTime } = crawlResult;
  const $ = cheerio.load(html);

  // Extract JSON-LD blocks
  const jsonLdBlocks: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).text().trim();
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          jsonLdBlocks.push(...parsed);
        } else if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
          jsonLdBlocks.push(...parsed["@graph"]);
        } else {
          jsonLdBlocks.push(parsed);
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  });

  // Extract headings
  const headings: { level: number; text: string }[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = parseInt(el.tagName.replace("h", ""), 10);
    const text = $(el).text().trim();
    if (text) headings.push({ level, text });
  });

  // Extract paragraphs
  const paragraphs: string[] = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10) paragraphs.push(text);
  });

  // Extract lists
  const lists: { type: "ol" | "ul"; items: string[] }[] = [];
  $("ul, ol").each((_, el) => {
    const type = el.tagName === "ol" ? "ol" : "ul";
    const items: string[] = [];
    $(el).find("li").each((_, li) => {
      const text = $(li).text().trim();
      if (text) items.push(text);
    });
    if (items.length > 0) lists.push({ type, items });
  });

  // Count tables
  const tableCount = $("table").length;

  // Extract forms
  const forms: ParsedPage["forms"] = [];
  $("form").each((_, el) => {
    const $form = $(el);
    const inputs = $form.find("input, textarea, select");
    const hasLabels = $form.find("label").length > 0;
    const hasPlaceholders = inputs.filter("[placeholder]").length > 0;
    const hasSubmit = $form.find('button[type="submit"], input[type="submit"]').length > 0
      || $form.find("button").filter((_, btn) => !$(btn).attr("type") || $(btn).attr("type") === "submit").length > 0;
    const hasAriaLabels = inputs.filter("[aria-label]").length > 0;
    const hasAutocomplete = inputs.filter("[autocomplete]").length > 0;
    forms.push({ hasLabels, hasPlaceholders, hasSubmit, hasAriaLabels, hasAutocomplete, inputCount: inputs.length });
  });

  // Extract buttons (outside forms too)
  const buttons: { text: string; isStyled: boolean }[] = [];
  $("button, a.btn, a.button, [role='button']").each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text) {
      const classes = $(el).attr("class") || "";
      const isStyled = /btn|button|cta/i.test(classes) || el.tagName === "button";
      buttons.push({ text, isStyled });
    }
  });

  // Extract links
  const links: { text: string; href: string }[] = [];
  $("a[href]").each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    const href = $(el).attr("href") || "";
    if (text && href) links.push({ text, href });
  });

  // Extract meta tags
  const metaTags: Record<string, string> = {};
  $("meta").each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("property") || "";
    const content = $(el).attr("content") || "";
    if (name && content) metaTags[name] = content;
  });

  // Viewport check
  const hasViewport = $('meta[name="viewport"]').length > 0;

  // Title
  const title = $("title").text().trim() || $("h1").first().text().trim() || path;

  // Word count from body text
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // First paragraph text (for direct answer analysis)
  const firstParagraphText = paragraphs[0] || "";

  return {
    url,
    path,
    html,
    jsonLdBlocks,
    headings,
    paragraphs,
    lists,
    tableCount,
    forms,
    buttons,
    links,
    metaTags,
    hasViewport,
    responseTime,
    wordCount,
    title,
    firstParagraphText,
  };
}
