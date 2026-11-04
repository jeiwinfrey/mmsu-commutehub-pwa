import { Suspense } from "react";
import { TripDetailsScreen } from "@/features/trips/components/trip-details";
async function Details({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TripDetailsScreen id={id} />;
}
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p role="status">Loading trip…</p>}>
      <Details params={params} />
    </Suspense>
  );
}
