# AI-Powered Intern Task Review and Feedback Automation System

> **Interview MVP Demonstration**: A full-stack, enterprise-grade intern task allocation, mentor explanation, AI-assisted review comparison, personalized feedback loop, and internship end-date governance platform.

---

## 1. Executive Summary & Objective

In companies managing 100+ interns, engineering supervisors face bottlenecked review cycles, inconsistent feedback quality, and lost tracking when interns approach the end of their internship without completing assigned tasks.

This platform automates:
1. **Intern Cohort Management**: Manages 100+ interns with unique email validation, duration tracking, and CSV batch import.
2. **Company Task Allocation**: Allocates technical assignments with exact requirements, expected outputs, and scheduled Google Meet reviews.
3. **Mentor AI Task Breakdown**: Translates rigid task specifications into approachable, step-by-step mentor guidance for the intern.
4. **AI-Assisted Side-by-Side Review Studio**: Evaluates intern submissions against original company requirements with evidence citation, identifying `Met`, `Partially Met`, `Missing`, and `Unable to Verify` criteria.
5. **Human-in-the-Loop Decision & Retry Automation**: Enables supervisors to approve completed assignments or request revisions with automated retry scheduling and personalized feedback emails.
6. **Internship End-Date Safeguards**: Automatically halts automated review retries when an intern's end date is reached without task completion and dispatches an alert to the supervisor.
7. **Safe Demo Outbox & Integrations**: Operates 100% out-of-the-box in safe mock mode without sending real emails or exposing private API keys, with full support for live OpenAI, Gmail/SMTP, Google Sheets, and Google Meet.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite 6, Lucide Icons.
- **Styling**: Responsive corporate design system (CSS variables, flex/grid layouts, split-screen review studio, modal dialogs, status badges).
- **Backend**: Node.js v22 with Express.
- **Database**: Embedded SQLite via native Node 22 `node:sqlite` (`DatabaseSync`), requiring zero external native compilation or C++ build tools on Windows.
- **AI Service**: Configurable dual-mode service (Live OpenAI API with `gpt-4o-mini` or Intelligent Grounded Mock AI).
- **Email Service**: Dual-mode email dispatcher (Live SMTP/Gmail via Nodemailer or Safe Mock Email Outbox with duplicate prevention and HTML previews).
- **Spreadsheet**: Google Sheets integration adapter and live CSV export formatted for Google Drive.
- **Meeting**: Dynamic Google Meet URL generator and scheduler.

---

## 3. Repeated Review Workflow State Machine

The review automation lifecycle follows this deterministic finite state machine:

```
[ALLOCATED] ──► [TASK_EXPLANATION_READY] ──► [REVIEW_SCHEDULED]
                                                     │
                                                     ▼
                                            [SUBMISSION_PENDING]
                                                     │
                                                     ▼
                                           [AI_ANALYSIS_COMPLETE]
                                                     │
                                                     ▼
                                           [HUMAN_REVIEW_PENDING]
                                                     │
                         ┌───────────────────────────┴───────────────────────────┐
                         ▼                                                       ▼
                 [HUMAN APPROVES]                                        [REVISION REQUESTED]
                         │                                                       │
                         ▼                                                       ▼
                  [COMPLETED]                                      Check Internship End Date
             (Completion Email Sent)                                             │
                                                     ┌───────────────────────────┴───────────────────────────┐
                                                     ▼                                                       ▼
                                           End Date Exceeded                                    Valid Date Before End
                                                     │                                                       │
                                                     ▼                                                       ▼
                                       [INCOMPLETE_AT_END_DATE]                                     Increment Attempt
                                    (Retry Stopped, Supervisor Alert)                                [REVIEW_SCHEDULED]
                                                                                                  (Feedback Email Sent)
```

---

## 4. Quick Startup Instructions

### Prerequisites
- Node.js v20+ or v22+
- npm v10+

### Step 1: Install Dependencies
```bash
# In project root:
cd server; npm install
cd ../client; npm install
```

### Step 2: Build Frontend & Start Server
```bash
# Build production client bundle:
cd client; npm run build

# Start the unified full-stack application from root:
cd ..; node start-all.js
```
Open **`http://localhost:5000`** in your browser. The Express server serves both the REST API and the React frontend seamlessly.

*(Optional for frontend hot-reloading: run `cd client; npm run dev` in a separate terminal and open `http://localhost:3000`)*.

---

## 5. 2-Minute Interview Demo Script

Follow this script to demonstrate all requirements within 120 seconds during an interview:

### Minute 0:00 - 0:30: Overview & Scalability (Dashboard & Interns)
1. **Open Dashboard (`http://localhost:5000`)**:
   - Point out the real-time KPI cards: *Total Interns, Tasks Allocated, Reviews Scheduled, Awaiting Approval, Completed Tasks*.
   - Point out the **Safe Demo Mode** badge: ensures no real emails are sent and no paid API keys are required.
2. **Scalability Demonstration**:
   - Click the **"Seed 100 Interns"** button in the top navigation.
   - Switch to **"Intern Management"** to show 100+ interns loaded instantly with unique email validation, search filtering, and CSV import modal.

### Minute 0:30 - 1:15: Side-by-Side AI Review & Revision Retry (Scenario A)
1. Navigate to **"Review Management"** (or click **"Open Alex's Review Studio"** from Dashboard).
2. Open **Review Attempt #1 for Alex Chen** (Task: *Build an Employee Directory Web Page*):
   - **Left Panel**: Original company requirements (6 numbered criteria, expected output, tech stack).
   - **Right Panel**: Intern submission excerpt and notes (intern implemented name search and cards, but acknowledges missing mobile layout and department filter).
3. Click **"⚡ Run AI Review Comparison"**:
   - Show how the AI evaluates every single requirement against the submitted code without inventing criteria.
   - Highlights: Requirement #2 (Search) is `Met`; Requirement #3 (Department Filter) is marked `Missing` with evidence cited; Requirement #4 (Responsive) is marked `Missing` (hardcoded 800px width).
   - Confirmed Strengths, Important Errors, and AI Recommendation (`Revision required`) are populated.
4. **Human Reviewer Decision**:
   - Select **"Request Revisions (Schedule Next Review)"**.
   - Note the next review date and time inputs.
   - Click **"Submit Revisions & Dispatch Email"**.
   - Observe: Attempt #1 updates to `REVISION_REQUESTED`, **Attempt #2** is automatically scheduled, and the personalized feedback email is generated.

### Minute 1:15 - 1:45: Human Approval & Completion (Scenario B)
1. Navigate back to Reviews and open **Review #2 for Maya Patel** (Task: *Task Tracker REST API*):
   - Maya submitted code satisfying all 5 REST endpoints with curl test evidence.
   - Click **"Run AI Review Comparison"**: AI marks all requirements `Met` and recommends `Ready for human approval`.
2. As the supervisor, select **"Approve Task (Mark Completed)"** and click confirm.
   - The assignment status transitions to `COMPLETED`.
   - The completion milestone email is dispatched to the intern.

### Minute 1:45 - 2:00: Email Outbox, End-Date Governance & Google Sheets
1. Switch to **"Email Outbox"**:
   - View the audited log of generated emails (`TASK_ALLOCATED`, `FEEDBACK_REVISION`, `TASK_COMPLETED`).
   - Click **"Preview"** on the revision email to show the professional HTML layout with completed items, missing items, and next meeting details.
   - Point out the `event_fingerprint` deduplication mechanism.
2. Switch to **"Sheets & Reports"**:
   - Show the structured export dataset with all intern review attempts.
   - Click **"Download Google Sheets CSV"** or test the live synchronization adapter.

---

## 6. Real vs. Mocked Integrations

| Integration | Active Demo State | Production Mode (`.env`) | Notes |
| :--- | :--- | :--- | :--- |
| **AI Task Explanation** | Grounded Deterministic Mentor Generator | Live OpenAI API (`gpt-4o-mini`) | Generates supportive, human-like mentor explanations. |
| **AI Review Comparison** | Structured Evidence Evaluator | Live OpenAI API (`json_object` mode) | Strictly compares submissions against company requirements without hallucination. |
| **Email Transmissions** | Safe Mock Outbox & HTML Previewer | Live SMTP / Gmail API via Nodemailer | In demo mode, all emails are safely persisted in SQLite and viewable in the UI. |
| **Google Meet URLs** | Real Google Meet URL Generator | Real Google Meet Format | Generates valid `meet.google.com/xxx-xxxx-xxx` URLs saved against review appointments. |
| **Google Sheets** | Export Adapter & CSV Generator | Live Google Sheets API v4 | Instant one-click CSV download or programmatic sync. |

---

## 7. External Credentials Reference

To transition from Demo Mode to external production services, configure `server/.env`:

```env
# 1. OpenAI API (Required only for live AI calls)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# 2. Gmail / SMTP (Required only for real email delivery)
EMAIL_MODE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_company_account@gmail.com
SMTP_PASS=your_google_app_password

# 3. Google Sheets (Required only for automated cloud sync)
GOOGLE_SHEETS_SPREADSHEET_ID=1A2B3C4D5E...
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-sync@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## 8. Database Schema Overview

The SQLite database (`server/data/intern_automation.db`) includes:
- **`interns`**: `id`, `full_name`, `email` (UNIQUE), `current_task_id`, `start_date`, `end_date`, `status` (`ACTIVE`, `COMPLETED`, `INCOMPLETE_AT_END_DATE`).
- **`tasks`**: `id`, `title`, `description`, `requirements` (JSON array), `expected_output`, `tech_stack`, `reference_url`, `review_duration_mins`.
- **`allocations`**: `id`, `intern_email`, `task_id`, `allocation_date`, `review_date`, `review_time`, `meet_link`, `internship_end_date`, `status`.
- **`reviews`**: `id`, `allocation_id`, `intern_email`, `task_id`, `attempt_number`, `review_date`, `review_time`, `meet_link`, `submission_content`, `status`, `ai_analysis_json`, `human_decision`, `human_feedback`, `next_review_date`, `next_review_time`.
- **`task_explanations`**: `id`, `task_id`, `intern_email`, `mentor_content`, `created_at`.
- **`email_logs`**: `id`, `recipient_email`, `recipient_name`, `event_type`, `event_fingerprint` (UNIQUE deduplication key), `subject`, `body_html`, `body_text`, `status`, `sent_at`.

---

## 9. Safeguards & Compliance

1. **No Evidence, No Pass**: Requirements are never marked as completed without concrete evidence in the submission. If evidence is ambiguous, the AI returns `Unable to Verify`.
2. **Human Authority**: AI outputs recommendations (`Ready for human approval` or `Revision required`); only an authorized human supervisor can finalize completion or schedule retries.
3. **End-Date Rule**: Automated retries immediately cease when an intern's end date has passed. The system flags `INCOMPLETE_AT_END_DATE` and notifies the supervisor instead of sending endless reminders.
4. **Email Deduplication**: Every email event generates a deterministic fingerprint (`EVENT_ID_RECIPIENT`) preventing accidental duplicate emails.
5. **No Key Exposure**: API secrets are strictly isolated to `server/.env` and never leaked to frontend code.
