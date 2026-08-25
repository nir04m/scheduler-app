import {
  CheckCircle2,
  HelpCircle,
  XCircle,
} from "lucide-react";
import type { AvailabilityStatus } from "@/lib/types";

export default function AvailabilityChip({
  value,
}: {
  value: AvailabilityStatus;
}) {
  if (value === "AVAILABLE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200/70 bg-green-50 px-2 py-0.5 text-[11px] font-medium leading-none text-green-700">
        <CheckCircle2 size={10} />
        Yes
      </span>
    );
  }

  if (value === "MAYBE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/70 bg-amber-50 px-2 py-0.5 text-[11px] font-medium leading-none text-amber-700">
        <HelpCircle size={10} />
        Maybe
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200/70 bg-red-50 px-2 py-0.5 text-[11px] font-medium leading-none text-red-600">
      <XCircle size={10} />
      No
    </span>
  );
}
