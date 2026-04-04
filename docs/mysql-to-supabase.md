# MySQL to Supabase Migration

This app already knows how to read from Supabase. As soon as these env vars exist in `.env.local`, the data layer switches away from `data/local-db.json` and starts using your Supabase project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 1. Create the Supabase schema

Run [schema.sql](C:/Users/USER/Desktop/pathways%20projects/next-crm-supabase-package/supabase/schema.sql) in the Supabase SQL editor.

## 2. Add `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=your-mysql-database
```

## 3. Run the migration

```powershell
npm install
npm run migrate:mysql-to-supabase
```

The script migrates these tables when they exist in MySQL:

- `users`
- `students`
- `consultations`
- `documents`
- `payments`
- `commissions`
- `referrals`
- `tasks`
- `expenses`
- `audit_logs`
- `student_notes`
- `email_templates`
- `user_templates`

## 4. Start the app

```powershell
npm run dev
```

## Notes

- Use a fresh Supabase database for the first run. By default, the script aborts if key target tables already contain data.
- If you need to load into a non-empty target, set `SUPABASE_ALLOW_EXISTING_DATA=true`.
- Missing MySQL emails are replaced with placeholders like `student-12@migrated.local`.
- Legacy document file paths are copied as strings. Actual files still need to be moved separately if they live outside the app.
- Login now accepts users stored in the Supabase `users` table, using the current plain `password` column workflow used by this project.
