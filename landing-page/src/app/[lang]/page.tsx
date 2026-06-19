import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import TechStack from "@/components/TechStack";
import DownloadSection from "@/components/DownloadSection";
import Footer from "@/components/Footer";
import { translations, Locale } from "@/lib/translations";
import { getRepoStats } from "@/lib/github";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function Home({ params }: PageProps) {
  const { lang } = (await params) as { lang: Locale };
  
  // Guard fallback in case lang is not a valid key
  const currentLang = translations[lang] ? lang : "en";
  const t = translations[currentLang];

  // Fetch live stats server-side (cached hourly)
  const stats = await getRepoStats();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar stats={stats} />
      <main className="flex-grow">
        <Hero t={t.hero} stats={stats} />
        <Features t={t.features} />
        <HowItWorks t={t.howItWorks} />
        <TechStack t={t.techStack} />
        <DownloadSection t={t.download} />
      </main>
      <Footer t={t.footer} />
    </div>
  );
}
