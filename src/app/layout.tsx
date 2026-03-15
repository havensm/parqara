import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Manrope, Space_Grotesk } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteSidebar } from "@/components/layout/site-sidebar";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { LegacyServiceWorkerCleanup } from "@/components/layout/legacy-service-worker-cleanup";
import { RootChrome } from "@/components/layout/root-chrome";
import { RouteScrollManager } from "@/components/layout/route-scroll-manager";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Parqara | AI planning for trips, weekends, and days out",
  description:
    "Parqara is an AI-powered planning platform centered around Mara, helping people plan trips, weekends, date nights, family adventures, and vacations in one polished workspace.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}>
        <LegacyServiceWorkerCleanup />
        <Suspense fallback={null}>
          <RouteScrollManager />
        </Suspense>
        <RootChrome footer={<SiteFooter />} marketingHeader={<MarketingHeader />} sidebar={<SiteSidebar />}>
          {children}
        </RootChrome>
      </body>
    </html>
  );
}
