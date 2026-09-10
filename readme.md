# Oregon Politiscape

A full-stack news and commentary website focused on Oregon politics, with an editorial CMS and an AI-assisted draft-generation pipeline.

## Features

- Mission-driven home page, featured articles, category pages, and individual article pages.
- Responsive navigation, an article archive, About page, and contact form.
- Admin tools for managing articles, drafts, categories, and contact messages.
- Image uploads backed by Replit App Storage.
- RSS and YouTube content sources for an automated editorial pipeline.
- Category matching, title-similarity checks before generation, and duplicate slug/title checks after generation.
- AI-generated articles saved as unpublished drafts for human review.
- Manual pipeline runs, configurable generation settings, run history, and email notifications through Resend.
- Search and sharing metadata, structured data, a sitemap, and crawler directives.
- Replit Auth with PostgreSQL-backed sessions.

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Routing and data | wouter, TanStack Query |
| Backend | Express 5, Node.js, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Authentication | Replit Auth / OpenID Connect, Passport, express-session |
| AI | OpenAI |
| Email | Resend |
| Storage | Replit App Storage / Google Cloud Storage |
| Scheduling | node-cron |

## Getting started

This application includes Replit-specific authentication, storage, and connector integrations. A checkout alone does not provision those services or copy the live database.

### Prerequisites

- Node.js 20 or later and npm.
- A PostgreSQL database.
- A configured Replit environment for the existing authentication, storage, and email integrations.
- An OpenAI API key if using AI draft generation.

### Install

```bash
git clone https://github.com/wholefoo/Oregon-Politiscape.git
cd Oregon-Politiscape
npm ci
```

### Configuration

Provide configuration through the runtime environment. Never commit credentials to GitHub.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `SESSION_SECRET` | Secret used to sign authentication sessions. |
| `ADMIN_USER_IDS` | Comma-separated allowlist of Replit user IDs allowed to administer the site. |
| `OPENAI_API_KEY` | Required for AI draft generation. |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Public object-storage search paths. |
| `PRIVATE_OBJECT_DIR` | Private object-storage directory. |
| `SITE_URL` | Canonical public site URL used by server-side SEO routes. |
| `ADMIN_NOTIFICATION_EMAIL` | Notification recipient fallback when no recipient is configured in the database. |
| `PORT` | Server port; defaults to `5000`. |

Replit Auth also depends on the runtime's `REPL_ID`; `ISSUER_URL` optionally overrides the default OpenID issuer. The email integration uses Replit-managed connector configuration and runtime identity. Do not copy runtime identity credentials into source files.

**Important:** Set `ADMIN_USER_IDS` before exposing the application to users. In the current implementation, an empty allowlist permits any authenticated user to access admin routes.

### Initialize the database and run

After configuring a development database:

```bash
npm run db:push
npm run dev
```

`db:push` applies the Drizzle schema to the configured database. Review schema changes and back up important data before applying them to an existing database.

The application seeds categories at startup. Existing articles, user accounts, contact messages, and uploaded storage objects are not copied by cloning this repository.

### Production build

```bash
npm run build
npm start
```

The production server serves the built frontend and API together. Configure the same database and service dependencies in the target runtime. Running outside Replit requires adapting the Replit-specific integrations.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Build the frontend and backend. |
| `npm start` | Run the production build. |
| `npm run check` | Run the TypeScript compiler check. |
| `npm run db:push` | Apply the database schema through Drizzle Kit. |

## Editorial pipeline

1. Fetch configured content sources.
2. Match candidate stories to categories.
3. Skip titles that are too similar to existing articles.
4. Generate an article using the configured editorial prompt.
5. Check generated titles and slugs for duplicates.
6. Sanitize and save the result as an unpublished draft.
7. Record the run and send applicable notifications.

The scheduler runs daily at **6:00 AM server time** while the application process is running. Admins can also trigger runs manually. Multiple application instances each register their own scheduler, so deployment topology matters.

Generated content requires editorial review for accuracy, sourcing, attribution, and suitability before publication. Similarity detection is a title-based heuristic, not a guarantee of semantic deduplication or recognition of substantive updates.

## Project structure

```text
client/
  public/                 Static images and public assets
  src/
    components/           Shared UI components
    hooks/                Client hooks
    pages/                Public pages and admin interface
server/
  pipeline/               Source ingestion, generation, matching, notifications
  replit_integrations/    Authentication and object storage
  routes.ts               API and server-rendered utility routes
  storage.ts              Database access layer
shared/
  schema.ts               Database models and validation schemas
  models/                 Shared authentication models
script/                   Build tooling
scripts/                  Maintenance scripts
```

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Home page |
| `/posts` | Article archive |
| `/category/:slug` | Category articles |
| `/article/:slug` | Article detail |
| `/about` | About and editorial information |
| `/contact` | Contact form |
| `/admin` | Authenticated administration |
| `/sitemap.xml` | Search-engine sitemap |
| `/robots.txt` | Crawler directives |

## Repository scope

This repository contains application code and checked-in static assets. Secrets, live database records, and files held in external object storage must be managed separately.