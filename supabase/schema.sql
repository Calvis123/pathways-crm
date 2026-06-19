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
  next_action_date date,
  advisory_agreement_signed boolean not null default false,
  deposit_paid numeric(12,2) default 0,
  application_reference text,
  offer_letter_received boolean not null default false,
  testimonial_requested boolean not null default false,
  referral_requested boolean not null default false,
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
  created_by text,
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
  password_hash text,
  must_change_password boolean not null default true,
  password_reset_token text,
  password_reset_expires_at timestamptz,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portal_access add column if not exists password_hash text;
alter table public.portal_access add column if not exists must_change_password boolean not null default true;
alter table public.portal_access add column if not exists password_reset_token text;
alter table public.portal_access add column if not exists password_reset_expires_at timestamptz;

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

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  budget_range text,
  career_goal text,
  academic_history text,
  preferred_destinations jsonb default '[]'::jsonb,
  language_proficiency text,
  intake_script_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  country text,
  agreement_status text not null default 'negotiation',
  primary_contact_name text,
  primary_contact_email text,
  response_time_hours numeric(8,2),
  satisfaction_score numeric(4,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_agreements (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  agreement_type text not null,
  status text not null default 'negotiation',
  legal_review_complete boolean not null default false,
  commission_rate numeric(5,2),
  retainer_amount numeric(12,2),
  bonus_criteria jsonb default '{}'::jsonb,
  fee_structure jsonb not null default '{}'::jsonb,
  onboarding_checklist jsonb not null default '[]'::jsonb,
  signed_at timestamptz,
  renewal_date date,
  created_at timestamptz not null default now(),
  constraint partner_agreement_commission_rate_valid check (commission_rate is null or (commission_rate >= 0 and commission_rate <= 25))
);

create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  name text not null,
  destination text not null,
  level text not null,
  tuition_fee numeric(12,2) not null default 0,
  currency text not null default 'KES',
  eligibility_criteria jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete cascade,
  status text not null default 'draft',
  offer_letter_url text,
  submitted_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.visa_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  destination_country text not null,
  status text not null default 'not_started',
  checklist_data jsonb not null default '[]'::jsonb,
  embassy_location text,
  appointment_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.placements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  type text not null,
  institution text,
  role_title text,
  salary_range text,
  satisfaction_score numeric(4,2),
  placed_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  type text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'KES',
  recognized_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.qa_checkpoints (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  stage text not null,
  label text not null,
  passed boolean not null default false,
  checklist_data jsonb default '{}'::jsonb,
  signed_off_by text,
  signed_off_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.market_configs (
  id uuid primary key default gen_random_uuid(),
  country text not null unique,
  language text not null default 'en',
  active boolean not null default true,
  visa_requirements jsonb not null default '[]'::jsonb,
  policy_notes text not null default '',
  market_owner text,
  official_sources jsonb not null default '[]'::jsonb,
  last_verified_at date,
  fee_configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consultant_training (
  id uuid primary key default gen_random_uuid(),
  consultant_username text not null,
  module_name text not null,
  module_type text not null,
  completed boolean not null default false,
  score numeric(5,2),
  certified_at date,
  expires_at date,
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
create index if not exists idx_student_profiles_student on public.student_profiles(student_id);
create index if not exists idx_partners_type_status on public.partners(type, agreement_status);
create index if not exists idx_partner_agreements_partner_status on public.partner_agreements(partner_id, status);
create index if not exists idx_programmes_partner_active on public.programmes(partner_id, active);
create index if not exists idx_applications_student_status on public.applications(student_id, status);
create index if not exists idx_visa_records_student_status on public.visa_records(student_id, status);
create index if not exists idx_placements_partner_type on public.placements(partner_id, type);
create index if not exists idx_revenue_partner_type on public.revenue_records(partner_id, type);
create index if not exists idx_qa_checkpoints_entity_stage on public.qa_checkpoints(entity_type, entity_id, stage);
create index if not exists idx_market_configs_active_country on public.market_configs(active, country);
create index if not exists idx_consultant_training_user_completed on public.consultant_training(consultant_username, completed);

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

drop trigger if exists set_student_profiles_updated_at on public.student_profiles;
create trigger set_student_profiles_updated_at
before update on public.student_profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_partners_updated_at on public.partners;
create trigger set_partners_updated_at
before update on public.partners
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_market_configs_updated_at on public.market_configs;
create trigger set_market_configs_updated_at
before update on public.market_configs
for each row execute procedure public.touch_updated_at();

alter table public.students add column if not exists passport_number text;
alter table public.students add column if not exists next_action_date date;
alter table public.students add column if not exists advisory_agreement_signed boolean not null default false;
alter table public.students add column if not exists deposit_paid numeric(12,2) default 0;
alter table public.students add column if not exists application_reference text;
alter table public.students add column if not exists offer_letter_received boolean not null default false;
alter table public.students add column if not exists testimonial_requested boolean not null default false;
alter table public.students add column if not exists referral_requested boolean not null default false;
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
alter table public.payments add column if not exists created_by text;
alter table public.students add column if not exists assigned_consultant_id text;
alter table public.student_profiles add column if not exists budget_range text;
alter table public.student_profiles add column if not exists career_goal text;
alter table public.student_profiles add column if not exists intake_script_data jsonb not null default '{}'::jsonb;
alter table public.market_configs add column if not exists market_owner text;
alter table public.market_configs add column if not exists official_sources jsonb not null default '[]'::jsonb;
alter table public.market_configs add column if not exists last_verified_at date;

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
alter table public.student_profiles enable row level security;
alter table public.partners enable row level security;
alter table public.partner_agreements enable row level security;
alter table public.programmes enable row level security;
alter table public.applications enable row level security;
alter table public.visa_records enable row level security;
alter table public.placements enable row level security;
alter table public.revenue_records enable row level security;
alter table public.qa_checkpoints enable row level security;
alter table public.market_configs enable row level security;
alter table public.consultant_training enable row level security;
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
  foreach t in array array['consultations','student_documents','commissions','tasks','email_templates','expenses','audit_logs','student_profiles','partners','partner_agreements','programmes','applications','visa_records','placements','revenue_records','qa_checkpoints','market_configs','consultant_training']
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

create or replace view public.vw_student_pipeline as
select stage, count(*)::integer as student_count
from public.students
group by stage;

create or replace view public.vw_partner_kpis as
select
  p.id as partner_id,
  p.name as partner_name,
  coalesce(round((count(a.*) filter (where a.status = 'accepted')::numeric / nullif(count(a.*), 0)) * 100, 2), 0) as conversion_rate,
  coalesce(round((count(pl.*) filter (where pl.type in ('admission','certification','employment'))::numeric / nullif(count(a.*) filter (where a.status = 'accepted'), 0)) * 100, 2), 0) as retention_rate,
  coalesce(round(sum(r.amount)::numeric / nullif(sum(pa.retainer_amount), 0), 2), 0) as roi,
  p.response_time_hours,
  p.satisfaction_score
from public.partners p
left join public.programmes pr on pr.partner_id = p.id
left join public.applications a on a.programme_id = pr.id
left join public.placements pl on pl.partner_id = p.id
left join public.revenue_records r on r.partner_id = p.id
left join public.partner_agreements pa on pa.partner_id = p.id
group by p.id, p.name, p.response_time_hours, p.satisfaction_score;

create or replace view public.vw_revenue_summary as
select type, currency, sum(amount)::numeric(12,2) as total_amount, count(*)::integer as record_count
from public.revenue_records
group by type, currency;

create or replace view public.vw_qa_compliance as
select
  stage,
  count(*)::integer as total_checks,
  count(*) filter (where passed)::integer as passed_checks,
  coalesce(round((count(*) filter (where passed)::numeric / nullif(count(*), 0)) * 100, 2), 0) as compliance_rate
from public.qa_checkpoints
group by stage;

create or replace view public.vw_consultant_training_progress as
select
  consultant_username,
  count(*)::integer as total_modules,
  count(*) filter (where completed)::integer as completed_modules,
  coalesce(round(avg(score) filter (where score is not null), 2), 0) as average_score
from public.consultant_training
group by consultant_username;

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
