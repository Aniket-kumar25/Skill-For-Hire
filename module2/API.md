# Module 2 API — Gig & Matching

Base URL: `http://localhost:5001/api/gigs` (JSON; authenticated requests use the `p25_session` HttpOnly cookie).

- `GET /` — list open, unexpired gigs; query: `q`, `skill`, `category`, `minBudget`, `maxBudget`.
- `GET /:id` — gig detail.
- `POST /` — client creates a gig.
- `GET /client/mine` — client's own gigs.
- `PATCH /:id/status` — client sets `open`, `paused`, or `closed`.
- `POST /:id/applications` — student submits proposal; computes match score against saved profile skills.
- `GET /student/applications/mine` — student's submitted applications.
- `GET /client/applications/inbox` — applications to client's gigs.
- `PATCH /applications/:applicationId` — client accepts/rejects; acceptance creates Module 3 Work record.

Role checks use the user document in Module 1; the active role must match the operation.
