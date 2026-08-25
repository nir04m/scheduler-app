"use client";

import {
  CalendarCheck,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Lock,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import AvailabilityChip from "@/components/scheduler/availability-chip";
import {
  formatOptionLongDate,
  formatOptionTime,
} from "@/lib/date-time";
import { participantStatus } from "@/lib/poll-results";
import type { Poll } from "@/lib/types";

export default function FinalizedView({
  poll,
}: {
  poll: Poll;
}) {
  const [copied, setCopied] = useState(false);

  const option =
    poll.finalTimeOption ??
    poll.timeOptions.find(
      (item) => item.id === poll.finalTimeOptionId
    );

  if (!option) {
    
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-muted-foreground">
        This poll is finalized, but its selected time is unavailable.
      </div>
    );
  }

  const selectedOption = option;

  const yesCount = poll.participants.filter(
    (participant) =>
      participantStatus(participant, option.id) === "AVAILABLE"
  ).length;

  async function copyDetails() {
    const text = `${poll.title}\n${formatOptionLongDate(
      selectedOption,
      poll.timezone
    )}\n${formatOptionTime(selectedOption, poll.timezone)}\n${poll.timezone}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Meeting details copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to copy details");
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-foreground">
          <CalendarCheck size={24} className="text-background" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Meeting confirmed
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {poll.title}
        </p>
      </div>

      <div className="mb-4 rounded-2xl border-2 border-foreground bg-card p-7 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Selected time
        </p>
        <p className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {formatOptionLongDate(option, poll.timezone)}
        </p>
        <p className="mt-1 font-mono text-xl font-medium text-muted-foreground">
          {formatOptionTime(option, poll.timezone)}
        </p>
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Globe size={12} />
          {poll.timezone.replaceAll("_", " ")}
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-green-700">
            <CheckCircle2 size={12} />
            {yesCount} of {poll.participants.length} available
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={12} />
            {poll.participants.length} responses
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={copyDetails}
        className={`mb-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium ${
          copied
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-border bg-card hover:bg-accent"
        }`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy meeting details"}
      </button>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-3.5 text-xs text-muted-foreground">
        <Lock size={13} />
        Voting is closed for this poll.
      </div>

      {poll.participants.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Participants
          </p>
          <div className="space-y-1.5">
            {poll.participants.map((participant) => {
              const status = participantStatus(
                participant,
                option.id
              );

              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                >
                  <span className="text-sm font-medium">
                    {participant.name}
                  </span>
                  {status ? (
                    <AvailabilityChip value={status} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No response
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
