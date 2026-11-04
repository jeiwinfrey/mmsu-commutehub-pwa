import { AppProvider } from "@/components/commute/app-provider";
import { PwaRuntime } from "@/components/commute/pwa";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/commute/demo-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
export const metadata: Metadata = {
  title: { default: "MMSU CommuteHub", template: "%s · CommuteHub" },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CommuteHub",
  },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
  description:
    "Plan your MMSU commute, follow simulated corridor vehicles, and share student commute reports.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#163d2c",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProvider>
          <PwaRuntime />
          <TooltipProvider>
            <DemoProvider>{children}</DemoProvider>
            <Toaster theme="light" position="top-center" />
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
