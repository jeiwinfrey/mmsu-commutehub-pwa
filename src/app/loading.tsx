import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="phone-shell grid gap-6 p-6" role="status">
      <Skeleton className="h-12" />
      <Skeleton className="h-56" />
      <p>Loading CommuteHub…</p>
    </div>
  );
}
