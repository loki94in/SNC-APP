\# SNC PATIENT REGISTER — FEATURE ADDENDUM

\## PRD Delta Document | Version: ADD-1.00

\### Siyaram Neurotherapy Center, Agra

\-----

&gt; This document extends the base PRD (MVP-1.00) with five new feature modules.

&gt; Every new feature follows the base PRD’s rule:

&gt; NO SCREEN → NO ELEMENT → NO FUNCTION → NO LOGIC → NO ERROR HANDLING = INVALID.

\-----

\## ADDENDUM OVERVIEW

|#|Feature Module                      |Screen                  |Priority|

|-|------------------------------------|------------------------|--------|

|A|Telegram Bot Manager                |Admin → Telegram        |HIGH    |

|B|Credential & Password Manager       |Admin → Security        |HIGH    |

|C|Role & Privilege Manager            |Admin → Roles           |HIGH    |

|D|Session Notes (PRE / POST Treatment)|Patient → Session       |HIGH    |

|E|Regular Visit Tracker               |Patient → Regular Visits|HIGH    |

\-----

\-----

\## MODULE A — TELEGRAM BOT MANAGER

\### A.1 Purpose

Allow clinic admin to manually configure the Telegram bot without touching code.

Admin can add a bot token, revoke it, and manage what commands the bot responds to.

\-----

\### A.2 Screen: Admin → Telegram Settings

**Screen Path:** `/screens/admin/telegram.html`

\#### A.2.1 — Bot Token Section

|UI Element              |data-function              |Behavior                                                       |

|------------------------|---------------------------|---------------------------------------------------------------|

|Token input field       `validate_telegram_token`  |Accepts bot token string; validates format `NNNNNNNNNN:AAAA...`|

|\[Save Token\] button     `saveTelegramTokenAction`  |Encrypts and stores token in local vault                       |

|\[Revoke Token\] button   `revokeTelegramTokenAction`|Clears stored token; disables bot immediately                  |

|Token status badge      `fetchBotStatus`           |Shows ACTIVE / REVOKED / NOT SET                               |

|\[Test Connection\] button`testBotConnectionAction`  |Sends a ping to Telegram API; shows ✅ or ❌                     |

**Token Storage Rule:**

\- Token is NEVER stored in plain text.

\- Stored as AES-256 encrypted string in localStorage key `snc_tg_token_enc`.

\- Decrypted in-memory only when API call is needed.

\- On revoke: encrypted store is wiped; bot status set to REVOKED.

**validate_telegram_token:**

\- Input: raw string from input field

\- Rule: must match regex `/^\d{8,12}:[A-Za-z0-9_-]{35,}$/`

\- Output: VALID flag or inline error message

\- Error: “Invalid token format. Check your BotFather token.”

**saveTelegramTokenAction:**

\- Input: validated token string

\- Processing: encrypt → store → call Telegram `getMe` API to verify

\- Success: show toast “Bot token saved and verified ✅”

\- Error: “Could not verify token with Telegram. Check your internet connection.”

**revokeTelegramTokenAction:**

\- Shows confirmation modal: “Revoke bot token? All alerts will stop.”

\- On confirm: wipe encrypted store → set status = REVOKED → log event with timestamp

\- On cancel: close modal, no change

**testBotConnectionAction:**

\- Reads encrypted token → decrypt → call Telegram `getMe`

\- Success: show bot username in toast “Connected as @YourBotName ✅”

\- Error: show “Bot unreachable. Check token or internet.”

\-----

\#### A.2.2 — Bot Commands Section

Admin can define a command list that the bot will recognise and respond to.

|UI Element               |data-function                 |Behavior                                                      |

|-------------------------|------------------------------|--------------------------------------------------------------|

|Command table (list view)`fetchBotCommands`            |Shows all defined commands                                    |

|\[Add Command\] button     `openAddCommandModal`         |Opens modal with command + response fields                    |

|\[Edit\] per row           `openEditCommandModal`        |Pre-fills modal with existing command                         |

|\[Delete\] per row         `deleteCommandAction`         |Removes command after confirmation                            |

|\[Push to Bot\] button     `pushCommandsToTelegramAction`|Sends updated command list to Telegram via `setMyCommands` API|

**Command Data Model:**

\`\`\`

command_id    : auto-generated UUID

trigger       : string (e.g., /status, /backup, /patients_today)

description   : string shown in Telegram command menu

response_type : STATIC_TEXT | DYNAMIC_DATA

response_text : string (for STATIC_TEXT type)

data_query    : string key (for DYNAMIC_DATA — maps to internal data fetch)

is_active     : boolean

\`\`\`

**pushCommandsToTelegramAction:**

\- Reads all `is_active = true` commands

\- Calls Telegram `setMyCommands` API with array of {command, description}

\- Success: “Commands pushed to Telegram ✅ Your bot menu is updated.”

\- Error: “Push failed. Check token status and internet.”

**Available DYNAMIC_DATA queries (pre-built):**

\- `patients_today` → count of patients seen today

\- `revenue_today` → total manual payments today

\- `backup_status` → last backup time and status

\- `next_appointment` → next scheduled session

\-----

\### A.3 Alert Rules (existing Telegram alert system — now admin-controlled)

|Setting                        |Control Type|Default               |

|-------------------------------|------------|----------------------|

|Send daily backup alert        |Toggle      |ON                    |

|Send login failure alert       |Toggle      |ON                    |

|Alert recipient Chat ID        |Text input  |(must be set manually)|

|Alert send time (daily summary)|Time picker |20:00                 |

**fetchChatId function:**

\- Admin enters their personal Telegram Chat ID (obtained from @userinfobot)

\- Stored encrypted alongside token

\- Validated by sending a test message on save

\-----

\-----

\## MODULE B — CREDENTIAL & PASSWORD MANAGER

\### B.1 Purpose

Allow admin to change their own password and login ID, and reset credentials for other users.

\-----

\### B.2 Screen: Admin → Security Settings

**Screen Path:** `/screens/admin/security.html`

\#### B.2.1 — Change Own Password

|UI Element                |data-function              |Behavior                                                     |

|--------------------------|---------------------------|-------------------------------------------------------------|

|Current password field    `validate_current_password`|Checks against stored hash                                   |

|New password field        `validate_new_password`    |Min 8 chars, 1 number, 1 special char                        |

|Confirm new password field`validate_confirm_password`|Must match new password field                                |

|\[Update Password\] button  `changePasswordAction`     |Hashes new password → stores → invalidates all other sessions|

**changePasswordAction:**

\- Step 1: Verify current password hash matches stored hash

\- Step 2: Validate new password strength (min 8 chars, 1 digit, 1 special)

\- Step 3: Hash new password (SHA-256 + salt)

\- Step 4: Store new hash → wipe old hash

\- Step 5: Log “Password changed” event with timestamp and user ID

\- Step 6: Force re-login (clear sessionStorage → redirect to login)

\- Success: “Password updated. Please log in again.”

\- Error states: Wrong current password / Weak password / Passwords don’t match

\-----

\#### B.2.2 — Change Login ID (Username)

|UI Element                          |data-function                    |Behavior                                                   |

|------------------------------------|---------------------------------|-----------------------------------------------------------|

|Current login ID (read-only display)`fetchCurrentLoginId`            |Shows masked current ID                                    |

|New login ID field                  `validate_new_login_id`          |Min 5 chars; alphanumeric + underscore only; must be unique|

|Password confirmation field         `validate_password_for_id_change`|Requires current password to authorise change              |

|\[Update Login ID\] button            `changeLoginIdAction`            |Updates ID → forces re-login                               |

**changeLoginIdAction:**

\- Step 1: Check new ID is unique (not already in use)

\- Step 2: Verify password

\- Step 3: Update login ID in user store

\- Step 4: Log event

\- Step 5: Force re-login

\- Error: “Login ID already taken” / “Password incorrect” / “Invalid format”

\-----

\#### B.2.3 — Admin: Reset Other Users’ Passwords

Only visible to ADMIN role.

|UI Element             |data-function             |Behavior                                    |

|-----------------------|--------------------------|--------------------------------------------|

|User selector dropdown `fetchAllUsers`           |List of all login accounts                  |

|\[Reset Password\] button`adminResetPasswordAction`|Generates temporary password → shows it once|

**adminResetPasswordAction:**

\- Generate random 10-character temp password

\- Hash and store against selected user

\- Flag account as `must_change_password = true`

\- Display temp password ONCE in modal (not stored in plain text anywhere after display)

\- On next login: user is forced to change password before accessing any screen

\- Log: “Password reset by \[admin_id\] for \[user_id\] at \[timestamp\]”

\-----

\-----

\## MODULE C — ROLE & PRIVILEGE MANAGER

\### C.1 Purpose

Define granular access rules: what screens, tabs, and actions each role can see and perform.

\-----

\### C.2 Screen: Admin → Roles & Permissions

**Screen Path:** `/screens/admin/roles.html`

\#### C.2.1 — Role Definitions

Four built-in roles (cannot be deleted, only modified):

|Role        |Default Description                                                           |

|------------|------------------------------------------------------------------------------|

|ADMIN       |Full access to all screens and functions                                      |

|CLINICIAN   |Patient records, sessions, scheduler — full read/write                        |

|RECEPTIONIST|Patient registration, appointments, basic payment entry — no financial reports|

|FINANCE     |Revenue dashboard, payment records — no clinical notes                        |

Custom roles can be created by ADMIN.

\-----

\#### C.2.2 — Permission Matrix UI

Displayed as a table: **Rows = Features/Screens** | **Columns = Roles**

Each cell contains a toggle (ON/OFF) and optionally a granularity selector (VIEW / EDIT / HIDDEN).

|Screen / Feature     |ADMIN|CLINICIAN |RECEPTIONIST|FINANCE   |

|---------------------|-----|----------|------------|----------|

|Dashboard            |EDIT |VIEW      |VIEW        |VIEW      |

|Patient Master       |EDIT |EDIT      |VIEW        |HIDDEN    |

|Session Notes        |EDIT |EDIT      |HIDDEN      |HIDDEN    |

|Regular Visit Tracker|EDIT |EDIT      |VIEW        |HIDDEN    |

|Scheduler / Calendar |EDIT |EDIT      |EDIT        |HIDDEN    |

|Payment Entry        |EDIT |VIEW      |EDIT        |VIEW      |

|Revenue Dashboard    |EDIT |HIDDEN    |HIDDEN      |VIEW      |

|Admin → Users        |EDIT |HIDDEN    |HIDDEN      |HIDDEN    |

|Admin → Roles        |EDIT |HIDDEN    |HIDDEN      |HIDDEN    |

|Admin → Telegram     |EDIT |HIDDEN    |HIDDEN      |HIDDEN    |

|Admin → Security     |EDIT |EDIT (own)|EDIT (own)  |EDIT (own)|

|Backup Controls      |EDIT |HIDDEN    |HIDDEN      |HIDDEN    |

**Permission values:**

\- `EDIT` = can view AND modify

\- `VIEW` = read-only, action buttons hidden

\- `HIDDEN` = entire section/tab not rendered in UI

\-----

\#### C.2.3 — Functions

|UI Element              |data-function               |Behavior                                                  |

|------------------------|----------------------------|----------------------------------------------------------|

|Permission matrix table `fetchPermissionMatrix`     |Loads all role-feature permission records                 |

|Toggle per cell         `updatePermissionAction`    |Updates single permission entry                           |

|\[Save All\] button       `savePermissionMatrixAction`|Batch-saves all changes                                   |

|\[Add Custom Role\] button`openAddRoleModal`          |Creates new role with all permissions defaulting to HIDDEN|

|\[Delete Role\] button    `deleteRoleAction`          |Only allowed if no users assigned to that role            |

|Role → User assignment  |(in User Manager)           |See Module B                                              |

**savePermissionMatrixAction:**

\- Validates no role has 0 accessible screens (prevents lockout)

\- Saves to `snc_permissions` store

\- Broadcasts permission refresh event to all active sessions

\- Log: “Permissions updated by \[admin_id\] at \[timestamp\]”

\-----

\#### C.2.4 — Runtime Enforcement

\- On every screen load: `checkPermission(screenKey, currentUserRole)` is called

\- Returns: EDIT / VIEW / HIDDEN

\- If HIDDEN: entire section component is not rendered (not just hidden via CSS — actually removed from DOM)

\- If VIEW: all `<button>`, `<input>`, `<select>` elements inside that section receive `disabled` attribute and a “View Only” badge is shown

\-----

\-----

\## MODULE D — SESSION NOTES (PRE / POST TREATMENT)

\### D.1 Purpose

For each patient visit, clinician records the condition BEFORE treatment and the outcome AFTER treatment. This builds a longitudinal treatment history per patient.

\-----

\### D.2 Screen: Patient → Session Notes

**Screen Path:** `/screens/patient/session.html`

**Access:** From Patient Profile → \[Add Session\] button

\-----

\### D.2.1 — Session Form

|Field             |Type            |Notes                                     |

|------------------|----------------|------------------------------------------|

|Session Date      |Date picker     |Defaults to today                         |

|Session Number    |Auto            |Auto-incremented per patient              |

|Treating Clinician|Dropdown        |Fetched from Users list (role = CLINICIAN)|

|Visit Type        |Select          |IN-CLINIC / HOME VISIT                    |

|Session Duration  |Number (minutes)|e.g., 45                                  |

|Payment Amount    |Number          |Manual entry (cash/UPI)                   |

|Payment Mode      |Select          |CASH / UPI / PENDING                      |

**PRE-TREATMENT Section:**

|Field                      |Type          |Notes                                                                                    |

|---------------------------|--------------|-----------------------------------------------------------------------------------------|

|Chief Complaint Today      |Textarea      |Patient’s main issue before session                                                      |

|Pain / Discomfort Level    |Slider 0–10   |Visual scale                                                                             |

|Mobility Status            |Select        |NORMAL / RESTRICTED / BEDRIDDEN                                                          |

|Relevant Vitals (BP, Pulse)|Text fields   |Optional; free entry                                                                     |

|Clinician Pre-Assessment   |Textarea      |Clinician’s own notes before starting                                                    |

|Conditions Flagged         |Multi-checkbox|Diabetes / Heart / BP / Kidney / B-12 / Folic Acid / Tongue / UDF (matches physical card)|

|Dietary Restrictions Active|Multi-checkbox|Restriction / No Khatta / No Non-Veg / No Alcohol (matches physical card)                |

**POST-TREATMENT Section:**

|Field                      |Type                    |Notes                                             |

|---------------------------|------------------------|--------------------------------------------------|

|Techniques Applied         |Multi-select + free text|e.g., Spinal Manipulation, Acupressure, Yoga      |

|Patient Response           |Select                  |VERY GOOD / GOOD / NEUTRAL / POOR                 |

|Post-Session Pain Level    |Slider 0–10             |Compare against pre                               |

|Clinician Post-Assessment  |Textarea                |Outcome observations                              |

|Next Session Recommendation|Textarea                |What to do next time                              |

|Follow-up Date             |Date picker             |Suggested next appointment                        |

|Mark as Regular Patient    |Toggle                  |If ON → links this patient to Regular Visit module|

\-----

\### D.2.2 — Session History View (per patient)

\- Timeline view: each session is a card showing date, session number, treating clinician

\- Expand card to see full PRE / POST data

\- Color coding: GOOD response = green border / POOR = red border / NEUTRAL = grey

\- Filter by: Date range / Clinician / Response level

\-----

\### D.2.3 — Functions

|Function                  |Trigger                 |Description                                                      |

|--------------------------|------------------------|-----------------------------------------------------------------|

`fetchPatientSessions`    |onLoad                  |Loads all sessions for current patient                           |

`validate_session_form`   |onChange                |Validates required fields in real-time                           |

`saveSessionAction`       |\[Save Session\] click    |Saves full PRE+POST record                                       |

`editSessionAction`       |\[Edit\] on history card  |Opens session form pre-filled (within 24hr window only)          |

`deleteSessionAction`     |\[Delete\] on history card|ADMIN only; requires confirmation + reason entry                 |

`calculateProgressMetrics`|onLoad (history view)   |Computes average pain delta PRE vs POST across all sessions      |

`exportSessionPDFAction`  |\[Export\] button         |Generates printable session summary matching physical card layout|

**saveSessionAction logic:**

\- Step 1: Validate all required fields (date, visit type, at least one PRE field, at least one POST field)

\- Step 2: Auto-increment session number for this patient

\- Step 3: If “Mark as Regular” is toggled ON: create/update Regular Visit record (Module E)

\- Step 4: If follow-up date set: create scheduler entry automatically

\- Step 5: Save to patient record

\- Step 6: Update Revenue record if payment amount entered

\- Success toast: “Session #N saved for \[Patient Name\] ✅”

\-----

\-----

\## MODULE E — REGULAR VISIT TRACKER

\### E.1 Purpose

Some patients come on a fixed recurring schedule for ongoing treatment (e.g., every Monday and Thursday for spinal therapy). This module provides a dedicated calendar-style tracker where all dates and treatments for such patients are logged in one place, making it easy to see the full pattern at a glance.

\-----

\### E.2 Screen: Patient → Regular Visits

**Screen Path:** `/screens/patient/regular_visits.html`

**Access:** From Patient Profile → \[Regular Visit Plan\] tab

**Also accessible from:** Dashboard → Regular Patients quick panel

\-----

\### E.2.1 — Regular Visit Plan Setup

|Field               |Type          |Notes                                        |

|--------------------|--------------|---------------------------------------------|

|Visit Frequency     |Select        |DAILY / ALTERNATE DAYS / WEEKLY / CUSTOM     |

|Days of Week        |Multi-checkbox|Mon / Tue / Wed / Thu / Fri / Sat / Sun      |

|Treatment Protocol  |Textarea      |Standard treatment plan for this patient     |

|Plan Start Date     |Date picker   |When recurring visits began                  |

|Plan End Date       |Date picker   |Optional; leave blank for open-ended         |

|Target Session Count|Number        |Optional; e.g., “20 sessions total”          |

|Active              |Toggle        |ON = patient appears in regular patient lists|

\-----

\### E.2.2 — Visit Log (Date-wise Notes)

This is the core of Module E. A grid or list of all dates in the plan, with per-date treatment notes.

**View:** Calendar grid (month view) with each planned visit date highlighted.

**Per-date entry panel (opens on clicking a date):**

|Field                |Type                      |Notes                                                         |

|---------------------|--------------------------|--------------------------------------------------------------|

|Visit Date           |Auto (from calendar click)|                                                              |

|Attended             |Toggle                    |YES / NO (mark as absent)                                     |

|Absence Reason       |Text (shows if NO)        |                                                              |

|Treatment Given      |Multi-select + free text  |Quick select from protocol + add custom                       |

|Clinician            |Dropdown                  |                                                              |

|Duration             |Number (minutes)          |                                                              |

|Session Notes (short)|Textarea                  |Quick field — not full PRE/POST form                          |

|Link Full Session    |Button                    |\[+ Add Full Session Notes\] → opens Module D form for this date|

|Payment              |Number + mode             |                                                              |

|Patient Condition    |Select                    |IMPROVING / STABLE / WORSENING / NOT ASSESSED                 |

**Color coding on calendar:**

\- ✅ Green = visited + notes saved

\- ❌ Red = absent (marked NO)

\- 🔵 Blue = upcoming planned date

\- ⚪ Grey = date in plan but not yet marked

\-----

\### E.2.3 — Regular Patient Dashboard Panel

On the main Dashboard: a “Regular Patients Today” card.

\- Shows list of regular patients whose plan includes TODAY

\- Each row: Patient Name | Last Visit Date | Sessions Completed / Target | Quick \[Mark Attended\] button

\- Clicking a patient goes to their Regular Visit detail for today

\-----

\### E.2.4 — Functions

|Function                         |Trigger                 |Description                                            |

|---------------------------------|------------------------|-------------------------------------------------------|

`fetchRegularPlan`               |onLoad (patient profile)|Loads visit plan for patient                           |

`saveRegularPlanAction`          |\[Save Plan\] click       |Creates/updates the recurring plan                     |

`fetchVisitCalendar`             |onLoad (calendar view)  |Generates calendar grid with attendance status per date|

`openDateEntryPanel`             |click on calendar date  |Opens side panel for that date’s treatment entry       |

`saveVisitEntryAction`           |\[Save\] in date panel    |Saves single-date visit record                         |

`markAbsentAction`               |\[Mark Absent\]           |Records absence with reason                            |

`fetchRegularPatientsTodayList`  |Dashboard onLoad        |Returns list of regular patients due today             |

`calculateAttendanceRate`        |onLoad (plan view)      |% of planned visits actually attended                  |

`calculateSessionProgress`       |onLoad (plan view)      |Sessions completed vs target                           |

`exportRegularVisitSummaryAction`|\[Export\] button         |PDF/CSV of full visit log with dates and treatments    |

**saveVisitEntryAction:**

\- Step 1: Validate date is part of patient’s active plan (warn if outside plan but still allow)

\- Step 2: Save visit record linked to patient + plan

\- Step 3: Update session count on plan record

\- Step 4: If payment entered: create payment record

\- Step 5: If \[Link Full Session\] was used: associate Module D session ID with this visit record

\- Success: date cell on calendar turns green immediately (optimistic UI update)

\-----

\-----

\## CROSS-MODULE DATA RELATIONSHIPS

\`\`\`

PATIENT RECORD

│

├── SESSIONS (Module D) — one per visit, full PRE/POST

│     └── linked to PAYMENT RECORD

│     └── linked to SCHEDULER ENTRY (follow-up)

│

├── REGULAR VISIT PLAN (Module E) — one plan per patient

│     └── VISIT ENTRIES — one per calendar date

│           └── optional link to → SESSION (Module D)

│           └── linked to PAYMENT RECORD

│

└── USER ACCOUNT (Module B/C)

      └── has ROLE → PERMISSION MATRIX (Module C)

      └── may be TREATING CLINICIAN on sessions

ADMIN CONFIG

├── TELEGRAM BOT CONFIG (Module A)

│     ├── ENCRYPTED TOKEN

│     ├── CHAT ID

│     └── BOT COMMANDS LIST

└── PERMISSION MATRIX (Module C)

\`\`\`

\-----

\## GLOBAL STATE RULES FOR NEW MODULES

|Rule                      |Detail                                                                              |

|--------------------------|------------------------------------------------------------------------------------|

|Session form auto-save    |Draft saved to sessionStorage every 30 seconds                                      |

|Permission check on load  |Every screen calls `checkPermission()` before rendering                             |

|Token never in URL        |Telegram token never passed as query param or logged to console                     |

|Regular visit offline mode|Visit entries can be logged offline; sync on reconnect                              |

|Unsaved session warning   |Navigating away from open session form triggers “Unsaved changes — stay or discard?”|

\-----

\## VALIDATION CHECKLIST (ADDENDUM)

\- ✔ Module A: Token encrypted at rest; revoke wipes store completely

\- ✔ Module B: Password change forces re-login; temp passwords shown once only

\- ✔ Module C: No role can have 0 accessible screens (lockout prevention)

\- ✔ Module D: Both PRE and POST sections required before session can be saved

\- ✔ Module E: Visit entries outside plan date range show a warning (not blocked)

\- ✔ All new functions have error handling, loading state, and success feedback

\- ✔ All new UI elements have `data-function` attributes

\-----

**END OF FEATURE ADDENDUM ADD-1.00**

*Base PRD: SNC MVP-1.00 | Extends: Sections 4, 5, 8, 9, 12*