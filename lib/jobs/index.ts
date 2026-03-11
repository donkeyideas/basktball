// Background Jobs Configuration
// Defines all scheduled jobs and their cron expressions

import { JobDefinition, scheduleJobs, runJobNow, getRecentJobRuns, getRunningJobs, isJobRunning } from "./runner";
import {
  fetchLiveScores,
  dailyDataSync,
  updateStandings,
  cleanupCache,
} from "./handlers";

// Job definitions with cron schedules
export const jobs: JobDefinition[] = [
  {
    name: "fetch-live-scores",
    description: "Fetch live scores from ESPN and BallDontLie APIs",
    schedule: "*/2 * * * *", // Every 2 minutes
    enabled: true,
    handler: fetchLiveScores,
  },
  {
    name: "daily-sync",
    description: "Sync teams and players from APIs",
    schedule: "0 5 * * *", // 5 AM daily
    enabled: true,
    handler: dailyDataSync,
  },
  {
    name: "update-standings",
    description: "Calculate and update league standings",
    schedule: "0 */4 * * *", // Every 4 hours
    enabled: true,
    handler: updateStandings,
  },
  {
    name: "cleanup-cache",
    description: "Clean up expired cache entries and old data",
    schedule: "0 */6 * * *", // Every 6 hours
    enabled: true,
    handler: cleanupCache,
  },
];

// Start all scheduled jobs
export function startJobScheduler(): void {
  console.log("Starting job scheduler...");
  scheduleJobs(jobs);
  console.log(`Scheduled ${jobs.filter((j) => j.enabled).length} jobs`);
}

// Run a specific job immediately
export async function triggerJob(jobName: string) {
  return runJobNow(jobs, jobName);
}

// Get job information
export function getJobInfo() {
  return jobs.map((job) => ({
    name: job.name,
    description: job.description,
    schedule: job.schedule,
    enabled: job.enabled,
    isRunning: isJobRunning(job.name),
  }));
}

// Re-export utilities
export { getRecentJobRuns, getRunningJobs, isJobRunning };
export type { JobResult, JobDefinition } from "./runner";
