# WKCARES Console — Phase 1

Vanilla HTML/CSS/JS + Firebase (Realtime Database + Auth), hosted on GitHub Pages.

## What's built (Phase 1)

- **Project architecture** — modular `css/`, `js/firebase/`, `js/utils/`, `js/components/`, `js/pages/`.
- **Firebase layer** — `config.js`, `auth.js` (login, invitation-only activation, password reset,
  forced reset, 30-min inactivity timeout, role helpers), `db.js` (staff/areas/bands/nets/invitations
  CRUD), `audit.js` (append-only audit log).
- **Login** (`login.html`) with friendly error handling and a timeout notice.
- **Account Activation** (`activate.html`) — validates a one-time invitation code + email, creates
  the Firebase Auth account, assigns the invited role, and permanently marks the invitation used.
- **Password reset** (`reset-password.html`) — self-service email reset and admin-forced reset flow.
- **Dashboard** (`index.html`) — live clock/date, quick stats, current-net-in-progress card,
  Chart.js attendance trend, recent nets, open emergency-traffic alerts, recent activity feed.
- **Weekly Net Form** (`new-net.html`) — the centerpiece page. Captures every field from the
  original paper form: Net Controller, Callsign, Date, Comments, Staff Check-ins (from the live
  roster), Alternate Bands (dynamic rows), Mountain & Metro Area grids (Green/Yellow/Red/Black
  with live row/column/grand totals), Guest Check-ins (unlimited dynamic rows), and Emergency
  Traffic (dynamic rows, gated by a "No emergency" checkbox). Every total updates live — nothing
  is calculated by hand. Autosaves to Firebase 800ms after any change, with a save-status indicator.
- **Firebase security rules** (`firebase-rules.json`) — role-based read/write, append-only audit log.
- **PWA shell** — `manifest.json` + `sw.js` (network-first with cache fallback for offline shell).

## Setup

1. Create a Firebase project → enable **Authentication (Email/Password)** and **Realtime Database**.
2. Paste your project's config into `js/firebase/config.js` (replace the `REPLACE_ME` values).
3. Publish `firebase-rules.json` as your Realtime Database rules.
4. Seed one admin manually the first time (Firebase Console → Authentication → Add user, then add
   a matching `/users/{uid}` record with `role: "admin"`) — after that, all further accounts go
   through the invitation flow.
5. Push to a GitHub repo and enable GitHub Pages on the root of the `main` branch.

## Not yet built (next phases)

- **Historical Nets** page (browse/search/edit past nets)
- **Reports** (Weekly/Monthly/Yearly, PDF/CSV/Excel export, print view)
- **Statistics** page (Band Usage, Area Participation, Guests, Emergency Traffic, Staff Attendance charts)
- **Admin Panel** — spreadsheet-style user management (Name/Callsign/Email/Role/Status/Last
  Login/Invitation Status), Staff/Areas/Bands/Frequencies management, Roles, Settings, Backups,
  full Audit Log viewer, Invitation management (copy/email/revoke/regenerate)
- **Settings** and **Profile** pages
- Global **search** across nets, staff, users, invitations
- Full offline data sync (Realtime Database's `enablePersistence`), install prompt for the PWA

Tell me which of these to build next and I'll continue in the same architecture.
