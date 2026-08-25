"use client";

import {
  CheckCircle2,
  HelpCircle,
  XCircle,
} from "lucide-react";

import type { AvailabilityStatus } from "@/lib/types";

const options: Array<{
  key: AvailabilityStatus;
  label: string;
  active: string;
  idle: string;
  icon: typeof CheckCircle2;
}> = [
  {
    key: "AVAILABLE",
    label: "Available",
    icon: CheckCircle2,
    active: "border-green-600 bg-green-600 text-white",
    idle:
      "border-green-200 bg-white text-green-700 hover:bg-green-50",
  },
  {
    key: "MAYBE",
    label: "Maybe",
    icon: HelpCircle,
    active: "border-amber-500 bg-amber-500 text-white",
    idle:
      "border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
  },
  {
    key: "UNAVAILABLE",
    label: "Can't make it",
    icon: XCircle,
    active: "border-red-500 bg-red-500 text-white",
    idle:
      "border-red-200 bg-white text-red-600 hover:bg-red-50",
  },
];

export default function AvailabilityToggle({
  value,
  onChange,
}: {
  value: AvailabilityStatus | null;
  onChange: (value: AvailabilityStatus) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.key;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`flex min-h-14 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-all sm:min-h-11 sm:text-sm ${
              active ? option.active : option.idle
            }`}
          >
            <Icon size={15} />
            <span className="leading-tight">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
