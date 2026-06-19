"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X, BookOpen } from "lucide-react";
import { DOCS_NAVIGATION } from "@/lib/seo";

export default function DocsSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Detect current locale from pathname segment
  const segments = pathname.split("/");
  const lang = segments[1] || "en";

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between border-b border-border-custom bg-surface px-4 py-3 sticky top-16 z-30">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2 font-mono text-xs text-text-primary focus:outline-none"
        >
          <Menu className="h-4 w-4 text-accent-green" />
          <span>{lang === "vi" ? "XEM MỤC LỤC" : "VIEW OUTLINE"}</span>
        </button>
        <div className="font-mono text-xs text-accent-green font-bold flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          <span>DOCS</span>
        </div>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:sticky top-[113px] md:top-24 left-0 w-full md:w-64 h-[calc(100vh-113px)] md:h-[calc(100vh-96px)] bg-background md:bg-transparent border-r border-border-custom md:border-0 z-40 transition-transform duration-300 md:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 md:p-0 h-full overflow-y-auto space-y-6">
          <div className="flex items-center justify-between md:hidden pb-4 border-b border-border-custom">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              {lang === "vi" ? "Danh mục" : "Contents"}
            </h3>
            <button onClick={toggleSidebar}>
              <X className="h-5 w-5 text-text-muted hover:text-white" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-xs font-bold text-text-muted uppercase tracking-widest px-2">
              {lang === "vi" ? "HƯỚNG DẪN" : "DOCUMENTATION"}
            </h3>
            <nav className="space-y-1 font-mono text-xs">
              {DOCS_NAVIGATION.map((item) => {
                const href = `/${lang}/docs/${item.slug}`;
                const isActive = pathname === href || (pathname === `/${lang}/docs` && item.slug === "getting-started");

                return (
                  <Link
                    key={item.slug}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-[6px] transition-all ${
                      isActive
                        ? "bg-accent-green/5 text-accent-green font-bold border border-accent-green/20"
                        : "text-text-muted hover:text-text-primary hover:bg-surface border border-transparent"
                    }`}
                  >
                    <span>{item.title}</span>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-accent-green" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        />
      )}
    </>
  );
}
