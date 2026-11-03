import { PhoneShell } from "@/components/layout/phone-shell";
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <PhoneShell>{children}</PhoneShell>;
}
