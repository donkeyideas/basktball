"use client";

import { useState, useEffect } from "react";

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

interface HistoryItem {
  id: string;
  jobName: string;
  status: string;
  startedAt: string;
  duration: number | null;
  error: string | null;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  async function fetchJobs() {
    try {
      const res = await fetch("/api/admin/jobs");
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
        setHistory(data.history || []);
        setError(null);
      } else {
        setError(data.error || "Failed to load jobs");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  async function runJob(jobName: string) {
    setRunningJob(jobName);
    try {
      const res = await fetch("/api/admin/jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobName }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(`Job failed: ${data.error}`);
      }
      await fetchJobs();
    } catch {
      alert("Failed to run job");
    } finally {
      setRunningJob(null);
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "running": return "running";
      case "success": return "success";
      case "completed": return "success";
      case "failed": return "failed";
      case "error": return "failed";
      default: return "paused";
    }
  };

  return (
    <>
      <div className="admin-header">
        <h1>SCHEDULED JOBS</h1>
        <button className="btn btn-primary" onClick={fetchJobs}>
          Refresh
        </button>
      </div>

      <div className="admin-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading jobs...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Jobs Table */}
            <div className="section">
              <div className="section-title">Job Status</div>
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>JOB NAME</th>
                    <th>SCHEDULE</th>
                    <th>LAST RUN</th>
                    <th>NEXT RUN</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td>
                        <div style={{ fontWeight: "600" }}>{job.name}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                          {job.description}
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "14px" }}>
                        {job.schedule}
                      </td>
                      <td style={{ fontSize: "14px" }}>
                        {formatDateTime(job.lastRun)}
                        {job.duration && (
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                            Duration: {formatDuration(job.duration)}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "14px" }}>
                        {formatDateTime(job.nextRun)}
                      </td>
                      <td>
                        <span className={`job-status ${getStatusClass(job.status)}`}>
                          {job.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => runJob(job.name)}
                          disabled={runningJob === job.name}
                          style={{
                            padding: "6px 12px",
                            background: runningJob === job.name ? "rgba(255,107,53,0.5)" : "var(--orange)",
                            border: "none",
                            color: "var(--white)",
                            fontSize: "12px",
                            cursor: runningJob === job.name ? "wait" : "pointer"
                          }}
                        >
                          {runningJob === job.name ? "Running..." : "Run Now"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Job History */}
            <div className="section">
              <div className="section-title">Recent Execution History</div>
              <div className="activity-log" style={{ maxHeight: "400px" }}>
                {history.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.5)", padding: "20px" }}>
                    No job history available.
                  </p>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="activity-item">
                      <span className="activity-time" style={{ minWidth: "160px" }}>
                        {formatDateTime(item.startedAt)}
                      </span>
                      <div className="activity-content">
                        <strong>{item.jobName}</strong> - {" "}
                        <span className={`job-status ${getStatusClass(item.status)}`} style={{ display: "inline" }}>
                          {item.status.toUpperCase()}
                        </span>
                        {item.duration && (
                          <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "10px" }}>
                            ({formatDuration(item.duration)})
                          </span>
                        )}
                        {item.error && (
                          <div style={{ color: "var(--red)", fontSize: "12px", marginTop: "5px" }}>
                            Error: {item.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
