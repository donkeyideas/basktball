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
  status: "running" | "success" | "failed" | "paused" | "idle";
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
  const [togglingJobs, setTogglingJobs] = useState<Set<string>>(new Set());

  const { data, isLoading } = useSWR<JobsData>("/api/admin/jobs", fetcher, {
    refreshInterval: 10000,
  });

  const jobs = data?.jobs || [];
  const history = data?.history || [];

  const runJob = async (jobId: string, jobName: string) => {
    setRunningJobs((prev) => new Set(prev).add(jobId));
    try {
      await fetch(`/api/admin/jobs/${jobId}/run`, { method: "POST" });
      await mutate("/api/admin/jobs");
    } catch (error) {
      console.error("Run job error:", error);
    }
    setRunningJobs((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
  };

  const toggleJob = async (jobId: string, enabled: boolean) => {
    setTogglingJobs((prev) => new Set(prev).add(jobId));
    try {
      await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      await mutate("/api/admin/jobs");
    } catch (error) {
      console.error("Toggle job error:", error);
    }
    setTogglingJobs((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
  };

  const getStatusClass = (status: string, isRunning: boolean) => {
    if (isRunning) return "job-status running";
    switch (status) {
      case "running": return "job-status running";
      case "success": return "job-status success";
      case "failed": return "job-status failed";
      case "paused": return "job-status paused";
      default: return "job-status";
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Jobs Table Skeleton */}
        <div className="section mb-8">
          <div className="section-header">
            <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* History Skeleton */}
        <div className="section">
          <div className="section-header">
            <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="p-4">
            <div className="h-64 bg-white/10 rounded animate-pulse" />
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
          SCHEDULED JOBS
        </h1>
        <span className="text-sm text-white/40">
          {jobs.length} jobs configured
        </span>
      </div>

      {/* Jobs Table */}
      <div className="section mb-8">
        <div className="section-header">
          <h2 className="section-title">Job Configuration</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Name</th>
                <th>Schedule</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-white/30">
                    No jobs configured
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const isRunning = runningJobs.has(job.id);
                  const isToggling = togglingJobs.has(job.id);
                  return (
                    <tr key={job.id}>
                      <td>
                        <div>
                          <p className="text-white font-medium">{job.name}</p>
                          <p className="text-white/40 text-xs">{job.description}</p>
                        </div>
                      </td>
                      <td>
                        <code className="text-[var(--orange)] bg-[var(--orange)]/10 px-2 py-1 rounded text-xs">
                          {job.schedule}
                        </code>
                      </td>
                      <td className="text-white/60 text-sm">
                        {formatDate(job.lastRun)}
                        {job.duration && (
                          <span className="text-white/30 ml-2">
                            ({formatDuration(job.duration)})
                          </span>
                        )}
                      </td>
                      <td className="text-white/60 text-sm">
                        {formatDate(job.nextRun)}
                      </td>
                      <td>
                        <span className={getStatusClass(job.status, isRunning)}>
                          {isRunning ? "Running" : job.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => runJob(job.id, job.name)}
                            disabled={isRunning || !job.enabled}
                            className="btn-run"
                          >
                            {isRunning ? (
                              <>
                                <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Running
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                </svg>
                                Run Now
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => toggleJob(job.id, job.enabled)}
                            disabled={isToggling}
                            className={job.enabled ? "btn-pause" : "btn-run"}
                          >
                            {job.enabled ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pause
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                </svg>
                                Enable
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job History */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Job Execution History</h2>
          <span className="text-sm text-white/40">{history.length} executions</span>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-[var(--dark-gray)]">
              <tr>
                <th>Job</th>
                <th>Status</th>
                <th>Started</th>
                <th>Duration</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-white/30">
                    No execution history
                  </td>
                </tr>
              ) : (
                history.map((run) => (
                  <tr key={run.id}>
                    <td className="text-white font-medium">{run.jobName}</td>
                    <td>
                      <span
                        className={cn(
                          "job-status",
                          run.status === "success" ? "success" : "failed"
                        )}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="text-white/60 text-sm">
                      {new Date(run.startedAt).toLocaleString()}
                    </td>
                    <td className="font-[family-name:var(--font-roboto-mono)] text-white/60 text-sm">
                      {formatDuration(run.duration)}
                    </td>
                    <td className="text-[var(--red)] text-sm max-w-[200px] truncate">
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
