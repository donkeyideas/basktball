"use client";

import { useState } from "react";
import useSWR from "swr";
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
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusBadge = (status: "indexed" | "pending" | "blocked") => {
    switch (status) {
      case "indexed": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "blocked": return "bg-red-500/20 text-red-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-6 w-16 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 grid grid-cols-5 gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[var(--dark-gray)] p-2 rounded animate-pulse">
              <div className="h-4 w-16 bg-white/10 rounded mb-1" />
              <div className="h-6 w-8 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden">
      {/* Header + Stats */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <h1 className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white">SEO</h1>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-white/40">Impr:</span>
            <span className="font-mono text-white">{(searchConsole.totalImpressions / 1000).toFixed(0)}K</span>
            <span className="text-white/40">CTR:</span>
            <span className="font-mono text-[var(--orange)]">{searchConsole.averageCTR}%</span>
            <span className="text-white/40">Pos:</span>
            <span className="font-mono text-white">{searchConsole.averagePosition}</span>
            <span className="text-white/40">Indexed:</span>
            <span className="font-mono text-green-400">{searchConsole.indexedPages}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {(["overview", "pages", "sitemap"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-2 py-1 text-[10px] font-semibold uppercase rounded transition-colors",
                activeTab === tab ? "bg-[var(--orange)] text-white" : "bg-white/10 text-white/50 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-auto">
          {/* SEO Health Scores */}
          <div className="grid grid-cols-5 gap-1.5">
            {seoScores.length === 0 ? (
              <div className="col-span-5 bg-[var(--dark-gray)] p-4 rounded text-center">
                <p className="text-white/30 text-xs">No SEO scores available</p>
              </div>
            ) : (
              seoScores.map((score) => (
                <div key={score.category} className="bg-[var(--dark-gray)] p-2 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white/60 text-[10px] uppercase">{score.category}</p>
                    <p className={cn("font-mono text-sm font-bold", getScoreColor(score.score))}>{score.score}</p>
                  </div>
                  {score.issues.length > 0 && (
                    <div className="border-t border-white/10 pt-1 mt-1">
                      {score.issues.slice(0, 1).map((issue, i) => (
                        <p key={i} className="text-white/30 text-[9px] truncate">- {issue}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", label: "Regenerate Sitemap", color: "blue" },
              { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Fetch GSC Data", color: "green" },
              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", label: "Run SEO Audit", color: "purple" },
              { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", label: "Bulk Edit Meta", color: "orange" },
            ].map((action) => (
              <button key={action.label} className="bg-[var(--dark-gray)] p-2 rounded hover:bg-white/10 transition-colors flex items-center gap-2">
                <div className={cn("w-6 h-6 flex items-center justify-center rounded", `bg-${action.color}-500/20`)}>
                  <svg className={cn("w-3 h-3", action.color === "orange" ? "text-[var(--orange)]" : `text-${action.color}-400`)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                  </svg>
                </div>
                <span className="text-white text-[10px]">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Top Pages Table */}
          <div className="flex-1 bg-[var(--dark-gray)] rounded overflow-hidden flex flex-col">
            <div className="px-2 py-1.5 border-b border-white/10">
              <h2 className="font-semibold text-white text-xs uppercase tracking-wide">Top Pages</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[var(--dark-gray)]">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-[10px] text-white/50 uppercase">Page</th>
                    <th className="px-2 py-1.5 text-center text-[10px] text-white/50 uppercase">Status</th>
                    <th className="px-2 py-1.5 text-right text-[10px] text-white/50 uppercase">Impr</th>
                    <th className="px-2 py-1.5 text-right text-[10px] text-white/50 uppercase">Clicks</th>
                    <th className="px-2 py-1.5 text-right text-[10px] text-white/50 uppercase">Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-2 py-4 text-center text-white/30 text-xs">
                        No page data available
                      </td>
                    </tr>
                  ) : (
                    pages.map((page, i) => (
                      <tr key={page.path} className={cn("border-t border-white/5", i % 2 === 0 ? "bg-[var(--black)]/30" : "")}>
                        <td className="px-2 py-1.5">
                          <p className="text-white font-mono">{page.path}</p>
                          <p className="text-white/40 text-[10px] truncate max-w-[200px]">{page.title}</p>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className={cn("px-1.5 py-0.5 text-[9px] rounded", getStatusBadge(page.indexStatus))}>{page.indexStatus}</span>
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-white/60">{(page.impressions / 1000).toFixed(1)}K</td>
                        <td className="px-2 py-1.5 text-right font-mono text-white/60">{page.clicks}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[var(--orange)]">{page.position.toFixed(1)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pages" && (
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-1.5">
          {/* Pages List */}
          <div className="col-span-2 bg-[var(--dark-gray)] rounded flex flex-col overflow-hidden">
            <div className="px-2 py-1.5 border-b border-white/10">
              <h2 className="font-semibold text-white text-xs uppercase tracking-wide">All Pages</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[var(--dark-gray)]">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-[10px] text-white/50 uppercase">Page</th>
                    <th className="px-2 py-1.5 text-center text-[10px] text-white/50 uppercase">Status</th>
                    <th className="px-2 py-1.5 text-right text-[10px] text-white/50 uppercase">Impr</th>
                    <th className="px-2 py-1.5 text-right text-[10px] text-white/50 uppercase">Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-center text-white/30 text-xs">
                        No pages found
                      </td>
                    </tr>
                  ) : (
                    pages.map((page, i) => (
                      <tr
                        key={page.path}
                        onClick={() => setSelectedPage(page)}
                        className={cn(
                          "border-t border-white/5 cursor-pointer transition-colors",
                          selectedPage?.path === page.path ? "bg-[var(--orange)]/10" : i % 2 === 0 ? "bg-[var(--black)]/30 hover:bg-white/5" : "hover:bg-white/5"
                        )}
                      >
                        <td className="px-2 py-1.5">
                          <p className="text-white font-mono">{page.path}</p>
                          <p className="text-white/40 text-[10px] truncate max-w-[200px]">{page.title}</p>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className={cn("px-1.5 py-0.5 text-[9px] rounded", getStatusBadge(page.indexStatus))}>{page.indexStatus}</span>
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-white/60">{(page.impressions / 1000).toFixed(1)}K</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[var(--orange)]">{page.position.toFixed(1)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Page Details */}
          <div className="bg-[var(--dark-gray)] rounded flex flex-col overflow-hidden">
            {selectedPage ? (
              <>
                <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between">
                  <h2 className="font-semibold text-white text-xs uppercase tracking-wide">Details</h2>
                  <button onClick={() => setSelectedPage(null)} className="text-white/40 hover:text-white text-xs">x</button>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-2">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase">Title</label>
                    <input type="text" defaultValue={selectedPage.title} className="w-full bg-[var(--black)] border border-white/10 text-white text-[10px] px-2 py-1.5 rounded" />
                    <p className="text-white/30 text-[9px] mt-0.5">{selectedPage.title.length}/60</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase">Meta Description</label>
                    <textarea defaultValue={selectedPage.metaDescription} rows={2} className="w-full bg-[var(--black)] border border-white/10 text-white text-[10px] px-2 py-1.5 rounded resize-none" />
                    <p className="text-white/30 text-[9px] mt-0.5">{selectedPage.metaDescription.length}/160</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase">Keywords</label>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {selectedPage.keywords.map((kw) => (
                        <span key={kw} className="bg-[var(--orange)]/20 text-[var(--orange)] px-1.5 py-0.5 text-[9px] rounded">{kw}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    <div>
                      <p className="text-[9px] text-white/40">Last Crawled</p>
                      <p className="text-white text-[10px]">{selectedPage.lastCrawled}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/40">CTR</p>
                      <p className="text-[var(--orange)] text-[10px] font-semibold">{((selectedPage.clicks / selectedPage.impressions) * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                  <button className="w-full px-2 py-1.5 bg-[var(--orange)] text-white text-[10px] font-semibold rounded">Save</button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/30 text-xs">Select a page</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "sitemap" && (
        <div className="flex-1 bg-[var(--dark-gray)] rounded p-3 space-y-3 overflow-auto">
          <div className="bg-[var(--black)] p-2 rounded">
            <p className="text-white font-semibold text-xs mb-1">sitemap.xml</p>
            <p className="text-white/40 text-[10px] mb-2">Auto-generated sitemap with all indexed pages</p>
            <div className="flex gap-1">
              <button className="px-2 py-1 bg-white/10 text-white text-[10px] rounded">View</button>
              <button className="px-2 py-1 bg-[var(--orange)] text-white text-[10px] rounded">Regenerate</button>
            </div>
          </div>
          <div className="bg-[var(--black)] p-2 rounded">
            <p className="text-white font-semibold text-xs mb-1">robots.txt</p>
            <textarea
              className="w-full bg-[var(--dark-gray)] border border-white/10 text-white/70 px-2 py-1.5 font-mono text-[10px] h-24 resize-none rounded"
              defaultValue={`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://basktball.com/sitemap.xml`}
            />
            <button className="mt-1 px-2 py-1 bg-[var(--orange)] text-white text-[10px] rounded">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
