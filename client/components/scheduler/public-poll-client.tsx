"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Globe,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import AvailabilityToggle from "@/components/scheduler/availability-toggle";
import ErrorPanel from "@/components/scheduler/error-panel";
import FinalizedView from "@/components/scheduler/finalized-view";
import LoadingPanel from "@/components/scheduler/loading-panel";
import ResultsMatrix from "@/components/scheduler/results-matrix";
import {
  getPoll,
  submitAvailability,
  updateAvailability,
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
import { responseStorageKey } from "@/lib/storage";
import type {
  AvailabilityStatus,
  Poll,
} from "@/lib/types";

export default function PublicPollClient({
  publicId,
}: {
  publicId: string;
}) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [view, setView] = useState<"vote" | "results">("vote");
  const [name, setName] = useState("");
  const [votes, setVotes] = useState<
    Record<number, AvailabilityStatus | null>
  >({});
  const [responseToken, setResponseToken] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const loadPoll = useCallback(async () => {
    try {
      setError(null);
      const result = await getPoll(publicId);
      setPoll(result);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load this poll"
      );
    } finally {
      setLoading(false);
    }
  }, [publicId]);

  useEffect(() => {
    const stored = localStorage.getItem(
      responseStorageKey(publicId)
    );

    queueMicrotask(() => {
      if (stored) setResponseToken(stored);
      void loadPoll();
    });
  }, [loadPoll, publicId]);

  const allVoted = useMemo(
    () =>
      poll?.timeOptions.every(
        (option) => votes[option.id] != null
      ) ?? false,
    [poll, votes]
  );

  if (loading) return <LoadingPanel />;
  if (error) {
    return (
      <ErrorPanel
        title="Poll unavailable"
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

  const bestId = bestTimeOptionId(
    poll.timeOptions,
    poll.participants
  );
  const bestOption = poll.timeOptions.find(
    (option) => option.id === bestId
  );
  const bestTotals =
    bestId != null
      ? totalsForOption(bestId, poll.participants)
      : null;

  async function handleSubmit() {
    if (!poll || !allVoted || !name.trim() || submitting) return;

    const responses = poll.timeOptions.map((option) => ({
      timeOptionId: option.id,
      status: votes[option.id]!,
    }));

    try {
      setSubmitting(true);

      if (responseToken) {
        await updateAvailability({
          publicId,
          responseToken,
          name: name.trim(),
          responses,
        });
        toast.success("Your availability was updated");
      } else {
        const result = await submitAvailability({
          publicId,
          name: name.trim(),
          responses,
        });

        localStorage.setItem(
          responseStorageKey(publicId),
          result.responseToken
        );
        setResponseToken(result.responseToken);
        toast.success("Your availability was saved");
      }

      await loadPoll();
      setJustSaved(true);
      setView("results");
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Unable to save availability"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {poll.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe size={11} />
              {shortTimezone(poll.timezone)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} />
              {poll.participants.length} response
              {poll.participants.length === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {poll.timeOptions.length} time option
              {poll.timeOptions.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setJustSaved(false);
              setView("vote");
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              view === "vote"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            My availability
          </button>
          <button
            type="button"
            onClick={() => setView("results")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              view === "results"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Group results
          </button>
        </div>
      </div>

      {poll.status === "CLOSED" && (
        <div className="mb-6 rounded-xl border border-border bg-muted/50 p-4 text-sm">
          Voting is closed. You can still view the responses below.
        </div>
      )}

      {justSaved && view === "results" && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 size={16} className="text-green-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">
                Availability saved
              </p>
              <p className="mt-0.5 text-xs text-green-700">
                You are viewing the group results below. You can return to your availability while the poll is open.
              </p>
            </div>
          </div>
          {poll.status === "OPEN" && (
            <button
              type="button"
              onClick={() => {
                setJustSaved(false);
                setView("vote");
              }}
              className="h-9 shrink-0 rounded-lg border border-green-300 bg-white px-3 text-xs font-medium text-green-900 hover:bg-green-100"
            >
              Update my availability
            </button>
          )}
        </div>
      )}

      {view === "vote" && poll.status === "OPEN" ? (
        <div className="mx-auto max-w-xl">
          <div className="mb-6">
            <label
              htmlFor="voter-name"
              className="mb-1.5 block text-sm font-medium"
            >
              Your name <span className="text-red-500">*</span>
            </label>
            <input
              id="voter-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              className="h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">
              Select your availability
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="mb-6 space-y-3">
            {poll.timeOptions.map((option) => {
              const selected = votes[option.id] ?? null;

              return (
                <div
                  key={option.id}
                  className={`rounded-xl border bg-card p-4 transition-all sm:p-5 ${
                    selected === "AVAILABLE"
                      ? "border-green-200 ring-1 ring-green-100"
                      : selected === "MAYBE"
                        ? "border-amber-200 ring-1 ring-amber-100"
                        : selected === "UNAVAILABLE"
                          ? "border-red-200/60 ring-1 ring-red-50"
                          : "border-border"
                  }`}
                >
                  <div className="mb-3">
                    <p className="text-sm font-semibold">
                      {formatOptionDate(option, poll.timezone)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {formatOptionTime(option, poll.timezone)}
                    </p>
                  </div>

                  <AvailabilityToggle
                    value={selected}
                    onChange={(status) =>
                      setVotes((current) => ({
                        ...current,
                        [option.id]: status,
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              {poll.timeOptions.map((option) => (
                <span
                  key={option.id}
                  className={`h-1 w-6 rounded-full ${
                    votes[option.id] === "AVAILABLE"
                      ? "bg-green-500"
                      : votes[option.id] === "MAYBE"
                        ? "bg-amber-500"
                        : votes[option.id] === "UNAVAILABLE"
                          ? "bg-red-400"
                          : "bg-border"
                  }`}
                />
              ))}
            </div>
            <span>
              {
                Object.values(votes).filter(Boolean)
                  .length
              }{" "}
              of {poll.timeOptions.length} answered
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !allVoted ||
              !name.trim() ||
              submitting
            }
            className="h-12 w-full rounded-xl bg-foreground text-sm font-medium text-background disabled:opacity-40"
          >
            {submitting
              ? "Saving..."
              : responseToken
                ? "Update my availability"
                : "Submit my availability"}
          </button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            No account required · Your private edit access is saved on this device
          </p>
        </div>
      ) : (
        <div>
          {bestOption && bestTotals && poll.participants.length > 0 && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                <Award size={16} className="text-green-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Best time:{" "}
                  {formatOptionDate(
                    bestOption,
                    poll.timezone
                  )}
                </p>
                <p className="mt-0.5 font-mono text-xs text-green-700">
                  {formatOptionTime(
                    bestOption,
                    poll.timezone
                  )}
                </p>
                <p className="mt-1 text-xs text-green-700">
                  {bestTotals.AVAILABLE} available ·{" "}
                  {bestTotals.MAYBE} maybe ·{" "}
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
        </div>
      )}
    </main>
  );
}
