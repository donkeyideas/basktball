"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  name: string;
  description: string;
  schedule: string;
  lastRun: string;
  nextRun: string;
  status: "running" | "success" | "failed" | "idle";
  duration?: number;
  enabled: boolean;
}

const mockJobs: Job[] = [
  {
    id: "1",
    name: "fetch-live-scores",
    description: "Fetch live game scores from APIs",
    schedule: "*/2 * * * *",
    lastRun: "2024-01-15T14:30:00Z",
    nextRun: "2024-01-15T14:32:00Z",
    status: "success",
    duration: 1200,
    enabled: true,
  },
  {
    id: "2",
    name: "daily-sync",
    description: "Full daily data synchronization",
    schedule: "0 5 * * *",
    lastRun: "2024-01-15T05:00:00Z",
    nextRun: "2024-01-16T05:00:00Z",
    status: "success",
    duration: 45000,
    enabled: true,
  },
  {
    id: "3",
    name: "generate-insights",
    description: "Generate AI content for recent games",
    schedule: "0 6 * * *",
    lastRun: "2024-01-15T06:00:00Z",
    nextRun: "2024-01-16T06:00:00Z",
    status: "running",
    enabled: true,
  },
  {
    id: "4",
    name: "update-standings",
    description: "Update league standings",
    schedule: "0 */4 * * *",
    lastRun: "2024-01-15T12:00:00Z",
    nextRun: "2024-01-15T16:00:00Z",
    status: "success",
    duration: 3500,
    enabled: true,
  },
  {
    id: "5",
    name: "cleanup-cache",
    description: "Clean expired cache entries",
    schedule: "0 */6 * * *",
    lastRun: "2024-01-15T12:00:00Z",
    nextRun: "2024-01-15T18:00:00Z",
    status: "idle",
    enabled: false,
  },
];

const mockJobHistory = [
  { id: "1", jobName: "fetch-live-scores", status: "success", startedAt: "2024-01-15T14:30:00Z", duration: 1200 },
  { id: "2", jobName: "fetch-live-scores", status: "success", startedAt: "2024-01-15T14:28:00Z", duration: 1150 },
  { id: "3", jobName: "update-standings", status: "success", startedAt: "2024-01-15T12:00:00Z", duration: 3500 },
  { id: "4", jobName: "daily-sync", status: "success", startedAt: "2024-01-15T05:00:00Z", duration: 45000 },
  { id: "5", jobName: "generate-insights", status: "failed", startedAt: "2024-01-14T06:00:00Z", duration: 12000, error: "API rate limit exceeded" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState(mockJobs);

  const toggleJob = (id: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, enabled: !job.enabled } : job
      )
    );
  };

  const runJob = (id: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: "running" as const } : job
      )
    );
    // Simulate job completion
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === id ? { ...job, status: "success" as const, lastRun: new Date().toISOString() } : job
        )
      );
    }, 2000);
  };

  const getStatusColor = (status: Job["status"]) => {
    switch (status) {
      case "running":
        return "bg-blue-500";
      case "success":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "idle":
        return "bg-gray-500";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
          BACKGROUND JOBS
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Manage scheduled tasks and background processes
        </p>
      </div>

      {/* Jobs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {jobs.map((job) => (
          <Card key={job.id} variant="default" className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{job.name}</h3>
                <p className="text-white/50 text-sm">{job.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", getStatusColor(job.status))} />
                <span className="text-xs text-white/60 capitalize">{job.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-white/40 text-xs">Schedule</p>
                <p className="text-white font-mono">{job.schedule}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs">Last Duration</p>
                <p className="text-white">{formatDuration(job.duration)}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs">Last Run</p>
                <p className="text-white">{new Date(job.lastRun).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs">Next Run</p>
                <p className="text-white">{new Date(job.nextRun).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={job.enabled}
                  onChange={() => toggleJob(job.id)}
                  className="accent-[var(--orange)]"
                />
                <span className="text-sm text-white/70">Enabled</span>
              </label>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => runJob(job.id)}
                disabled={job.status === "running"}
                isLoading={job.status === "running"}
              >
                {job.status === "running" ? "RUNNING..." : "RUN NOW"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Job History */}
      <Card variant="default" className="overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h2 className="font-bold text-white">Recent Job History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--dark-gray)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">JOB</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">STARTED</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">DURATION</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">ERROR</th>
              </tr>
            </thead>
            <tbody>
              {mockJobHistory.map((run, i) => (
                <tr
                  key={run.id}
                  className={cn(
                    "border-t border-white/10",
                    i % 2 === 0 ? "bg-[var(--black)]" : "bg-[var(--dark-gray)]"
                  )}
                >
                  <td className="px-4 py-3 text-white text-sm">{run.jobName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5",
                        run.status === "success"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70 text-sm">
                    {new Date(run.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white/70 text-sm">
                    {formatDuration(run.duration)}
                  </td>
                  <td className="px-4 py-3 text-red-400 text-sm">
                    {(run as { error?: string }).error || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
