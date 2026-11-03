import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
export const metadata: Metadata = {
  title: { default: "MMSU CommuteHub · UI starter", template: "%s · CommuteHub" },
  description: "Mobile UI assignment scaffold for MMSU CommuteHub. Sample data only.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="antialiased"><TooltipProvider>{children}<Toaster theme="light" position="top-center" /></TooltipProvider></body></html>;
}
