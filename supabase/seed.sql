insert into public.students (
  id, full_name, email, phone, location, country_interest, program_level, university_name,
  stage, consultation_requested, consultation_status, consultation_date, next_action_date,
  advisory_agreement_signed, deposit_paid, application_reference, offer_letter_received,
  testimonial_requested, referral_requested, visa_status,
  ielts_enrolled, payment_status, consultation_upfront_paid, consultation_balance_paid,
  segment, segment_score, lead_source, referral_code, notes
) values
  (
    '9e9956df-fc55-4ee8-a47a-c5ff58d29a01', 'Faith Wanjiku', 'faith@example.com', '+254712345678',
    'Nairobi', 'United Kingdom', 'Masters', 'University of Leeds',
    'application', true, 'confirmed', '2026-04-05T09:00:00Z', '2026-04-06',
    true, 20000, 'LEEDS-FAITH-2026', false, false, false, null,
    true, 'installment', 20000, 20000, 'ready_to_go', 82, 'Facebook Consultation', null,
    'Interested in September intake.'
  ),
  (
    '495fc1e4-b0ff-42be-9568-a275ca4010a8', 'Brian Otieno', 'brian@example.com', '+254722000111',
    'Kisumu', 'Canada', 'Diploma', null,
    'consultation', true, 'pending', '2026-04-03T14:00:00Z', null,
    false, 0, null, false, false, false, null,
    false, 'pending', 0, 0, 'needs_guidance', 20, 'Website', 'BARAK10',
    'Needs scholarship guidance.'
  ),
  (
    '2b9178cc-ae7b-4945-af51-c2bbde4c63db', 'Ann Njeri', 'ann@example.com', '+254701444555',
    'Mombasa', 'Australia', 'Undergraduate', 'Monash University',
    'placed', true, 'completed', '2026-03-20T11:30:00Z', '2026-03-23',
    true, 40000, 'MONASH-ANN-2026', true, true, true, 'approved',
    false, 'full', 40000, 0, 'vip', 95, 'Referral', 'VIP2026',
    'Placement complete, waiting commission payout.'
  )
on conflict (id) do nothing;

insert into public.consultations (id, student_id, scheduled_at, status, notes) values
  ('ca403647-ac01-4f11-aac4-0d6e9f9fdcb7', '495fc1e4-b0ff-42be-9568-a275ca4010a8', '2026-04-03T14:00:00Z', 'pending', 'Discuss study budget and visa timelines.'),
  ('bd676c1d-b0ce-4d3c-817f-fd91554e5478', '9e9956df-fc55-4ee8-a47a-c5ff58d29a01', '2026-04-05T09:00:00Z', 'confirmed', 'Application checklist review.')
on conflict (id) do nothing;

insert into public.student_documents (id, student_id, document_type, original_filename, file_size, status, review_notes) values
  ('535fe534-45d2-4a90-b6ef-a85242da62eb', '9e9956df-fc55-4ee8-a47a-c5ff58d29a01', 'Passport', 'faith-passport.pdf', 304221, 'verified', 'All details clear.'),
  ('f73de48c-c09d-49b1-bf1c-5e4c175c1d07', '495fc1e4-b0ff-42be-9568-a275ca4010a8', 'Academic Transcript', 'brian-transcript.pdf', 402800, 'pending', null)
on conflict (id) do nothing;

insert into public.student_profiles (
  id, student_id, budget_range, career_goal, academic_history, preferred_destinations, language_proficiency, intake_script_data
) values
  (
    'f8a3e0a4-2282-4d70-9d61-538c89317e21', '9e9956df-fc55-4ee8-a47a-c5ff58d29a01',
    'high', 'research', 'BSc second class upper, research-oriented masters target.',
    '["United Kingdom","Canada"]'::jsonb, 'IELTS 7.0',
    '{"personal_details_complete":true,"academic_history_complete":true,"career_aspiration":"Research career in public health","budget_confirmed":true}'::jsonb
  ),
  (
    '4edca12f-3e27-45f4-bb7e-43f99344b90a', '495fc1e4-b0ff-42be-9568-a275ca4010a8',
    'low', 'flexible', 'Diploma applicant seeking affordable route.',
    '["Canada","Kenya"]'::jsonb, 'Pending IELTS',
    '{"personal_details_complete":true,"academic_history_complete":true,"career_aspiration":"Flexible digital skills pathway","budget_confirmed":false}'::jsonb
  )
on conflict (id) do nothing;

insert into public.partners (
  id, name, type, country, agreement_status, primary_contact_name, primary_contact_email, response_time_hours, satisfaction_score
) values
  ('b3d4f0df-82bb-4f3d-adb3-9f71631cd901', 'University of Leeds', 'university', 'United Kingdom', 'active', 'Sarah Thompson', 'partners@leeds.example', 32, 8.4),
  ('44d22a34-dfa5-4af6-a062-538f6474a551', 'SkillBridge Africa', 'digital_skills_platform', 'Kenya', 'signed', 'Njeri Kamau', 'growth@skillbridge.example', 18, 8.9),
  ('db431df7-2c9d-48e7-91bb-08a3f3bdbe57', 'Global Talent Employers', 'employer', 'Canada', 'legal_review', 'Michael Reed', 'hiring@globaltalent.example', 54, 7.1)
on conflict (id) do nothing;

insert into public.partner_agreements (
  id, partner_id, agreement_type, status, legal_review_complete, commission_rate, retainer_amount, bonus_criteria, fee_structure, onboarding_checklist, signed_at, renewal_date
) values
  (
    'b24767eb-26a8-4c20-9321-f3bc036c29b0', 'b3d4f0df-82bb-4f3d-adb3-9f71631cd901',
    'commission', 'active', true, 12, null,
    '{"volume_threshold":20,"conversion_target":65}'::jsonb,
    '{"programme_level":"masters","commission_rate":12,"currency":"KES"}'::jsonb,
    '[{"label":"Signed agreement uploaded","done":true},{"label":"Admissions contact confirmed","done":true},{"label":"Commission schedule verified","done":true}]'::jsonb,
    '2026-01-15T10:00:00Z', '2026-12-31'
  ),
  (
    '19f2835d-b8b6-4dc0-b4cf-06121581e925', '44d22a34-dfa5-4af6-a062-538f6474a551',
    'retainer', 'signed', true, null, 90000,
    '{"retention_target":80}'::jsonb,
    '{"monthly_retainer":90000,"deliverables":["referrals","coaching reports"]}'::jsonb,
    '[{"label":"Curriculum mapped","done":true},{"label":"Portal documents received","done":false}]'::jsonb,
    '2026-03-10T10:00:00Z', '2026-09-10'
  )
on conflict (id) do nothing;

insert into public.programmes (
  id, partner_id, name, destination, level, tuition_fee, currency, eligibility_criteria, active
) values
  ('273d6a5a-f355-4cb7-aa52-81ff275d7932', 'b3d4f0df-82bb-4f3d-adb3-9f71631cd901', 'MSc International Business', 'United Kingdom', 'masters', 1650000, 'KES', '{"min_gpa":"second class upper","english":"IELTS 6.5"}'::jsonb, true),
  ('37037d42-a932-4d8c-a6ee-7f164187a5da', '44d22a34-dfa5-4af6-a062-538f6474a551', 'Cloud Support Certification', 'Kenya', 'certificate', 85000, 'KES', '{"mode":"online","duration_weeks":16}'::jsonb, true)
on conflict (id) do nothing;

insert into public.applications (
  id, student_id, programme_id, status, offer_letter_url, submitted_at, accepted_at
) values
  ('ee4e4897-fdc7-4647-bb34-37eb29bb533a', '9e9956df-fc55-4ee8-a47a-c5ff58d29a01', '273d6a5a-f355-4cb7-aa52-81ff275d7932', 'submitted', null, '2026-04-01T09:00:00Z', null),
  ('b93a02a8-351a-4030-9c32-f85949683426', '2b9178cc-ae7b-4945-af51-c2bbde4c63db', '273d6a5a-f355-4cb7-aa52-81ff275d7932', 'accepted', '/documents/ann-offer-letter.pdf', '2026-02-20T09:00:00Z', '2026-03-10T09:00:00Z')
on conflict (id) do nothing;

insert into public.market_configs (
  id, country, language, active, visa_requirements, policy_notes, market_owner, official_sources, last_verified_at, fee_configuration
) values
  (
    '52ce5d4f-6571-4b24-a1a2-1d18a13082be', 'United Kingdom', 'en', true,
    '[{"label":"Valid passport","timeline":"Before CAS","fee":"0"},{"label":"CAS letter","timeline":"After offer acceptance"},{"label":"Bank statement","timeline":"28 days maturity"},{"label":"TB certificate","timeline":"Before submission"}]'::jsonb,
    'Student route checklist requires current financial proof and CAS validation.',
    'operations',
    '[{"label":"UK student visa guidance","url":"https://www.gov.uk/student-visa","last_checked":"2026-06-18"}]'::jsonb,
    '2026-06-18',
    '{"visa_fee":715,"currency":"GBP"}'::jsonb
  ),
  (
    'd00d75f4-6337-4d44-9d81-2ef05a8e9d1e', 'Kenya', 'en', true,
    '[{"label":"National ID or passport"},{"label":"Training admission confirmation"},{"label":"Payment confirmation"}]'::jsonb,
    'Local certification path uses identity, admission, and payment verification only.',
    'operations',
    '[{"label":"Kenya eCitizen services","url":"https://www.ecitizen.go.ke/","last_checked":"2026-06-18"}]'::jsonb,
    '2026-06-18',
    '{"registration_fee":5000,"currency":"KES"}'::jsonb
  )
on conflict (id) do nothing;

insert into public.visa_records (
  id, student_id, destination_country, status, checklist_data, embassy_location, appointment_at, submitted_at, approved_at
) values
  (
    '8ef8cfbb-8dcb-4331-b431-c7fcb97d2fa2', '2b9178cc-ae7b-4945-af51-c2bbde4c63db', 'Australia', 'approved',
    '[{"label":"Passport","done":true},{"label":"Offer letter","done":true},{"label":"Financial proof","done":true}]'::jsonb,
    'Nairobi', '2026-03-16T08:00:00Z', '2026-03-16T08:00:00Z', '2026-03-22T08:00:00Z'
  )
on conflict (id) do nothing;

insert into public.placements (
  id, student_id, programme_id, partner_id, type, institution, satisfaction_score, placed_at
) values
  ('1e8c88b0-e590-4dab-b9dc-a6b5dd1f9ec7', '2b9178cc-ae7b-4945-af51-c2bbde4c63db', '273d6a5a-f355-4cb7-aa52-81ff275d7932', 'b3d4f0df-82bb-4f3d-adb3-9f71631cd901', 'admission', 'Monash University', 8.2, '2026-03-22')
on conflict (id) do nothing;

insert into public.revenue_records (
  id, student_id, partner_id, type, amount, currency, recognized_at, notes
) values
  ('e0f7909d-09f0-4c9e-8830-1d5665ed1a7d', '2b9178cc-ae7b-4945-af51-c2bbde4c63db', 'b3d4f0df-82bb-4f3d-adb3-9f71631cd901', 'commission', 140000, 'KES', '2026-03-22', 'Admission placement commission triggered.'),
  ('e552b704-a4e8-4e76-9567-173b68b52bed', null, '44d22a34-dfa5-4af6-a062-538f6474a551', 'retainer', 90000, 'KES', '2026-04-01', 'Monthly partner retainer.'),
  ('6a7eb49b-9e50-46c6-bb6d-f38687e370a7', null, '44d22a34-dfa5-4af6-a062-538f6474a551', 'royalty', 35000, 'KES', '2026-04-01', 'Recurring white-label platform royalty.')
on conflict (id) do nothing;

insert into public.qa_checkpoints (
  id, entity_type, entity_id, stage, label, passed, checklist_data, signed_off_by, signed_off_at
) values
  ('09fce5cf-0ca4-4fea-954d-b5a60876a10b', 'student', '9e9956df-fc55-4ee8-a47a-c5ff58d29a01', 'intake', 'Profile complete', true, '{"source":"intake_script_data"}'::jsonb, 'admin', '2026-03-29T08:00:00Z'),
  ('4e595a1b-7921-42fb-b538-94fd189b772f', 'student', '495fc1e4-b0ff-42be-9568-a275ca4010a8', 'counselling', 'Budget confirmed', false, '{"missing":"budget_range confirmation"}'::jsonb, null, null)
on conflict (id) do nothing;

insert into public.consultant_training (
  id, consultant_username, module_name, module_type, completed, score, certified_at, expires_at
) values
  ('a15afd35-a31a-4325-9653-d1d77c37d71c', 'admin', 'Module 1 - The pathways business and ethics', 'onboarding', true, 92, '2026-03-01', '2027-03-01'),
  ('31d88955-b7ec-404d-9d32-aa08a787cdbb', 'admin', 'Module 2 - The seven gates and CRM', 'onboarding', true, 90, '2026-03-02', '2027-03-02'),
  ('d931e14c-9af3-4ddb-84d2-15f2fd72c611', 'admin', 'Module 3 - Intake and counselling', 'certification', true, 88, '2026-03-03', '2027-03-03'),
  ('e8e7e54f-4cf9-4e98-aa2a-a85ae5a826aa', 'admin', 'Module 4 - Applications and documents', 'certification', true, 91, '2026-03-04', '2027-03-04'),
  ('fa529a75-202d-4a13-8895-4b9182485a21', 'admin', 'Module 5 - Visa support and honesty rule', 'certification', true, 94, '2026-03-05', '2027-03-05'),
  ('2d3fbfb4-0d03-4ee8-af89-e8442fbcb793', 'consultant', 'Module 6 - Partners and revenue basics', 'skill_development', false, null, null, null),
  ('60e212fa-18ce-4fb4-9d0e-3e50aa3bb14f', 'consultant', 'Module 7 - Tools, dashboard, and prompt library', 'skill_development', false, null, null, null)
on conflict (id) do nothing;

insert into public.commissions (id, student_id, university_name, tuition_fee, commission_rate, commission_amount, currency, status, due_date, notes) values
  ('3d1c0856-6964-4024-9ee5-c2bb814840c4', '2b9178cc-ae7b-4945-af51-c2bbde4c63db', 'Monash University', 1800000, 10, 180000, 'KES', 'overdue', '2026-03-28', 'Invoice sent but not received.')
on conflict (id) do nothing;

insert into public.tasks (id, title, description, status, priority, due_date) values
  ('1b76a306-b7cb-4897-9185-0e1db860aa31', 'Call Brian about scholarship options', 'Confirm budget range before the consultation.', 'pending', 'high', '2026-04-03'),
  ('a566197d-b8ea-456e-a94a-991d736bb325', 'Verify Faith''s passport upload', 'Operations to double-check clarity and expiry date.', 'in_progress', 'medium', '2026-04-02')
on conflict (id) do nothing;

insert into public.email_templates (id, template_name, subject, body, category) values
  ('6586d570-d70d-4062-b5e0-ee57f97ff2a5', 'Consultation Reminder', 'Your Barak consultation is coming up', 'Hi {{name}}, this is a reminder for your consultation on {{date}}. Reply with any documents you want reviewed before the meeting.', 'consultation'),
  ('44c3355d-2a9d-4b4c-a273-4d66d3f07a49', 'Document Follow-up', 'Please upload your missing documents', 'Hi {{name}}, we are still waiting for your {{document_type}}. Upload it so we can keep your application moving.', 'documents')
on conflict (id) do nothing;

insert into public.audit_logs (id, action, table_name, related_id, record_label, old_value, new_value, actor_name) values
  ('3ab2ee94-fa89-457c-8856-7128ee7c28c2', 'Consultation Scheduled', 'consultations', 'ca403647-ac01-4f11-aac4-0d6e9f9fdcb7', 'Brian Otieno', null, '{"status":"pending"}', 'System'),
  ('c3ca1278-8825-4d59-a104-42d01b5ec431', 'Document Reviewed', 'student_documents', '535fe534-45d2-4a90-b6ef-a85242da62eb', 'faith-passport.pdf', '{"status":"uploaded"}', '{"status":"verified"}', 'System')
on conflict (id) do nothing;
