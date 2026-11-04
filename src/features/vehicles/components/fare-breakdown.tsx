import type { FareEstimate } from "@/types/commute";
import { money } from "@/lib/commute-catalog";
export function FareBreakdown({
  fare,
  student,
}: {
  fare: FareEstimate;
  student: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt>Regular fare</dt>
          <dd className="tabular-nums">{money(fare.regularCentavos)}</dd>
        </div>
        {student && (
          <div className="flex justify-between gap-3 text-primary">
            <dt>Student discount (20%)</dt>
            <dd className="tabular-nums">
              −{money(fare.regularCentavos - fare.studentCentavos)}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t pt-3 text-base font-semibold">
          <dt>{student ? "Student estimate" : "Regular estimate"}</dt>
          <dd className="tabular-nums">
            {money(student ? fare.studentCentavos : fare.regularCentavos)}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        Sample fare, not an official tariff. Bring valid student identification
        to claim an eligible discount. No payment or booking.
      </p>
    </div>
  );
}
