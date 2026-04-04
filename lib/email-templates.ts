export const emailTemplateCategories = {
  "follow-ups": "Follow-ups",
  visa: "Visa Process",
  payments: "Payments",
  rejections: "Rejections & Bad News",
  congratulations: "Congratulations",
  general: "General"
} as const;

export const emailTemplatePlaceholders = [
  "{student_name}",
  "{country}",
  "{university}",
  "{program}",
  "{amount}",
  "{date}",
  "{coordinator_name}"
] as const;

export type BuiltInEmailTemplate = {
  id: string;
  category: keyof typeof emailTemplateCategories;
  name: string;
  subject: string;
  body: string;
};

export const builtInEmailTemplates: BuiltInEmailTemplate[] = [
  {
    id: "post_consultation",
    category: "follow-ups",
    name: "Post-Consultation Follow-up",
    subject: "Next Steps After Your Consultation - Barak Pathways",
    body: `Dear {student_name},

Thank you for taking the time to speak with us today about your study abroad goals.

During our consultation, we discussed your interest in pursuing {program} in {country}. Based on our discussion, here are your next steps:
1. Gather your academic documents
2. Prepare your passport copy
3. Start researching {university} options

Our team will begin preparing your application profile. If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "application_status",
    category: "follow-ups",
    name: "Application Status Check-in",
    subject: "Quick Update on Your {country} Application",
    body: `Hi {student_name},

I wanted to check in on the status of your application to {university}. Have you received any updates regarding your {program} application?

If you need any assistance following up or have questions about the process, please let me know.

Warm regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "ielts_progress",
    category: "follow-ups",
    name: "IELTS Progress Check",
    subject: "How's Your IELTS Prep Going?",
    body: `Hi {student_name},

I hope your IELTS preparation is going well. Are you finding any particular sections challenging?

If you need additional resources or want to schedule a practice session, just let me know.

Best,
Jael
Barak Pathways`
  },
  {
    id: "document_reminder",
    category: "follow-ups",
    name: "Document Reminder (1 week)",
    subject: "Reminder: Documents Needed for Your Application",
    body: `Dear {student_name},

This is a friendly reminder that we're still waiting for documents to complete your application to {university}.

Please upload the required documents by {date}. If you're facing any challenges gathering them, please let me know.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "cold_lead",
    category: "follow-ups",
    name: "Cold Lead Re-engagement",
    subject: "Still Interested in Studying in {country}?",
    body: `Hi {student_name},

It's been a while since we last spoke about your study abroad plans for {country}. I wanted to check whether you're still interested in pursuing {program} abroad.

If you'd like to revisit your options, I'd be happy to chat.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "visa_submitted",
    category: "visa",
    name: "Visa Application Submitted",
    subject: "Great News! Your Visa Application is Submitted",
    body: `Dear {student_name},

Fantastic news! Your visa application for {country} has been successfully submitted.

Processing typically takes 2-4 weeks. We'll notify you immediately once we have an update.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "visa_interview",
    category: "visa",
    name: "Visa Interview Preparation",
    subject: "Your Visa Interview Tips & Checklist",
    body: `Dear {student_name},

Your visa interview is coming up. Please bring your passport, appointment letter, proof of funds, academic documents, and your university acceptance letter.

Dress professionally, arrive early, and answer confidently and honestly.

Best,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "visa_approved",
    category: "visa",
    name: "Visa Approved - Congratulations",
    subject: "VISA APPROVED! Welcome to {country}!",
    body: `Dear {student_name},

Congratulations! Your visa for {country} has been approved.

Next steps:
1. Book your flight
2. Confirm accommodation
3. Attend pre-departure orientation

Program starts: {date}

Warm regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "visa_rejected",
    category: "visa",
    name: "Visa Rejected - Support",
    subject: "Regarding Your Visa Application",
    body: `Dear {student_name},

I understand this visa outcome is disappointing, but it doesn't mean the end of your study abroad plans.

We can discuss appeal options, a stronger reapplication, alternative destinations, or the next intake.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "payment_initial",
    category: "payments",
    name: "Initial Payment Reminder",
    subject: "Invoice for Study Abroad Consultation - Barak Pathways",
    body: `Dear {student_name},

This is a friendly reminder regarding your initial consultation fee of {amount} KES.

Please make payment by {date} to allow us to begin processing your application.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "payment_balance",
    category: "payments",
    name: "Balance Payment (Visa Approved)",
    subject: "Final Payment - Congratulations on Your Approval!",
    body: `Dear {student_name},

Congratulations on your visa approval.

Balance due: {amount} KES
Due date: {date}

Please complete this payment so we can finalize your travel arrangements to {country}.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "payment_overdue",
    category: "payments",
    name: "Payment Overdue (15+ days)",
    subject: "Payment Reminder - Barak Pathways",
    body: `Dear {student_name},

This is a follow-up regarding your outstanding payment of {amount} KES.

Our records show this payment is now overdue. Please arrange payment as soon as possible to avoid delays in your application.

Regards,
Finance Department
Barak Pathways`
  },
  {
    id: "university_rejection",
    category: "rejections",
    name: "University Rejection - Alternative Options",
    subject: "Update on Your {university} Application",
    body: `Dear {student_name},

{university} has unfortunately decided not to proceed with your application for {program}.

This is disappointing, but there are still strong alternative options we can explore together.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "program_unavailable",
    category: "rejections",
    name: "Program Not Available",
    subject: "Alternative Programs for Your Goals",
    body: `Dear {student_name},

{program} at {university} is unfortunately not available for the upcoming intake.

There are several similar programs that align with your career goals. Let's discuss the best fit.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "scholarship_not_awarded",
    category: "rejections",
    name: "Scholarship Not Awarded",
    subject: "Scholarship Update & Other Funding Options",
    body: `Dear {student_name},

Unfortunately, the scholarship committee did not award this scholarship to you this time.

We can still explore university-specific scholarships, external funding, loans, and work-study options.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "university_acceptance",
    category: "congratulations",
    name: "University Acceptance",
    subject: "You're Accepted! Welcome to {university}!",
    body: `Dear {student_name},

Congratulations! You have been accepted into {program} at {university}.

Next steps:
1. Accept the offer by {date}
2. Pay the acceptance deposit ({amount})
3. Begin the visa process

Warm regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "scholarship_awarded",
    category: "congratulations",
    name: "Scholarship Awarded",
    subject: "Scholarship Awarded - {amount} KES!",
    body: `Dear {student_name},

Amazing news! You have been awarded a scholarship of {amount} from {university}.

This is a fantastic achievement and a strong recognition of your academic work.

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "success_story",
    category: "congratulations",
    name: "Student Success Story Request",
    subject: "We'd Love to Share Your Success Story!",
    body: `Dear {student_name},

Congratulations on your successful placement and enrollment at {university}.

We'd love to share your story with future students if you're comfortable with that. If you're interested, please reply with a short testimonial and a photo.

Best regards,
Marketing Team
Barak Pathways`
  },
  {
    id: "welcome_lead",
    category: "general",
    name: "Welcome Email (New Lead)",
    subject: "Welcome to Barak Pathways - Let's Get You Abroad!",
    body: `Dear {student_name},

Welcome to Barak Pathways.

Thank you for your inquiry about studying in {country}. Within 24 hours, one of our consultants will contact you to discuss your goals and next steps.

Warm regards,
Team Barak Pathways`
  },
  {
    id: "commission_request",
    category: "general",
    name: "Commission Request to University",
    subject: "Commission Payment Request - {student_name}",
    body: `Dear University Partners Team,

I'm writing to request the commission payment for student {student_name}, who has successfully enrolled in {program}.

Thank you for your continued partnership.

Best regards,
Finance Department
Barak Pathways`
  },
  {
    id: "partner_intro",
    category: "general",
    name: "Partner University Introduction",
    subject: "New Partnership Inquiry - Barak Pathways Kenya",
    body: `Dear Partnerships Team,

My name is {coordinator_name} from Barak Pathways, a leading education consultancy in Kenya. We're reaching out to explore partnership opportunities with {university}.

Would you be available for a call next week to discuss this further?

Best regards,
{coordinator_name}
Barak Pathways`
  },
  {
    id: "referral_thankyou",
    category: "general",
    name: "Referral Thank You",
    subject: "Thank You for Referring {student_name}!",
    body: `Dear {student_name},

Thank you for referring a student to Barak Pathways. We truly appreciate your trust and support.

Warm regards,
{coordinator_name}
Barak Pathways`
  }
];
