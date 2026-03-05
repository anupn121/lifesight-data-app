"use client";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import AddIntegrationPage from "@/components/integrations-monitoring/AddIntegrationPage";

export default function AddIntegrationRoute() {
  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-4 pt-4">
          <div className="pb-8">
            <AddIntegrationPage />
          </div>
        </main>
      </div>
    </div>
  );
}
