# Visa Management Platform — Technical Specification

> **Purpose**: This document is a comprehensive specification for building a corporate visa management platform. It is designed to be consumed by Claude Code (or any AI coding agent) to scaffold, build, and iterate on the full application.

---

## 1. Project Overview

A comprehensive, modern, professional visa management platform for corporate clients. The platform enables:

- **Superadmin & Team**: Manage countries, visa types, document requirements, users, companies, applications, payments, and all operational data through a powerful admin panel with a no-code form/template builder.
- **Corporate Employees**: Self-register via company email, browse country-specific visa information, download branded visa guides, share information via email, start visa applications (for themselves or colleagues), upload documents, make payments, and track application status in real-time.

The platform handles the **full visa lifecycle end-to-end** — from information discovery to visa issuance — entirely online.

---

## 2. Tech Stack

| Layer              | Technology                                                  |
| ------------------ | ----------------------------------------------------------- |
| Framework          | **Next.js 14+ (App Router)** — full-stack React framework   |
| Language           | **TypeScript** (strict mode)                                |
| Database           | **PostgreSQL** (via Prisma ORM)                             |
| Authentication     | **Custom Email OTP** (passwordless for corporate users), **Email + Password + 2FA (TOTP)** for admin users |
| Payment Gateway    | **Razorpay**                                                |
| File Storage       | **S3-compatible storage** (AWS S3 / MinIO for self-hosted)  |
| Email Service      | **Resend** (primary) or Nodemailer with SMTP fallback       |
| PDF Generation     | **@react-pdf/renderer** or **Puppeteer** for branded PDFs   |
| UI Library         | **Tailwind CSS** + **shadcn/ui** component library          |
| State Management   | **React Server Components** + **Zustand** (client state)    |
| Validation         | **Zod** (shared schemas for client + server)                |
| Deployment         | **Self-hosted / VPS** (Docker + Docker Compose)             |
| Reverse Proxy      | **Nginx** or **Caddy** (SSL termination)                    |
| Background Jobs    | **BullMQ** with Redis (email queues, PDF generation, etc.)  |
| Search             | **PostgreSQL full-text search** (upgrade to Meilisearch if needed later) |

---

## 3. User Roles & Permissions

### 3.1 Role Hierarchy

```
Superadmin
  └── Admin Team Members (custom role-based permissions)
        └── Corporate Employees (grouped by company)
```

### 3.2 Superadmin
- Full unrestricted access to everything
- Manage admin team: invite, assign roles, set granular permissions
- Manage platform settings, branding, global configurations
- Access all analytics and reporting
- Configure countries, visa types, templates via form builder
- Manage all companies, users, applications, payments

### 3.3 Admin Team Members (Custom RBAC)
- Permissions are **granular and configurable per team member** by the superadmin
- Permission categories (each can be set to: None / View / Edit / Full):
  - **Countries & Visa Management**: create/edit countries, visa types, requirements, templates
  - **User Management**: view/edit corporate users and company data
  - **Application Management**: review applications, request revisions, approve/reject, update status
  - **Document Review**: review uploaded documents, approve/flag/request re-uploads
  - **Payment Management**: view payments, issue refunds, manage invoicing
  - **Content Management**: edit visa information pages, upload guides, manage FAQs
  - **Analytics**: view dashboards, export reports
  - **System Settings**: manage email templates, notification settings

### 3.4 Corporate Employees
- Self-register using company email address
- Auto-grouped under their company by email domain (e.g., `@acme.com` → Acme Corp)
- First employee from a new domain triggers company creation (auto or admin-confirmed)
- Abilities:
  - Complete their personal profile and company profile
  - Browse country pages and visa information (login required)
  - Download branded visa summary sheets and detailed packets (PDF)
  - Share visa information via email (to self, colleagues, or managers)
  - Start visa applications for themselves **or on behalf of colleagues**
  - Upload required documents per visa checklist
  - Track application status in real-time
  - Make payments via Razorpay
  - View application history
  - Receive email + in-app notifications

---

## 4. Authentication System

### 4.1 Corporate Employee Auth (Passwordless Email OTP)
```
Flow:
1. User enters company email on signup/login page
2. System validates email format, checks domain
3. If new user → create account, auto-assign to company by domain
4. Send 6-digit OTP to email (valid for 10 minutes, max 3 attempts)
5. User enters OTP → session created (JWT + HTTP-only cookie)
6. Session duration: 7 days, with sliding refresh
```

### 4.2 Admin Auth (Email + Password + 2FA)
```
Flow:
1. Admin enters email + password
2. If 2FA enabled → prompt for TOTP code (Google Authenticator / Authy)
3. Session created with elevated privileges
4. Session duration: 8 hours (stricter for security)
5. 2FA is mandatory for all admin users (enforced by superadmin)
```

### 4.3 Security Measures
- Rate limiting on OTP requests (max 5 per email per hour)
- OTP brute-force protection (3 attempts, then regenerate)
- Session invalidation on password change (admin)
- IP-based suspicious activity detection
- All sessions logged in audit trail

---

## 5. Data Model (Prisma Schema Overview)

### 5.1 Core Entities

```
Company
├── id, name, domain, logo, address, industry
├── brandingConfig (JSON: colors, logo URL for co-branded PDFs)
├── status (active / suspended / pending_verification)
├── createdAt, updatedAt
└── employees[] → User

User
├── id, email, firstName, lastName, phone, avatar
├── role (superadmin / admin_team / employee)
├── companyId → Company
├── profile → UserProfile (passport details, nationality, DOB, etc.)
├── adminPermissions (JSON, only for admin_team role)
├── status (active / suspended / pending)
├── lastLoginAt, createdAt, updatedAt
├── applications[] → VisaApplication
└── notifications[] → Notification

Country
├── id, name, code (ISO 3166), flagUrl
├── description, overview (rich text)
├── bannerImage, gallery[]
├── isActive (boolean)
├── sortOrder
├── createdAt, updatedAt
└── visaTypes[] → VisaType

VisaType
├── id, countryId → Country
├── name (e.g., "Business Visa", "Tourist Visa", "Work Permit")
├── slug
├── description, overview (rich text)
├── processingTime, validityPeriod, maxStay
├── fees (JSON: { baseFee, serviceFee, urgentFee, currency })
├── isActive, sortOrder
├── template → VisaTemplate (the form/document configuration)
├── requirements[] → VisaRequirement
├── documents[] → RequiredDocument
├── steps[] → ProcessStep (for the timeline)
└── applications[] → VisaApplication

VisaTemplate (Form Builder Config)
├── id, visaTypeId → VisaType
├── fields[] (JSON array of field definitions)
│   Each field: { fieldId, label, type, required, options[], validation, helpText, section, order }
│   Supported types: text, textarea, date, select, multiselect, checkbox, file, number, email, phone, country_select, passport_upload, photo_upload
├── sections[] (JSON: logical groupings of fields, e.g., "Personal Info", "Travel Details", "Employment")
└── version, createdAt, updatedAt

RequiredDocument
├── id, visaTypeId → VisaType
├── name (e.g., "Passport Copy", "Bank Statement")
├── description, helpText
├── acceptedFormats[] (e.g., ["pdf", "jpg", "png"])
├── maxFileSize (in MB)
├── isMandatory (boolean)
├── sortOrder
└── sampleDocumentUrl (optional: example for reference)

ProcessStep (for country page timeline)
├── id, visaTypeId → VisaType
├── stepNumber, title, description (rich text)
├── estimatedDuration
├── tips (optional helpful notes)
└── sortOrder

VisaApplication
├── id, applicationNumber (auto-generated: e.g., "VA-2026-00001")
├── userId → User (the applicant)
├── initiatedById → User (the person who started it, may differ from applicant)
├── visaTypeId → VisaType
├── companyId → Company
├── status (enum: see workflow below)
├── formData (JSON: filled-in template fields)
├── submittedAt, approvedAt, rejectedAt, issuedAt
├── rejectionReason (text, optional)
├── paymentId → Payment
├── assignedTo → User (admin team member handling this)
├── priority (normal / urgent)
├── createdAt, updatedAt
├── documents[] → ApplicationDocument
├── comments[] → ApplicationComment
├── statusHistory[] → StatusChange (audit trail)
└── visaDocument → IssuedVisa

ApplicationDocument
├── id, applicationId → VisaApplication
├── requiredDocumentId → RequiredDocument
├── fileUrl (S3 path)
├── fileName, fileType, fileSize
├── status (pending_review / approved / rejected / re_upload_requested)
├── reviewNote (text: reason for rejection or re-upload request)
├── reviewedBy → User (admin who reviewed)
├── uploadedAt, reviewedAt
└── version (integer: tracks re-uploads)

ApplicationComment (Thread per Application)
├── id, applicationId → VisaApplication
├── authorId → User (can be employee or admin)
├── content (text)
├── isInternal (boolean: if true, only visible to admin team)
├── attachments[] (optional file URLs)
├── createdAt
└── parentId → ApplicationComment (optional, for threaded replies)

StatusChange (Audit Trail)
├── id, applicationId → VisaApplication
├── fromStatus, toStatus
├── changedBy → User
├── note (optional)
└── createdAt

Payment
├── id, applicationId → VisaApplication
├── userId → User
├── razorpayOrderId, razorpayPaymentId, razorpaySignature
├── amount, currency, feeBreakdown (JSON: { baseFee, serviceFee, tax })
├── status (pending / authorized / captured / failed / refunded)
├── paidAt, refundedAt
└── createdAt

Notification
├── id, userId → User
├── type (enum: application_update, document_review, payment, system, share)
├── title, message
├── data (JSON: contextual payload, e.g., applicationId, link)
├── isRead (boolean)
├── channel (email / in_app / both)
└── createdAt

AuditLog
├── id
├── userId → User (who performed the action)
├── action (enum: create, update, delete, login, logout, export, etc.)
├── entity (e.g., "VisaApplication", "User", "Country")
├── entityId
├── changes (JSON: { before, after })
├── ipAddress, userAgent
└── createdAt

VisaInfoShare (tracks shares of visa information)
├── id
├── sharedBy → User
├── visaTypeId → VisaType
├── recipientEmail
├── recipientName (optional)
├── sharedAt
└── downloadCount

IssuedVisa
├── id, applicationId → VisaApplication
├── fileUrl (S3 path to the visa document)
├── visaNumber
├── issuedDate, expiryDate
├── notes
└── uploadedBy → User (admin team member)
```

---

## 6. Application Workflow & Status Machine

### 6.1 Status Flow

```
INITIATED
    │
    ▼
DOCUMENTS_PENDING
    │
    ▼
UNDER_REVIEW  ◄──────────┐
    │                     │
    ├── (all good) ──►    │
    │                     │
    ▼                     │
REVISIONS_REQUESTED ──────┘
    (user re-uploads, loops back to UNDER_REVIEW)
    │
    ▼ (all approved)
APPROVED_PAYMENT_PENDING
    │
    ▼
PAYMENT_CONFIRMED
    │
    ▼
PROCESSING
    │
    ├──► VISA_ISSUED (success)
    │
    └──► REJECTED (with reason + option to re-apply)
```

### 6.2 Status Definitions

| Status                    | Description                                                     | Who Triggers             |
| ------------------------- | --------------------------------------------------------------- | ------------------------ |
| `INITIATED`               | Application created, basic info filled                          | Employee                 |
| `DOCUMENTS_PENDING`       | Awaiting document uploads per checklist                         | System (auto)            |
| `UNDER_REVIEW`            | All docs uploaded, admin team reviewing                         | System (auto on upload complete) |
| `REVISIONS_REQUESTED`     | One or more docs flagged, user must re-upload                   | Admin Team               |
| `APPROVED_PAYMENT_PENDING`| Application approved, awaiting payment                          | Admin Team               |
| `PAYMENT_CONFIRMED`       | Payment received and verified                                   | System (Razorpay webhook)|
| `PROCESSING`              | Your team is processing with embassy/consulate                  | Admin Team               |
| `VISA_ISSUED`             | Visa received and uploaded, user notified                       | Admin Team               |
| `REJECTED`                | Application rejected with detailed reason                       | Admin Team               |

### 6.3 Status Change Rules
- Every status change is logged in `StatusChange` with who, when, and optional note
- Email + in-app notification sent to the applicant on every status change
- Admin team members assigned to the application are also notified
- Status can only move forward (no skipping steps), except the UNDER_REVIEW ↔ REVISIONS_REQUESTED loop
- Superadmin can override/force any status change (logged in audit)

---

## 7. Feature Specifications

### 7.1 Public Landing Page
- Modern, professional marketing page (clean white + blue tones)
- Hero section with clear value proposition
- Features overview, how-it-works section, testimonials/trust signals
- Prominent "Sign Up" / "Login" CTA
- Footer with legal links (Privacy Policy, Terms of Service)
- Fully responsive (mobile-first)
- SEO optimized with meta tags, Open Graph

### 7.2 Authentication Pages
- **Signup**: Email input → domain validation → OTP sent → verify → profile setup wizard
- **Login**: Email input → OTP sent → verify → redirect to dashboard
- **Admin Login**: Separate `/admin/login` route → email + password → 2FA prompt → admin dashboard
- Consistent branding on all auth pages

### 7.3 Corporate Employee Dashboard
After login, employees see:
- **Overview Cards**: Active applications count, pending actions, recent notifications
- **Quick Actions**: Start new application, browse countries, view profile
- **Recent Applications**: List with status badges, quick links
- **Notifications Feed**: Unread notifications with links to relevant items
- **Navigation Sidebar**:
  - Dashboard (home)
  - Countries (browse all)
  - My Applications
  - Apply for Colleague
  - Company Profile
  - My Profile
  - Notifications
  - Help / FAQ

### 7.4 Country Pages (Timeline Theme)
Each country has a dedicated page accessible only to authenticated users.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  [Country Flag] [Country Name]                  │
│  [Banner Image]                                 │
│  [General Overview - rich text]                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  VISA TYPES TIMELINE                            │
│                                                 │
│  ● ─── Tourist Visa                             │
│  │     ├ Overview & eligibility                 │
│  │     ├ Requirements list                      │
│  │     ├ Required Documents (checklist)         │
│  │     ├ Processing Time: 5-7 business days     │
│  │     ├ Fees: ₹3,500 + ₹500 service fee       │
│  │     ├ Step-by-step process (sub-timeline)    │
│  │     │   1. Fill application form             │
│  │     │   2. Upload documents                  │
│  │     │   3. Payment                           │
│  │     │   4. Processing                        │
│  │     │   5. Visa issued                       │
│  │     ├ [Download Summary PDF]                 │
│  │     ├ [Download Detailed Guide PDF]          │
│  │     ├ [Share via Email]                      │
│  │     └ [Start Application →]                  │
│  │                                              │
│  ● ─── Business Visa                            │
│  │     └ ... (same expandable structure)        │
│  │                                              │
│  ● ─── Work Permit                              │
│        └ ...                                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Behavior:**
- Timeline is vertical with animated expand/collapse
- Each visa type node is a collapsible card
- Sub-timeline shows the step-by-step process within each visa type
- Smooth scroll animations
- "Download", "Share", and "Apply" buttons prominently placed
- Mobile-responsive: timeline stacks vertically

### 7.5 Visa Application Flow (Employee Side)

```
Step 1: Select Visa Type
  → Choose country → choose visa type
  → Or click "Start Application" from country page

Step 2: Applicant Selection
  → "Applying for myself" or "Applying for a colleague"
  → If colleague: enter their name + email → system sends them a notification
  → Colleague can view the application and add their own details

Step 3: Fill Application Form
  → Dynamic form rendered from VisaTemplate
  → Sections displayed as a multi-step wizard (one section per step)
  → Auto-save as draft on every field change
  → Field-level validation (Zod schemas from template config)

Step 4: Upload Documents
  → Checklist of required documents for this visa type
  → Drag-and-drop or click-to-upload
  → File type and size validation (client + server)
  → Preview uploaded documents
  → Progress indicators for each document

Step 5: Review & Submit
  → Summary of all filled data and uploaded documents
  → Edit links back to each section
  → Terms & conditions acceptance
  → Submit button → status moves to UNDER_REVIEW

Step 6: Payment (triggered after admin approval)
  → Payment page with fee breakdown
  → Razorpay checkout integration (inline)
  → Payment confirmation → receipt generated
  → Status moves to PAYMENT_CONFIRMED

Step 7: Tracking
  → Visual progress tracker showing current status
  → Comment thread for communication with admin team
  → Document re-upload interface (if revisions requested)
  → Push notifications on status changes
```

### 7.6 Colleague Application Flow
- User A clicks "Apply for Colleague"
- Enters colleague's name and email (must be from the same company domain)
- System creates the application with `initiatedById = User A`, `userId = Colleague`
- Colleague receives email notification with a link to the application
- Both User A and the colleague can view and edit the application
- Colleague can fill in personal details that User A may not have
- Admin sees both the initiator and the applicant in the application view

### 7.7 Downloadable Visa Information (Branded PDFs)

**Two types of PDFs:**

1. **Summary Sheet** (1–2 pages)
   - Quick-reference card format
   - Visa type name, processing time, fees, validity
   - Key requirements (bullet points)
   - Top of page: Platform logo (left) + Corporate company logo (right)
   - Bottom: Contact info, website, disclaimer
   - Clean, branded design matching the platform's blue theme

2. **Detailed Packet** (multi-page)
   - Comprehensive guide for the visa type
   - Full requirements with detailed descriptions
   - Complete document checklist with specifications
   - Step-by-step process guide
   - Tips and common mistakes
   - FAQ section
   - Same co-branding (platform logo + corporate logo)
   - Professional layout with headers, page numbers, table of contents

**Generation:** PDFs are generated dynamically from the current visa data (always up-to-date). Cached with invalidation on data changes.

### 7.8 Email Sharing
- User clicks "Share via Email" on any visa type
- Modal: Enter recipient email(s), optional personal message
- System sends a branded email with:
  - Visa type summary inline in email body
  - Attached PDF (summary sheet)
  - "View Full Details" link (requires login)
- Tracked in `VisaInfoShare` table
- Admin can see share analytics (who shared what, to whom, how often)

### 7.9 In-App Notification System
- Bell icon in top navigation bar with unread count badge
- Dropdown panel showing recent notifications
- Full notifications page with filters (all, unread, by type)
- Notification types:
  - Application status changes
  - Document review results (approved / re-upload requested)
  - Payment confirmations
  - New applications (for admin)
  - Colleague application invites
  - System announcements
- Mark as read (individual and bulk)
- Email notifications sent in parallel (configurable per type)

### 7.10 Comments/Notes Thread per Application
- Located on the application detail page
- Threaded comments: support for replies
- Both employees and admin team can post
- **Internal notes**: Admin can mark a comment as "internal only" — visible only to admin team, hidden from employees
- File attachments supported in comments
- Timestamps and author avatars
- Real-time updates (polling or WebSocket)

---

## 8. Admin Panel Specifications

### 8.1 Admin Dashboard (Home)
- **Key Metrics Cards**: Total applications (by status), revenue this month, active users, pending reviews
- **Charts**: Applications over time (line), revenue over time (bar), applications by country (pie), status distribution (donut)
- **Recent Activity Feed**: Latest application submissions, status changes, payments
- **Quick Actions**: Review pending applications, manage flagged documents
- **Alerts**: Applications stuck in review too long, payment failures

### 8.2 Country Management
- CRUD for countries with rich text editor for descriptions
- Upload flag, banner image, gallery images
- Drag-and-drop reordering
- Activate/deactivate countries (inactive countries hidden from employees)
- Nested management: click into a country to manage its visa types

### 8.3 Visa Type Management (with Form Builder)
- CRUD for visa types within a country
- Rich text editor for descriptions, overview, eligibility
- **Form Template Builder** (the core no-code tool):
  - Drag-and-drop field types onto canvas
  - Configure each field: label, type, required, validation rules, help text, placeholder
  - Organize fields into sections (collapsible groups)
  - Reorder fields and sections via drag-and-drop
  - Field types: text, textarea, date, date_range, select (single/multi), checkbox, radio, number, email, phone, file_upload, country_picker, passport_details (composite), photo_upload
  - Conditional logic: show/hide fields based on other field values
  - Preview mode: see the form as the employee would see it
  - Version history: track template changes
- **Document Requirements Manager**:
  - Add required documents with name, description, accepted formats, max size
  - Mark as mandatory or optional
  - Upload sample documents for reference
  - Reorder via drag-and-drop
- **Process Steps Manager**:
  - Define step-by-step process for the timeline
  - Each step: title, description, estimated duration, tips
  - Reorder via drag-and-drop
- Fee configuration: base fee, service fee, urgent processing fee, currency

### 8.4 Application Management
- **List View**: Filterable, sortable table of all applications
  - Filters: status, country, visa type, company, date range, assigned agent, priority
  - Search by application number, applicant name, email
  - Bulk actions: assign to agent, export to CSV
- **Detail View**: Full application detail page
  - Applicant info (linked to user profile)
  - Company info
  - Form data (rendered from template)
  - Documents panel: view, approve, reject, request re-upload (with note)
  - Status control: buttons to advance status (with confirmation)
  - Payment info
  - Comment thread (with internal notes toggle)
  - Status history timeline
  - Assign to team member
  - Set priority (normal / urgent)
- **Kanban View** (optional but recommended): Drag applications between status columns

### 8.5 User Management
- List all corporate users with filters (company, status, registration date)
- View user detail: profile, their applications, their shares, their payment history
- Actions: suspend, reactivate, impersonate (view as user), send notification
- Company management: list companies, view employees, edit company details, upload company logo, manage branding config

### 8.6 Payment Management
- List all payments with filters (status, date, amount, company)
- View payment detail: Razorpay metadata, linked application
- Refund processing
- Revenue reports and exports
- Invoice generation (optional future enhancement)

### 8.7 Visa Information Share Analytics
- Track who shared what visa info, to whom, when
- Download counts per PDF
- Most shared visa types
- Engagement metrics

### 8.8 Team Management (Superadmin Only)
- Invite admin team members via email
- Assign custom permissions (granular toggles per category)
- View team member activity log
- Suspend/remove team members
- Force 2FA reset

### 8.9 System Settings (Superadmin Only)
- Platform branding: logo, colors, favicon
- Email template customization (notification emails, share emails, etc.)
- Default notification preferences
- Razorpay configuration (API keys)
- S3 storage configuration
- SMTP/email service configuration
- Maintenance mode toggle

---

## 9. Design System & UI Guidelines

### 9.1 Design Direction
- **Theme**: Clean white + blue tones — light and professional
- **Primary Color**: Deep blue (`#1E40AF` range) with lighter blue accents
- **Secondary**: Slate/gray tones for text and borders
- **Accent**: Subtle green for success states, amber for warnings, red for errors
- **Background**: White (`#FFFFFF`) with very light gray (`#F8FAFC`) for sections/cards
- **Typography**: Inter or similar clean sans-serif, clear hierarchy
- **Border Radius**: Medium (8px for cards, 6px for inputs) — friendly but professional
- **Shadows**: Subtle, layered shadows for depth without heaviness

### 9.2 Component Patterns
- **Cards**: White background, subtle border, light shadow — used for applications, visa types, stats
- **Tables**: Clean with zebra striping, sticky headers, inline actions
- **Forms**: Spacious layout, clear labels, inline validation, helpful descriptions
- **Modals**: Centered with backdrop blur, used sparingly for confirmations and quick actions
- **Timeline**: Custom vertical timeline component with animated expand/collapse, connecting lines, dot indicators
- **Status Badges**: Color-coded pills (blue = in progress, green = success, yellow = attention, red = rejected)
- **Navigation**: Sidebar for main nav (collapsible), top bar for profile/notifications/search

### 9.3 Responsive Design
- Mobile-first approach
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Sidebar collapses to hamburger on mobile
- Tables become card lists on mobile
- Timeline remains vertical on all viewports
- Touch-friendly targets (min 44px)

### 9.4 Animations & Micro-interactions
- Page transitions: subtle fade
- Card hover: lift with shadow increase
- Timeline expand/collapse: smooth height animation
- Status changes: progress bar animation
- Notifications: slide-in from top-right
- Loading states: skeleton screens (not spinners)
- Form steps: slide transition between sections

---

## 10. API Architecture

### 10.1 Route Structure (Next.js App Router)

```
app/
├── (public)/                          # Public routes (no auth)
│   ├── page.tsx                       # Landing page
│   ├── login/page.tsx                 # Employee login (OTP)
│   ├── signup/page.tsx                # Employee registration
│   └── verify-otp/page.tsx            # OTP verification
│
├── (dashboard)/                       # Authenticated employee routes
│   ├── layout.tsx                     # Dashboard shell (sidebar, topbar)
│   ├── dashboard/page.tsx             # Employee home
│   ├── countries/
│   │   ├── page.tsx                   # Countries grid/list
│   │   └── [countrySlug]/page.tsx     # Country detail (timeline)
│   ├── applications/
│   │   ├── page.tsx                   # My applications list
│   │   ├── new/page.tsx               # Start new application (wizard)
│   │   ├── colleague/page.tsx         # Apply for colleague
│   │   └── [id]/page.tsx             # Application detail + tracking
│   ├── profile/page.tsx               # My profile
│   ├── company/page.tsx               # Company profile
│   └── notifications/page.tsx         # All notifications
│
├── (admin)/                           # Admin routes
│   ├── admin/
│   │   ├── layout.tsx                 # Admin shell
│   │   ├── login/page.tsx             # Admin login
│   │   ├── dashboard/page.tsx         # Admin dashboard (analytics)
│   │   ├── countries/                 # Country CRUD
│   │   ├── visa-types/                # Visa type CRUD + template builder
│   │   ├── applications/              # Application management
│   │   ├── users/                     # User management
│   │   ├── companies/                 # Company management
│   │   ├── payments/                  # Payment management
│   │   ├── shares/                    # Share analytics
│   │   ├── team/                      # Team management
│   │   └── settings/                  # System settings
│
├── api/                               # API routes
│   ├── auth/
│   │   ├── signup/route.ts
│   │   ├── login/route.ts
│   │   ├── verify-otp/route.ts
│   │   ├── admin-login/route.ts
│   │   ├── verify-2fa/route.ts
│   │   └── logout/route.ts
│   ├── countries/route.ts
│   ├── visa-types/route.ts
│   ├── applications/route.ts
│   ├── documents/route.ts
│   ├── payments/
│   │   ├── create-order/route.ts
│   │   ├── verify/route.ts
│   │   └── webhook/route.ts           # Razorpay webhook
│   ├── notifications/route.ts
│   ├── share/route.ts
│   ├── pdf/
│   │   ├── summary/[visaTypeId]/route.ts
│   │   └── detailed/[visaTypeId]/route.ts
│   ├── admin/                         # Admin-only API routes
│   │   ├── users/route.ts
│   │   ├── companies/route.ts
│   │   ├── applications/route.ts
│   │   ├── templates/route.ts
│   │   ├── team/route.ts
│   │   ├── analytics/route.ts
│   │   └── settings/route.ts
│   └── upload/route.ts                # File upload to S3
```

### 10.2 API Conventions
- All API routes return `{ success: boolean, data?: any, error?: string }`
- Pagination: `?page=1&limit=20` → response includes `{ data, total, page, totalPages }`
- Sorting: `?sortBy=createdAt&sortOrder=desc`
- Filtering: `?status=UNDER_REVIEW&country=US`
- All mutations validate input with Zod schemas
- All routes check authentication and authorization (middleware)

---

## 11. Security Implementation

### 11.1 Data Encryption
- **At rest**: PostgreSQL with encrypted volumes, S3 server-side encryption (SSE-S3 or SSE-KMS)
- **In transit**: TLS 1.3 everywhere (enforced via Nginx/Caddy)
- **Sensitive fields**: Passport numbers encrypted at application level (AES-256-GCM) before storage, decrypted only when needed
- **File uploads**: Pre-signed S3 URLs for direct upload (files never pass through app server)

### 11.2 Audit Logging
- Every admin action logged: who, what, when, from where (IP), what changed (before/after diff)
- Immutable append-only log (separate table, no DELETE permissions)
- Admin can search and filter audit logs
- Retention: configurable (default 2 years)
- Exportable for compliance

### 11.3 GDPR Compliance
- **Data export**: Users can request a full export of their personal data (JSON/PDF)
- **Data deletion**: Users can request account deletion; system anonymizes their data after a grace period
- **Consent tracking**: Explicit consent checkboxes during registration, stored with timestamp
- **Cookie consent**: Banner for any tracking cookies
- **Privacy policy**: Clearly linked, covers data processing, storage, third-party sharing
- **Data retention policies**: Configurable per data type
- **Right to rectification**: Users can edit their profile data at any time

### 11.4 Additional Security
- CSRF protection (Next.js built-in + custom tokens for mutations)
- XSS prevention (React's default escaping + CSP headers)
- SQL injection prevention (Prisma parameterized queries)
- Rate limiting on all API routes (stricter on auth endpoints)
- Helmet.js for security headers
- File upload validation (server-side MIME type checking, virus scanning if feasible)
- CORS configuration (restrict to your domain only)

---

## 12. Notification System

### 12.1 Email Notifications
Triggered on:
- OTP for login/signup
- Application status changes (to applicant + initiator if different)
- Document review results
- Payment confirmation/receipt
- Colleague application invitation
- Visa issuance
- Admin: new application received, payment received

All emails use branded HTML templates (customizable by superadmin).

### 12.2 In-App Notifications
- Stored in `Notification` table
- Delivered via polling (every 30s) or WebSocket for real-time
- Grouped by type
- Click-through to relevant page
- Bulk mark-as-read

---

## 13. Background Jobs (BullMQ + Redis)

| Job                  | Trigger                         | Action                                         |
| -------------------- | ------------------------------- | ---------------------------------------------- |
| `sendOtpEmail`       | Login/signup request            | Generate OTP, store hash, send email           |
| `sendNotifEmail`     | Status change, review, etc.     | Render template, send via Resend/SMTP          |
| `generatePdf`        | Download/share request          | Generate branded PDF, cache in S3              |
| `processPaymentWebhook` | Razorpay webhook              | Verify signature, update payment + application |
| `cleanupExpiredOtps` | Cron (every 15 min)             | Delete expired OTPs from DB                    |
| `auditLogArchive`    | Cron (monthly)                  | Archive old audit logs                         |
| `gdprDataExport`     | User request                    | Compile user data, generate zip, email link    |

---

## 14. Deployment (Self-Hosted / VPS)

### 14.1 Docker Compose Setup

```yaml
services:
  app:          # Next.js application
  postgres:     # PostgreSQL database
  redis:        # Redis for sessions, caching, BullMQ
  worker:       # BullMQ worker process
  minio:        # S3-compatible object storage (or use external S3)
  nginx:        # Reverse proxy + SSL termination
```

### 14.2 Environment Variables (to configure)
```
DATABASE_URL
REDIS_URL
S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
RESEND_API_KEY (or SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
JWT_SECRET, OTP_SECRET
ENCRYPTION_KEY (for passport data)
NEXT_PUBLIC_APP_URL
ADMIN_EMAIL (initial superadmin)
```

### 14.3 Infrastructure Requirements
- **Minimum VPS**: 4 vCPUs, 8GB RAM, 100GB SSD
- **Recommended**: 8 vCPUs, 16GB RAM, 250GB SSD (with NVMe)
- **SSL**: Let's Encrypt via Certbot or Caddy auto-SSL
- **Backups**: Automated daily PostgreSQL dumps + S3 bucket versioning
- **Monitoring**: Health check endpoint, basic uptime monitoring

---

## 15. Development Phases (Recommended)

### Phase 1 — Foundation (Weeks 1–3)
- Project setup: Next.js, Prisma, PostgreSQL, Docker Compose
- Database schema and migrations
- Authentication system (employee OTP + admin password + 2FA)
- Basic employee dashboard layout
- Basic admin dashboard layout
- File upload to S3

### Phase 2 — Country & Visa Management (Weeks 4–6)
- Country CRUD (admin)
- Visa type CRUD (admin)
- Form template builder (admin)
- Document requirements manager (admin)
- Process steps manager (admin)
- Country pages with timeline (employee view)

### Phase 3 — Application Workflow (Weeks 7–9)
- Visa application wizard (employee)
- Dynamic form rendering from templates
- Document upload with checklist
- Application review system (admin)
- Document review (approve/reject/request re-upload)
- Status machine and transitions
- Comment thread per application
- Colleague application flow

### Phase 4 — Payments & PDFs (Weeks 10–11)
- Razorpay integration (order creation, checkout, webhooks)
- Payment management (admin)
- PDF generation (summary sheet + detailed packet)
- Co-branding logic (platform logo + company logo)
- Email sharing of visa info

### Phase 5 — Notifications & Polish (Weeks 12–13)
- Email notification system (all triggers)
- In-app notification system
- Audit logging
- GDPR features (data export, deletion)
- Admin analytics dashboard

### Phase 6 — Landing Page & Launch Prep (Week 14)
- Public landing page design and build
- SEO optimization
- Security hardening and penetration testing
- Performance optimization (caching, lazy loading, image optimization)
- Docker production build optimization
- Documentation

---

## 16. Key Technical Decisions & Notes for Claude Code

1. **Use Next.js App Router** with Server Components by default; use `'use client'` only when interactivity is needed.
2. **Prisma** is the ORM — always generate types from schema, use them everywhere.
3. **Zod schemas** should be shared between frontend (form validation) and backend (API validation). Define once in a `/lib/schemas/` directory.
4. **shadcn/ui** for components — install only the components needed, customize to match the blue theme.
5. **The form template builder** is the most complex feature. Use a JSON schema approach: templates are stored as JSON, rendered dynamically on the employee side, and editable via drag-and-drop on the admin side.
6. **File uploads** should go directly to S3 via pre-signed URLs. The server generates the URL, the client uploads directly, then confirms back to the server.
7. **PDF generation** should happen in background jobs (BullMQ) and be cached. Invalidate cache when underlying visa data changes.
8. **All admin API routes** must check both authentication AND authorization (role + specific permissions).
9. **Use database transactions** for any multi-step operations (e.g., creating an application + initial status change + notification).
10. **Soft delete** for critical entities (users, companies, applications) — never hard delete.
11. **Keep the design clean and minimal** — avoid clutter, use whitespace generously, limit colors to the defined palette.
12. **The platform name and logos will be provided** — use placeholder text/images during development and make them easily configurable via the admin settings panel.

---

## 17. File/Folder Structure

```
visa-platform/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                        # Seed script for dev data
├── src/
│   ├── app/                           # Next.js App Router pages (see §10.1)
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── layout/                    # Sidebar, TopBar, Footer
│   │   ├── auth/                      # Login, Signup, OTP forms
│   │   ├── dashboard/                 # Dashboard widgets, cards
│   │   ├── country/                   # Country card, timeline, visa type card
│   │   ├── application/               # Application wizard, status tracker, document uploader
│   │   ├── admin/                     # Admin-specific components
│   │   │   ├── template-builder/      # Drag-and-drop form builder
│   │   │   ├── application-review/    # Review panel, document reviewer
│   │   │   └── analytics/             # Charts, metric cards
│   │   ├── comments/                  # Comment thread component
│   │   ├── notifications/             # Notification bell, panel, list
│   │   └── pdf/                       # PDF templates (React-PDF)
│   ├── lib/
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── auth.ts                    # Auth utilities (JWT, OTP, session)
│   │   ├── s3.ts                      # S3 client and helpers
│   │   ├── razorpay.ts               # Razorpay client and helpers
│   │   ├── email.ts                   # Email sending utilities
│   │   ├── pdf.ts                     # PDF generation utilities
│   │   ├── permissions.ts             # RBAC permission checker
│   │   ├── schemas/                   # Zod validation schemas (shared)
│   │   ├── constants.ts               # Application statuses, roles, etc.
│   │   └── utils.ts                   # General utilities
│   ├── hooks/                         # Custom React hooks
│   ├── stores/                        # Zustand stores
│   ├── middleware.ts                   # Next.js middleware (auth, redirects)
│   └── types/                         # TypeScript type definitions
├── workers/
│   └── index.ts                       # BullMQ worker definitions
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── .env.example
├── package.json
└── tsconfig.json
```

---

*This specification is designed to be comprehensive enough for an AI coding agent to build the platform methodically, phase by phase. Each section provides the context and detail needed to make correct architectural and implementation decisions without ambiguity.*
