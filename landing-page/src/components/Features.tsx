"use client";

import React from "react";
import { Shield, QrCode, Binary, Activity, Filter, FileOutput } from "lucide-react";
import { motion } from "framer-motion";
import { translations } from "@/lib/translations";

interface FeaturesProps {
  t: typeof translations.en.features;
}

export default function Features({ t }: FeaturesProps) {
  const featuresList = [
    {
      icon: Shield,
      title: t.mitm_title,
      desc: t.mitm_desc
    },
    {
      icon: QrCode,
      title: t.qr_title,
      desc: t.qr_desc
    },
    {
      icon: Binary,
      title: t.pattern_title,
      desc: t.pattern_desc
    },
    {
      icon: Activity,
      title: t.capture_title,
      desc: t.capture_desc
    },
    {
      icon: Filter,
      title: t.filter_title,
      desc: t.filter_desc
    },
    {
      icon: FileOutput,
      title: t.export_title,
      desc: t.export_desc
    }
  ];

  return (
    <section id="features" className="py-20 bg-background border-b border-border-custom relative scroll-mt-16">
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

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="group relative bg-surface border border-border-custom hover:border-accent-green rounded-[6px] p-6 bg-hex-grid transition-all duration-300"
              >
                {/* Accent glow on hover */}
                <div className="absolute inset-0 bg-accent-green/2 opacity-0 group-hover:opacity-100 rounded-[6px] transition-opacity duration-300 pointer-events-none" />

                <div className="relative space-y-4">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center h-10 w-10 bg-background border border-border-custom rounded-[6px] text-accent-green group-hover:border-accent-green group-hover:bg-accent-green/5 transition-colors duration-300">
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Title */}
                  <h3 className="font-mono text-base font-bold text-white group-hover:text-accent-green transition-colors duration-300">
                    {feat.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-text-muted font-sans leading-relaxed group-hover:text-text-primary transition-colors duration-300">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
