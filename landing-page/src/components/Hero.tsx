"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Download, ShieldAlert, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GithubIcon from "@/components/GithubIcon";
import { translations } from "@/lib/translations";
import { RepoStats } from "@/lib/github";

interface LogItem {
  id: number;
  method: string;
  host: string;
  path: string;
  status: number;
  size: string;
}

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const HOSTS = [
  "api.instagram.com",
  "google-analytics.com",
  "auth.spotify.com",
  "api.github.com",
  "identity.apple.com",
  "graph.facebook.com",
  "api.stripe.com",
  "api.openai.com/v1"
];
const PATHS = [
  "/v1/auth/session",
  "/track/event",
  "/user/profile",
  "/checkout/sessions",
  "/repos/trafexia",
  "/devices/register",
  "/chat/completions"
];
const STATUSES = [200, 200, 201, 304, 401, 403, 500];

function generateRandomLog(id: number): LogItem {
  const method = METHODS[Math.floor(Math.random() * METHODS.length)];
  const host = HOSTS[Math.floor(Math.random() * HOSTS.length)];
  const path = PATHS[Math.floor(Math.random() * PATHS.length)];
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  
  let size = `${(Math.random() * 5).toFixed(1)} kB`;
  if (Math.random() > 0.7) {
    size = `${Math.floor(Math.random() * 800) + 100} B`;
  }

  return { id, method, host, path, status, size };
}

interface HeroProps {
  t: typeof translations.en.hero;
  stats?: RepoStats;
}

export default function Hero({ t, stats }: HeroProps) {
  const [logs, setLogs] = useState<LogItem[]>([]);

  // Initialize initial logs and start stream interval on client
  useEffect(() => {
    // Generate initial logs
    let currentId = 0;
    const initialLogs = Array.from({ length: 6 }, () => {
      currentId++;
      return generateRandomLog(currentId);
    });
    setLogs(initialLogs);

    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextId = prev.length > 0 ? prev[prev.length - 1].id + 1 : 1;
        const newLog = generateRandomLog(nextId);
        // Keep maximum 8 logs visible
        const updated = [...prev, newLog];
        if (updated.length > 8) {
          updated.shift();
        }
        return updated;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "text-accent-green";
      case "POST": return "text-info-blue";
      case "PUT": return "text-amber-400";
      case "DELETE": return "text-danger-red";
      default: return "text-fuchsia-400";
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-accent-green";
    if (status >= 300 && status < 400) return "text-text-muted";
    if (status >= 400 && status < 500) return "text-amber-400";
    return "text-danger-red";
  };

  return (
    <section className="relative border-b border-border-custom bg-background scanlines py-20 lg:py-28 overflow-hidden">
      {/* Decorative grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E1E24_1px,transparent_1px),linear-gradient(to_bottom,#1E1E24_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events:none" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tagline / Intercept Badge */}
            <div className="inline-flex items-center gap-3 border border-border-custom bg-surface px-3 py-1 rounded-[6px]">
              <span className="font-mono text-xs font-semibold text-accent-green tracking-wider uppercase">
                {t.tag}
              </span>
              <span className="h-3 w-[1px] bg-border-custom" />
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-danger-red animate-blink" />
                <span className="font-mono text-[10px] font-bold text-danger-red tracking-widest uppercase">
                  {t.badge}
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Intercept.<br />
              <span className="text-accent-green">Decode.</span> Reverse.
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-text-muted font-sans max-w-xl">
              {t.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="#download"
                className="flex items-center gap-2 bg-accent-green border border-accent-green text-background px-6 py-3 font-mono font-bold text-sm rounded-[6px] hover:bg-transparent hover:text-accent-green transition-all"
              >
                <Download className="h-4 w-4" />
                <span>{t.cta_mac}</span>
              </Link>
              <a
                href="https://github.com/danieldev23/trafexia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-border-custom bg-surface text-text-primary px-6 py-3 font-mono font-bold text-sm rounded-[6px] hover:border-accent-green hover:text-accent-green transition-all"
              >
                <GithubIcon className="h-4 w-4" />
                <span>{t.cta_github}</span>
              </a>
            </div>

            {/* Stats */}
            <div className="border-t border-border-custom pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs text-text-muted">
              <div>
                <span className="block text-white font-bold text-sm">{stats?.stars ?? 833}</span>
                <span>{t.stars}</span>
              </div>
              <div>
                <span className="block text-white font-bold text-sm">{stats?.forks ?? 319}</span>
                <span>{t.forks}</span>
              </div>
              <div>
                <span className="block text-white font-bold text-sm">{stats?.version ?? "v1.0.8"}</span>
                <span>{t.release}</span>
              </div>
              <div>
                <span className="block text-white font-bold text-sm">MIT</span>
                <span>{t.license}</span>
              </div>
            </div>

          </div>

          {/* Log Stream Terminal Window (Right side) */}
          <div className="lg:col-span-5">
            <div className="border border-border-custom bg-surface shadow-2xl rounded-[6px] overflow-hidden">
              
              {/* Window Header */}
              <div className="flex items-center justify-between bg-[#0e0e11] px-4 py-3 border-b border-border-custom font-mono text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-danger-red/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-accent-green/60" />
                  <span className="text-text-muted ml-2 text-[11px]">MITM PROXY [PORT 8888]</span>
                </div>
                <div className="flex items-center gap-1.5 text-accent-green font-semibold">
                  <Cpu className="h-3 w-3 animate-pulse" />
                  <span className="text-[10px]">CAPTURING</span>
                </div>
              </div>

              {/* Terminal Logs Content (Fixed height, overflow-hidden for smooth transition) */}
              <div className="p-4 bg-background h-[300px] overflow-hidden font-mono text-xs leading-relaxed">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted space-y-2">
                    <ShieldAlert className="h-5 w-5 text-accent-green animate-pulse" />
                    <span>Listening for mobile traffic...</span>
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-end overflow-hidden pb-1 space-y-2.5">
                    <AnimatePresence initial={false} mode="popLayout">
                      {logs.map((log) => (
                        <motion.div
                          layout
                          key={log.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15, scale: 0.95 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            opacity: { duration: 0.15 }
                          }}
                          className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-custom/30 pb-1.5 last:border-0 last:pb-0"
                        >
                          <div className="flex items-start gap-2 overflow-hidden">
                            <span className={`font-extrabold select-none ${getMethodColor(log.method)}`}>
                              {log.method.padEnd(6)}
                            </span>
                            <div className="truncate">
                              <span className="text-text-primary font-semibold">{log.host}</span>
                              <span className="text-text-muted text-[11px] block sm:inline sm:ml-1 font-sans">{log.path}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-3 mt-1 sm:mt-0 ml-8 sm:ml-0 self-end sm:self-center select-none font-code-ligatures">
                            <span className={getStatusColor(log.status)}>{log.status}</span>
                            <span className="text-text-muted text-[10px]">{log.size}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
