export default function Loading() {
  return (
    <div className="animate-pulse space-y-3 px-4 pt-4">
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 flex-1 rounded-lg bg-elevated" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-elevated" />
      <div className="h-40 rounded-2xl bg-elevated" />
    </div>
  );
}
