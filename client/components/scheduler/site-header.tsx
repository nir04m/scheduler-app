"use client";

import Link from "next/link";
import { CalendarCheck, Plus } from "lucide-react";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[#f6f5f3]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-foreground">
            <CalendarCheck size={14} className="text-background" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Scheduler
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Create poll</span>
        </Link>
      </div>
    </header>
  );
}
