"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Download, Menu, X, Terminal, Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GithubIcon from "@/components/GithubIcon";
import { translations, Locale } from "@/lib/translations";
import { RepoStats } from "@/lib/github";

interface NavbarProps {
  stats?: RepoStats;
}

const LANGUAGES: { code: Locale; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "pt", name: "Português", flag: "🇵🇹" }
];

export default function Navbar({ stats }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Detect current locale
  const lang: Locale = (LANGUAGES.find((l) => pathname.startsWith(`/${l.code}/`) || pathname === `/${l.code}`)?.code ?? "en") as Locale;
  const t = translations[lang].nav;
  const activeLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const handleLanguageChange = (newLang: Locale) => {
    if (lang === newLang) return;
    const segments = pathname.split("/");
    // segments[0] is "", segments[1] is the locale prefix
    segments[1] = newLang;
    const newPath = segments.join("/");
    router.push(newPath);
    setShowDropdown(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-custom bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`/${lang}`} className="flex items-center gap-2 font-mono text-lg font-bold tracking-widest text-text-primary hover:text-accent-green transition-colors">
            <Terminal className="h-5 w-5 text-accent-green" />
            <span>TRAFEXIA</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-mono text-sm">
            <Link href={`/${lang}/#features`} className="text-text-muted hover:text-accent-green transition-colors">
              {t.features}
            </Link>
            <Link href={`/${lang}/docs`} className="text-text-muted hover:text-accent-green transition-colors">
              {t.docs}
            </Link>
            <Link href={`/${lang}/#download`} className="text-text-muted hover:text-accent-green transition-colors">
              {t.download}
            </Link>
          </nav>

          {/* Actions: GitHub Star, Language Selector & CTA (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 border border-border-custom bg-surface px-3 py-1.5 rounded-[6px] font-mono text-xs text-text-muted hover:text-white transition-all hover:border-text-muted focus:outline-none"
              >
                <Globe className="h-3.5 w-3.5 text-accent-green" />
                <span>{activeLang.flag} {activeLang.code.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 border border-border-custom bg-surface rounded-[6px] shadow-2xl overflow-hidden py-1 z-50 font-mono text-xs"
                  >
                    <div className="grid grid-cols-1 max-h-60 overflow-y-auto">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => handleLanguageChange(l.code)}
                          className={`flex items-center gap-2 px-3 py-2 text-left hover:bg-background transition-colors ${
                            lang === l.code ? "text-accent-green font-bold bg-background/50" : "text-text-muted hover:text-white"
                          }`}
                        >
                          <span>{l.flag}</span>
                          <span>{l.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a
              href="https://github.com/danieldev23/trafexia"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-border-custom bg-surface px-3 py-1.5 text-xs text-text-muted hover:text-white rounded-[6px] hover:border-text-muted transition-all"
            >
              <GithubIcon className="h-4 w-4" />
              <span>{t.stars}</span>
              <span className="h-4 w-[1px] bg-border-custom" />
              <span className="text-accent-green font-semibold">★ {stats?.stars ?? 833}</span>
            </a>
            
            <Link
              href={`/${lang}/#download`}
              className="flex items-center gap-1.5 bg-accent-green px-4 py-1.5 text-sm font-bold text-background hover:bg-accent-green/90 transition-all rounded-[6px]"
            >
              <Download className="h-4 w-4" />
              <span>{t.cta}</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 text-text-muted hover:text-white focus:outline-none"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t border-border-custom bg-surface"
          >
            <div className="space-y-1 px-4 py-4 font-mono text-sm">
              <Link
                href={`/${lang}/#features`}
                onClick={toggleMenu}
                className="block py-2 text-text-muted hover:text-accent-green transition-colors"
              >
                {t.features}
              </Link>
              <Link
                href={`/${lang}/docs`}
                onClick={toggleMenu}
                className="block py-2 text-text-muted hover:text-accent-green transition-colors"
              >
                {t.docs}
              </Link>
              <Link
                href={`/${lang}/#download`}
                onClick={toggleMenu}
                className="block py-2 text-text-muted hover:text-accent-green transition-colors"
              >
                {t.download}
              </Link>
              
              {/* Language Selector (Mobile grid) */}
              <div className="py-3 border-t border-b border-border-custom/30 my-2">
                <span className="text-text-muted text-xs flex items-center gap-1.5 mb-2 px-1">
                  <Globe className="h-4 w-4" /> Language / Ngôn ngữ
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { handleLanguageChange(l.code); toggleMenu(); }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors ${
                        lang === l.code ? "text-accent-green bg-background font-bold border border-accent-green/20" : "text-text-muted hover:text-white"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <a
                  href="https://github.com/danieldev23/trafexia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 border border-border-custom bg-background py-2 text-xs text-text-muted hover:text-white rounded-[6px] transition-all"
                >
                  <GithubIcon className="h-4 w-4" />
                  <span>{t.stars}</span>
                  <span className="h-4 w-[1px] bg-border-custom" />
                  <span className="text-accent-green font-semibold">★ {stats?.stars ?? 833}</span>
                </a>
                <Link
                  href={`/${lang}/#download`}
                  onClick={toggleMenu}
                  className="flex items-center justify-center gap-1.5 bg-accent-green py-2 text-sm font-bold text-background hover:bg-accent-green/90 transition-all rounded-[6px]"
                >
                  <Download className="h-4 w-4" />
                  <span>{t.cta}</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
