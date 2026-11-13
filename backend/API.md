# Module 1 REST API
Base URL: `http://localhost:5000/api`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check API status |
| GET | `/profiles` | List profiles; optional `?skill=React` filter |
| GET | `/profiles/:studentId` | Get or initialize a student's profile |
| PUT | `/profiles/:studentId` | Create/update profile, skills, portfolio, and availability |

Example update body:
```json
{
  "fullName": "Alex Kumar",
  "headline": "Frontend Developer",
  "bio": "I build responsive web apps.",
  "department": "B.Tech Computer Science",
  "studyYear": "3rd year",
  "contactEmail": "alex@example.com",
  "skills": [{ "name": "React", "level": "Intermediate" }],
  "portfolio": [{ "title": "Campus App", "description": "A campus utility app", "technologies": ["Next.js", "MongoDB"], "projectUrl": "https://github.com/example/app" }],
  "availability": "Available",
  "weeklyHours": 10
}
```

The `studentId` route parameter is a development placeholder until authentication is integrated. Do not expose arbitrary profile updates publicly in production.


## Account roles
- Registration accepts `role: student|client` (defaults to student for older clients).
- `GET /api/auth/me` returns roles and activeRole.
- `POST /api/account/roles/enable` enables a role; body `{\"role\":\"client\"}`.
- `POST /api/account/roles/switch` switches active role; body `{\"role\":\"student\"}`.
