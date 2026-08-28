# Foundrix Client Hub

Claude Prompt — Dev's CRM (Foundrix / The Grand Standard)

Copy everything below into Claude (Claude Code, or a chat with Code Execution/Artifacts enabled) as your starting prompt.

Build me a CRM web app for my consulting and mentorship business. Here's the context:

About the business: I run Foundrix, an AI & SaaS business consulting agency, and The Grand Standard, a ₹25K/3-month 1:1 mentorship program with a results guarantee. I work with service-based agencies, AI/SaaS startups, freelancers, and ecommerce businesses — helping them get clients and leads. I also run content/lead-gen efforts across Instagram, LinkedIn, X, and Substack (newsletter: Dev's Ledger), and partner with other communities (e.g. Discord servers) to promote the mentorship.

Core CRM requirements:

Contacts / Leads table

Fields: Name, Business name, Business type (Agency / AI-SaaS / Freelancer / Ecommerce / Content Creator), Email, Phone, Instagram/LinkedIn handle, Source (Instagram DM, LinkedIn, Discord partnership, referral, cold outreach, Substack, other), Status (New Lead → Contacted → Call Booked → Proposal Sent → Negotiating → Won/Client → Lost), Notes, Date added, Last contacted date.

Filter/sort by status, source, and business type.

Kanban-style pipeline view (drag cards between stages) AND a table view — toggle between them.

Client tracking (for Won leads)

Once a lead becomes a client, track: Program (The Grand Standard mentorship / consulting retainer / other), Start date, 3-month program end date (auto-calculated), Payment status (Paid / Partial / Pending), Amount (₹), Results/progress notes (freeform log with dates), Guarantee status flag.

A simple dashboard widget showing active clients and days remaining in their program.

Follow-up / task reminders

Each lead/client can have follow-up tasks with a due date.

A "Today's follow-ups" and "Overdue" view on the dashboard.

Dashboard / analytics page

Total leads by status (funnel chart)

Leads by source (which channel is producing the most leads — Instagram, LinkedIn, Discord, etc.)

Conversion rate (leads → clients)

Monthly revenue tracker (sum of amounts from Won clients)

Active clients count and program completion timeline

Content/outreach log (optional secondary tab)

Track content posted (platform, date, topic, link) and partnership outreach (e.g. Discord server partnerships), separate from the main pipeline, with the ability to link a lead to the content/source that brought them in.

App name: Dev's CRM (use this as the app title/branding — sidebar header, browser tab title, login screen).

Access:

Instead of full Google OAuth login as the access gate, protect the app with a simple 4-digit PIN screen (PIN: 0710) that unlocks the dashboard. Google OAuth is still used in the background for the Drive read/write connection, but the PIN is the everyday unlock screen I interact with.

Store the PIN check client-side (this is a single-user personal tool, not handling sensitive financial/PII-grade security) — a simple lock screen that gates the UI until the correct PIN is entered.

Design requirements:

Clean, high-end, minimal, text-based design — no cartoonish graphics or stock illustrations. Premium SaaS dashboard feel: lots of whitespace, strong typography hierarchy, subtle borders/shadows instead of heavy color blocks.

Dark mode as default, with a light mode toggle.

Sidebar navigation: Dashboard, Pipeline (Leads), Clients, Content/Outreach Log, Settings.

Fast, keyboard-friendly forms for adding a new lead (should take under 15 seconds).

PIN lock screen should match the same clean, text-based aesthetic — centered numeric input, no clutter.

Data:

Store data in Google Drive using the Google Drive API with OAuth login, so only I can access it — either a structured JSON file or a Google Sheet per table (leads, clients, tasks, content_log) that the app reads from and writes to.

Sync should feel instant in the UI (optimistic updates), with saves happening to Drive in the background.

Build approach:

Build this as a single-page React app (Vite or Next.js — your call).

Start by scaffolding the folder structure, the Google OAuth + Drive read/write layer, and the data schema for the four tables.

Then build the Dashboard and Pipeline pages first, followed by Clients, Content Log, and Settings.

Ask me before making assumptions about Google Cloud project setup / OAuth client credentials — I'll need to create those in Google Cloud Console and give you the client ID.


pin to access the site is 0710

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8eb8cb01-76c7-417b-823e-54ed73397128).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
