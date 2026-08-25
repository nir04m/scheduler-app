import type {
  AvailabilityStatus,
  Participant,
  TimeOption,
} from "@/lib/types";

export function participantStatus(
  participant: Participant,
  timeOptionId: number
): AvailabilityStatus | undefined {
  return participant.availabilities.find(
    (availability) => availability.timeOptionId === timeOptionId
  )?.status;
}

export function totalsForOption(
  timeOptionId: number,
  participants: Participant[]
) {
  const totals = {
    AVAILABLE: 0,
    MAYBE: 0,
    UNAVAILABLE: 0,
  };

  for (const participant of participants) {
    const status = participantStatus(participant, timeOptionId);
    if (status) totals[status] += 1;
  }

  return totals;
}

export function bestTimeOptionId(
  timeOptions: TimeOption[],
  participants: Participant[]
) {
  let bestId = timeOptions[0]?.id ?? null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const option of timeOptions) {
    const totals = totalsForOption(option.id, participants);
    const score =
      totals.AVAILABLE * 2 +
      totals.MAYBE -
      totals.UNAVAILABLE * 2;

    if (score > bestScore) {
      bestScore = score;
      bestId = option.id;
    }
  }

  return bestId;
}
