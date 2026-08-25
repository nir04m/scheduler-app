import Link from "next/link";
import { CircleAlert } from "lucide-react";

export default function ErrorPanel({
  title = "Something went wrong",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <CircleAlert size={22} />
      </div>
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-foreground px-5 text-sm font-medium text-background"
      >
        Create a new poll
      </Link>
    </main>
  );
}
