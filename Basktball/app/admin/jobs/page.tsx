"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
    // Simulate job completion after 2 seconds
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
      case "running":
        return "bg-blue-500";
      case "success":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "idle":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
          BACKGROUND JOBS
        </h1>
        <p className="text-white/50 text-sm">
          Manage scheduled tasks and background processes
        </p>
      </div>

      {/* Jobs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} variant="default" className="p-3 animate-pulse">
                <div className="h-5 w-32 bg-white/10 rounded mb-2" />
                <div className="h-4 w-48 bg-white/10 rounded mb-3" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 bg-white/10 rounded" />
                  <div className="h-12 bg-white/10 rounded" />
                </div>
              </Card>
            ))
          : jobs.map((job) => {
              const isRunning = runningJobs.has(job.name);
              return (
                <Card key={job.id} variant="default" className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white text-sm">
                        {job.name}
                      </h3>
                      <p className="text-white/50 text-xs">{job.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          isRunning ? "bg-blue-500" : getStatusColor(job.status)
                        )}
                      />
                      <span className="text-xs text-white/60 capitalize">
                        {isRunning ? "running" : job.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <p className="text-white/40 text-[10px]">Schedule</p>
                      <p className="text-white font-mono">{job.schedule}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px]">Last Duration</p>
                      <p className="text-white">{formatDuration(job.duration)}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px]">Last Run</p>
                      <p className="text-white">
                        {job.lastRun
                          ? new Date(job.lastRun).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px]">Next Run</p>
                      <p className="text-white">
                        {job.nextRun
                          ? new Date(job.nextRun).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={job.enabled}
                        onChange={() => {}}
                        className="accent-[var(--orange)]"
                      />
                      <span className="text-sm text-white/70">Enabled</span>
                    </label>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => runJob(job.name)}
                      disabled={isRunning}
                      isLoading={isRunning}
                    >
                      {isRunning ? "RUNNING..." : "RUN NOW"}
                    </Button>
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Job History */}
      <Card variant="default" className="overflow-hidden">
        <div className="p-3 border-b border-white/10">
          <h2 className="font-semibold text-white text-sm">Recent Job History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--dark-gray)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                  JOB
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                  STATUS
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                  STARTED
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                  DURATION
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                  ERROR
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 bg-white/10 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30">
                    No job history available
                  </td>
                </tr>
              ) : (
                history.map((run, i) => (
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
                      {run.error || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
