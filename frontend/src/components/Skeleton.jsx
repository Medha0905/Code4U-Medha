export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-cream-200 rounded-lg ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
