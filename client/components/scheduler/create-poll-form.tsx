"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Globe,
  Link2,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { createPoll } from "@/lib/api";
import { zonedLocalToUtcIso } from "@/lib/date-time";
import { organizerStorageKey } from "@/lib/storage";
import type { CreatePollResponse } from "@/lib/types";

type TimeSlot = {
  id: string;
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

const CALENDAR_START_HOUR = 8;
const CALENDAR_END_HOUR = 20;
const STEP_MINUTES = 30;
const DAYS_TO_SHOW = 5;

const TIME_ROWS: { hour: number; minute: number }[] = [];
for (let hour = CALENDAR_START_HOUR; hour < CALENDAR_END_HOUR; hour += 1) {
  for (let minute = 0; minute < 60; minute += STEP_MINUTES) {
    TIME_ROWS.push({ hour, minute });
  }
}

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfCurrentWeek() {
  const now = new Date();
  const result = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = result.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - daysSinceMonday);
  return result;
}

function cellKey(date: Date, hour: number, minute: number) {
  return `${localDateString(date)}:${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatClock(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return minute === 0
    ? `${displayHour} ${suffix}`
    : `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return formatClock(hour, minute);
}

function formatDate(date: string) {
  if (!date) return "";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function cellsToSlots(cells: Set<string>): TimeSlot[] {
  const byDate = new Map<string, number[]>();

  for (const key of cells) {
    const [date, hour, minute] = key.split(":");
    const value = Number(hour) * 60 + Number(minute);
    const current = byDate.get(date) ?? [];
    current.push(value);
    byDate.set(date, current);
  }

  const slots: TimeSlot[] = [];

  for (const [date, minutes] of byDate) {
    minutes.sort((a, b) => a - b);

    let index = 0;
    while (index < minutes.length) {
      const start = minutes[index];
      let end = start + STEP_MINUTES;

      while (
        index + 1 < minutes.length &&
        minutes[index + 1] === end
      ) {
        index += 1;
        end += STEP_MINUTES;
      }

      slots.push({
        id: `${date}-${start}`,
        date,
        startTime: formatMinutes(start),
        endTime: formatMinutes(end),
      });

      index += 1;
    }
  }

  return slots.sort((a, b) => {
    const left = `${a.date}T${a.startTime}`;
    const right = `${b.date}T${b.startTime}`;
    return left.localeCompare(right);
  });
}

function slotToCellKeys(slot: TimeSlot) {
  const keys: string[] = [];
  const [startHour, startMinute] = slot.startTime.split(":").map(Number);
  const [endHour, endMinute] = slot.endTime.split(":").map(Number);
  let current = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  while (current < end) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;
    keys.push(
      `${slot.date}:${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    );
    current += STEP_MINUTES;
  }

  return keys;
}

function CalendarTimePicker({
  cells,
  setCells,
}: {
  cells: Set<string>;
  setCells: Dispatch<SetStateAction<Set<string>>>;
}) {
  const [weekStart, setWeekStart] = useState(startOfCurrentWeek);
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const dragging = useRef(false);
  const dragMode = useRef<"add" | "remove">("add");
  const dragColumn = useRef(-1);

  useEffect(() => {
    const stopDragging = () => {
      dragging.current = false;
    };

    document.addEventListener("mouseup", stopDragging);
    return () => document.removeEventListener("mouseup", stopDragging);
  }, []);

  const weekDates = useMemo(
    () =>
      Array.from({ length: DAYS_TO_SHOW }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
      }),
    [weekStart]
  );

  const selectedSlots = useMemo(() => cellsToSlots(cells), [cells]);

  function moveWeek(days: number) {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      return next;
    });
  }

  function weekLabel() {
    const first = weekDates[0].toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const last = weekDates[weekDates.length - 1].toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${first} to ${last}`;
  }

  function adjacentKey(
    date: Date,
    hour: number,
    minute: number,
    direction: -1 | 1
  ) {
    const total = hour * 60 + minute + direction * STEP_MINUTES;
    return `${localDateString(date)}:${formatMinutes(total)}`;
  }

  function desktopCellClass(date: Date, hour: number, minute: number) {
    const key = cellKey(date, hour, minute);
    const selected = cells.has(key);
    const hourBorder = minute === 0 ? "border-t border-t-border/60" : "";

    if (!selected) {
      return `${hourBorder} cursor-pointer hover:bg-accent/60`;
    }

    const first = !cells.has(adjacentKey(date, hour, minute, -1));
    const last = !cells.has(adjacentKey(date, hour, minute, 1));

    return [
      "cursor-pointer border-x-2 border-x-foreground/[0.18] bg-foreground/[0.11]",
      first ? "rounded-t border-t-2 border-t-foreground/[0.18]" : hourBorder,
      last ? "rounded-b border-b-2 border-b-foreground/[0.18]" : "",
    ].join(" ");
  }

  function handleCellDown(
    event: MouseEvent,
    date: Date,
    hour: number,
    minute: number,
    column: number
  ) {
    event.preventDefault();
    const key = cellKey(date, hour, minute);
    const selected = cells.has(key);

    dragging.current = true;
    dragMode.current = selected ? "remove" : "add";
    dragColumn.current = column;

    setCells((current) => {
      const next = new Set(current);
      if (selected) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleCellEnter(
    date: Date,
    hour: number,
    minute: number,
    column: number
  ) {
    if (!dragging.current || dragColumn.current !== column) return;

    const key = cellKey(date, hour, minute);
    setCells((current) => {
      const next = new Set(current);
      if (dragMode.current === "add") next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function dayHasCells(date: Date) {
    const datePrefix = `${localDateString(date)}:`;
    return Array.from(cells).some((key) => key.startsWith(datePrefix));
  }

  function removeSlot(slot: TimeSlot) {
    const keys = slotToCellKeys(slot);
    setCells((current) => {
      const next = new Set(current);
      keys.forEach((key) => next.delete(key));
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => moveWeek(-7)}
          className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent"
          aria-label="Previous week"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-medium">{weekLabel()}</span>
        <button
          type="button"
          onClick={() => moveWeek(7)}
          className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent"
          aria-label="Next week"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="hidden sm:block">
        <p className="mb-2 text-[11px] text-muted-foreground">
          Click or drag within a day to select possible meeting times.
        </p>
        <div className="select-none overflow-hidden rounded-xl border border-border">
          <div
            className="grid border-b border-border bg-muted/30"
            style={{ gridTemplateColumns: "58px repeat(5, 1fr)" }}
          >
            <div />
            {weekDates.map((date) => (
              <div
                key={localDateString(date)}
                className="border-l border-border py-2 text-center"
              >
                <div
                  className={`text-xs font-semibold ${
                    dayHasCells(date)
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>

          <div
            className="grid overflow-y-auto"
            style={{
              gridTemplateColumns: "58px repeat(5, 1fr)",
              maxHeight: 336,
            }}
          >
            {TIME_ROWS.map(({ hour, minute }) => (
              <Fragment key={`${hour}:${minute}`}>
                <div
                  className={`flex items-start justify-end pr-2 pt-1 ${
                    minute === 0 ? "border-t border-t-border/60" : ""
                  }`}
                >
                  {minute === 0 && (
                    <span className="font-mono text-[10px] leading-none text-muted-foreground">
                      {formatClock(hour, 0)}
                    </span>
                  )}
                </div>

                {weekDates.map((date, column) => (
                  <div
                    key={`${localDateString(date)}-${hour}-${minute}`}
                    onMouseDown={(event) =>
                      handleCellDown(event, date, hour, minute, column)
                    }
                    onMouseEnter={() =>
                      handleCellEnter(date, hour, minute, column)
                    }
                    className={`h-7 border-l border-border/50 transition-colors ${desktopCellClass(
                      date,
                      hour,
                      minute
                    )}`}
                    title={`${date.toLocaleDateString("en-US")} ${formatClock(hour, minute)}`}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:hidden">
        <p className="text-[11px] text-muted-foreground">
          Choose a day, then tap 30 minute blocks to build your time windows.
        </p>

        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
        >
          {weekDates.map((date, index) => {
            const active = index === mobileDayIndex;
            const hasCells = dayHasCells(date);

            return (
              <button
                key={localDateString(date)}
                type="button"
                onClick={() => setMobileDayIndex(index)}
                className={`relative flex flex-col items-center rounded-lg py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                <span>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-[11px] opacity-60">{date.getDate()}</span>
                {hasCells && !active && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-current opacity-50" />
                )}
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
            {weekDates[mobileDayIndex]?.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {TIME_ROWS.map(({ hour, minute }) => {
              const date = weekDates[mobileDayIndex];
              const key = cellKey(date, hour, minute);
              const selected = cells.has(key);
              const endMinutes = hour * 60 + minute + STEP_MINUTES;

              return (
                <button
                  key={`${hour}:${minute}`}
                  type="button"
                  onClick={() =>
                    setCells((current) => {
                      const next = new Set(current);
                      if (selected) next.delete(key);
                      else next.add(key);
                      return next;
                    })
                  }
                  className={`flex h-11 w-full items-center border-b border-border/40 px-3 text-left transition-colors last:border-b-0 ${
                    selected ? "bg-foreground/[0.09]" : "bg-card hover:bg-accent"
                  } ${minute === 0 ? "border-t-2 border-t-border/70" : ""}`}
                >
                  <span className="w-[72px] shrink-0 font-mono text-xs text-muted-foreground">
                    {formatClock(hour, minute)}
                  </span>
                  <span
                    className={`flex-1 text-xs font-medium transition-opacity ${
                      selected ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {formatClock(hour, minute)} to {formatClock(
                      Math.floor(endMinutes / 60),
                      endMinutes % 60
                    )}
                  </span>
                  {selected && (
                    <span className="size-1.5 shrink-0 rounded-full bg-foreground/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedSlots.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {selectedSlots.length} time option
              {selectedSlots.length === 1 ? "" : "s"} selected
            </span>
            <button
              type="button"
              onClick={() => setCells(new Set())}
              className="text-xs text-muted-foreground transition-colors hover:text-red-500"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-1.5">
            {selectedSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex h-10 items-center justify-between rounded-lg border border-border bg-card px-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 text-xs font-medium">
                    {formatDate(slot.date)}
                  </span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {formatTime(slot.startTime)} to {formatTime(slot.endTime)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSlot(slot)}
                  className="ml-2 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-red-500"
                  aria-label={`Remove ${formatDate(slot.date)} ${formatTime(slot.startTime)}`}
                >
                  <XCircle size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-11 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
          No times selected. Click or drag on the calendar above.
        </div>
      )}
    </div>
  );
}

export default function CreatePollForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState("America/Edmonton");
  const [cells, setCells] = useState<Set<string>>(() => new Set());
  const [created, setCreated] = useState<CreatePollResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<"participant" | "organizer" | null>(null);

  const slots = useMemo(() => cellsToSlots(cells), [cells]);
  const canSubmit = title.trim().length > 0 && slots.length > 0;

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
    const value = kind === "participant" ? participantUrl() : organizerUrl();

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
        <div className="mb-7 text-center">
          <div className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Check size={22} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Poll created!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{created.title}</span>{" "}
            is ready to share.
          </p>
        </div>

        <section className="mb-4 rounded-2xl border-2 border-foreground bg-card p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
              <Users size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Track responses and manage your poll
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                View group results, edit the poll, and choose the final time when ready.
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-green-600" />
              View responses
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-green-600" />
              Compare availability
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-green-600" />
              Finalize time
            </span>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/organizer/${created.publicId}`)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            View results and manage poll
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            onClick={() => copyLink("organizer")}
            className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-xs font-medium hover:bg-accent"
          >
            {copied === "organizer" ? <Check size={13} /> : <Link2 size={13} />}
            {copied === "organizer"
              ? "Private link copied"
              : "Copy private organizer link"}
          </button>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div>
            <p className="text-sm font-medium">Share with participants</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Send this link to everyone whose availability you need.
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
              {copied === "participant" ? <Check size={14} /> : <Copy size={14} />}
              {copied === "participant" ? "Copied" : "Copy"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/poll/${created.publicId}`)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-accent"
          >
            <Users size={14} />
            Preview participant view
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Create a poll
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select possible meeting windows and share the poll to find what works best.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        <section>
          <label htmlFor="poll-title" className="mb-1.5 block text-left text-sm font-medium">
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
          <label htmlFor="poll-description" className="mb-1.5 block text-left text-sm font-medium">
            Description{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
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
          <label htmlFor="timezone" className="mb-1.5 flex items-center gap-1.5 text-left text-sm font-medium">
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

          <CalendarTimePicker cells={cells} setCells={setCells} />
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
