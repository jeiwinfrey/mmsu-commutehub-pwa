import { PhoneShell } from "@/components/layout/phone-shell";
export default function EntryLayout({ children }: { children: React.ReactNode }) {
  return <PhoneShell standalone>{children}</PhoneShell>;
}
