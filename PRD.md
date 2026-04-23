# SNC Patient Register — Product Requirements Document
## Siyaram Neurotherapy Center | Version 1.0

---

## 1. App Purpose

**Desktop application** for Siyaram Neurotherapy Center to manage patient records, treatment sessions, and payment tracking — stored locally as JSON files on a single Windows PC, working **fully offline**.

**Core Problem Solved:** Replaces manual paper-based patient tracking with a digital system that works without internet and generates PDF receipts for manual sharing.

---

## 2. Target Users

| Role | Use Case |
|------|----------|
| **Admin (Owner)** | Full access: patients, sessions, payments, settings, backup |

> Multi-user support deferred to future version.

---

## 3. Must-Have Features (MVP)

### F1. Patient Management
- Add new patients (name, contact, medical conditions, restrictions)
- View patient list with search (by name, mobile, reg. number)
- Patient detail view with contact info + medical notes
- Edit/Delete patients
- **Patient Treatment Card** — printable card per patient containing:
  - Clinic header: Siya Ram Neurotherapy Center, Reg. No., Neurotherapist name
  - Patient Info: Name, Address, Occupation, Age/Sex, Telephone
  - Health conditions checklist
  - Dietary restrictions (e.g., No Alcohol, etc.)
  - Patient History section
  - Treatment sessions table (Date, Assessment, Pain Level, Mobility, Techniques)
  - Footer disclaimer: "Treatment is at patient's own risk"
- Treatment Card pop-up window for viewing/editing patient details

### F2. Session Recording
- Log treatment sessions per patient
- Record: date, assessment (pre/post), pain level, mobility, techniques
- Associate session with payment

### F3. Payment Tracking
- Record Cash / UPI / Pending payments
- Link payment to patient and session
- View payment history with filters (date range, patient)

### F4. PDF Receipt Generation
- Generate receipt for each payment
- Include: clinic name, date, patient name, amount, payment mode
- Save as PDF file to local folder
- Print support via system print dialog

### F5. Dashboard
- Total patients count
- Total sessions this month
- Total revenue this month
- Recent patients list

---

## 4. Nice-to-Have Features

- Regular visit reminders
- Treatment progress charts
- Backup/Restore to ZIP file
- Export data to Excel
- SMS reminders to patients

---

## 5. Minimum Requirements

| Item | Requirement |
|------|-------------|
| **OS** | Windows 10 or later |
| **CPU** | Intel i3 3rd Gen or equivalent |
| **RAM** | 4 GB |
| **Storage** | 500 MB free space |
| **Display** | 1280 x 720 minimum |

---

## 6. Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Tauri 2.x (Rust backend + WebView2 frontend) |
| **Frontend** | React 19 + TypeScript |
| **Styling** | Tailwind CSS |
| **PDF** | jsPDF |
| **Routing** | React Router DOM |
| **Storage** | Local JSON files (fs plugin) |

---

## 7. Data Storage

All data stored as JSON files in app data directory:

```
%APPDATA%/SNC Patient Register/
├── patients.json
├── sessions.json
├── payments.json
├── settings.json
└── backups/
```

---

## 8. Authentication

- Local admin account (stored in settings.json)
- Default credentials: `admin / admin123`
- Password changeable in settings

---

## 9. Pages
### P1: Login Page — `/login`
```
┌─────────────────────────────────────────┐
│        SIYA RAM NEUROTHERAPY CENTER     │
│                                         │
│         🔒 Admin Login                  │
│                                         │
│     Username: [_______________]         │
│     Password: [_______________]         │
│                                         │
│         [    LOGIN    ]                 │
│                                         │
│     Default: admin / admin123          │
└─────────────────────────────────────────┘
```

### P2: Dashboard — `/`
```
┌──────────────────────────────────────────────────────────┐
│  🏥 SIYA RAM NEUROTHERAPY CENTER          [Logout]     │
├────────────┬────────────┬────────────┬───────────────────┤
│ Patients   │ Sessions   │ Revenue   │ Settings          │
│   125      │    43      │ ₹45,600   │ ⚙️                │
├────────────┴────────────┴────────────┴───────────────────┤
│                                                          │
│  📋 Recent Patients                                      │
│  ┌────────────────────────────────────────────────┐     │
│  │ #001 | Ramesh Kumar | 9876543210 | 16-04-2026 │     │
│  │ #002 | Priya Singh     | 9876543211 | 15-04-2026 │     │
│  │ #003 | Suresh Yadav   | 9876543212 | 14-04-2026 │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  [+ Add New Patient]                                    │
└──────────────────────────────────────────────────────────┘
```


1. **Login** — `/login` — Authentication page
2. **Dashboard** — `/` — Stats overview + recent patients
3. **Patients** — `/patients` — Patient list + search
4. **Patient Detail** — `/patients/:id` — Patient info + sessions
5. **Add Patient** — `/patients/new` — New patient form
6. **Sessions** — `/sessions` — All sessions log
7. **Payments** — `/payments` — All payments with filters
8. **Settings** — `/settings` — Backup/restore/password
9. **Treatment Card** — `/patients/:id/treatment-card` — Printable patient treatment card (modal/pop-up window)

---

## 10. Receipt PDF Layout

```
┌─────────────────────────────────┐
│  🏥 SNC PATIENT REGISTER        │
│  Siyaram Neurotherapy Center    │
│  [Address]                      │
│  [Phone]                        │
├─────────────────────────────────┤
│  Receipt No. : #001             │
│  Date       : 23-04-2026        │
│  Patient    : [Name]            │
│  Amount     : Rs. 500           │
│  Mode       : CASH / UPI         │
├─────────────────────────────────┤
│  Treatment Provided             │
│  [Session Notes]                │
├─────────────────────────────────┤
│  Thank you for your visit!       │
└─────────────────────────────────┘
```

---

## 11. Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Green | `#16a34a` | Buttons, accents |
| Dark Green | `#15803d` | Header, sidebar |
| Light Green | `#dcfce7` | Badges, highlights |
| Background | `#f8fafc` | Page background |
| Card BG | `#ffffff` | Cards, panels |
| Text Dark | `#1e293b` | Primary text |
| Text Gray | `#64748b` | Secondary text |
| Error Red | `#ef4444` | Error messages |
| Warning | `#f59e0b` | Warning states |

---

## 12. Treatment Card Layout

```
┌───────────────────────────────────────────┐
│  🏥 SIYA RAM NEUROTHERAPY CENTER          │
│  Reg. No.: [2018293]                      │
│  Neurotherapist: Pt. Pradeep Kumar        │
├───────────────────────────────────────────┤
│  Patient Name    : _______________________│
│  Address         : _______________________│
│  Occupation      : _______________________│
│  Age/Sex         : _____ / _____          │
│  Telephone       : _______________________│
├───────────────────────────────────────────┤
│  Health Conditions:                       │
│  [ ] Paralysis  [ ] Joint Pain            │
│  [ ] Slip Disc  [ ] Cervical              │
│  [ ] BP         [ ] Sugar                 │
│  [ ] Heart      [ ] Stomach               │
│  [ ] Parkinson  [ ] Epilepsy              │
│  [ ] Mental     [ ] PCOD                   │
│  [ ] Asthma     [ ] Thyroid                │
├───────────────────────────────────────────┤
│  Dietary Restrictions:                     │
│  [ ] No Alcohol  [ ] No Egg                │
│  [ ] No Non-Veg  [ ] Light Diet           │
├───────────────────────────────────────────┤
│  Patient History:                          │
│  ________________________________________ │
│  ________________________________________ │
├───────────────────────────────────────────┤
│  Treatment                                │
│  ┌──────┬─────────┬──────┬────────┬─────┐│
│  │ Date │Assessment│Pain  │Mobility│Tech ││
│  ├──────┼─────────┼──────┼────────┼─────┤│
│  │      │         │      │        │     ││
│  └──────┴─────────┴──────┴────────┴─────┘│
├───────────────────────────────────────────┤
│  ⚠ Treatment is at patient's own risk.     │
└───────────────────────────────────────────┘
```

---
