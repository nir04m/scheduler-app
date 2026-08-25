export type AvailabilityStatus =
  | "AVAILABLE"
  | "MAYBE"
  | "UNAVAILABLE";

export type PollStatus = "OPEN" | "CLOSED" | "FINALIZED";

export interface TimeOption {
  id: number;
  startTime: string;
  endTime: string;
  createdAt?: string;
}

export interface Availability {
  id?: number;
  timeOptionId: number;
  status: AvailabilityStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Participant {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  availabilities: Availability[];
}

export interface Poll {
  id: number;
  publicId: string;
  title: string;
  description: string | null;
  timezone: string;
  status: PollStatus;
  finalTimeOptionId: number | null;
  createdAt: string;
  updatedAt: string;
  finalTimeOption: TimeOption | null;
  timeOptions: TimeOption[];
  participants: Participant[];
}

export interface CreatePollResponse {
  id: number;
  publicId: string;
  organizerToken: string;
  title: string;
  description: string | null;
  timezone: string;
  status?: PollStatus;
  timeOptions: TimeOption[];
}

export interface ParticipantResponse {
  id: number;
  pollId: number;
  name: string;
  responseToken: string;
  createdAt: string;
  updatedAt: string;
  availabilities: Availability[];
}
