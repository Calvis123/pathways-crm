insert into public.students (
  id, full_name, email, phone, location, country_interest, program_level, university_name,
  stage, consultation_requested, consultation_status, consultation_date, visa_status,
  ielts_enrolled, payment_status, consultation_upfront_paid, consultation_balance_paid,
  segment, segment_score, lead_source, referral_code, notes
) values
  (
    '9e9956df-fc55-4ee8-a47a-c5ff58d29a01', 'Faith Wanjiku', 'faith@example.com', '+254712345678',
    'Nairobi', 'United Kingdom', 'Masters', 'University of Leeds',
    'application', true, 'confirmed', '2026-04-05T09:00:00Z', null,
    true, 'installment', 20000, 20000, 'ready_to_go', 82, 'Facebook Consultation', null,
    'Interested in September intake.'
  ),
  (
    '495fc1e4-b0ff-42be-9568-a275ca4010a8', 'Brian Otieno', 'brian@example.com', '+254722000111',
    'Kisumu', 'Canada', 'Diploma', null,
    'consultation', true, 'pending', '2026-04-03T14:00:00Z', null,
    false, 'pending', 0, 0, 'needs_guidance', 20, 'Website', 'BARAK10',
    'Needs scholarship guidance.'
  ),
  (
    '2b9178cc-ae7b-4945-af51-c2bbde4c63db', 'Ann Njeri', 'ann@example.com', '+254701444555',
    'Mombasa', 'Australia', 'Undergraduate', 'Monash University',
    'placed', true, 'completed', '2026-03-20T11:30:00Z', 'approved',
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

insert into public.users (id, username, password, full_name, email, role, status, phone) values
  ('10000000-0000-0000-0000-000000000200', 'hr', 'barak123', 'Hannah HR', 'hr@barakpathways.com', 'hr', 'active', '+254700222200')
on conflict (email) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  role = excluded.role,
  status = excluded.status,
  phone = excluded.phone;
