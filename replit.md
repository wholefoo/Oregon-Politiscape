# Oregon Politiscape Clone

A content-driven political blog/CMS site cloned from oregonpolitiscape.com, built with React, Express, and PostgreSQL. Contains all real article content from the original site.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter routing
- **Backend**: Express.js API server
- **Database**: PostgreSQL with Drizzle ORM
- **Content Rendering**: react-markdown + remark-gfm + rehype-raw for markdown/HTML article content
- **File Storage**: Replit App Storage (GCS) via `@google-cloud/storage` — images uploaded to `public/article/image/` in GCS bucket, served at `/article/image/:filename`
- **Styling**: Merriweather + Playfair Display fonts, patriotic/editorial color scheme with amber accents

## Pages
- `/` - Home page with hero banner, featured links, and recent articles
- `/category/:slug` - Category listing page with hero image and filtered articles
- `/article/:slug` - Individual article detail page with full markdown rendering
- `/posts` - All blog articles listing
- `/about` - About/mission page
- `/contact` - Contact form
- `/admin` - Admin CMS dashboard (Replit Auth protected)

## Authentication
- Replit Auth via OpenID Connect (passport + express-session + connect-pg-simple)
- Auth modules in `server/replit_integrations/auth/`
- Auth schema in `shared/models/auth.ts` (users + sessions tables)
- Client hook: `client/src/hooks/use-auth.ts`
- Admin routes protected with `isAuthenticated` middleware

## Data Model
- **Users**: id, email, firstName, lastName, profileImageUrl (Replit Auth)
- **Sessions**: sid, sess, expire (session storage)
- **Categories**: name, slug, description (5 categories: Founding Documents, Founding Fathers, Hamilton's Legacy, Political Spectrum, Essential Patriot)
- **Articles**: title, slug, excerpt, content (markdown/HTML), featuredImage, categoryId, published, publishedAt (23 real articles from original site)
- **Contact Messages**: name, email, message, createdAt

## Key Files
- `shared/schema.ts` - Drizzle schema definitions
- `server/routes.ts` - API endpoints (list endpoints strip content for performance)
- `server/storage.ts` - Database storage interface
- `server/seed.ts` - Category seeding (categories only)
- `server/migrate-content.ts` - One-time migration script for article content
- `server/db.ts` - Database connection
- `client/src/components/Layout.tsx` - Main layout with Navbar + Footer
- `client/src/components/ArticleCard.tsx` - Reusable article card
- `client/src/components/HeroBanner.tsx` - Hero image component
- `client/src/pages/` - All page components

## API Endpoints
- `GET /api/categories` - All categories
- `GET /api/categories/:slug` - Single category
- `GET /api/categories/:slug/articles` - Articles by category (content stripped)
- `GET /api/articles` - All published articles (content stripped)
- `GET /api/articles/featured?limit=N` - Featured/recent articles (content stripped)
- `GET /api/articles/:slug` - Single article with full content
- `POST /api/contact` - Submit contact form
- `GET /api/auth/user` - Current authenticated user
- `GET /api/admin/articles` - All articles including drafts (auth required)
- `GET /api/admin/articles/:id` - Single article by ID with content (auth required)
- `POST /api/admin/articles` - Create article (auth required)
- `PATCH /api/admin/articles/:id` - Update article (auth required)
- `DELETE /api/admin/articles/:id` - Delete article (auth required)
- `POST /api/admin/categories` - Create category (auth required)
- `PATCH /api/admin/categories/:id` - Update category (auth required)
- `DELETE /api/admin/categories/:id` - Delete category (auth required)
- `GET /api/admin/messages` - All contact messages (auth required)

## Content Pipeline
- `server/pipeline/scraper.ts` — RSS fetcher; 8 conservative sources; filters by recency (48h) and keyword relevance
- `server/pipeline/generator.ts` — OpenAI chat completions with strict worldview system prompt
- `server/pipeline/openaiClient.ts` — OpenAI client factory (requires OPENAI_API_KEY / Replit AI Integration)
- `server/pipeline/runner.ts` — Orchestrator: RSS → dedupe → generate up to 5 drafts → save as published:false
- Pipeline runs daily at 6:00 AM via node-cron; manual trigger via `POST /api/admin/pipeline/run`
- All generated articles land as drafts with `[AI Draft]` excerpt prefix; admin reviews in Pipeline tab before publishing
- `pipeline_runs` DB table logs each run (status, sourcesChecked, articlesGenerated, errorMessage)

## Notes
- Article content is stored as HTML and rendered with dangerouslySetInnerHTML + processContent() utility
- List API endpoints strip content field for performance (some articles are 100k+ chars)
- wouter Link component renders its own `<a>` tag — never wrap with another `<a>`
- Navbar/footer use hardcoded `#1a2332` dark navy background; navbar dynamically fetches categories from API
- AI-generated images for all sections stored in `/images/` directory
- The pastoral-teaching-on-the-sanctity-of-life article has placeholder content (original uses dynamic loading)
- Worldview filter: politically conservative, Judeo-Evangelical Christian, Young Earth/Biblical Creation
