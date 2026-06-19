import React from "react";
import Navbar from "@/components/Navbar";
import DocsSidebar from "@/components/DocsSidebar";
import { getRepoStats } from "@/lib/github";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await getRepoStats();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar stats={stats} />
      <div className="flex-grow bg-background border-b border-border-custom">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <DocsSidebar />

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
