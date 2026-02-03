"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  name: string;
  description: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string | null;
  status: string;
  duration: number | null;
  enabled: boolean;
  error: string | null;
}

interface JobHistory {
  id: string;
  jobName: string;
  status: string;
  startedAt: string;
  duration: number | null;
  error: string | null;
}

interface JobsData {
  success: boolean;
  jobs: Job[];
  history: JobHistory[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function JobsPage() {
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());

  const { data, isLoading } = useSWR<JobsData>("/api/admin/jobs", fetcher, {
    refreshInterval: 10000,
  });

  const jobs = data?.jobs || [];
  const history = data?.history || [];

  const runJob = async (jobName: string) => {
    setRunningJobs((prev) => new Set(prev).add(jobName));
    setTimeout(() => {
      setRunningJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobName);
        return next;
      });
      mutate("/api/admin/jobs");
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-blue-500";
      case "success": return "bg-green-500";
      case "failed": return "bg-red-500";
      case "idle": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white">
          BACKGROUND JOBS
        </h1>
        <span className="text-[10px] text-white/40 uppercase">
          {jobs.length} jobs configured
        </span>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 mb-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[var(--dark-gray)] p-2 rounded animate-pulse">
                <div className="h-4 w-20 bg-white/10 rounded mb-1" />
                <div className="h-3 w-28 bg-white/10 rounded mb-2" />
                <div className="flex gap-1">
                  <div className="h-6 flex-1 bg-white/10 rounded" />
                  <div className="h-6 w-12 bg-white/10 rounded" />
                </div>
              </div>
            ))
          : jobs.map((job) => {
              const isRunning = runningJobs.has(job.name);
              return (
                <div key={job.id} className="bg-[var(--dark-gray)] p-2 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white text-xs truncate">
                      {job.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isRunning ? "bg-blue-500 animate-pulse" : getStatusColor(job.status)
                        )}
                      />
                    </div>
                  </div>
                  <p className="text-white/40 text-[10px] truncate mb-1">{job.description}</p>

                  <div className="grid grid-cols-2 gap-1 text-[10px] mb-2">
                    <div>
                      <span className="text-white/30">Sched:</span>
                      <span className="text-white/60 ml-1 font-mono">{job.schedule}</span>
                    </div>
                    <div>
                      <span className="text-white/30">Dur:</span>
                      <span className="text-white/60 ml-1">{formatDuration(job.duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={job.enabled}
                        onChange={() => {}}
                        className="accent-[var(--orange)] w-3 h-3"
                      />
                      <span className="text-[10px] text-white/50">On</span>
                    </label>
                    <button
                      onClick={() => runJob(job.name)}
                      disabled={isRunning}
                      className={cn(
                        "px-2 py-0.5 text-[10px] rounded transition-colors",
                        isRunning
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-[var(--orange)]/20 text-[var(--orange)] hover:bg-[var(--orange)]/30"
                      )}
                    >
                      {isRunning ? "..." : "RUN"}
                    </button>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Job History Table */}
      <div className="flex-1 min-h-0 bg-[var(--dark-gray)] rounded overflow-hidden flex flex-col">
        <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-white text-xs uppercase tracking-wide">Job History</h2>
          <span className="text-[10px] text-white/40">{history.length} runs</span>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--dark-gray)]">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-white/50 uppercase">Job</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-white/50 uppercase">Status</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-white/50 uppercase">Started</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-white/50 uppercase">Duration</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-white/50 uppercase">Error</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-2 py-1.5"><div className="h-3 w-20 bg-white/10 rounded animate-pulse" /></td>
                    <td className="px-2 py-1.5"><div className="h-3 w-12 bg-white/10 rounded animate-pulse" /></td>
                    <td className="px-2 py-1.5"><div className="h-3 w-24 bg-white/10 rounded animate-pulse" /></td>
                    <td className="px-2 py-1.5"><div className="h-3 w-10 bg-white/10 rounded animate-pulse" /></td>
                    <td className="px-2 py-1.5"><div className="h-3 w-6 bg-white/10 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-white/30 text-xs">
                    No job history
                  </td>
                </tr>
              ) : (
                history.map((run, i) => (
                  <tr
                    key={run.id}
                    className={cn(
                      "border-t border-white/5",
                      i % 2 === 0 ? "bg-[var(--black)]/30" : ""
                    )}
                  >
                    <td className="px-2 py-1.5 text-white">{run.jobName}</td>
                    <td className="px-2 py-1.5">
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded",
                          run.status === "success"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        )}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-white/60">
                      {new Date(run.startedAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-white/60 font-mono">
                      {formatDuration(run.duration)}
                    </td>
                    <td className="px-2 py-1.5 text-red-400 truncate max-w-[100px]">
                      {run.error || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
