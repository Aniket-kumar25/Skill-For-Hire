# Module 3 — Work & Delivery

Express service on port `5002`, sharing the Module 1 MongoDB database, JWT secret and `User` model. Module 2 creates a Work record when a client accepts a student's application.

## Client workflow
- View work assigned to the client and monitor milestone progress.
- Create milestones with title, description, deadline and amount.
- Edit pending/revision milestones; delete milestones that have not been submitted.
- Review submitted deliverables; approve or request revision with required feedback.
- Cancel work only before a milestone has been submitted or approved.
- Complete work after every milestone is approved, then rate/review the student.

## Student workflow
- View work assigned to the student, deadlines, amounts and status.
- Upload one PDF, DOC, DOCX, ZIP, PNG, JPG or TXT file up to 10 MB, or submit an external HTTP(S) link.
- Add a submission note and submit a milestone.
- Read revision feedback and resubmit while the milestone is in revision state.

## Security
All work routes require the HttpOnly session cookie. Role and work ownership are checked by the backend. Uploaded files are not exposed as a public static directory; the download endpoint checks that the signed-in user is the client or student assigned to the work. Upload names are random UUIDs. File storage is local to this service and should be moved to object storage for production.

## API
- `GET /api/works`
- `POST /api/works/:id/milestones` — client adds a milestone
- `PATCH /api/works/:id/milestones/:milestoneId` — client edits pending/revision milestone
- `DELETE /api/works/:id/milestones/:milestoneId` — client deletes pending milestone
- `POST /api/works/:id/milestones/:milestoneId/upload` — student uploads a file
- `GET /api/works/:id/milestones/:milestoneId/download` — authenticated owner download
- `PATCH /api/works/:id/milestones/:milestoneId/submit` — student submits
- `PATCH /api/works/:id/milestones/:milestoneId/review` — client approves/requests revision
- `PATCH /api/works/:id/cancel` — client cancels eligible work
- `PATCH /api/works/:id/complete` — client completes work
- `PATCH /api/works/:id/rating` — client rates completed work

Milestone amounts are tracking values only. This module does not transfer money or provide escrow.
