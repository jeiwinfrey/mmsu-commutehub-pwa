"use client";
import Link from "next/link";
import { ArrowLeft, Info, SlidersHorizontal } from "@/components/commute/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
export function Intro({
  title,
  description,
  step,
  back,
}: {
  title: string;
  description: string;
  step?: string;
  back?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {back && (
        <Button asChild variant="ghost" className="w-fit">
          <Link href={back}>
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Back
          </Link>
        </Button>
      )}
      <div className="flex flex-wrap gap-2">
        {step && <Badge variant="outline">{step}</Badge>}
      </div>
      <h1 className="whitespace-pre-line">{title.replaceAll("\\n", "\n")}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
export function Notice({
  title,
  children,
  warning = false,
}: {
  title: string;
  children: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <Alert role="note" className={warning ? "notice-warning" : "notice-info"}>
      <Info aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  description,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  description?: string;
  disabled?: boolean;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className="w-full min-h-12"
          aria-describedby={description ? id + "-hint" : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-w-[calc(100vw-32px)]">
          <SelectGroup>
            {options.map((o) => (
              <SelectItem className="min-h-11" key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {description && (
        <FieldDescription id={id + "-hint"}>{description}</FieldDescription>
      )}
    </Field>
  );
}
export function PreviewTools({
  value,
  onChange,
  options = [
    { value: "normal", label: "Normal" },
    { value: "loading", label: "Loading" },
    { value: "empty", label: "Empty" },
    { value: "error", label: "Error" },
  ],
}: {
  value: string;
  onChange: (v: string) => void;
  options?: readonly { value: string; label: string }[];
}) {
  return process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_UI_PREVIEWS === "true" ? (
    <details className="preview-tools">
      <summary>
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        UI preview states
      </summary>
      <div className="pt-3">
        <SelectField
          id="preview-state"
          label="Preview state"
          value={value}
          onChange={onChange}
          options={options}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          For reviewing the UI. No live service or saved data.
        </p>
      </div>
    </details>
  ) : null;
}
export function Metrics({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      {items.map((i) => (
        <div className="metric" key={i.label}>
          <dt className="text-xs text-muted-foreground">{i.label}</dt>
          <dd className="text-lg font-semibold tabular-nums">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
