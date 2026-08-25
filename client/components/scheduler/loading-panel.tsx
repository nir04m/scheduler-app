export default function LoadingPanel({
  label = "Loading poll...",
}: {
  label?: string;
}) {
  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="mt-8 h-36 rounded-xl border border-border bg-card" />
        <div className="h-36 rounded-xl border border-border bg-card" />
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        {label}
      </p>
    </main>
  );
}
