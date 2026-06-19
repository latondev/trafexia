"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal } from "lucide-react";
import { siteConfig } from "@/lib/seo";
import { translations } from "@/lib/translations";

interface FooterProps {
  t: typeof translations.en.footer;
}

export default function Footer({ t }: FooterProps) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const lang = pathname.split("/")[1] || "en";

  return (
    <footer className="bg-background border-t border-border-custom font-mono text-xs text-text-muted py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand Logo & Copyright */}
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4 text-accent-green" />
            <span>&copy; {currentYear} {siteConfig.name}. {t.copyright}</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href={`/${lang}/docs`} className="hover:text-accent-green transition-colors">
              {t.docs}
            </Link>
            <a
              href="https://github.com/danieldev23/trafexia"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-green transition-colors"
            >
              {t.github}
            </a>
            <a
              href="https://github.com/danieldev23/trafexia/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-green transition-colors"
            >
              {t.releases}
            </a>
            <a
              href="https://github.com/danieldev23/trafexia/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-green transition-colors"
            >
              {t.license}
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
