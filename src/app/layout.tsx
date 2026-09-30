import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";

const body = Public_Sans({ subsets: ["latin"], variable: "--nf-body", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--nf-display", display: "swap" });
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Hazard Watch — crowdsourced hazard mapping",
  description: "Report local hazards and let authorities see validated hotspots.",
};
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable}`}>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
