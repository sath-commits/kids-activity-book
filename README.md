# Little Explorer

Personalized, printable activity booklets for kids — generated on demand for any destination in the world.

**Live:** [little-explorer.builtthisweekend.com](https://little-explorer.builtthisweekend.com)

## What it does

Enter a destination + your children's details → get a custom PDF junior ranger booklet with:
- Destination-specific coloring pages (DALL-E 3)
- Activity sections with missions, challenges, scavenger hunt
- Personalized content based on child's interests
- Bingo card, badges, and completion certificates
- Print at home!

## Stack

- **Framework:** Next.js 14, App Router, TypeScript, Tailwind CSS
- **AI:** OpenAI `gpt-4o` (content), `dall-e-3` (coloring page images)
- **PDF:** `@react-pdf/renderer` (generation)
- **Email:** Resend
- **Cache:** Supabase (destination-level content)

## Environment Variables

Copy `.env.local.example` to `.env.local`:

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
RESEND_API_KEY=re_...
```

## Supabase DDL

Run this in your Supabase SQL editor:

```sql
create table destination_cache (
  destination_slug text primary key,
  destination_display_name text not null,
  destination_intro text default '',
  sections_json jsonb not null,
  cover_image_url text,
  section_image_urls jsonb default '[]'::jsonb,
  scavenger_hunt_json jsonb not null,
  bingo_grid_json jsonb not null,
  badge_names_json jsonb not null,
  answer_key_json jsonb not null,
  bonus_content_json jsonb,
  hit_count integer default 1,
  created_at timestamptz default now()
);
```

If your existing table still has legacy `cover_image_b64` / `section_images_b64` columns marked `not null`, either make them nullable or keep them temporarily while the app backfills empty values for backward compatibility.

## Cache Architecture

**What's cached** (per destination, shared across all users):
- GPT-4o structured content (sections, scavenger hunt, bingo, badges)
- DALL-E 3 images (cover + one per section)

**Never cached** (always fresh):
- Child names, ages, gender, interests
- Personalized challenge notes and drawing prompts
- Language translations (cached with `_[lang]` slug suffix, e.g. `yellowstone-national-park-wy_es`)

To refresh stale cached content: delete the row in `destination_cache`. No auto-expiry in v1.

## Rate Limiting

10 requests per IP per hour (in-memory, resets on server restart). Configurable in `lib/rateLimit.ts`.

## Local Development

```bash
npm install
cp .env.local.example .env.local
# Fill in your API keys
npm run dev
```

## Deployment

Deploy to Vercel. Set environment variables in the project dashboard.
