"use client";

import React from "react";
import { Download, Monitor, Terminal, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { translations } from "@/lib/translations";

interface DownloadSectionProps {
  t: typeof translations.en.download;
}

export default function DownloadSection({ t }: DownloadSectionProps) {
  const downloadsList = [
    {
      platform: "macOS",
      icon: Cpu,
      pkg: t.macos_pkg,
      archs: t.macos_archs,
      link: "https://github.com/danieldev23/trafexia/releases/latest"
    },
    {
      platform: "Windows",
      icon: Monitor,
      pkg: t.windows_pkg,
      archs: t.windows_archs,
      link: "https://github.com/danieldev23/trafexia/releases/latest"
    },
    {
      platform: "Linux",
      icon: Terminal,
      pkg: t.linux_pkg,
      archs: t.linux_archs,
      link: "https://github.com/danieldev23/trafexia/releases/latest"
    }
  ];

  return (
    <section id="download" className="py-20 bg-background border-b border-border-custom relative scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <h2 className="font-mono text-xs font-semibold text-accent-green tracking-widest uppercase">
            {t.tag}
          </h2>
          <p className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t.title}
          </p>
          <p className="text-text-muted text-base">
            {t.subtitle}
          </p>
        </div>

        {/* Download Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {downloadsList.map((dl, idx) => {
            const Icon = dl.icon;
            return (
              <motion.div
                key={dl.platform}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="bg-surface border border-border-custom hover:border-accent-green p-6 rounded-[6px] flex flex-col justify-between h-56 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-lg font-bold text-white group-hover:text-accent-green transition-colors">
                      {dl.platform}
                    </h3>
                    <Icon className="h-5 w-5 text-text-muted group-hover:text-accent-green transition-colors" />
                  </div>
                  <div className="font-mono text-xs text-text-muted space-y-1">
                    <p className="text-white">{dl.pkg}</p>
                    <p>{dl.archs}</p>
                  </div>
                </div>

                <a
                  href={dl.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-background border border-border-custom text-text-primary py-2.5 font-mono text-xs font-bold rounded-[6px] hover:bg-accent-green hover:text-background hover:border-accent-green transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>{t.cta}</span>
                </a>
              </motion.div>
            );
          })}
        </div>

        {/* Security Notice Card with Red Border */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="border border-danger-red bg-surface p-6 rounded-[6px] flex flex-col sm:flex-row items-start gap-4"
        >
          <div className="inline-flex items-center justify-center p-2 rounded-[6px] bg-danger-red/10 text-danger-red shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h4 className="font-mono text-sm font-bold text-danger-red uppercase tracking-wider">
              {t.warning_title}
            </h4>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              {t.warning_desc}
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
