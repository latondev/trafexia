"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  code: string;
}

export default function CopyButton({ code }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="absolute top-3 right-3 p-1.5 rounded-[6px] border border-border-custom bg-background text-text-muted hover:text-white hover:border-text-muted transition-all z-20"
      aria-label="Copy code snippet"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-accent-green" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
