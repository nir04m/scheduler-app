import {
  Award,
  CheckCircle2,
  HelpCircle,
  XCircle,
} from "lucide-react";

import AvailabilityChip from "@/components/scheduler/availability-chip";
import {
  bestTimeOptionId,
  participantStatus,
  totalsForOption,
} from "@/lib/poll-results";
import {
  formatOptionDate,
  formatOptionTime,
} from "@/lib/date-time";
import type { Participant, TimeOption } from "@/lib/types";

export default function ResultsMatrix({
  timeOptions,
  participants,
  timezone,
}: {
  timeOptions: TimeOption[];
  participants: Participant[];
  timezone: string;
}) {
  const bestId = bestTimeOptionId(timeOptions, participants);

  if (participants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm font-medium">No responses yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Share the participant link to start collecting availability.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-40 px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Participant
              </th>
              {timeOptions.map((option) => {
                const best = option.id === bestId;

                return (
                  <th
                    key={option.id}
                    className={`min-w-32 px-3 py-3 text-center ${
                      best ? "bg-green-50" : "bg-card"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      {best && (
                        <span className="mb-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
                          <Award size={10} />
                          Best
                        </span>
                      )}
                      <span className="text-xs font-semibold">
                        {formatOptionDate(option, timezone)}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatOptionTime(option, timezone)}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {participants.map((participant, index) => (
              <tr
                key={participant.id}
                className={`border-b border-border/50 ${
                  index % 2 ? "bg-background/40" : "bg-card"
                }`}
              >
                <td className="max-w-40 truncate px-4 py-3 text-sm font-medium">
                  {participant.name}
                </td>

                {timeOptions.map((option) => {
                  const status = participantStatus(
                    participant,
                    option.id
                  );

                  return (
                    <td
                      key={option.id}
                      className={`px-3 py-3 text-center ${
                        option.id === bestId
                          ? "bg-green-50/50"
                          : ""
                      }`}
                    >
                      {status ? (
                        <AvailabilityChip value={status} />
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Totals
              </td>

              {timeOptions.map((option) => {
                const totals = totalsForOption(
                  option.id,
                  participants
                );

                return (
                  <td
                    key={option.id}
                    className={`px-3 py-3 ${
                      option.id === bestId
                        ? "bg-green-50/50"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5 text-[11px]">
                      <span className="flex items-center gap-1 font-medium text-green-700">
                        <CheckCircle2 size={10} />
                        {totals.AVAILABLE} yes
                      </span>
                      <span className="flex items-center gap-1 text-amber-700">
                        <HelpCircle size={10} />
                        {totals.MAYBE} maybe
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle size={10} />
                        {totals.UNAVAILABLE} no
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {timeOptions.map((option) => {
          const totals = totalsForOption(option.id, participants);
          const best = option.id === bestId;

          const yesNames = participants
            .filter(
              (participant) =>
                participantStatus(participant, option.id) ===
                "AVAILABLE"
            )
            .map((participant) => participant.name);

          const maybeNames = participants
            .filter(
              (participant) =>
                participantStatus(participant, option.id) ===
                "MAYBE"
            )
            .map((participant) => participant.name);

          const noNames = participants
            .filter(
              (participant) =>
                participantStatus(participant, option.id) ===
                "UNAVAILABLE"
            )
            .map((participant) => participant.name);

          return (
            <div
              key={option.id}
              className={`rounded-xl border bg-card p-4 ${
                best
                  ? "border-green-200 bg-green-50/30"
                  : "border-border"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {formatOptionDate(option, timezone)}
                    </span>
                    {best && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                        <Award size={9} />
                        Best
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {formatOptionTime(option, timezone)}
                  </p>
                </div>

                <div className="flex gap-2 text-xs font-medium">
                  <span className="text-green-700">
                    {totals.AVAILABLE}✓
                  </span>
                  <span className="text-amber-700">
                    {totals.MAYBE}~
                  </span>
                  <span className="text-red-500">
                    {totals.UNAVAILABLE}✗
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                {yesNames.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="inline-flex min-w-15 items-center gap-1 font-medium text-green-700">
                      <CheckCircle2 size={10} />
                      Yes
                    </span>
                    <span className="text-muted-foreground">
                      {yesNames.join(", ")}
                    </span>
                  </div>
                )}

                {maybeNames.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="inline-flex min-w-15 items-center gap-1 font-medium text-amber-700">
                      <HelpCircle size={10} />
                      Maybe
                    </span>
                    <span className="text-muted-foreground">
                      {maybeNames.join(", ")}
                    </span>
                  </div>
                )}

                {noNames.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="inline-flex min-w-15 items-center gap-1 font-medium text-red-500">
                      <XCircle size={10} />
                      No
                    </span>
                    <span className="text-muted-foreground">
                      {noNames.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
