# Skill For Hire

**Tagline:** Your skills. Your portfolio. Your opportunities.

A student freelancing marketplace built with Next.js (JavaScript/JSX), React, Tailwind CSS, Express, MongoDB/Mongoose, JWT and bcrypt. The application has three connected modules and one shared frontend.

## Modules
- **Module 1 — Student Skill & Portfolio:** single-role registration/login, student profile, skills, portfolio projects and availability; public talent discovery.
- **Module 2 — Gig & Matching:** clients publish/manage gigs; students browse/search/filter and apply; skill-match score; clients accept/reject applications. Accepting an application creates a work record for Module 3.
- **Module 3 — Work & Delivery:** milestones, deadlines and amounts; student file/link submissions; client review/approval/revision; authenticated deliverable downloads; cancellation before work is submitted; completion and rating.

## Account rules
Every account has exactly one role (`student` or `client`). There is no role switch. Student profile endpoints require a student account; gig posting/review requires a client; applications require a student; work actions enforce role and record ownership on the backend.

## Requirements
- Node.js 20+ (Node 24 was used for syntax checks)
- MongoDB running locally or a MongoDB Atlas connection string

## Environment setup
Create `.env` from each backend's `.env.example`:
- `backend/.env` — port 5000
- `module2/backend/.env` — port 5001
- `module3/backend/.env` — port 5002

Use the **same** `MONGODB_URI`, `JWT_SECRET` (at least 32 characters) and `CLIENT_ORIGIN=http://localhost:3000` in all three files. Keep `.env` files private and never commit them. Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy `frontend/.env.local.example` to `frontend/.env.local`. Default API URLs are localhost ports 5000, 5001 and 5002.

## Install and run
Run `npm install` separately in `backend`, `module2/backend`, `module3/backend`, and `frontend` (each folder has its own package.json). Start each service in its own terminal:

```bash
# terminal 1
cd backend && npm run dev
# terminal 2
cd module2/backend && npm run dev
# terminal 3
cd module3/backend && npm run dev
# terminal 4
cd frontend && npm run dev
```

Open http://localhost:3000. Health checks: `http://localhost:5000/api/health`, `http://localhost:5001/api/health`, `http://localhost:5002/api/health`.

## Suggested end-to-end demonstration
1. Register a Student account and complete its profile/skills.
2. In a separate browser profile, register a Client account and create a gig.
3. Apply to that gig as the student.
4. Accept the application as the client; a work record should appear in Work & Delivery.
5. Add milestones as the client; submit a file or link as the student.
6. Approve or request a revision as the client; resubmit if needed.
7. Approve all milestones, complete the project and submit a rating.

## Scope and limitations
Milestone amounts are planning/recordkeeping values. This project does not process payments, escrow, refunds or tax documents. Uploaded files are limited to PDF, DOC, DOCX, ZIP, PNG, JPG and TXT up to 10 MB; downloads require a signed-in account that owns the work. File storage is local to the backend and should be replaced with object storage for production deployment.

## Navigation and theme update

The authenticated workspace now uses one shared role-aware navigation bar:
- Student: Browse Gigs, My Profile, My Applications, My Work.
- Client: My Gigs, My Profile, Received Applications, My Work.

The client `Received Applications` link opens the applicant inbox on the client workspace. The theme toggle and dark-theme switching have been removed; the interface uses the light theme only.
