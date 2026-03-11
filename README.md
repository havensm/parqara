# Parqara MVP

Parqara is a production-oriented MVP for AI-powered theme park planning and in-park guidance. It helps a guest build a park-day plan before the trip, then adapts recommendations live as wait times, closures, weather, and walking costs change.

## What is implemented

- Landing page with product framing and clear sign-up paths
- Local email/password auth, verified email-link auth, optional Google sign-in, and Postmark/Resend transactional email delivery
- Trip setup flow with park-day constraints
- Deterministic itinerary generation with explanations
- Live park dashboard with next-best recommendation, alerts, and replan action
- Trip completion flow and summary screen
- Next.js API routes for the core product workflow
- PostgreSQL persistence through Prisma
- Mock provider adapters for park metadata, wait times, weather, AI text, and routing
- Idempotent park-catalog bootstrap for first deploys
- Temporary app-wide password gate while the production environment is being finalized
- Free, Plus, and Pro subscription tiers with Stripe-ready billing fields and feature gating
- Admin control room with app metrics and an integration setup checklist
- Vitest coverage for the recommendation engine

## Stack

- Frontend: Next.js App Router + TypeScript
- Styling: Tailwind CSS v4
- Backend: Next.js route handlers and server services
- Database: PostgreSQL + Prisma
- Auth: Local session cookie auth with Prisma-backed sessions
- Testing: Vitest
- AI: deterministic fallback, optional OpenAI provider

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables:
   ```bash
   copy .env.example .env
   ```
3. Start PostgreSQL:
   ```bash
   docker compose up -d db
   ```
4. Apply the Prisma schema locally:
   ```bash
   npm run db:push
   ```
5. Bootstrap the default park catalog:
   ```bash
   npm run db:seed
   ```
6. Start the app:
   ```bash
   npm run dev
   ```
7. Open [http://localhost:3000](http://localhost:3000)
8. Enter the temporary access word `yard` on the preview gate unless you changed `PREVIEW_GATE_PASSWORD`.

## Useful commands

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run bundle:eb
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run db:bootstrap
npm run prisma:studio
```

## Bootstrap data

The bootstrap script seeds a default park catalog for `Aurora Adventure Park`, including:

- 20 attractions, shows, play areas, and dining locations
- Per-attraction wait profiles for live simulation
- Park metadata required to create new trips
- Idempotent upserts so repeated deploys stay safe

It does not create demo accounts or demo trips.

## AWS Elastic Beanstalk deployment

Parqara is deployable as a single Node.js Elastic Beanstalk environment backed by PostgreSQL RDS.

1. Create an Amazon RDS PostgreSQL instance in the same VPC as your Elastic Beanstalk environment.
2. Create a Node.js 22 Amazon Linux 2023 Elastic Beanstalk web environment.
3. Configure environment variables in Elastic Beanstalk:
   - `DATABASE_URL`
   - `APP_URL`
   - `NEXT_PUBLIC_APP_URL` if you need a public browser-facing origin as well
   - `SESSION_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `OPENAI_TRIP_PLANNER_MODEL`
   - `POSTMARK_SERVER_TOKEN`
   - `POSTMARK_FROM_EMAIL`
   - `POSTMARK_MESSAGE_STREAM`
   - `RESEND_API_KEY` and `RESEND_FROM_EMAIL` only if you want a fallback email provider during the Postmark cutover
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_PLUS_MONTHLY`
   - `STRIPE_PRICE_PRO_MONTHLY`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `NEXT_PUBLIC_POSTHOG_KEY`
   - `NEXT_PUBLIC_POSTHOG_HOST`
   - `MAPBOX_ACCESS_TOKEN`
   - `SKIP_DB_BOOTSTRAP` if you need to suppress migrations and seed/bootstrap during a deploy
   - `PREVIEW_GATE_ENABLED` to disable the temporary lock screen when you are ready
   - `PREVIEW_GATE_PASSWORD` to change the access word
4. Point the Elastic Beanstalk health check at `/api/health`. That route is now an app-level health check. Use `/api/health/db` when you want to verify database connectivity explicitly.
5. Upload `dist/parqara-web-eb.zip` through the Elastic Beanstalk UI. The included predeploy hook runs Prisma migrate and seed as separate steps, writes to `/var/log/parqara-predeploy.log`, and respects:
   - `SKIP_DB_BOOTSTRAP=true` to skip bootstrap entirely
   - `DB_MIGRATE_TIMEOUT_SECONDS`
   - `DB_SEED_TIMEOUT_SECONDS`
6. Elastic Beanstalk log streaming is enabled through `.ebextensions/02-logs.config`, so future deploy failures should land in CloudWatch Logs instead of disappearing from the console flow.
7. Attach an ACM certificate to the load balancer and set `APP_URL` to the final HTTPS origin. Keep `NEXT_PUBLIC_APP_URL` aligned if you still use it in client-side code.

Included deployment artifacts:

- `Procfile`
- `.ebignore`
- `.ebextensions/01-healthcheck.config`
- `.platform/hooks/predeploy/01_bootstrap.sh`
- `prisma/migrations/*`
- `middleware.ts`
- `public/access.html`

## Terraform infrastructure

A low-cost Terraform template for AWS now lives in infra/terraform. It provisions the current Parqara deployment shape: one Elastic Beanstalk web environment plus one PostgreSQL RDS instance. See [infra/terraform/README.md](/C:/Users/mhave/OneDrive/Desktop/parqara/infra/terraform/README.md) for usage.

## EBS bundle workflow

For the current architecture, Parqara produces a single upload-ready web bundle:

```bash
npm run bundle:eb
```

That command builds the Next.js app and writes:

- `dist/parqara-web-eb.zip`

Upload that zip through the Elastic Beanstalk UI for the current full-stack deployment.

Parqara does not yet produce a separate `api.zip`, because the API routes live inside the same Next.js application under `src/app/api`. A true two-zip `web` + `api` workflow would require splitting the repo into separate deployable apps first.

## GitHub deployment workflow

GitHub Actions can now deploy Parqara automatically to Elastic Beanstalk whenever a change lands on `main`.

Workflow file:

- `.github/workflows/deploy-eb-prod.yml`

What it does on every push to `main`:

- installs dependencies
- runs `npm run lint`
- builds `dist/parqara-web-eb.zip`
- uploads that zip to GitHub as a workflow artifact
- copies the zip to S3
- creates a new Elastic Beanstalk application version
- updates the `parqara-web-env-1` environment
- checks `/api/health` after deployment

Repository variables to add in GitHub Actions settings:

- `EB_DEPLOY_BUCKET` (required): S3 bucket used to store deployment zips for Elastic Beanstalk application versions
- `AWS_REGION` (optional): defaults to `us-east-1`
- `EB_APPLICATION_NAME` (optional): defaults to `parqara-web`
- `EB_ENVIRONMENT_NAME` (optional): defaults to `parqara-web-env-1`
- `EB_HEALTHCHECK_URL` (optional): override the post-deploy health check URL if you want to hit `https://parqara.com/api/health` instead of the Elastic Beanstalk CNAME

AWS credentials for the workflow:

- preferred: `AWS_GITHUB_ACTIONS_ROLE_ARN` secret for GitHub OIDC-based deploys
- fallback: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets

The S3 bucket must already exist in the same AWS region as Elastic Beanstalk. The workflow only publishes new app versions and updates the existing environment; it does not create AWS infrastructure. Keep runtime variables like `APP_URL`, `DATABASE_URL`, and the Google/Stripe secrets managed in Elastic Beanstalk.

## API surface

- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/email/start`
- `GET /api/auth/email/verify`
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `POST /api/auth/signout`
- `GET /api/health`
- `POST /api/preview-access`
- `DELETE /api/preview-access`
- `POST /api/trips`
- `GET /api/trips/[tripId]`
- `PATCH /api/trips/[tripId]`
- `POST /api/trips/[tripId]/generate`
- `GET /api/trips/[tripId]/live`
- `POST /api/trips/[tripId]/complete`
- `POST /api/trips/[tripId]/replan`
- `GET /api/trips/[tripId]/summary`

## Architecture

### Provider abstraction

All external-style dependencies live behind typed interfaces in `src/server/providers/contracts.ts`.

Implemented providers:

- `ParkMetadataProvider`: loads park and attraction metadata
- `WaitTimeProvider`: computes live waits from seeded profiles and active disruption scenarios
- `WeatherProvider`: returns seeded hourly weather states
- `RoutingProvider`: estimates walking time from attraction coordinates and congestion events
- `RecommendationExplanationProvider`: creates itinerary and replan explanations

The current provider factory is in `src/server/providers/factory.ts`. Replacing the mocks with real theme park, weather, routing, or AI APIs should not require UI rewrites.

### Recommendation engine

The deterministic engine lives in `src/server/engine/recommendation-engine.ts`.

Each recommendation is scored with weighted factors such as:

- Must-do priority
- Preferred ride type match
- Kid and thrill suitability
- Current wait time
- Walking time from the current location
- Same-zone / anti-backtracking bonus
- Meal window bonus
- Short-wait / below-baseline crowd advantage
- Show penalty when high-priority rides are still outstanding

The engine also inserts break windows, prefers dining during lunch/snack windows, and excludes closed attractions. It is deliberately structured so a forecasting or ML model can replace the scoring layer later without changing the API contracts.

## Persistence model

Prisma models included in `prisma/schema.prisma`:

- `User`
- `UserPreference`
- `EmailVerificationToken`
- `Session`
- `Trip`
- `PartyProfile`
- `TripCollaborator`
- `Park`
- `Attraction`
- `ItineraryItem`
- `ParkStateSnapshot`

## OpenAI support

If `OPENAI_API_KEY` is empty, Parqara uses deterministic explanation text.

If `OPENAI_API_KEY` is present, the explanation providers call the OpenAI Responses API through the `openai` SDK while keeping the rest of the system unchanged.

## Subscription tiers

- `Free`: core trip setup, itinerary generation, saved preferences, and summaries
- `Plus` (`$12/month`): live park dashboard, ride completions, and instant replans
- `Pro` (`$29/month`): everything in Plus, plus Mara AI concierge and trip collaboration

## Admin dashboard

`/admin` is restricted to `havensm09@gmail.com`.

It now has two views:

- `Metrics`: live user, subscription, trip, onboarding, and collaboration metrics from Prisma
- `Integrations`: setup status and completion steps for Google OAuth, Stripe, Postmark email, OpenAI, Sentry, PostHog, and Mapbox

Recommended next integrations for production are:

- `Sentry` for error monitoring and release visibility
- `PostHog` for signup, paywall, and feature-adoption analytics
- `Mapbox` for real walking-time estimates and stronger live routing

## Deferred TODO

These are the improvements intentionally being postponed while the first live version is getting online.

- [ ] Move the AWS setup from `SingleInstance` Elastic Beanstalk to a load-balanced environment with ACM so the app can run behind end-to-end HTTPS instead of the temporary Cloudflare edge-only setup.
- [ ] Switch Cloudflare SSL from `Flexible` to `Full (strict)` once the AWS origin has a valid certificate.
- [ ] Finish the Stripe billing flow with checkout sessions, webhook handling, subscription syncing, and a customer portal.
- [ ] Replace the temporary personal Google support/contact email in the Google Auth Platform config with a real Parqara business address once branded email is set up.
- [ ] Wire the recommended integrations into runtime code: `Sentry`, `PostHog`, and `Mapbox`.
- [ ] Replace the mock provider adapters with real park, weather, wait-time, and routing providers where available.
- [ ] Split the app into separate deployable `web` and `api` services only if the current full-stack Next.js deployment starts to become a constraint.
- [ ] Add a remote Terraform state backend with S3 and locking so infrastructure changes are safer across machines.
- [ ] Tighten the EBS deployment flow so app versions can be promoted with a repeatable release process instead of only manual UI uploads.
- [ ] Add a proper seeded internal test/admin account flow for smoke testing instead of relying only on manual sign-up.
- [ ] Expand test coverage beyond the recommendation engine and targeted billing/admin tests, especially around auth, billing gates, and deployment-critical flows.
- [ ] Revisit the landing page again once product screenshots from the live app are available, replacing placeholder marketing illustrations where needed.

## Verification completed

The repository has been validated with:

- `npm run lint`
- `npm run build`
- `npm run db:seed`
- `prisma migrate deploy` plus `db:seed` against a fresh temporary PostgreSQL database
- direct Vitest execution of `src/server/engine/recommendation-engine.test.ts`
- HTTP verification that the temporary gate redirects to `/access.html`, rejects a bad password, and unlocks on `yard`

## Known note

On this Windows + OneDrive environment, repeated production builds can require clearing the generated `.next` directory between attempts because of file locking on build artifacts. A fresh build from a clean state succeeds.





















