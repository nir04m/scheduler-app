"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Link2,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { createPoll } from "@/lib/api";
import { zonedLocalToUtcIso } from "@/lib/date-time";
import { organizerStorageKey } from "@/lib/storage";
import type { CreatePollResponse } from "@/lib/types";

type TimeSlot = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
};

const TIMEZONES = [
  "America/Edmonton",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];

let nextSlotId = 1;

function newSlot(): TimeSlot {
  return {
    id: nextSlotId++,
    date: "",
    startTime: "",
    endTime: "",
  };
}

function formatDate(date: string) {
  if (!date) return "";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function CreatePollForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState("America/Edmonton");
  const [slots, setSlots] = useState<TimeSlot[]>(() => [newSlot()]);
  const [created, setCreated] = useState<CreatePollResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<"participant" | "organizer" | null>(null);

  function updateSlot(
    id: number,
    field: keyof Omit<TimeSlot, "id">,
    value: string
  ) {
    setSlots((current) =>
      current.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
  }

  function addSlot() {
    setSlots((current) => [...current, newSlot()]);
  }

  function removeSlot(id: number) {
    setSlots((current) =>
      current.filter((slot) => slot.id !== id)
    );
  }

  const canSubmit =
    title.trim().length > 0 &&
    slots.length > 0 &&
    slots.every(
      (slot) => slot.date && slot.startTime && slot.endTime
    );

  async function handleSubmit() {
    if (!canSubmit || submitting) return;

    try {
      setSubmitting(true);

      const options = slots.map((slot) => {
        const startTime = zonedLocalToUtcIso(
          slot.date,
          slot.startTime,
          timezone
        );

        const endTime = zonedLocalToUtcIso(
          slot.date,
          slot.endTime,
          timezone
        );

        if (new Date(endTime) <= new Date(startTime)) {
          throw new Error(
            `End time must be after start time for ${formatDate(slot.date)}.`
          );
        }

        return { startTime, endTime };
      });

      const result = await createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
        timezone,
        options,
      });

      localStorage.setItem(
        organizerStorageKey(result.publicId),
        result.organizerToken
      );

      setCreated(result);
      toast.success("Poll created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create poll"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function participantUrl() {
    if (!created || typeof window === "undefined") return "";
    return `${window.location.origin}/poll/${created.publicId}`;
  }

  function organizerUrl() {
    if (!created || typeof window === "undefined") return "";
    return `${window.location.origin}/organizer/${created.publicId}#token=${encodeURIComponent(created.organizerToken)}`;
  }

  async function copyLink(kind: "participant" | "organizer") {
    const value =
      kind === "participant" ? participantUrl() : organizerUrl();

    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("Unable to copy link");
    }
  }

  if (created) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Check size={26} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Poll created
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {created.title}
            </span>{" "}
            is ready to share.
          </p>
        </div>

        <div className="mb-4 space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <p className="text-sm font-medium">Participant link</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Share this with everyone whose availability you need.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-border bg-background px-3">
              <span className="truncate font-mono text-xs text-muted-foreground">
                {participantUrl()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => copyLink("participant")}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
            >
              {copied === "participant" ? (
                <Check size={14} />
              ) : (
                <Copy size={14} />
              )}
              {copied === "participant" ? "Copied" : "Copy"}
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(`/poll/${created.publicId}`)
            }
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-accent"
          >
            <Users size={14} />
            Preview vote page
          </button>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div>
            <p className="text-sm font-medium">Organizer access</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Keep this link private. It can edit and finalize the poll.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-green-600" />
              Live responses
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-green-600" />
              Edit poll
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-green-600" />
              Finalize
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(`/organizer/${created.publicId}`)
            }
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-medium text-background"
          >
            <Link2 size={14} />
            Open organizer view
          </button>

          <button
            type="button"
            onClick={() => copyLink("organizer")}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-xs font-medium hover:bg-accent"
          >
            {copied === "organizer" ? (
              <Check size={13} />
            ) : (
              <Copy size={13} />
            )}
            {copied === "organizer"
              ? "Private link copied"
              : "Copy private organizer link"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Create a poll
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Propose times and share with participants to find when everyone is free.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <section>
          <label
            htmlFor="poll-title"
            className="mb-1.5 block text-left text-sm font-medium"
          >
            Poll title <span className="text-red-500">*</span>
          </label>
          <input
            id="poll-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Team Q4 Planning Kickoff"
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-left text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
          />
        </section>

        <section>
          <label
            htmlFor="poll-description"
            className="mb-1.5 block text-left text-sm font-medium"
          >
            Description{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <textarea
            id="poll-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What's this meeting about?"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
          />
        </section>

        <section>
          <label
            htmlFor="timezone"
            className="mb-1.5 flex items-center gap-1.5 text-left text-sm font-medium"
          >
            <Globe size={14} className="shrink-0 text-muted-foreground" />
            <span>Timezone</span>
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-left text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Clock size={14} className="shrink-0 text-muted-foreground" />
              <span>Proposed times</span>
              <span className="text-red-500">*</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {slots.length} option{slots.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Option {index + 1}
                    {slot.date && (
                      <span className="ml-2 normal-case tracking-normal text-foreground">
                        · {formatDate(slot.date)}
                      </span>
                    )}
                  </span>
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      className="rounded p-1 text-muted-foreground hover:text-red-500"
                      aria-label="Remove time option"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-left text-[11px] font-medium text-muted-foreground">
                      Date
                    </label>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(event) =>
                        updateSlot(slot.id, "date", event.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-left text-[11px] font-medium text-muted-foreground">
                      Start time
                    </label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(event) =>
                        updateSlot(slot.id, "startTime", event.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-left text-[11px] font-medium text-muted-foreground">
                      End time
                    </label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(event) =>
                        updateSlot(slot.id, "endTime", event.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSlot}
            className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-foreground/30 hover:bg-accent/50 hover:text-foreground"
          >
            <Plus size={15} />
            Add another time option
          </button>
        </section>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-6 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Creating..." : "Create poll"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </main>
  );
}
