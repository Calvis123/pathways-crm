# pathways-crm

# Barak CRM Rebuild

This project is a clean rebuild of the legacy PHP CRM found in the backup folder. It uses:

- Next.js App Router
- React
- Tailwind CSS
- Supabase for PostgreSQL, auth, and storage-ready data flows

## Legacy functionality carried over

The new project is modeled from the PHP files and SQL migrations in the backup:

- `23 index.php`: dashboard, stage pipeline, bulk lead/student operations
- `book-consultation.php`: public lead + consultation intake
- `consultations-manager.php`: consultation queue and status tracking
- `documents.php`: document upload/review workflow
- `commissions.php`: university commission tracking
- `customer-segments.php`: auto-segmentation and value grouping
- `week2-database-migration.sql`: missing tables and students table extensions
- `API-DOCUMENTATION.md` and `ADMIN-GUIDE.md`: roles, access rules, audit expectations

## Project structure

- `app/`: pages and API routes
- `components/`: reusable dashboard and table components
- `lib/`: typed data access, helpers, Supabase clients, mock fallback data
- `supabase/schema.sql`: PostgreSQL schema for Supabase
- `supabase/seed.sql`: seed data for local/demo use

## Environment setup

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

If env vars are missing, the app still renders using local mock data so you can preview the UI immediately.

## Supabase setup

1. Create a new Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Add your environment variables to `.env.local`.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes

- API routes are included for creating students, scheduling consultations, and reviewing documents.
- The current RLS policies are intentionally simple so the starter works quickly.
- A next step would be adding Supabase Auth and role-aware row filtering to match the old PHP session logic for `marketing`, `ielts_trainer`, `admin`, and other roles.
