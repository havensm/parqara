import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DB_HEALTH_TIMEOUT_MS = 3000;

async function checkDatabase() {
  await Promise.race([
    db.$queryRaw`SELECT 1`,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Database health check timed out."));
      }, DB_HEALTH_TIMEOUT_MS);
    }),
  ]);
}

export async function GET() {
  try {
    await checkDatabase();

    return NextResponse.json(
      {
        ok: true,
        service: "parqara",
        mode: "database",
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Database connection failed.",
        mode: "database",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
        status: 503,
      }
    );
  }
}
