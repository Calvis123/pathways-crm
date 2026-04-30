import type {
  AppUserRecord,
  AuditLog,
  CommissionRecord,
  Consultation,
  DocumentRecord,
  EmailTemplate,
  ExpenseRecord,
  PaymentRecord,
  PortalAccessRecord,
  PortalActivity,
  PortalMessage,
  ReferralRecord,
  Student,
  StudentNote,
  Task
} from "@/lib/types";

export const mockStudents: Student[] = [
  {
    id: "9e9956df-fc55-4ee8-a47a-c5ff58d29a01",
    full_name: "Faith Wanjiku",
    email: "faith@example.com",
    phone: "+254712345678",
    location: "Nairobi",
    country_interest: "United Kingdom",
    program_level: "Masters",
    university_name: "University of Leeds",
    enrollment_date: null,
    stage: "application",
    consultation_requested: true,
    consultation_status: "confirmed",
    consultation_date: "2026-04-05T09:00:00.000Z",
    visa_status: null,
    ielts_enrolled: true,
    payment_status: "installment",
    ielts_overall_score: 7,
    ielts_session_count: 8,
    ielts_test_date: "2026-04-12",
    payment_due_date: "2026-03-31",
    payment_amount: 20000,
    payment_paid: 20000,
    payment_date: "2026-03-30",
    payment_method: "mpesa",
    payment_notes: "Consultation balance cleared.",
    commission_amount: 140000,
    commission_status: "pending",
    commission_due_date: null,
    commission_paid_date: null,
    commission_institution: "University of Leeds",
    commission_notes: null,
    consultation_upfront_paid: 20000,
    consultation_balance_paid: 20000,
    segment: "ready_to_go",
    segment_score: 82,
    lead_source: "Facebook Consultation",
    referral_code: null,
    notes: "Interested in September intake. Target Score: 7.5",
    created_by: null,
    created_at: "2026-03-28T08:30:00.000Z",
    updated_at: "2026-04-01T10:30:00.000Z"
  },
  {
    id: "495fc1e4-b0ff-42be-9568-a275ca4010a8",
    full_name: "Brian Otieno",
    email: "brian@example.com",
    phone: "+254722000111",
    location: "Kisumu",
    country_interest: "Canada",
    program_level: "Diploma",
    university_name: null,
    enrollment_date: null,
    stage: "consultation",
    consultation_requested: true,
    consultation_status: "pending",
    consultation_date: "2026-04-03T14:00:00.000Z",
    visa_status: null,
    ielts_enrolled: false,
    payment_status: "pending",
    ielts_overall_score: null,
    ielts_session_count: 0,
    ielts_test_date: null,
    payment_due_date: "2026-03-29",
    payment_amount: 20000,
    payment_paid: 0,
    payment_date: null,
    payment_method: null,
    payment_notes: null,
    commission_amount: 140000,
    commission_status: "pending",
    commission_due_date: null,
    commission_paid_date: null,
    commission_institution: null,
    commission_notes: null,
    consultation_upfront_paid: 0,
    consultation_balance_paid: 0,
    segment: "needs_guidance",
    segment_score: 20,
    lead_source: "Website",
    referral_code: "BARAK10",
    notes: "Needs scholarship guidance.",
    created_by: null,
    created_at: "2026-04-01T11:00:00.000Z",
    updated_at: "2026-04-02T08:15:00.000Z"
  },
  {
    id: "2b9178cc-ae7b-4945-af51-c2bbde4c63db",
    full_name: "Ann Njeri",
    email: "ann@example.com",
    phone: "+254701444555",
    location: "Mombasa",
    country_interest: "Australia",
    program_level: "Undergraduate",
    university_name: "Monash University",
    enrollment_date: "2026-03-22",
    stage: "enrolled",
    consultation_requested: true,
    consultation_status: "completed",
    consultation_date: "2026-03-20T11:30:00.000Z",
    visa_status: "approved",
    ielts_enrolled: false,
    payment_status: "full",
    ielts_overall_score: null,
    ielts_session_count: 0,
    ielts_test_date: null,
    payment_due_date: null,
    payment_amount: 20000,
    payment_paid: 20000,
    payment_date: "2026-03-25",
    payment_method: "bank_transfer",
    payment_notes: "Visa approval payment completed.",
    commission_amount: 140000,
    commission_status: "pending",
    commission_due_date: "2027-03-22",
    commission_paid_date: null,
    commission_institution: "Monash University",
    commission_notes: "Awaiting annual institutional commission payout.",
    consultation_upfront_paid: 40000,
    consultation_balance_paid: 0,
    segment: "vip",
    segment_score: 95,
    lead_source: "Referral",
    referral_code: "VIP2026",
    notes: "Placement complete, waiting commission payout.",
    created_by: "00000000-0000-0000-0000-000000000001",
    created_at: "2026-02-15T09:00:00.000Z",
    updated_at: "2026-03-30T15:00:00.000Z"
  },
  {
    id: "43fc1517-f79f-4d2f-8d67-7d6e4dd5fb44",
    full_name: "Kevin Mwangi",
    email: "kevin@example.com",
    phone: "+254711888222",
    location: "Nakuru",
    country_interest: "United Kingdom",
    program_level: "Masters",
    university_name: "University of Derby",
    enrollment_date: "2025-03-01",
    stage: "enrolled",
    consultation_requested: true,
    consultation_status: "completed",
    consultation_date: "2025-02-10T10:00:00.000Z",
    visa_status: "approved",
    ielts_enrolled: false,
    payment_status: "full",
    ielts_overall_score: null,
    ielts_session_count: 0,
    ielts_test_date: null,
    payment_due_date: null,
    payment_amount: 20000,
    payment_paid: 20000,
    payment_date: "2025-02-28",
    payment_method: "mpesa",
    payment_notes: "Student balance cleared ahead of enrollment.",
    commission_amount: 140000,
    commission_status: "overdue",
    commission_due_date: "2026-03-01",
    commission_paid_date: null,
    commission_institution: "University of Derby",
    commission_notes: "Follow-up required with partner finance team.",
    consultation_upfront_paid: 40000,
    consultation_balance_paid: 0,
    segment: "vip",
    segment_score: 90,
    lead_source: "Referral",
    referral_code: "GRACE2026",
    notes: "Commission overdue and awaiting finance update.",
    created_by: "admin",
    created_at: "2025-01-20T09:00:00.000Z",
    updated_at: "2026-03-28T12:00:00.000Z"
  }
];

export const mockConsultations: Consultation[] = [
  {
    id: "ca403647-ac01-4f11-aac4-0d6e9f9fdcb7",
    student_id: mockStudents[1].id,
    scheduled_at: "2026-04-03T14:00:00.000Z",
    status: "pending",
    notes: "Discuss study budget and visa timelines.",
    created_by: null,
    created_at: "2026-04-02T07:00:00.000Z",
    student: {
      full_name: mockStudents[1].full_name,
      email: mockStudents[1].email,
      phone: mockStudents[1].phone,
      country_interest: mockStudents[1].country_interest,
      stage: mockStudents[1].stage
    }
  },
  {
    id: "bd676c1d-b0ce-4d3c-817f-fd91554e5478",
    student_id: mockStudents[0].id,
    scheduled_at: "2026-04-05T09:00:00.000Z",
    status: "confirmed",
    notes: "Application checklist review.",
    created_by: null,
    created_at: "2026-04-01T11:30:00.000Z",
    student: {
      full_name: mockStudents[0].full_name,
      email: mockStudents[0].email,
      phone: mockStudents[0].phone,
      country_interest: mockStudents[0].country_interest,
      stage: mockStudents[0].stage
    }
  }
];

export const mockDocuments: DocumentRecord[] = [
  {
    id: "535fe534-45d2-4a90-b6ef-a85242da62eb",
    student_id: mockStudents[0].id,
    document_type: "Passport",
    original_filename: "faith-passport.pdf",
    file_url: null,
    file_size: 304221,
    status: "verified",
    review_notes: "All details clear.",
    uploaded_by: null,
    reviewed_by: null,
    uploaded_at: "2026-04-01T13:00:00.000Z",
    reviewed_at: "2026-04-01T15:30:00.000Z",
    student: {
      full_name: mockStudents[0].full_name,
      stage: mockStudents[0].stage
    }
  },
  {
    id: "f73de48c-c09d-49b1-bf1c-5e4c175c1d07",
    student_id: mockStudents[1].id,
    document_type: "Academic Transcript",
    original_filename: "brian-transcript.pdf",
    file_url: null,
    file_size: 402800,
    status: "pending",
    review_notes: null,
    uploaded_by: null,
    reviewed_by: null,
    uploaded_at: "2026-04-02T09:00:00.000Z",
    reviewed_at: null,
    student: {
      full_name: mockStudents[1].full_name,
      stage: mockStudents[1].stage
    }
  }
];

export const mockCommissions: CommissionRecord[] = [
  {
    id: "3d1c0856-6964-4024-9ee5-c2bb814840c4",
    student_id: mockStudents[2].id,
    university_name: "Monash University",
    tuition_fee: 1800000,
    commission_rate: 10,
    commission_amount: 180000,
    currency: "KES",
    status: "overdue",
    due_date: "2026-03-28",
    payment_date: null,
    notes: "Invoice sent but not received.",
    created_at: "2026-03-14T12:00:00.000Z",
    student: {
      full_name: mockStudents[2].full_name,
      stage: mockStudents[2].stage
    }
  }
];

export const mockPayments: PaymentRecord[] = [
  {
    id: "0b45f6df-883f-4831-bf50-843155402edb",
    student_id: mockStudents[0].id,
    payment_type: "consultation",
    amount: 20000,
    currency: "KES",
    status: "paid",
    payment_method: "mpesa",
    reference_number: "RFW123ABC",
    notes: "Consultation deposit received.",
    paid_at: "2026-03-30T09:15:00.000Z",
    created_at: "2026-03-30T09:15:00.000Z",
    student: {
      full_name: mockStudents[0].full_name,
      stage: mockStudents[0].stage,
      email: mockStudents[0].email
    }
  },
  {
    id: "086fb472-cbd0-4d14-bba3-34ef0ffc1cb8",
    student_id: mockStudents[2].id,
    payment_type: "application",
    amount: 40000,
    currency: "KES",
    status: "pending",
    payment_method: "bank_transfer",
    reference_number: null,
    notes: "Awaiting transfer confirmation.",
    paid_at: null,
    created_at: "2026-04-01T08:30:00.000Z",
    student: {
      full_name: mockStudents[2].full_name,
      stage: mockStudents[2].stage,
      email: mockStudents[2].email
    }
  }
];

export const mockUsers: AppUserRecord[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    username: "admin",
    password: "barak123",
    full_name: "Amina Admin",
    email: "admin@barakpathways.com",
    role: "admin",
    status: "active",
    phone: "+254700111111",
    last_login_at: "2026-04-02T08:00:00.000Z",
    created_at: "2026-01-10T08:00:00.000Z"
  },
  {
    id: "10000000-0000-0000-0000-000000000200",
    username: "hr",
    password: "barak123",
    full_name: "Hannah HR",
    email: "hr@barakpathways.com",
    role: "hr",
    status: "active",
    phone: "+254700222200",
    last_login_at: null,
    created_at: "2026-01-10T08:00:00.000Z"
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    username: "consultant",
    password: "barak123",
    full_name: "Caleb Consultant",
    email: "consultant@barakpathways.com",
    role: "consultant",
    status: "active",
    phone: "+254700222222",
    last_login_at: "2026-04-02T08:10:00.000Z",
    created_at: "2026-01-10T08:00:00.000Z"
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    username: "operations",
    password: "barak123",
    full_name: "Oscar Operations",
    email: "operations@barakpathways.com",
    role: "operations",
    status: "active",
    phone: "+254700333333",
    last_login_at: "2026-04-01T17:20:00.000Z",
    created_at: "2026-01-10T08:00:00.000Z"
  }
];

export const mockReferrals: ReferralRecord[] = [
  {
    id: "2eb3c46d-c95c-4227-8a6b-93a26fd6c77c",
    referrer_name: "Grace Alumni",
    referrer_email: "grace@example.com",
    referrer_phone: "+254711123123",
    referral_code: "GRACE2026",
    referred_student_name: "Kevin Mwangi",
    referred_student_email: "kevin@example.com",
    status: "contacted",
    reward_amount: 5000,
    notes: "Waiting for consultation booking.",
    created_at: "2026-03-27T12:00:00.000Z"
  },
  {
    id: "e8258d6c-70c1-4984-9e0b-0f463fc7af57",
    referrer_name: "Faith Wanjiku",
    referrer_email: "faith@example.com",
    referrer_phone: "+254712345678",
    referral_code: "FAITHVIP",
    referred_student_name: "Mercy Naliaka",
    referred_student_email: "mercy@example.com",
    status: "converted",
    reward_amount: 10000,
    notes: "Converted to application stage.",
    created_at: "2026-03-29T09:30:00.000Z"
  }
];

export const mockStudentNotes: StudentNote[] = [
  {
    id: "2f1a7c93-4fc7-4db9-9b43-f61c7de6cbeb",
    student_id: mockStudents[0].id,
    created_by: "admin",
    creator_name: "Amina Admin",
    note_text: "Student is highly responsive and already preparing passport and IELTS paperwork.",
    note_type: "important",
    priority: "high",
    is_private: false,
    tags: "responsive,ielts,documents",
    reminder_date: null,
    created_at: "2026-04-01T08:00:00.000Z",
    updated_at: "2026-04-01T08:00:00.000Z"
  },
  {
    id: "6bc8f120-f9d9-4787-8f7c-8d9b6245b6f8",
    student_id: mockStudents[1].id,
    created_by: "consultant",
    creator_name: "Caleb Consultant",
    note_text: "Needs scholarship options explained slowly before application fee conversation.",
    note_type: "call",
    priority: "medium",
    is_private: true,
    tags: "scholarship,budget",
    reminder_date: "2026-04-03T09:00:00.000Z",
    created_at: "2026-04-02T06:45:00.000Z",
    updated_at: "2026-04-02T06:45:00.000Z"
  }
];

export const mockPortalAccess: PortalAccessRecord[] = [
  {
    id: "d2a7927b-18ba-4f92-bc26-76b56d8c42ba",
    student_id: mockStudents[0].id,
    access_token: "portal-faith-demo-token",
    token_expires_at: "2026-05-01T00:00:00.000Z",
    is_active: true,
    last_login_at: "2026-04-01T17:00:00.000Z",
    created_at: "2026-03-29T12:00:00.000Z",
    updated_at: "2026-04-01T17:00:00.000Z",
    student: {
      full_name: mockStudents[0].full_name,
      email: mockStudents[0].email,
      stage: mockStudents[0].stage
    }
  }
];

export const mockPortalMessages: PortalMessage[] = [
  {
    id: "fd0b1cd5-6956-4d65-b5dd-c0944fb7a3f6",
    student_id: mockStudents[0].id,
    subject: "Checklist update",
    message: "Please upload your latest academic transcript before Friday for the final review.",
    direction: "crm_to_student",
    is_read: true,
    created_at: "2026-04-01T09:15:00.000Z",
    student: {
      full_name: mockStudents[0].full_name,
      email: mockStudents[0].email
    }
  }
];

export const mockPortalActivity: PortalActivity[] = [
  {
    id: "4d18d651-40e5-4987-b755-fc4ce19837ad",
    student_id: mockStudents[0].id,
    activity_type: "portal_login",
    activity_details: "Student accessed the portal dashboard.",
    created_at: "2026-04-01T17:00:00.000Z",
    student: {
      full_name: mockStudents[0].full_name,
      email: mockStudents[0].email
    }
  },
  {
    id: "10a67284-c44b-4b25-919d-3f9c90eefb1f",
    student_id: mockStudents[0].id,
    activity_type: "document_upload",
    activity_details: "Uploaded passport copy through the portal.",
    created_at: "2026-04-01T17:05:00.000Z",
    student: {
      full_name: mockStudents[0].full_name,
      email: mockStudents[0].email
    }
  }
];

export const mockTemplates: EmailTemplate[] = [
  {
    id: "6586d570-d70d-4062-b5e0-ee57f97ff2a5",
    template_name: "Consultation Reminder",
    subject: "Your Barak consultation is coming up",
    body: "Hi {{name}}, this is a reminder for your consultation on {{date}}. Reply with any documents you want reviewed before the meeting.",
    category: "consultation",
    created_at: "2026-03-29T07:30:00.000Z"
  },
  {
    id: "44c3355d-2a9d-4b4c-a273-4d66d3f07a49",
    template_name: "Document Follow-up",
    subject: "Please upload your missing documents",
    body: "Hi {{name}}, we are still waiting for your {{document_type}}. Upload it so we can keep your application moving.",
    category: "documents",
    created_at: "2026-03-27T07:30:00.000Z"
  }
];

export const mockTasks: Task[] = [
  {
    id: "1b76a306-b7cb-4897-9185-0e1db860aa31",
    title: "Call Brian about scholarship options",
    description: "Confirm budget range before the consultation.",
    status: "pending",
    priority: "high",
    due_date: "2026-04-03",
    assigned_to: null,
    created_at: "2026-04-02T06:00:00.000Z"
  },
  {
    id: "a566197d-b8ea-456e-a94a-991d736bb325",
    title: "Verify Faith's passport upload",
    description: "Operations to double-check clarity and expiry date.",
    status: "in_progress",
    priority: "medium",
    due_date: "2026-04-02",
    assigned_to: null,
    created_at: "2026-04-01T10:00:00.000Z"
  }
];

export const mockExpenses: ExpenseRecord[] = [
  {
    id: "2f92d3cb-3d2f-4a31-8995-16a51fd8f600",
    category: "marketing",
    amount: 12500,
    description: "Meta ads for consultation campaign",
    expense_date: "2026-04-01",
    payment_method: "mpesa",
    receipt_number: "MKT-APR-001",
    vendor: "Meta Ads",
    created_by: "admin",
    created_at: "2026-04-01T09:30:00.000Z"
  },
  {
    id: "c7b34ea8-6955-4470-94d8-a8e9f1d8c940",
    category: "internet",
    amount: 4500,
    description: "Office internet subscription",
    expense_date: "2026-03-30",
    payment_method: "bank",
    receipt_number: "NET-APR-778",
    vendor: "Safaricom Business",
    created_by: "admin",
    created_at: "2026-03-30T11:00:00.000Z"
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: "3ab2ee94-fa89-457c-8856-7128ee7c28c2",
    action: "Consultation Scheduled",
    table_name: "consultations",
    related_id: mockConsultations[0].id,
    record_label: mockStudents[1].full_name,
    old_value: null,
    new_value: "{\"status\":\"pending\"}",
    created_at: "2026-04-02T07:00:00.000Z",
    actor_name: "System"
  },
  {
    id: "c3ca1278-8825-4d59-a104-42d01b5ec431",
    action: "Document Reviewed",
    table_name: "student_documents",
    related_id: mockDocuments[0].id,
    record_label: mockDocuments[0].original_filename,
    old_value: "{\"status\":\"uploaded\"}",
    new_value: "{\"status\":\"verified\"}",
    created_at: "2026-04-01T15:30:00.000Z",
    actor_name: "System"
  },
  {
    id: "f17e7435-2e2d-42ce-97cb-b9f8ed130d59",
    action: "Payment Recorded",
    table_name: "payments",
    related_id: mockPayments[0].id,
    record_label: mockStudents[0].full_name,
    old_value: null,
    new_value: "{\"amount\":20000,\"status\":\"paid\"}",
    created_at: "2026-03-30T09:15:00.000Z",
    actor_name: "Amina Admin"
  },
  {
    id: "1a951a72-57b1-4a90-85c7-0cb22c4c30f6",
    action: "Portal Access Generated",
    table_name: "portal_access",
    related_id: mockPortalAccess[0].id,
    record_label: mockStudents[0].full_name,
    old_value: null,
    new_value: "{\"status\":\"active\"}",
    created_at: "2026-03-29T12:00:00.000Z",
    actor_name: "Amina Admin"
  }
];
