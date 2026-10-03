export default function Loading() {
  return (
    <div className="space-y-7" role="status" aria-label="Loading page">
      <div className="h-8 w-56 rounded bg-muted" />
      <div className="h-4 max-w-sm rounded bg-muted" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-lg border bg-white" />
        ))}
      </div>
      <div className="h-96 rounded-lg border bg-white" />
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}
