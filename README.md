# MICSAPP — Integrated School Management System (Prototype)

Interactive, presentation-ready prototype of **MICSAPP**, the One-Stop-Shop Integrated School Management System proposed for **Morgan International Community School (MICS), Gomoa Manso, Ghana**. Prepared by Inter Smart.

> **Prototype notice.** All students, staff, parents, financial figures and records are **fictional**, generated for demonstration only. There is no backend, no live integration (QuickBooks, AI, SMS, email) and no real authentication. Changes are stored only in the viewer's browser (`localStorage`).

---

## 1. Running locally

The prototype is a fully static site — **HTML5, CSS3 and vanilla JavaScript** only. There is no build step, framework or package install.

**Option A — open directly**
Double-click `index.html`. It works from `file://` in Chrome, Edge, Safari and Firefox.

**Option B — local web server (recommended for presenting)**
```bash
cd MICSAPP
python3 -m http.server 8000
# open http://localhost:8000
```

## 2. Demo accounts

Password for every account: **`demo123`**. The login page also has one-click demo account cards.

| Role | Email | Lands on |
|---|---|---|
| Head of School / Management | `head@mics.edu.gh` | Management Command Centre |
| School Administrator | `admin@mics.edu.gh` | Administration Overview |
| Teacher (Mathematics) | `teacher@mics.edu.gh` | Teacher Workspace |
| Parent (two children) | `parent@mics.edu.gh` | Parent Portal |

Use **Profile menu → Switch demo role** to move between roles without signing out, and **Profile menu → Reset demo data** to restore the original sample data before a presentation.

## 3. Deploying to GitHub Pages

1. Create a GitHub repository (for example `micsapp-prototype`) and push the contents of this folder to the default branch:
   ```bash
   git init
   git add .
   git commit -m "MICSAPP prototype"
   git branch -M main
   git remote add origin https://github.com/<org>/micsapp-prototype.git
   git push -u origin main
   ```
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and the `/ (root)` folder, then **Save**.
4. After a minute the site is live at `https://<org>.github.io/micsapp-prototype/`.

GitHub Pages compatibility:
- All asset paths are **relative**, so the site works in a repository subdirectory.
- Navigation uses **hash routes** (`#/dashboard`, `#/students/STU-0012`), so no server-side routing or 404 redirects are needed.
- `.nojekyll` is included so GitHub serves every file as-is.
- The only external request is the Inter web font from Google Fonts; the app falls back to system fonts if it is unavailable.

## 4. Using the official MICS logo

The official MICS crest (`assets/images/cropped-logo_main.png`) is used in the sidebar, on the login page and as the favicon. The primary colour is the crest green **#005838**. The login panel uses `assets/images/ibclass2025.jpg` (Class of 2025) under a green overlay. If the crest file is missing, a typographic **MICS** wordmark is shown instead.

To swap the crest, replace the file or change `logo` in `js/config.js`.

Brand colours are defined as CSS variables in `css/variables.css`: crest green `#005838` (primary) and gold `#E5AC00` (accent). The `--brand-navy*` token names were kept so no component CSS had to change; they now hold the green scale.

## 5. Recommended 7-minute client demonstration

The same walkthrough is available in the app under **Profile menu → Demo walkthrough**. Reset demo data first.

| # | Time | Step | What to show |
|---|---|---|---|
| 1 | 0:00 | **Sign in as Head of School** | The login page and demo accounts. Click *Head of School*. |
| 2 | 0:30 | **Management Command Centre** | "Needs attention today", the six KPIs, the performance trend by programme (toggle Attainment/Attendance), the curriculum mix, fee collection and receivables, budget vs actual, Strategic Plan progress, departmental KPIs and the live activity feed. |
| 3 | 2:00 | **Academic performance & student records** | Click *students needing academic attention*, then open a flagged student. Walk through the profile tabs: attendance calendar, results by term, guardians and fees with QuickBooks status. |
| 4 | 3:00 | **Admission approval** | Executive actions → Admissions → *Review* → **Approve**. The pending counts drop immediately. In Admissions, open the approved applicant → **Enrol student**. A student record, guardian account and invoice are created. |
| 5 | 4:00 | **School operations** | Operations overview, then Facilities. Open *MR-0418*, assign the plumber, set *In progress*, then **Mark completed** with resolution notes. The open counts and timeline update. |
| 6 | 5:00 | **AI Intelligence Centre** | Ask *"What is the current fee collection position?"*. Point out the executive summary, metrics, sources, suggested actions and advisory disclaimer. All responses are simulated. |
| 7 | 5:45 | **Parent Portal** | Profile → Switch role → Parent. Toggle between Ama and Yaw. Submit a payment proof, then switch back to Head of School → Finance → Payment verification → **Verify**. Note "QuickBooks: pending sync". |
| 8 | 6:30 | **Governance & unified architecture** | Governance → Action items → update ACT-029. Show the Strategic Plan page and Reports. Close on the point that every module writes to one shared institutional record. |

## 6. What is functional vs demonstration-only

**Working demonstration workflows (persisted locally):**
- Simulated login and logout, the role switcher, role-based navigation and access restrictions
- Admissions: new application (validated), status changes, assessment recording, approve/reject and **enrol**, which creates a student, guardian and invoice
- Unified approvals inbox: approve, reject (reason required) and mark reviewed, synced to admissions and HR leave
- Maintenance: log a request, assign, change status and priority, complete with resolution notes
- Teacher attendance register, which updates student attendance, the parent view and the dashboards
- Parent portal: child switching, payment-proof submission (validated) and appointment requests
- Finance: payment verification (verify/reject) with a separate QuickBooks status, and a simulated QuickBooks refresh
- Governance action-item updates; exeat approvals; visitor check-out; kitchen requisitions; library renewals; policy acknowledgement; permission-matrix edits; announcements; appointment confirmation
- Global search (⌘K / Ctrl K), notifications with read/unread states and deep links, CSV exports, printable reports
- Reset demo data

**Clearly marked as planned capabilities** (they open a "Planned capability" dialog): offer letters, messaging, the payroll approval run, board packs, evidence upload, SSO/MFA provisioning, and similar features.

**Simulated, not live:** QuickBooks (read-only integration simulated), AI responses (pre-written templates populated from demo data), and SMS/email notifications.

**Privacy by design:** the Infirmary shows aggregate statistics only. Individual medical records are presented as restricted.

## 7. Project structure

```
index.html              App shell, inline SVG icon sprite, script/style includes
.nojekyll               GitHub Pages: serve files as-is
css/
  variables.css         Design tokens (brand, neutrals, status, validated chart palette, spacing, type)
  base.css              Reset, typography, utilities
  layout.css            Sidebar, header, grid, responsive behaviour
  components.css        Buttons, cards, KPI, tables, forms, badges, tabs, modal, drawer, toasts, kanban, timeline
  pages.css             Page compositions (login, dashboard, admissions, operations, AI, teacher, parent, …)
js/
  config.js             Brand configuration (logo slot)
  data.js               Central fictional dataset (seeded, deterministic, cross-linked IDs)
  state.js              localStorage store, selectors (derived metrics) and domain actions
  components.js         UI helpers: formatting, table, modal, confirm, drawer, toast, forms, CSV
  charts.js             Dependency-free SVG charts (line, bar, donut, ring, sparkline, bullets)
  auth.js               Simulated authentication & demo users
  router.js             Hash router with role guards
  shell.js              Sidebar navigation, header, global search, notifications, profile menu
  app.js                Bootstrap
  pages/                One file per module/screen
assets/
  icons/favicon.svg
  images/               Place the official logo here (see section 4)
```

### Data model

`js/data.js` generates about 400 students, 400 guardians, 72 staff, 18 classes across GES Basic, GES SHS, Cambridge and IB DP, plus invoices, payments, budgets, admissions, approvals, maintenance, boarding, catering, governance and KPI records. Generation uses a fixed seed, so every load is identical. IDs link across modules (`STU-`, `PAR-`, `EMP-`, `CLS-`, `INV-`, `ADM-`, `APR-`, `MR-`, `ACT-`). For example, **Ama Adjei (STU-0012)** and **Yaw Adjei (STU-0047)** appear consistently in the directory, teacher register, parent portal and finance.

Dashboard figures are **calculated from the records**, not hard-coded, so every workflow action updates the counters across modules.

The demo date is fixed at **Wednesday 11 November 2026** (AY 2026/27, Term 1, Week 10) so the data stays internally consistent whenever it is presented.

## 8. Browser support

Latest Chrome, Edge, Safari and Firefox on desktop. The layout adapts to smaller browser widths: the sidebar collapses to icons below 1280px and becomes an overlay below 768px. This is not a mobile app.
