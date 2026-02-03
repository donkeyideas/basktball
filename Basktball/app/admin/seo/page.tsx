"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";

interface SEOScore {
  category: string;
  score: number;
  status: "good" | "warning" | "error";
  issues: string[];
}

interface PageSEO {
  path: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  lastCrawled: string;
  indexStatus: "indexed" | "pending" | "blocked";
  impressions: number;
  clicks: number;
  position: number;
}

interface SEOData {
  success: boolean;
  searchConsole: {
    totalImpressions: number;
    totalClicks: number;
    averageCTR: number;
    averagePosition: number;
    indexedPages: number;
    pendingPages: number;
    errorsPages: number;
  };
  seoScores: SEOScore[];
  pages: PageSEO[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SEOManagementPage() {
  const { data, isLoading } = useSWR<SEOData>("/api/admin/seo", fetcher);
  const [selectedPage, setSelectedPage] = useState<PageSEO | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "sitemap">("overview");
  const [isProcessing, setIsProcessing] = useState(false);

  const searchConsole = data?.searchConsole || {
    totalImpressions: 0,
    totalClicks: 0,
    averageCTR: 0,
    averagePosition: 0,
    indexedPages: 0,
    pendingPages: 0,
    errorsPages: 0,
  };
  const seoScores = data?.seoScores || [];
  const pages = data?.pages || [];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[var(--green)]";
    if (score >= 70) return "text-[var(--yellow)]";
    return "text-[var(--red)]";
  };

  const getStatusClass = (status: "indexed" | "pending" | "blocked") => {
    switch (status) {
      case "indexed": return "job-status success";
      case "pending": return "job-status paused";
      case "blocked": return "job-status failed";
    }
  };

  const handleRegenerateSitemap = async () => {
    setIsProcessing(true);
    try {
      await fetch("/api/admin/seo/sitemap", { method: "POST" });
      await mutate("/api/admin/seo");
    } catch (error) {
      console.error("Regenerate sitemap error:", error);
    }
    setIsProcessing(false);
  };

  const handleRunAudit = async () => {
    setIsProcessing(true);
    try {
      await fetch("/api/admin/seo/audit", { method: "POST" });
      await mutate("/api/admin/seo");
    } catch (error) {
      console.error("Run audit error:", error);
    }
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 w-24 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card p-4 animate-pulse">
              <div className="h-8 w-20 bg-white/10 rounded mb-2" />
              <div className="h-4 w-24 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="section">
          <div className="section-header">
            <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
          SEO MANAGEMENT
        </h1>
        <div className="flex gap-2">
          {(["overview", "pages", "sitemap"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded transition-colors capitalize",
                activeTab === tab
                  ? "bg-[var(--orange)] text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat-card p-4">
          <p className="stat-value text-2xl">{(searchConsole.totalImpressions / 1000).toFixed(0)}K</p>
          <p className="stat-label">Total Impressions</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl text-[var(--orange)]">{searchConsole.averageCTR.toFixed(2)}%</p>
          <p className="stat-label">Average CTR</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl">{searchConsole.averagePosition.toFixed(1)}</p>
          <p className="stat-label">Average Position</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl text-[var(--green)]">{searchConsole.indexedPages}</p>
          <p className="stat-label">Indexed Pages</p>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          {/* SEO Health Scores */}
          <div className="section mb-6">
            <div className="section-header">
              <h2 className="section-title">SEO Health Scores</h2>
              <button
                onClick={handleRunAudit}
                disabled={isProcessing}
                className="btn btn-secondary btn-small"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Run Audit
              </button>
            </div>
            <div className="p-4">
              {seoScores.length === 0 ? (
                <p className="text-white/30 text-center py-8">No SEO scores available</p>
              ) : (
                <div className="grid grid-cols-5 gap-4">
                  {seoScores.map((score) => (
                    <div key={score.category} className="bg-[var(--darker-gray)] p-4 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white/60 text-sm uppercase">{score.category}</p>
                        <p className={cn("font-[family-name:var(--font-roboto-mono)] text-2xl font-bold", getScoreColor(score.score))}>
                          {score.score}
                        </p>
                      </div>
                      {score.issues.length > 0 && (
                        <div className="border-t border-white/10 pt-2 mt-2">
                          {score.issues.slice(0, 2).map((issue, i) => (
                            <p key={i} className="text-white/40 text-xs truncate">
                              - {issue}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Pages Table */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Top Pages by Impressions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Status</th>
                    <th>Impressions</th>
                    <th>Clicks</th>
                    <th>CTR</th>
                    <th>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-white/30">
                        No page data available
                      </td>
                    </tr>
                  ) : (
                    pages.map((page) => (
                      <tr key={page.path}>
                        <td>
                          <p className="text-white font-[family-name:var(--font-roboto-mono)]">{page.path}</p>
                          <p className="text-white/40 text-xs truncate max-w-[300px]">{page.title}</p>
                        </td>
                        <td>
                          <span className={getStatusClass(page.indexStatus)}>
                            {page.indexStatus}
                          </span>
                        </td>
                        <td className="font-[family-name:var(--font-roboto-mono)] text-white">
                          {(page.impressions / 1000).toFixed(1)}K
                        </td>
                        <td className="font-[family-name:var(--font-roboto-mono)] text-white">
                          {page.clicks.toLocaleString()}
                        </td>
                        <td className="font-[family-name:var(--font-roboto-mono)] text-[var(--orange)]">
                          {((page.clicks / page.impressions) * 100).toFixed(2)}%
                        </td>
                        <td className="font-[family-name:var(--font-roboto-mono)] text-white">
                          {page.position.toFixed(1)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "pages" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Pages List */}
          <div className="col-span-2 section">
            <div className="section-header">
              <h2 className="section-title">All Pages</h2>
              <span className="text-sm text-white/40">{pages.length} pages</span>
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              <table className="data-table">
                <thead className="sticky top-0 bg-[var(--dark-gray)]">
                  <tr>
                    <th>Page</th>
                    <th>Status</th>
                    <th>Impressions</th>
                    <th>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-white/30">
                        No pages found
                      </td>
                    </tr>
                  ) : (
                    pages.map((page) => (
                      <tr
                        key={page.path}
                        onClick={() => setSelectedPage(page)}
                        className={cn(
                          "cursor-pointer",
                          selectedPage?.path === page.path && "bg-[var(--orange)]/5"
                        )}
                      >
                        <td>
                          <p className="text-white font-[family-name:var(--font-roboto-mono)]">{page.path}</p>
                          <p className="text-white/40 text-xs truncate max-w-[250px]">{page.title}</p>
                        </td>
                        <td>
                          <span className={getStatusClass(page.indexStatus)}>
                            {page.indexStatus}
                          </span>
                        </td>
                        <td className="font-[family-name:var(--font-roboto-mono)] text-white/60">
                          {(page.impressions / 1000).toFixed(1)}K
                        </td>
                        <td className="font-[family-name:var(--font-roboto-mono)] text-[var(--orange)]">
                          {page.position.toFixed(1)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Page Details */}
          <div className="section">
            {selectedPage ? (
              <>
                <div className="section-header">
                  <h2 className="section-title">Page Details</h2>
                  <button
                    onClick={() => setSelectedPage(null)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Title Tag</label>
                    <input
                      type="text"
                      defaultValue={selectedPage.title}
                      className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-3 py-2 rounded focus:border-[var(--orange)] outline-none"
                    />
                    <p className="text-white/30 text-xs mt-1">{selectedPage.title.length}/60 characters</p>
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Meta Description</label>
                    <textarea
                      defaultValue={selectedPage.metaDescription}
                      rows={3}
                      className="w-full bg-[var(--darker-gray)] border border-white/10 text-white text-sm px-3 py-2 rounded focus:border-[var(--orange)] outline-none resize-none"
                    />
                    <p className="text-white/30 text-xs mt-1">{selectedPage.metaDescription.length}/160 characters</p>
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Keywords</label>
                    <div className="flex flex-wrap gap-1">
                      {selectedPage.keywords.map((kw) => (
                        <span key={kw} className="bg-[var(--orange)]/20 text-[var(--orange)] px-2 py-1 text-xs rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Last Crawled</p>
                      <p className="text-white text-sm">{selectedPage.lastCrawled}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">Click-through Rate</p>
                      <p className="text-[var(--orange)] font-[family-name:var(--font-roboto-mono)] text-lg">
                        {((selectedPage.clicks / selectedPage.impressions) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <button className="btn btn-primary w-full">
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-white/30">
                <svg className="w-16 h-16 mx-auto mb-4 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p>Select a page to edit SEO settings</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "sitemap" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Sitemap */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Sitemap Configuration</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-[var(--darker-gray)] p-4 rounded">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">sitemap.xml</p>
                    <p className="text-white/40 text-sm">Auto-generated sitemap with all indexed pages</p>
                  </div>
                  <span className="job-status success">Active</span>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-small">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  <button
                    onClick={handleRegenerateSitemap}
                    disabled={isProcessing}
                    className="btn btn-primary btn-small"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                </div>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">Sitemap includes:</p>
                <ul className="space-y-2 text-sm text-white/40">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {searchConsole.indexedPages} indexed pages
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--yellow)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {searchConsole.pendingPages} pending pages
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {searchConsole.errorsPages} pages with errors
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Robots.txt */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">robots.txt</h2>
            </div>
            <div className="p-4">
              <textarea
                className="w-full bg-[var(--darker-gray)] border border-white/10 text-white/70 px-4 py-3 font-[family-name:var(--font-roboto-mono)] text-sm h-64 resize-none rounded focus:border-[var(--orange)] outline-none"
                defaultValue={`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://basktball.com/sitemap.xml`}
              />
              <div className="flex justify-end mt-4">
                <button className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
