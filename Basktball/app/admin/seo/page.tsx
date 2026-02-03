"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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

// Mock data
const mockSeoScores: SEOScore[] = [
  {
    category: "Technical SEO",
    score: 92,
    status: "good",
    issues: ["2 pages missing canonical tags"],
  },
  {
    category: "Content Quality",
    score: 88,
    status: "good",
    issues: ["5 pages need longer meta descriptions"],
  },
  {
    category: "Core Web Vitals",
    score: 76,
    status: "warning",
    issues: ["LCP needs improvement on mobile", "CLS above threshold on 3 pages"],
  },
  {
    category: "Mobile Usability",
    score: 95,
    status: "good",
    issues: [],
  },
  {
    category: "Internal Linking",
    score: 82,
    status: "good",
    issues: ["12 orphan pages detected"],
  },
];

const mockPages: PageSEO[] = [
  {
    path: "/",
    title: "Basktball - Basketball Analytics & Advanced Stats",
    metaDescription: "Advanced basketball analytics across NBA, WNBA, NCAA...",
    keywords: ["basketball", "NBA", "analytics"],
    lastCrawled: "2026-02-02",
    indexStatus: "indexed",
    impressions: 45230,
    clicks: 3241,
    position: 4.2,
  },
  {
    path: "/tools/shot-chart",
    title: "Shot Chart Analyzer | Basktball",
    metaDescription: "Interactive NBA shot chart visualization tool...",
    keywords: ["shot chart", "NBA visualization"],
    lastCrawled: "2026-02-01",
    indexStatus: "indexed",
    impressions: 12450,
    clicks: 892,
    position: 8.5,
  },
  {
    path: "/tools/compare",
    title: "Player Comparison Tool | Basktball",
    metaDescription: "Compare NBA players head-to-head with advanced metrics...",
    keywords: ["player comparison", "NBA stats"],
    lastCrawled: "2026-02-01",
    indexStatus: "indexed",
    impressions: 8920,
    clicks: 621,
    position: 12.3,
  },
  {
    path: "/stats",
    title: "League Leaders & Stats | Basktball",
    metaDescription: "Current NBA statistical leaders in points, rebounds...",
    keywords: ["NBA leaders", "basketball stats"],
    lastCrawled: "2026-02-02",
    indexStatus: "indexed",
    impressions: 22100,
    clicks: 1843,
    position: 6.1,
  },
  {
    path: "/tools/predictor",
    title: "AI Game Predictor | Basktball",
    metaDescription: "AI-powered NBA game predictions with confidence ratings...",
    keywords: ["NBA predictions", "game predictor"],
    lastCrawled: "2026-01-30",
    indexStatus: "pending",
    impressions: 5430,
    clicks: 312,
    position: 18.7,
  },
];

const mockSearchConsole = {
  totalImpressions: 245000,
  totalClicks: 12450,
  averageCTR: 5.08,
  averagePosition: 8.4,
  indexedPages: 47,
  pendingPages: 3,
  errorsPages: 0,
};

export default function SEOManagementPage() {
  const [pages] = useState<PageSEO[]>(mockPages);
  const [selectedPage, setSelectedPage] = useState<PageSEO | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "sitemap">("overview");

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusBadge = (status: "indexed" | "pending" | "blocked") => {
    switch (status) {
      case "indexed":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "blocked":
        return "bg-red-500/20 text-red-400";
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
            SEO MANAGEMENT
          </h1>
          <p className="text-white/50 text-sm">
            Monitor and optimize search engine visibility
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Generate Sitemap
          </Button>
          <Button variant="primary" size="sm">
            Submit to Google
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["overview", "pages", "sitemap"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 font-semibold uppercase text-xs tracking-wider transition-colors",
              activeTab === tab
                ? "bg-[var(--orange)] text-white"
                : "bg-[var(--dark-gray)] text-white/60 hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Search Console Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-xs uppercase mb-1">Impressions</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-xl text-white">
                {(mockSearchConsole.totalImpressions / 1000).toFixed(0)}K
              </p>
            </Card>
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-xs uppercase mb-1">Clicks</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-xl text-white">
                {(mockSearchConsole.totalClicks / 1000).toFixed(1)}K
              </p>
            </Card>
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-xs uppercase mb-1">Avg CTR</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-xl text-[var(--orange)]">
                {mockSearchConsole.averageCTR}%
              </p>
            </Card>
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-xs uppercase mb-1">Avg Position</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-xl text-white">
                {mockSearchConsole.averagePosition}
              </p>
            </Card>
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-xs uppercase mb-1">Indexed</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-xl text-green-500">
                {mockSearchConsole.indexedPages}
              </p>
            </Card>
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-xs uppercase mb-1">Pending</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-xl text-yellow-500">
                {mockSearchConsole.pendingPages}
              </p>
            </Card>
            <Card variant="default" className="p-3">
              <p className="text-white/50 text-xs uppercase mb-1">Errors</p>
              <p className="font-[family-name:var(--font-roboto-mono)] text-xl text-red-500">
                {mockSearchConsole.errorsPages}
              </p>
            </Card>
          </div>

          {/* SEO Scores */}
          <Card variant="default" className="p-4 mb-6">
            <h2 className="font-semibold text-white text-sm mb-3">SEO Health Scores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
              {mockSeoScores.map((score) => (
                <div key={score.category} className="bg-[var(--black)] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/70 text-sm">{score.category}</p>
                    <p
                      className={cn(
                        "font-[family-name:var(--font-roboto-mono)] text-2xl font-bold",
                        getScoreColor(score.score)
                      )}
                    >
                      {score.score}
                    </p>
                  </div>
                  {score.issues.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      {score.issues.map((issue, i) => (
                        <p key={i} className="text-white/40 text-xs">
                          - {issue}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="bordered" className="p-3 cursor-pointer hover:border-[var(--orange)] transition-colors">
              <div className="w-8 h-8 bg-blue-500/20 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="font-semibold text-white text-xs">Regenerate Sitemap</p>
              <p className="text-white/50 text-[10px]">Update XML sitemap</p>
            </Card>
            <Card variant="bordered" className="p-3 cursor-pointer hover:border-[var(--orange)] transition-colors">
              <div className="w-8 h-8 bg-green-500/20 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="font-semibold text-white text-xs">Fetch GSC Data</p>
              <p className="text-white/50 text-[10px]">Sync Search Console</p>
            </Card>
            <Card variant="bordered" className="p-3 cursor-pointer hover:border-[var(--orange)] transition-colors">
              <div className="w-8 h-8 bg-purple-500/20 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-semibold text-white text-xs">Run SEO Audit</p>
              <p className="text-white/50 text-[10px]">Full site analysis</p>
            </Card>
            <Card variant="bordered" className="p-3 cursor-pointer hover:border-[var(--orange)] transition-colors">
              <div className="w-8 h-8 bg-orange-500/20 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-[var(--orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="font-semibold text-white text-xs">Bulk Edit Meta</p>
              <p className="text-white/50 text-[10px]">Update page metadata</p>
            </Card>
          </div>
        </>
      )}

      {activeTab === "pages" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pages List */}
          <div className="lg:col-span-2">
            <Card variant="default" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--dark-gray)]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                        PAGE
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-white/60">
                        STATUS
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-white/60">
                        IMPRESSIONS
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-white/60">
                        CLICKS
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-white/60">
                        POSITION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((page) => (
                      <tr
                        key={page.path}
                        onClick={() => setSelectedPage(page)}
                        className={cn(
                          "border-t border-white/10 cursor-pointer transition-colors",
                          selectedPage?.path === page.path
                            ? "bg-[var(--orange)]/10"
                            : "hover:bg-white/5"
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white text-sm">{page.path}</p>
                          <p className="text-white/50 text-xs truncate max-w-xs">
                            {page.title}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "px-2 py-1 text-xs font-semibold uppercase",
                              getStatusBadge(page.indexStatus)
                            )}
                          >
                            {page.indexStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-[family-name:var(--font-roboto-mono)] text-sm text-white">
                          {page.impressions.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center font-[family-name:var(--font-roboto-mono)] text-sm text-white">
                          {page.clicks.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center font-[family-name:var(--font-roboto-mono)] text-sm text-[var(--orange)]">
                          {page.position.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Page Details */}
          <div>
            {selectedPage ? (
              <Card variant="bordered" className="p-5 border-[var(--orange)]">
                <h2 className="font-bold text-white mb-4">Page SEO Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-white/50 text-xs uppercase block mb-1">
                      Page Title
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedPage.title}
                      className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-3 py-2 text-sm"
                    />
                    <p className="text-white/30 text-xs mt-1">
                      {selectedPage.title.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <label className="text-white/50 text-xs uppercase block mb-1">
                      Meta Description
                    </label>
                    <textarea
                      defaultValue={selectedPage.metaDescription}
                      rows={3}
                      className="w-full bg-[var(--black)] border border-[var(--border)] text-white px-3 py-2 text-sm resize-none"
                    />
                    <p className="text-white/30 text-xs mt-1">
                      {selectedPage.metaDescription.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <label className="text-white/50 text-xs uppercase block mb-1">
                      Keywords
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {selectedPage.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="bg-[var(--orange)]/20 text-[var(--orange)] px-2 py-1 text-xs"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-white/50 text-xs">Last Crawled</p>
                      <p className="text-white text-sm">{selectedPage.lastCrawled}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs">CTR</p>
                      <p className="text-[var(--orange)] text-sm font-semibold">
                        {((selectedPage.clicks / selectedPage.impressions) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <Button variant="primary" className="w-full">
                    Save Changes
                  </Button>
                </div>
              </Card>
            ) : (
              <Card variant="default" className="p-5">
                <p className="text-white/50 text-center py-8">
                  Select a page to view SEO details
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "sitemap" && (
        <Card variant="default" className="p-5">
          <h2 className="font-bold text-white mb-4">Sitemap Configuration</h2>
          <div className="space-y-4">
            <div className="bg-[var(--black)] p-4">
              <p className="text-white font-semibold mb-2">sitemap.xml</p>
              <p className="text-white/50 text-sm mb-3">
                Auto-generated sitemap with all indexed pages
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View Sitemap</Button>
                <Button variant="primary" size="sm">Regenerate</Button>
              </div>
            </div>

            <div className="bg-[var(--black)] p-4">
              <p className="text-white font-semibold mb-2">robots.txt</p>
              <textarea
                className="w-full bg-[var(--dark-gray)] border border-[var(--border)] text-white/70 px-3 py-2 font-mono text-sm h-32 resize-none"
                defaultValue={`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://basktball.com/sitemap.xml`}
              />
              <Button variant="primary" size="sm" className="mt-2">Save robots.txt</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
