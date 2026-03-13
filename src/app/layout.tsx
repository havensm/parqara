import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Manrope, Space_Grotesk } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
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
  title: "Parqara | Adventure planner with live park guidance",
  description:
    "Parqara is an adventure planner that builds park-day itineraries around real constraints and updates guidance live as conditions change.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}>
        <Suspense fallback={null}>
          <RouteScrollManager />
        </Suspense>
        <div className="relative isolate min-h-screen overflow-x-clip">
          <SiteHeader />
          <main className="relative mx-auto min-h-[calc(100vh-104px)] w-full max-w-[88rem] px-4 pb-14 pt-4 sm:px-8 sm:pb-20 sm:pt-6 lg:px-10">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}