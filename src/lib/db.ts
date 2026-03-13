import "server-only";

import { PrismaClient } from "@prisma/client/index";

declare global {
  var prisma: PrismaClient | undefined;
}

type PrismaClientOptions = NonNullable<ConstructorParameters<typeof PrismaClient>[0]>;
type PrismaInternalConfigOverride = {
  __internal: {
    configOverride: (config: Record<string, unknown>) => Record<string, unknown>;
  };
};

const prismaClientConfig = {
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  // Prisma 6.16 can generate a client with copyEngine=false, which incorrectly routes
  // local Postgres URLs through the Accelerate validator in Next/Webpack dev.
  __internal: {
    configOverride: (config: Record<string, unknown>) => ({
      ...config,
      copyEngine: true,
    }),
  },
} satisfies PrismaClientOptions & PrismaInternalConfigOverride;

export const db = global.prisma ?? new PrismaClient(prismaClientConfig as PrismaClientOptions);

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}