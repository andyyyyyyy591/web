export default function Loading() {
  return (
    <div className="animate-pulse space-y-3 px-4 pt-4">
      <div className="h-32 rounded-2xl bg-elevated" />
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 flex-1 rounded-lg bg-elevated" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-elevated" />
    </div>
  );
}
