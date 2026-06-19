"use client";

import React from "react";
import { Layers, Globe, Wind, Smartphone, Cpu, Terminal, Apple } from "lucide-react";
import { motion } from "framer-motion";
import NestjsIcon from "@/components/NestjsIcon";

const TECH_ITEMS = [
  { name: "OkHttp3", icon: Layers, color: "text-info-blue" },
  { name: "NestJS", icon: null, isNest: true, color: "text-[#e0234e]" },
  { name: "WebView", icon: Globe, color: "text-emerald-400" },
  { name: "Flutter", icon: Wind, color: "text-sky-400" },
  { name: "React Native", icon: Smartphone, color: "text-indigo-400" },
  { name: "Frida", icon: Cpu, color: "text-yellow-400" },
  { name: "Android SDK", icon: Terminal, color: "text-green-400" },
  { name: "iOS", icon: Apple, color: "text-white" }
];

interface TechStackProps {
  t: {
    tag: string;
    title: string;
    subtitle: string;
  };
}

export default function TechStack({ t }: TechStackProps) {
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

        {/* Tech Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {TECH_ITEMS.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className="bg-surface border border-border-custom hover:border-accent-green rounded-[6px] p-5 flex flex-col items-center justify-center text-center space-y-3 transition-colors group"
              >
                <div className={`h-10 w-10 flex items-center justify-center rounded-[6px] bg-background border border-border-custom group-hover:border-accent-green transition-colors ${item.color}`}>
                  {item.isNest ? (
                    <NestjsIcon className="h-6 w-6" />
                  ) : (
                    IconComponent && <IconComponent className="h-5 w-5" />
                  )}
                </div>
                <span className="font-mono text-xs font-bold text-white tracking-wide group-hover:text-accent-green transition-colors">
                  {item.name}
                </span>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
