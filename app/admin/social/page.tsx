"use client";

import { useState } from "react";
import GeneratorTab from "./tabs/GeneratorTab";
import QueueTab from "./tabs/QueueTab";
import PublishedTab from "./tabs/PublishedTab";
import AutomationTab from "./tabs/AutomationTab";
import ConnectionsTab from "./tabs/ConnectionsTab";

const TABS = [
  { id: "generator", label: "Generator" },
  { id: "queue", label: "Queue" },
  { id: "published", label: "Published" },
  { id: "automation", label: "Automation" },
  { id: "connections", label: "Connections" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SocialPostsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("generator");

  return (
    <>
      <div className="admin-header">
        <h1>SOCIAL MEDIA</h1>
      </div>

      <div className="admin-content">
        <div className="seo-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`seo-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "24px" }}>
          {activeTab === "generator" && <GeneratorTab />}
          {activeTab === "queue" && <QueueTab />}
          {activeTab === "published" && <PublishedTab />}
          {activeTab === "automation" && <AutomationTab />}
          {activeTab === "connections" && <ConnectionsTab />}
        </div>
      </div>
    </>
  );
}
