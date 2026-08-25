"use client";

import {
  Award,
  Check,
  Edit2,
  Globe,
  Link2,
  Save,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import ErrorPanel from "@/components/scheduler/error-panel";
import FinalizedView from "@/components/scheduler/finalized-view";
import LoadingPanel from "@/components/scheduler/loading-panel";
import ResultsMatrix from "@/components/scheduler/results-matrix";
import {
  finalizePoll,
  getPoll,
  updatePoll,
} from "@/lib/api";
import {
  formatOptionDate,
  formatOptionTime,
  shortTimezone,
} from "@/lib/date-time";
import {
  bestTimeOptionId,
  totalsForOption,
} from "@/lib/poll-results";
import { organizerStorageKey } from "@/lib/storage";
import type { Poll } from "@/lib/types";

export default function OrganizerClient({
  publicId,
}: {
  publicId: string;
}) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(
    null
  );
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTimezone, setEditTimezone] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadPoll = useCallback(async () => {
    try {
      setError(null);
      const result = await getPoll(publicId);
      setPoll(result);
      setEditTitle(result.title);
      setEditDescription(result.description ?? "");
      setEditTimezone(result.timezone);
      setSelectedId(
        result.finalTimeOptionId ??
          bestTimeOptionId(
            result.timeOptions,
            result.participants
          )
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load organizer view"
      );
    } finally {
      setLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
      const hash = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );
    
      const hashToken = hash.get("token");
    
      const stored = localStorage.getItem(
        organizerStorageKey(publicId)
      );
    
      const resolved = hashToken || stored;
    
      if (hashToken) {
        localStorage.setItem(
          organizerStorageKey(publicId),
          hashToken
        );
    
        history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`
        );
      }
    
      queueMicrotask(() => {
        if (resolved) {
          setToken(resolved);
        }
    
        void loadPoll();
      });
  }, [loadPoll, publicId]);

  const bestId = useMemo(
    () =>
      poll
        ? bestTimeOptionId(
            poll.timeOptions,
            poll.participants
          )
        : null,
    [poll]
  );

  if (loading) {
    return <LoadingPanel label="Loading organizer view..." />;
  }

  if (error) {
    return (
      <ErrorPanel
        title="Organizer view unavailable"
        message={error}
      />
    );
  }

  if (!poll) {
    return (
      <ErrorPanel
        title="Poll not found"
        message="We couldn't find this scheduling poll."
      />
    );
  }

  if (poll.status === "FINALIZED") {
    return <FinalizedView poll={poll} />;
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">
          Organizer access required
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open the private organizer link that was created with this poll.
        </p>
      </main>
    );
  }

  const bestOption = poll.timeOptions.find(
    (option) => option.id === bestId
  );
  const bestTotals =
    bestId != null
      ? totalsForOption(bestId, poll.participants)
      : null;

  async function handleSave() {
    if (!token || working) return;

    try {
      setWorking(true);
      await updatePoll(publicId, token, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        timezone: editTimezone,
      });
      await loadPoll();
      setEditing(false);
      toast.success("Poll updated");
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Unable to update poll"
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleFinalize() {
    if (!token || selectedId == null || working) return;

    try {
      setWorking(true);
      await finalizePoll(publicId, token, selectedId);
      await loadPoll();
      toast.success("Meeting time finalized");
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Unable to finalize poll"
      );
    } finally {
      setWorking(false);
    }
  }

  async function copyParticipantLink() {
    try {
      const value = `${window.location.origin}/poll/${publicId}`;
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Participant link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to copy link");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Organizer view
          </span>
          <h1 className="font-display mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            {poll.title}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users size={11} />
              {poll.participants.length} responses
            </span>
            <span className="flex items-center gap-1">
              <Globe size={11} />
              {shortTimezone(poll.timezone)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((current) => !current)}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-accent"
          >
            {editing ? <X size={13} /> : <Edit2 size={13} />}
            <span className="hidden sm:inline">
              {editing ? "Cancel" : "Edit poll"}
            </span>
          </button>

          <button
            type="button"
            onClick={copyParticipantLink}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-accent"
          >
            {copied ? <Check size={13} /> : <Link2 size={13} />}
            <span className="hidden sm:inline">
              {copied ? "Copied" : "Share link"}
            </span>
          </button>
        </div>
      </div>

      {editing && (
        <div className="mb-6 space-y-4 rounded-xl border border-border bg-card p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Title
            </label>
            <input
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(event) =>
                setEditDescription(event.target.value)
              }
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Timezone
            </label>
            <input
              value={editTimezone}
              onChange={(event) =>
                setEditTimezone(event.target.value)
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={working || !editTitle.trim()}
              className="flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
            >
              <Save size={13} />
              Save changes
            </button>
          </div>
        </div>
      )}

      {bestOption && bestTotals && poll.participants.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Award size={16} className="text-green-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">
              {formatOptionDate(bestOption, poll.timezone)} looks best
            </p>
            <p className="mt-0.5 text-xs text-green-700">
              {bestTotals.AVAILABLE} of {poll.participants.length} participants are available ·{" "}
              {bestTotals.UNAVAILABLE} unavailable
            </p>
          </div>
        </div>
      )}

      <ResultsMatrix
        timeOptions={poll.timeOptions}
        participants={poll.participants}
        timezone={poll.timezone}
      />

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold">
          Select the meeting time
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose one of the proposed times to finalize this meeting.
        </p>

        <div className="my-4 space-y-2">
          {poll.timeOptions.map((option) => {
            const totals = totalsForOption(
              option.id,
              poll.participants
            );
            const selected = selectedId === option.id;

            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  selected
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="finalize-time"
                  checked={selected}
                  onChange={() => setSelectedId(option.id)}
                  className="accent-foreground"
                />

                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">
                    {formatOptionDate(option, poll.timezone)}
                  </span>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatOptionTime(option, poll.timezone)}
                  </p>
                </div>

                <div className="flex gap-2 text-[11px]">
                  <span className="font-medium text-green-700">
                    {totals.AVAILABLE} yes
                  </span>
                  <span className="text-amber-700">
                    {totals.MAYBE} maybe
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleFinalize}
          disabled={selectedId == null || working}
          className="h-10 w-full rounded-lg bg-foreground text-sm font-medium text-background disabled:opacity-40"
        >
          {working ? "Finalizing..." : "Finalize this time"}
        </button>
      </section>
    </main>
  );
}
