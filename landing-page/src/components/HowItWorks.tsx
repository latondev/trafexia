"use client";

import React from "react";
import { Play, QrCode, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { translations } from "@/lib/translations";

interface HowItWorksProps {
  t: typeof translations.en.howItWorks;
}

export default function HowItWorks({ t }: HowItWorksProps) {
  const stepsList = [
    {
      num: "01",
      icon: Play,
      title: t.step1_title,
      desc: t.step1_desc
    },
    {
      num: "02",
      icon: QrCode,
      title: t.step2_title,
      desc: t.step2_desc
    },
    {
      num: "03",
      icon: Wifi,
      title: t.step3_title,
      desc: t.step3_desc
    }
  ];

  return (
    <section className="py-20 bg-background border-b border-border-custom relative overflow-hidden">
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

        {/* Steps container */}
        <div className="relative">
          {/* Connector Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-[1px] bg-border-custom -translate-y-1/2 z-0" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {stepsList.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="bg-surface border border-border-custom p-6 rounded-[6px] relative flex flex-col items-center text-center space-y-4"
                >
                  {/* Step Number Tag (top right) */}
                  <span className="absolute top-3 right-4 font-mono text-xs font-bold text-accent-green/40">
                    {step.num}
                  </span>

                  {/* Icon Circle */}
                  <div className="flex items-center justify-center h-12 w-12 rounded-[6px] bg-background border border-border-custom text-accent-green">
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Title */}
                  <h3 className="font-mono text-base font-bold text-white">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-text-muted font-sans leading-relaxed max-w-xs">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
