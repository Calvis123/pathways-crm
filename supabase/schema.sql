create extension if not exists "pgcrypto";

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  passport_number text,
  location text,
  country_interest text,
  program_level text,
  university_name text,
  enrollment_date date,
  stage text not null default 'lead',
  consultation_requested boolean not null default false,
  consultation_status text,
  consultation_date timestamptz,
  visa_status text,
  ielts_enrolled boolean not null default false,
  ielts_amount numeric(12,2) default 0,
  ielts_payment_status text,
  ielts_overall_score numeric(4,1),
  ielts_session_count integer default 0,
  ielts_test_date date,
  payment_status text default 'pending',
  payment_due_date date,
  payment_amount numeric(12,2) default 0,
  payment_paid numeric(12,2) default 0,
  payment_date date,
  payment_method text,
  payment_notes text,
  commission_amount numeric(12,2) default 140000,
  commission_status text default 'pending',
  commission_due_date date,
  commission_paid_date date,
  commission_institution text,
  commission_notes text,
  consultation_upfront_paid numeric(12,2) not null default 0,
  consultation_balance_paid numeric(12,2) not null default 0,
  segment text default 'unsegmented',
  segment_score integer default 0,
  lead_source text,
  referral_code text,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'pending',
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  document_type text not null,
  original_filename text not null,
  file_url text,
  file_size integer,
  status text not null default 'pending',
  review_notes text,
  uploaded_by text,
  reviewed_by text,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  university_name text not null,
  tuition_fee numeric(12,2) not null default 0,
  commission_rate numeric(5,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  currency text not null default 'KES',
  status text not null default 'pending',
  due_date date,
  payment_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  payment_type text not null default 'consultation',
  amount numeric(12,2) not null default 0,
  currency text not null default 'KES',
  status text not null default 'pending',
  payment_method text not null default 'mpesa',
  reference_number text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text,
  full_name text not null,
  email text not null unique,
  role text not null default 'employee',
  status text not null default 'active',
  phone text,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_name text not null,
  referrer_email text,
  referrer_phone text,
  referral_code text not null unique,
  referred_student_name text not null,
  referred_student_email text,
  status text not null default 'new',
  reward_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  created_by text,
  creator_name text,
  note_text text not null,
  note_type text not null default 'general',
  priority text not null default 'medium',
  is_private boolean not null default false,
  tags text,
  reminder_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portal_access (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  access_token text not null unique,
  token_expires_at timestamptz not null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portal_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject text not null,
  message text not null,
  direction text not null default 'crm_to_student',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.portal_activity (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  activity_type text not null,
  activity_details text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'pending',
  priority text not null default 'medium',
  due_date date,
  assigned_to text,
  created_at timestamptz not null default now()
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  template_name text not null,
  subject text not null,
  body text not null,
  category text not null default 'general',
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric(12,2) not null default 0,
  description text,
  expense_date date not null default current_date,
  payment_method text,
  receipt_number text,
  vendor text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  table_name text not null,
  related_id text,
  record_label text,
  old_value text,
  new_value text,
  actor_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_students_stage on public.students(stage);
create index if not exists idx_students_created_at on public.students(created_at desc);
create index if not exists idx_students_segment on public.students(segment);
create index if not exists idx_consultations_student_status on public.consultations(student_id, status);
create index if not exists idx_documents_student_status on public.student_documents(student_id, status);
create index if not exists idx_commissions_status on public.commissions(status);
create index if not exists idx_payments_student_status on public.payments(student_id, status);
create index if not exists idx_referrals_status on public.referrals(status);
create index if not exists idx_student_notes_student_created on public.student_notes(student_id, created_at desc);
create index if not exists idx_portal_access_student on public.portal_access(student_id);
create index if not exists idx_portal_messages_student on public.portal_messages(student_id, created_at desc);
create index if not exists idx_portal_activity_student on public.portal_activity(student_id, created_at desc);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_expenses_date_category on public.expenses(expense_date desc, category);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at
before update on public.students
for each row execute procedure public.touch_updated_at();

alter table public.students add column if not exists passport_number text;
alter table public.students add column if not exists enrollment_date date;
alter table public.students add column if not exists ielts_amount numeric(12,2) default 0;
alter table public.students add column if not exists ielts_payment_status text;
alter table public.students add column if not exists ielts_overall_score numeric(4,1);
alter table public.students add column if not exists ielts_session_count integer default 0;
alter table public.students add column if not exists ielts_test_date date;
alter table public.students add column if not exists payment_due_date date;
alter table public.students add column if not exists payment_amount numeric(12,2) default 0;
alter table public.students add column if not exists payment_paid numeric(12,2) default 0;
alter table public.students add column if not exists payment_date date;
alter table public.students add column if not exists payment_method text;
alter table public.students add column if not exists payment_notes text;
alter table public.students add column if not exists commission_amount numeric(12,2) default 140000;
alter table public.students add column if not exists commission_status text default 'pending';
alter table public.students add column if not exists commission_due_date date;
alter table public.students add column if not exists commission_paid_date date;
alter table public.students add column if not exists commission_institution text;
alter table public.students add column if not exists commission_notes text;

alter table public.students enable row level security;
alter table public.consultations enable row level security;
alter table public.student_documents enable row level security;
alter table public.commissions enable row level security;
alter table public.payments enable row level security;
alter table public.users enable row level security;
alter table public.referrals enable row level security;
alter table public.student_notes enable row level security;
alter table public.portal_access enable row level security;
alter table public.portal_messages enable row level security;
alter table public.portal_activity enable row level security;
alter table public.tasks enable row level security;
alter table public.email_templates enable row level security;
alter table public.expenses enable row level security;
alter table public.audit_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'students' and policyname = 'Allow authenticated users full access'
  ) then
    create policy "Allow authenticated users full access" on public.students
      for all to authenticated using (true) with check (true);
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array['consultations','student_documents','commissions','tasks','email_templates','expenses','audit_logs']
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'Allow authenticated users full access'
    ) then
      execute format(
        'create policy "Allow authenticated users full access" on public.%I for all to authenticated using (true) with check (true)',
        t
      );
    end if;
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['payments','users','referrals','student_notes','portal_access','portal_messages','portal_activity']
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'Allow authenticated users full access'
    ) then
      execute format(
        'create policy "Allow authenticated users full access" on public.%I for all to authenticated using (true) with check (true)',
        t
      );
    end if;
  end loop;
end $$;
