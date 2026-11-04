"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="phone-shell grid content-center gap-6 p-8">
      <h1>Let’s try that again.</h1>
      <p>
        We couldn’t load this screen. Check your connection, then retry. Your
        saved account data is kept in the database.
      </p>
      <Button onClick={reset}>Retry screen</Button>
    </div>
  );
}
