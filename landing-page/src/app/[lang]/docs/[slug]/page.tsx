import React from "react";
import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { DOCS_NAVIGATION, siteConfig } from "@/lib/seo";
import CopyButton from "@/components/CopyButton";
import { Locale } from "@/lib/translations";

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

const ALL_LOCALES = ["en", "vi", "zh", "ja", "ko", "es", "fr", "de", "ru", "pt"];

export async function generateStaticParams() {
  const paramsList: { lang: string; slug: string }[] = [];
  ALL_LOCALES.forEach((lang) => {
    DOCS_NAVIGATION.forEach((item) => {
      paramsList.push({ lang, slug: item.slug });
    });
  });
  return paramsList;
}

export async function generateMetadata({ params }: PageProps) {
  const { lang, slug } = (await params) as { lang: Locale; slug: string };
  const item = DOCS_NAVIGATION.find((n) => n.slug === slug);
  if (!item) return {};

  return {
    title: item.title,
    description: lang === "vi" 
      ? `${item.title} — Hướng dẫn chi tiết cấu hình và sử dụng Trafexia.`
      : `${item.title} — Detailed setup and usage guide for Trafexia.`,
    alternates: {
      canonical: `/docs/${slug}`,
    },
    openGraph: {
      title: `${item.title} — ${siteConfig.name}`,
      description: lang === "vi" 
        ? `${item.title} — Hướng dẫn chi tiết cấu hình và sử dụng Trafexia.`
        : `${item.title} — Detailed setup and usage guide for Trafexia.`,
      url: `${siteConfig.url}/${lang}/docs/${slug}`,
    }
  };
}

// Custom components inside MDX files with strict TypeScript
const mdxComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-3xl font-mono font-bold mt-8 mb-6 border-b border-border-custom pb-3 text-white tracking-tight" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = props.children?.toString() || "";
    const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    return (
      <h2
        id={id}
        className="text-xl font-mono font-bold mt-8 mb-4 text-white border-l-2 border-accent-green pl-3 scroll-mt-24"
        {...props}
      />
    );
  },
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = props.children?.toString() || "";
    const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    return (
      <h3
        id={id}
        className="text-lg font-mono font-bold mt-6 mb-3 text-white scroll-mt-24"
        {...props}
      />
    );
  },
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-sm text-text-muted leading-relaxed mb-4 font-sans" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-5 mb-4 text-sm text-text-muted font-sans space-y-2" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-5 mb-4 text-sm text-text-muted font-sans space-y-2" {...props} />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => <li className="mb-1" {...props} />,
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="bg-surface border border-border-custom rounded px-1.5 py-0.5 text-[11px] text-accent-green font-code font-code-ligatures" {...props} />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => {
    const codeElement = props.children as React.ReactElement<{ children?: string }>;
    const codeText = codeElement?.props?.children || "";
    const cleanCode = typeof codeText === "string" ? codeText.trim() : "";
    return (
      <div className="relative group my-6">
        <CopyButton code={cleanCode} />
        <pre className="bg-surface border border-border-custom p-4 rounded-[6px] text-xs text-text-primary overflow-x-auto font-code font-code-ligatures leading-relaxed">
          {codeElement}
        </pre>
      </div>
    );
  },
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => <hr className="border-border-custom my-8" {...props} />,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-accent-green hover:underline font-mono text-xs" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => {
    const children = props.children;
    let text = "";
    
    // Safe child extraction without 'any'
    if (React.isValidElement(children) && children.props) {
      const childProps = children.props as { children?: React.ReactNode };
      const inner = childProps.children;
      if (Array.isArray(inner)) {
        text = inner.map((c) => {
          if (typeof c === 'string') return c;
          if (React.isValidElement(c) && c.props) {
            const nodeProps = c.props as { children?: React.ReactNode };
            return typeof nodeProps.children === 'string' ? nodeProps.children : '';
          }
          return '';
        }).join('');
      } else if (typeof inner === 'string') {
        text = inner;
      }
    }

    const isWarning = text.includes("[!WARNING]");
    const isImportant = text.includes("[!IMPORTANT]");
    const isTip = text.includes("[!TIP]");
    const isNote = text.includes("[!NOTE]");

    if (isWarning || isImportant || isTip || isNote) {
      let title = "NOTE";
      let borderColor = "border-info-blue";
      let textColor = "text-info-blue";
      let bg = "bg-info-blue/5";
      
      if (isWarning) {
        title = "WARNING";
        borderColor = "border-danger-red";
        textColor = "text-danger-red";
        bg = "bg-danger-red/5";
      } else if (isImportant) {
        title = "IMPORTANT";
        borderColor = "border-danger-red";
        textColor = "text-danger-red";
        bg = "bg-danger-red/5";
      } else if (isTip) {
        title = "TIP";
        borderColor = "border-accent-green";
        textColor = "text-accent-green";
        bg = "bg-accent-green/5";
      }

      // Strip tag marker safely
      const cleanChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props) {
          const nodeProps = child.props as { children?: React.ReactNode };
          const innerChildren = nodeProps.children;
          return React.cloneElement(child, {
            children: React.Children.map(innerChildren, (innerChild) => {
              if (typeof innerChild === 'string') {
                return innerChild
                  .replace("[!WARNING]", "")
                  .replace("[!IMPORTANT]", "")
                  .replace("[!TIP]", "")
                  .replace("[!NOTE]", "")
                  .trim();
              }
              return innerChild;
            })
          } as React.Attributes);
        }
        return child;
      });

      return (
        <div className={`border-l-4 ${borderColor} ${bg} p-4 my-6 rounded-r-[6px] space-y-1`}>
          <div className={`font-mono text-[10px] font-extrabold tracking-wider ${textColor}`}>
            {title}
          </div>
          <div className="text-xs text-text-muted font-sans leading-relaxed">
            {cleanChildren}
          </div>
        </div>
      );
    }

    return (
      <blockquote className="border-l-4 border-border-custom bg-surface p-4 my-6 rounded-r-[6px] text-xs text-text-muted font-sans italic">
        {children}
      </blockquote>
    );
  }
};

interface HeadingItem {
  text: string;
  id: string;
  level: number;
}

// Helper to parse headings for the on-page table of contents
function parseHeadings(content: string): HeadingItem[] {
  const lines = content.split("\n");
  const headings: HeadingItem[] = [];

  lines.forEach((line) => {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      headings.push({ text, id, level });
    }
  });

  return headings;
}

export default async function DocItemPage({ params }: PageProps) {
  const { lang, slug } = (await params) as { lang: Locale; slug: string };
  const currentIdx = DOCS_NAVIGATION.findIndex((item) => item.slug === slug);
  
  if (currentIdx === -1) {
    notFound();
  }

  const currentDoc = DOCS_NAVIGATION[currentIdx];

  // Resolve MDX file content matching the dynamic locale, fallback to English
  let filePath = path.join(
    process.cwd(),
    "src",
    "content",
    "docs",
    lang,
    `${slug}.mdx`
  );

  if (!fs.existsSync(filePath)) {
    // Fallback to English content
    filePath = path.join(
      process.cwd(),
      "src",
      "content",
      "docs",
      "en",
      `${slug}.mdx`
    );
    if (!fs.existsSync(filePath)) {
      notFound();
    }
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const headings = parseHeadings(fileContent);

  // Setup previous and next links
  const prevDoc = currentIdx > 0 ? DOCS_NAVIGATION[currentIdx - 1] : null;
  const nextDoc = currentIdx < DOCS_NAVIGATION.length - 1 ? DOCS_NAVIGATION[currentIdx + 1] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Article Body */}
      <article className="lg:col-span-9 space-y-8 min-w-0">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
          <Link href={`/${lang}`} className="hover:text-accent-green transition-colors">TRAFEXIA</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/${lang}/docs`} className="hover:text-accent-green transition-colors">DOCS</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white font-bold">{currentDoc.title}</span>
        </div>

        {/* Dynamic MDX rendering */}
        <div className="prose prose-invert max-w-none">
          <MDXRemote source={fileContent} components={mdxComponents} />
        </div>

        {/* Next and Previous buttons */}
        <div className="border-t border-border-custom pt-6 flex items-center justify-between gap-4 font-mono text-xs">
          {prevDoc ? (
            <Link
              href={`/${lang}/docs/${prevDoc.slug}`}
              className="flex items-center gap-2 text-text-muted hover:text-accent-green transition-all border border-border-custom hover:border-accent-green bg-surface px-4 py-2.5 rounded-[6px]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <div className="text-left">
                <span className="block text-[9px] text-text-muted/60 font-sans">
                  {lang === "vi" ? "TRƯỚC ĐÓ" : "PREVIOUS"}
                </span>
                <span>{prevDoc.title}</span>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextDoc ? (
            <Link
              href={`/${lang}/docs/${nextDoc.slug}`}
              className="flex items-center gap-2 text-text-muted hover:text-accent-green transition-all border border-border-custom hover:border-accent-green bg-surface px-4 py-2.5 rounded-[6px] ml-auto text-right"
            >
              <div className="text-right">
                <span className="block text-[9px] text-text-muted/60 font-sans">
                  {lang === "vi" ? "TIẾP THEO" : "NEXT"}
                </span>
                <span>{nextDoc.title}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </article>

      {/* On-Page Table of Contents (Right Sidebar) */}
      <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto font-mono text-xs">
        <div className="flex items-center gap-1.5 text-white font-bold tracking-wider uppercase border-b border-border-custom pb-2">
          <BookOpen className="h-3.5 w-3.5 text-accent-green" />
          <span>{lang === "vi" ? "MỤC LỤC TRANG" : "ON THIS PAGE"}</span>
        </div>
        {headings.length === 0 ? (
          <p className="text-text-muted text-[10px] italic">
            {lang === "vi" ? "Không có đề mục phụ" : "No sub-headings"}
          </p>
        ) : (
          <nav className="flex flex-col gap-2.5">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className={`text-text-muted hover:text-accent-green transition-colors leading-relaxed block ${
                  h.level === 3 ? "pl-4 text-[11px]" : "font-semibold text-xs"
                }`}
              >
                {h.text}
              </a>
            ))}
          </nav>
        )}
      </aside>

    </div>
  );
}
