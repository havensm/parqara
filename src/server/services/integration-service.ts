import {
  getConfiguredEmailProvider,
  isPostmarkEmailConfigured,
  isResendEmailConfigured,
} from "@/lib/email";

export type AdminIntegrationCategory =
  | "Auth"
  | "Billing"
  | "Messaging"
  | "AI"
  | "Observability"
  | "Analytics"
  | "Routing"
  | "Weather"
  | "Park data";
export type AdminIntegrationStage = "live" | "scaffolded" | "recommended";
export type AdminIntegrationStatus = "configured" | "partial" | "missing";

type EnvShape = Record<string, string | undefined>;

type IntegrationEnvVarBlueprint = {
  description: string;
  name: string;
  required?: boolean;
};

type IntegrationBlueprint = {
  benefit: string;
  category: AdminIntegrationCategory;
  description: string;
  docsUrl: string;
  envVars: IntegrationEnvVarBlueprint[];
  key: string;
  name: string;
  roadmapRank: number;
  stage: AdminIntegrationStage;
  stageDetail: string;
  steps: Array<{
    detail: string;
    title: string;
  }>;
  resolveStatus: (env: EnvShape, envVars: IntegrationEnvVarBlueprint[]) => {
    detail: string;
    status: AdminIntegrationStatus;
  };
};

export type AdminIntegration = {
  benefit: string;
  category: AdminIntegrationCategory;
  description: string;
  docsUrl: string;
  envVars: Array<IntegrationEnvVarBlueprint & { present: boolean; required: boolean }>;
  key: string;
  name: string;
  roadmapRank: number;
  stage: AdminIntegrationStage;
  stageDetail: string;
  status: AdminIntegrationStatus;
  statusDetail: string;
  steps: Array<{
    detail: string;
    title: string;
  }>;
};

export type AdminIntegrationsSnapshot = {
  integrations: AdminIntegration[];
  summary: {
    configured: number;
    live: number;
    missing: number;
    partial: number;
    recommended: number;
    scaffolded: number;
  };
};

function hasEnv(env: EnvShape, name: string) {
  return Boolean(env[name]?.trim());
}

function evaluateEnvStatus(env: EnvShape, envVars: IntegrationEnvVarBlueprint[]): AdminIntegrationStatus {
  const requiredVars = envVars.filter((item) => item.required !== false);
  const presentRequired = requiredVars.filter((item) => hasEnv(env, item.name)).length;

  if (requiredVars.length > 0 && presentRequired === requiredVars.length) {
    return "configured";
  }

  if (envVars.some((item) => hasEnv(env, item.name))) {
    return "partial";
  }

  return "missing";
}

function buildEnvVars(env: EnvShape, envVars: IntegrationEnvVarBlueprint[]) {
  return envVars.map((item) => ({
    ...item,
    present: hasEnv(env, item.name),
    required: item.required !== false,
  }));
}

const integrationBlueprints: IntegrationBlueprint[] = [
  {
    key: "google-auth",
    name: "Google OAuth",
    category: "Auth",
    roadmapRank: 1,
    stage: "live",
    stageDetail: "Google sign-in already has route handlers and session support in the app.",
    description: "Lets users sign in with Google instead of creating a local password.",
    benefit: "Cuts signup friction and raises completed onboarding rates.",
    docsUrl: "https://developers.google.com/identity/protocols/oauth2/web-server",
    envVars: [
      {
        name: "GOOGLE_CLIENT_ID",
        description: "OAuth client ID from Google Cloud.",
      },
      {
        name: "GOOGLE_CLIENT_SECRET",
        description: "OAuth client secret from Google Cloud.",
      },
      {
        name: "APP_URL",
        description: "Canonical production origin used for server-side auth callbacks and email links.",
      },
      {
        name: "NEXT_PUBLIC_APP_URL",
        description: "Optional public origin. Keep it aligned with APP_URL if you set both.",
        required: false,
      },
    ],
    steps: [
      {
        title: "Create a Google Web OAuth client",
        detail: "Create credentials in Google Cloud and use the production domain as an authorized JavaScript origin.",
      },
      {
        title: "Register the callback route",
        detail: "Add https://your-domain/api/auth/google/callback as an authorized redirect URI so src/lib/auth/google.ts can complete the flow.",
      },
      {
        title: "Set production env vars",
        detail: "Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and APP_URL in Elastic Beanstalk so server-side auth callbacks and email links use the real production domain. Keep NEXT_PUBLIC_APP_URL aligned if you still set it.",
      },
    ],
    resolveStatus(env, envVars) {
      const status = evaluateEnvStatus(env, envVars);

      if (status === "configured") {
        return {
          status,
          detail: "OAuth credentials are present. Confirm the callback URL matches the final production domain exactly.",
        };
      }

      if (status === "partial") {
        return {
          status,
          detail: "Some Google settings exist, but APP_URL or one of the OAuth secrets is still missing.",
        };
      }

      return {
        status,
        detail: "Google sign-in is available in code but not configured for this environment yet.",
      };
    },
  },
  {
    key: "stripe-billing",
    name: "Stripe Billing",
    category: "Billing",
    roadmapRank: 2,
    stage: "scaffolded",
    stageDetail: "Tiered plans, entitlements, and pricing UI are live; checkout and webhook sync still need final route wiring.",
    description: "Handles paid subscriptions for the Free, Plus, and Pro plans.",
    benefit: "Lets you convert users directly from the plan gates already visible in the product.",
    docsUrl: "https://docs.stripe.com/payments/checkout/build-subscriptions",
    envVars: [
      {
        name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        description: "Stripe publishable key for the browser checkout flow.",
      },
      {
        name: "STRIPE_SECRET_KEY",
        description: "Stripe secret key for server-side session creation.",
      },
      {
        name: "STRIPE_WEBHOOK_SECRET",
        description: "Webhook signing secret for subscription updates.",
      },
      {
        name: "STRIPE_PRICE_PLUS_MONTHLY",
        description: "Stripe monthly recurring price ID for the Plus tier.",
      },
      {
        name: "STRIPE_PRICE_PRO_MONTHLY",
        description: "Stripe monthly recurring price ID for the Pro tier.",
      },
    ],
    steps: [
      {
        title: "Create Stripe products and monthly prices",
        detail: "Create Plus and Pro products in Stripe and copy the live recurring price IDs into the matching env vars.",
      },
      {
        title: "Set checkout and webhook secrets",
        detail: "Add the publishable key, secret key, and webhook secret in Elastic Beanstalk so billing routes can validate Stripe traffic.",
      },
      {
        title: "Finish the subscription sync routes",
        detail: "Add checkout-session and webhook handlers that update User.stripeCustomerId, User.stripeSubscriptionId, and subscription status fields used by the paywalls.",
      },
    ],
    resolveStatus(env, envVars) {
      const status = evaluateEnvStatus(env, envVars);

      if (status === "configured") {
        return {
          status,
          detail: "Stripe secrets and price IDs are present. The remaining work is the final checkout-session and webhook implementation.",
        };
      }

      if (status === "partial") {
        return {
          status,
          detail: "Some Stripe values are in place, but the live price IDs or webhook secret are still missing.",
        };
      }

      return {
        status,
        detail: "Billing plans are modeled in the app, but Stripe is not configured for live subscription activation yet.",
      };
    },
  },
  {
    key: "transactional-email",
    name: "Transactional Email",
    category: "Messaging",
    roadmapRank: 3,
    stage: "live",
    stageDetail: "Email-link auth can now send through Postmark first, with Resend still available as a fallback during cutover.",
    description: "Delivers sign-in and verification links reliably in production.",
    benefit: "Reduces auth failures and gives you a safer migration path while email deliverability is being verified.",
    docsUrl: "https://postmarkapp.com/developer/user-guide/send-email-with-api",
    envVars: [
      {
        name: "POSTMARK_SERVER_TOKEN",
        description: "Primary Postmark API token for transactional sends.",
      },
      {
        name: "POSTMARK_FROM_EMAIL",
        description: "Verified Postmark sender or domain-based from address.",
      },
      {
        name: "POSTMARK_MESSAGE_STREAM",
        description: "Optional Postmark message stream; defaults to outbound.",
        required: false,
      },
      {
        name: "RESEND_API_KEY",
        description: "Optional fallback provider during the Postmark cutover.",
        required: false,
      },
      {
        name: "RESEND_FROM_EMAIL",
        description: "Optional fallback sender when Resend is enabled.",
        required: false,
      },
    ],
    steps: [
      {
        title: "Verify a sender in Postmark",
        detail: "Create a Postmark server, verify the sending domain or sender signature, and choose the transactional message stream you want to use.",
      },
      {
        title: "Set the Postmark env vars",
        detail: "Add POSTMARK_SERVER_TOKEN and POSTMARK_FROM_EMAIL so src/lib/email.ts sends auth emails through Postmark in production.",
      },
      {
        title: "Keep or remove the fallback provider",
        detail: "Leave RESEND_API_KEY and RESEND_FROM_EMAIL in place during launch if you want a safe rollback, then remove them once Postmark is stable.",
      },
    ],
    resolveStatus(env) {
      if (isPostmarkEmailConfigured(env)) {
        return {
          status: "configured",
          detail: "Postmark is configured and will be used as the primary email provider for auth flows.",
        };
      }

      if (isResendEmailConfigured(env)) {
        return {
          status: "partial",
          detail: "Resend is configured today. Add Postmark env vars to switch production email delivery to Postmark without changing the auth flow.",
        };
      }

      if (getConfiguredEmailProvider(env)) {
        return {
          status: "partial",
          detail: "A fallback email provider is configured, but the primary Postmark setup is incomplete.",
        };
      }

      return {
        status: "missing",
        detail: "No production email provider is configured yet, so email-link auth will fail in production.",
      };
    },
  },
  {
    key: "openai",
    name: "OpenAI",
    category: "AI",
    roadmapRank: 4,
    stage: "live",
    stageDetail: "The app already uses OpenAI when a key is present and falls back to deterministic copy when it is not.",
    description: "Powers the concierge, explanation generation, and richer planning responses.",
    benefit: "Improves perceived product intelligence without changing the rest of the trip-planning workflow.",
    docsUrl: "https://platform.openai.com/docs/guides/text?api-mode=responses",
    envVars: [
      {
        name: "OPENAI_API_KEY",
        description: "API key used by the concierge and explanation services.",
      },
      {
        name: "OPENAI_MODEL",
        description: "Default model name for explanation and planning responses.",
        required: false,
      },
      {
        name: "OPENAI_TRIP_PLANNER_MODEL",
        description: "Optional override for the trip planner agent.",
        required: false,
      },
    ],
    steps: [
      {
        title: "Create a restricted OpenAI key",
        detail: "Create a project-scoped API key and put a spend limit on the project before using it in production.",
      },
      {
        title: "Set the model env vars",
        detail: "Add OPENAI_API_KEY and optionally OPENAI_MODEL or OPENAI_TRIP_PLANNER_MODEL for the planning flows that already call the SDK.",
      },
      {
        title: "Watch premium usage",
        detail: "Track concierge usage against Pro conversions so the AI spend stays aligned with the plan gates.",
      },
    ],
    resolveStatus(env, envVars) {
      const status = evaluateEnvStatus(env, envVars);

      if (status === "configured") {
        return {
          status,
          detail: "OpenAI is configured and the concierge can use the live model instead of deterministic fallback copy.",
        };
      }

      if (status === "partial") {
        return {
          status,
          detail: "An OpenAI model override exists, but the API key is still missing.",
        };
      }

      return {
        status,
        detail: "The app will use deterministic explanations until an OpenAI API key is added.",
      };
    },
  },
  {
    key: "sentry",
    name: "Sentry",
    category: "Observability",
    roadmapRank: 1,
    stage: "recommended",
    stageDetail: "This is the highest-value next integration for production visibility because it will catch auth, billing, and live-trip failures automatically.",
    description: "Captures server exceptions, frontend errors, and release-linked traces in production.",
    benefit: "Gives you a direct way to see failures before users report them.",
    docsUrl: "https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/",
    envVars: [
      {
        name: "NEXT_PUBLIC_SENTRY_DSN",
        description: "Client and server DSN used to send events to Sentry.",
      },
      {
        name: "SENTRY_AUTH_TOKEN",
        description: "Optional auth token for source-map uploads during builds.",
        required: false,
      },
      {
        name: "SENTRY_ORG",
        description: "Optional Sentry organization for release automation.",
        required: false,
      },
      {
        name: "SENTRY_PROJECT",
        description: "Optional Sentry project slug for release automation.",
        required: false,
      },
    ],
    steps: [
      {
        title: "Install the Next.js SDK",
        detail: "Add @sentry/nextjs, then create instrumentation and runtime config files so App Router requests and route handlers report errors.",
      },
      {
        title: "Set the DSN and release env vars",
        detail: "Add NEXT_PUBLIC_SENTRY_DSN for event delivery and the optional auth token, org, and project vars if you want source maps uploaded during build.",
      },
      {
        title: "Capture the critical flows first",
        detail: "Start by instrumenting auth callbacks, Stripe webhooks, and live-trip API routes so production issues show up immediately.",
      },
    ],
    resolveStatus(env, envVars) {
      const status = evaluateEnvStatus(env, envVars);

      if (status === "configured") {
        return {
          status,
          detail: "The DSN is present. Finish the SDK install and route instrumentation to start collecting production errors.",
        };
      }

      if (status === "partial") {
        return {
          status,
          detail: "Some release metadata exists, but the DSN or SDK wiring is still missing.",
        };
      }

      return {
        status,
        detail: "Sentry is not wired yet. This should be the first observability integration added before launch traffic increases.",
      };
    },
  },
  {
    key: "posthog",
    name: "PostHog",
    category: "Analytics",
    roadmapRank: 2,
    stage: "recommended",
    stageDetail: "PostHog is the best fit for conversion analytics, paywall experiments, and session replay without adding a separate data warehouse first.",
    description: "Tracks product analytics, funnels, feature flags, and session replay for growth decisions.",
    benefit: "Lets you measure onboarding drop-off, pricing conversion, and feature adoption by tier.",
    docsUrl: "https://posthog.com/docs/libraries/next-js",
    envVars: [
      {
        name: "NEXT_PUBLIC_POSTHOG_KEY",
        description: "Project API key for browser analytics.",
      },
      {
        name: "NEXT_PUBLIC_POSTHOG_HOST",
        description: "PostHog cloud or self-hosted ingest host.",
      },
    ],
    steps: [
      {
        title: "Install the browser SDK and provider",
        detail: "Add PostHog to src/app/layout.tsx so page views and shared user context are available across the app.",
      },
      {
        title: "Set the PostHog env vars",
        detail: "Add NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST for the correct PostHog project and region.",
      },
      {
        title: "Track the revenue and activation events",
        detail: "Capture preview gate unlock, signup completed, trip generated, live mode opened, and billing CTA clicked so you can measure conversion by tier.",
      },
    ],
    resolveStatus(env, envVars) {
      const status = evaluateEnvStatus(env, envVars);

      if (status === "configured") {
        return {
          status,
          detail: "PostHog credentials are present. The remaining work is adding the provider and event tracking in the app shell and upgrade flows.",
        };
      }

      if (status === "partial") {
        return {
          status,
          detail: "A PostHog key or host is present, but both values and runtime instrumentation are not complete yet.",
        };
      }

      return {
        status,
        detail: "PostHog is not configured yet. It is the best next step for measuring signup, activation, and plan conversion.",
      };
    },
  },
  {
    key: "mapbox",
    name: "Mapbox",
    category: "Routing",
    roadmapRank: 5,
    stage: "recommended",
    stageDetail: "Mapbox would replace the current mock walking-time model with real routing and make live recommendations more trustworthy.",
    description: "Adds geocoding and real walking-time estimates for park navigation.",
    benefit: "Improves itinerary quality by using actual route times instead of only local coordinate heuristics.",
    docsUrl: "https://docs.mapbox.com/api/navigation/directions/",
    envVars: [
      {
        name: "MAPBOX_ACCESS_TOKEN",
        description: "Access token for directions and geocoding requests.",
      },
    ],
    steps: [
      {
        title: "Create a scoped Mapbox token",
        detail: "Generate a token with directions and geocoding access so the server can request route estimates safely.",
      },
      {
        title: "Add a Mapbox-backed routing provider",
        detail: "Create a real provider next to src/server/providers/mock/routing-provider.ts and switch src/server/providers/factory.ts to use it when MAPBOX_ACCESS_TOKEN is present.",
      },
      {
        title: "Use it in planner inputs",
        detail: "Once routing is live, add geocoded search and better walking estimates to trip setup and live mode so the route recommendations feel grounded in real travel time.",
      },
    ],
    resolveStatus(env, envVars) {
      const status = evaluateEnvStatus(env, envVars);

      if (status === "configured") {
        return {
          status,
          detail: "The Mapbox token is present. The next step is wiring a production routing provider into the existing provider factory.",
        };
      }

      return {
        status,
        detail: "Mapbox is not configured yet. It is the clearest upgrade path for better live routing and ETA quality.",
      };
    },
  },
  {
    key: "tomorrow-weather",
    name: "Tomorrow.io Weather",
    category: "Weather",
    roadmapRank: 4,
    stage: "recommended",
    stageDetail: "The provider seam already exists in the server provider factory, but the app still relies on generated weather data today.",
    description: "Replaces mock weather conditions with live and forecast park weather.",
    benefit: "Makes indoor-vs-outdoor recommendations, rain delays, and heat planning feel grounded in real conditions.",
    docsUrl: "https://docs.tomorrow.io/",
    envVars: [
      {
        name: "TOMORROW_API_KEY",
        description: "Tomorrow.io API key for realtime and forecast weather calls.",
      },
    ],
    steps: [
      {
        title: "Create a Tomorrow.io project and API key",
        detail: "Create the production project, confirm the plan limits you want, and generate an API key that can be rotated without touching other services.",
      },
      {
        title: "Set the production weather secret",
        detail: "Add TOMORROW_API_KEY in your production environment so the server can request weather at planner runtime.",
      },
      {
        title: "Swap the mock weather provider for a live provider",
        detail: "Implement a real provider next to src/server/providers/mock/weather-provider.ts and switch src/server/providers/factory.ts to use it when TOMORROW_API_KEY is present.",
      },
    ],
    resolveStatus(env, envVars) {
      const status = evaluateEnvStatus(env, envVars);

      if (status === "configured") {
        return {
          status,
          detail: "The weather API key is present. The remaining work is wiring a production weather provider into the existing provider factory.",
        };
      }

      return {
        status,
        detail: "Weather is still driven by generated mock conditions. Add a live weather provider before you rely on weather-sensitive planning in production.",
      };
    },
  },
  {
    key: "queue-times",
    name: "Queue-Times park operations",
    category: "Park data",
    roadmapRank: 3,
    stage: "recommended",
    stageDetail: "Parqara already has wait-time and closure provider seams, but live mode still uses synthetic park operations data today.",
    description: "Adds real ride statuses, closures, and live wait times for supported parks.",
    benefit: "Makes Mara's replans and the live dashboard reflect actual park conditions instead of local mock scenarios.",
    docsUrl: "https://queue-times.com/pages/api",
    envVars: [],
    steps: [
      {
        title: "Confirm the supported parks and attribution requirement",
        detail: "Queue-Times requires a prominent Powered by Queue-Times.com attribution for the free realtime API, so decide which parks you want to support first and where that attribution will live in the product.",
      },
      {
        title: "Add a production wait-time provider",
        detail: "Implement a real provider next to src/server/providers/mock/wait-time-provider.ts and switch src/server/providers/factory.ts to use it for supported parks while keeping a fallback path for unsupported parks.",
      },
      {
        title: "Map Parqara park and attraction IDs once",
        detail: "Create a stable mapping from your internal park and attraction IDs to the external Queue-Times IDs so wait times, closures, and alerts land on the right planner items.",
      },
    ],
    resolveStatus() {
      return {
        status: "missing",
        detail: "The app still uses synthetic wait times and ride-status scenarios. Add a real park-operations feed before treating live replans as production-grounded.",
      };
    },
  },
];

export function getAdminIntegrationsSnapshot(env: EnvShape = process.env): AdminIntegrationsSnapshot {
  const integrations = integrationBlueprints.map((blueprint) => {
    const status = blueprint.resolveStatus(env, blueprint.envVars);

    return {
      key: blueprint.key,
      name: blueprint.name,
      category: blueprint.category,
      roadmapRank: blueprint.roadmapRank,
      stage: blueprint.stage,
      stageDetail: blueprint.stageDetail,
      status: status.status,
      statusDetail: status.detail,
      description: blueprint.description,
      benefit: blueprint.benefit,
      docsUrl: blueprint.docsUrl,
      envVars: buildEnvVars(env, blueprint.envVars),
      steps: blueprint.steps,
    } satisfies AdminIntegration;
  });

  return {
    integrations,
    summary: {
      configured: integrations.filter((integration) => integration.status === "configured").length,
      partial: integrations.filter((integration) => integration.status === "partial").length,
      missing: integrations.filter((integration) => integration.status === "missing").length,
      live: integrations.filter((integration) => integration.stage === "live").length,
      scaffolded: integrations.filter((integration) => integration.stage === "scaffolded").length,
      recommended: integrations.filter((integration) => integration.stage === "recommended").length,
    },
  };
}


