# KCSE Management System

A full-stack web application for managing Kenya Certificate of Secondary Education (KCSE) examinations, built for the Kenya National Examinations Council (KNEC). The system handles candidate registration, marks entry, result management, and public result lookup.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Grading System](#grading-system)
- [Security Considerations](#security-considerations)
- [Development Notes](#development-notes)

---

## Overview

The system serves two distinct user groups:

**Public users** — candidates and guardians who need to look up official KCSE results using an index number and full name. No account is required.

**Admin users** — KNEC staff, school administrators, and examiners who register candidates, enter marks, approve results, and monitor system activity through a protected dashboard.

---

## Technology Stack

### Backend

| Component       | Technology                          |
|----------------|--------------------------------------|
| Framework       | Django 4.x + Django REST Framework  |
| Authentication  | Django Simple JWT                   |
| Database        | PostgreSQL (recommended)            |
| Caching         | Django cache framework (1-hour TTL) |
| Rate limiting   | DRF throttling (20 requests/hour for public lookup) |

### Frontend

| Component       | Technology                     |
|----------------|----------------------------------|
| Framework       | React 18                        |
| Routing         | React Router 6                  |
| HTTP client     | Axios                           |
| Charts          | Recharts                        |
| Build tool      | Vite 5                          |
| Fonts           | Playfair Display, DM Sans, DM Mono |

---

## Project Structure

```
kcse-management-system/
│
├── backend/                              # Django application
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── kcse/                            # Main Django app
│       ├── models.py                    # All data models
│       ├── serializers.py               # DRF serializers
│       ├── views.py                     # API views
│       ├── urls.py                      # URL routing
│       └── admin.py                     # Django admin config
│
└── frontend/                            # React application
    ├── package.json
    ├── vite.config.js                   # Vite config with /api proxy
    ├── .env.example
    ├── index.html                       # Entry HTML, loads Google Fonts
    └── src/
        ├── main.jsx                     # React root, imports global CSS
        ├── App.jsx                      # Router tree, layout wrappers
        │
        ├── styles/
        │   ├── general.css              # Design system, tokens, base styles
        │   └── adminpages.css           # Admin layout, sidebar, data tables
        │
        ├── utils/
        │   └── api.js                   # Axios instance, all API calls
        │
        ├── context/
        │   └── AuthContext.jsx          # JWT auth state, login/logout
        │
        ├── hooks/
        │   ├── useAuth.js               # Re-exports from AuthContext
        │   └── useResults.js            # Result lookup state management
        │
        ├── components/
        │   ├── common/
        │   │   ├── Navbar.jsx           # Public navigation bar
        │   │   ├── Footer.jsx           # Public footer
        │   │   ├── Sider.jsx            # Admin sidebar (staff only)
        │   │   ├── LoadingSpinner.jsx   # Reusable spinner
        │   │   └── ErrorBoundary.jsx    # React error boundary
        │   │
        │   ├── results/
        │   │   ├── ResultsLookup.jsx    # Public search form with validation
        │   │   ├── ResultCard.jsx       # Single subject result row
        │   │   ├── GradeDisplay.jsx     # Coloured grade pill + points badge
        │   │   └── ResultSlip.jsx       # Full printable result slip
        │   │
        │   └── admin/
        │       ├── CandidateForm.jsx    # Register/edit candidate form
        │       ├── MarksEntry.jsx       # Paper scores entry + approval
        │       └── Dashboard.jsx        # Stats, analytics chart, audit feed
        │
        └── pages/
            ├── Home.jsx                 # Public landing page
            ├── ResultsPage.jsx          # Public results lookup page
            ├── LoginPage.jsx            # Admin JWT login
            ├── AdminLayout.jsx          # Protected layout with sidebar
            ├── DashboardPage.jsx        # Admin dashboard
            ├── CandidatesPage.jsx       # Filterable candidate list
            ├── RegisterCandidatePage.jsx
            ├── EditCandidatePage.jsx
            ├── MarksEntryPage.jsx
            ├── AuditLogsPage.jsx
            └── NotFound.jsx
```

---

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # fill in values

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

### Frontend Setup

```bash
cd frontend
cp .env.example .env              # set VITE_API_BASE_URL if needed
npm install
npm run dev
```

The React app will be available at `http://localhost:5173/`.

Vite is configured to proxy all `/api/*` requests to `http://localhost:8000`, so no CORS configuration is needed during development.

### Production Build

```bash
cd frontend
npm run build                     # outputs to dist/
```

Serve the `dist/` directory with Nginx or any static file server. Configure your web server to proxy `/api/*` to Django and serve `index.html` for all other routes (SPA fallback).

---

## Environment Variables

### Backend (`backend/.env`)

```
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,localhost
DATABASE_URL=postgresql://user:password@localhost:5432/kcse_db
```

### Frontend (`frontend/.env`)

```
VITE_API_BASE_URL=http://localhost:8000/api
```

In production, if the frontend and backend are served from the same domain, this can be left as `/api`.

---

## API Reference

### Public Endpoints

No authentication required.

#### POST /api/results/lookup/

Look up a candidate's results by index number and full name.

Request body:
```json
{
  "index_number": "12345678901001",
  "full_name": "JANE WANJIRU KAMAU",
  "examination_year": 2023
}
```

The `examination_year` field is optional. If omitted, the most recently released year is used.

Name matching is fuzzy — at least two tokens from the provided name must match the registered name. This accommodates common name ordering variations.

Response (success):
```json
{
  "success": true,
  "result": {
    "index_number": "12345678901001",
    "full_name": "JANE WANJIRU KAMAU",
    "gender_display": "Female",
    "school_name": "Alliance Girls High School",
    "school_center_code": "10000000001",
    "county": "Kiambu",
    "sub_county": "Limuru",
    "examination_year_value": 2023,
    "subject_results": [ ... ],
    "overall_result": { ... }
  }
}
```

This endpoint is rate-limited to 20 requests per hour per IP address.

#### GET /api/reference/years/

Returns all examination years with released results. Response is cached for one hour.

#### GET /api/reference/grading-scale/

Returns the full KCSE grading scale. Response is cached for one hour.

---

### Admin Endpoints

All endpoints below require a valid JWT access token in the `Authorization: Bearer <token>` header.

#### Authentication

```
POST /api/token/           # obtain access + refresh tokens
POST /api/token/refresh/   # exchange refresh token for new access token
```

#### Candidate Management

```
GET    /api/admin/candidates/                    # list with ?name=&school=&year= filters
POST   /api/admin/candidates/register/           # register new candidate
GET    /api/admin/candidates/<index_number>/     # retrieve candidate
PATCH  /api/admin/candidates/<index_number>/     # update candidate
```

#### Marks

```
POST /api/admin/marks/enter/              # enter paper scores
POST /api/admin/marks/<uuid>/approve/     # approve (lock) a SubjectResult
```

#### Analytics

```
GET /api/admin/analytics/school/<center_code>/?year=2023
```

Returns total candidates, mean points, mean score, and grade distribution for a school.

#### Audit Logs

```
GET /api/admin/audit-logs/?action=RESULT_VIEW&index_number=12345678901001
```

Returns up to 500 most recent matching entries.

---

## Frontend Architecture

### Routing

Routes are split into two trees:

- **Public tree** — wrapped with `Navbar` and `Footer`, no authentication check
- **Admin tree** — wrapped with `AdminLayout` which redirects unauthenticated users to `/admin/login`

```
/                          Home
/results                   ResultsPage
/admin/login               LoginPage
/admin/dashboard           DashboardPage        (protected)
/admin/candidates          CandidatesPage       (protected)
/admin/candidates/register RegisterCandidatePage (protected)
/admin/candidates/:id      EditCandidatePage    (protected)
/admin/marks/enter         MarksEntryPage       (protected)
/admin/audit-logs          AuditLogsPage        (protected)
*                          NotFound
```

### State Management

There is no global state library. State is managed through:

- `AuthContext` — authentication state, available application-wide via `useAuth()`
- `useResults` — result lookup state (result, loading, error, available years)
- Local `useState` — form state within individual components

### API Layer

All HTTP calls go through `src/utils/api.js`, which exports a configured Axios instance plus named functions for every endpoint. The instance automatically:

- Attaches the JWT access token from `localStorage` to every request
- Redirects to `/admin/login` on any 401 response

### Design System

All design tokens are CSS custom properties defined in `general.css`. Components reference these variables directly — no CSS-in-JS library is used.

Key tokens:

```css
--clr-primary: #0a4a2f          /* deep government green */
--clr-accent:  #c8a84b          /* gold accent */
--clr-bg:      #f7f5f0          /* warm ivory background */
--font-display: 'Playfair Display', Georgia, serif
--font-body:    'DM Sans', system-ui, sans-serif
--font-mono:    'DM Mono', 'Courier New', monospace
```

---

## Backend Architecture

### Models

| Model              | Purpose                                           |
|-------------------|---------------------------------------------------|
| `County`           | Kenyan county reference data                     |
| `SubCounty`        | Sub-county reference, FK to County               |
| `Subject`          | Examination subject catalogue                    |
| `GradingScale`     | Grade letters, points, and score ranges          |
| `School`           | Examination centre with 11-digit centre code     |
| `ExaminationYear`  | Academic year with lifecycle status              |
| `Candidate`        | Student registration record                      |
| `CandidateSubject` | Through model linking candidates to subjects     |
| `SubjectResult`    | Individual paper scores and computed grade       |
| `OverallResult`    | Aggregated result — best 7 subjects              |
| `AuditLog`         | Immutable log of all significant system actions  |
| `ResultQuery`      | Record of every public result lookup             |

### Views

| View                       | Type            | Permission     |
|---------------------------|-----------------|----------------|
| `ResultLookupView`         | APIView         | AllowAny       |
| `active_examination_years` | function view   | AllowAny       |
| `grading_scale`            | function view   | AllowAny       |
| `CandidateRegistrationView`| CreateAPIView   | IsAdminUser    |
| `CandidateDetailView`      | RetrieveUpdateAPIView | IsAdminUser |
| `CandidateListView`        | ListAPIView     | IsAdminUser    |
| `SubjectResultEntryView`   | CreateAPIView   | IsAdminUser    |
| `SubjectResultApproveView` | APIView         | IsAdminUser    |
| `SchoolPerformanceView`    | APIView         | IsAdminUser    |
| `AuditLogListView`         | ListAPIView     | IsAdminUser    |

---

## Authentication

The system uses JSON Web Tokens via Django Simple JWT.

- Access tokens are stored in `localStorage` under the key `access_token`
- Refresh tokens are stored under `refresh_token`
- User metadata (username, is_staff, is_superuser) is decoded from the JWT payload and stored in `localStorage` under `user`
- The Axios interceptor attaches the access token to every outbound request and clears storage on 401

For production deployments, consider storing tokens in `httpOnly` cookies instead of `localStorage` to mitigate XSS risk.

---

## Data Models

### Candidate index number format

```
[11-digit centre code][3-digit student number]
Total: 14 digits

Example: 10000000001001
         ^^^^^^^^^^^ ^^^
         centre code  student number
```

The centre code matches the `School.center_code` field exactly.

### Examination year lifecycle

```
REGISTRATION_OPEN
      |
REGISTRATION_CLOSED
      |
EXAMINATION_ONGOING
      |
MARKING_ONGOING
      |
RESULTS_RELEASED     <-- public lookup becomes available
      |
ARCHIVED
```

Results are only accessible via the public API when the year's status is `RESULTS_RELEASED`.

### SubjectResult status flow

```
PENDING -> ENTERED -> VALIDATED -> MODERATED -> APPROVED
                                              -> WITHHELD
                                              -> CANCELLED
                       ABSENT (set directly)
```

Only results in ENTERED, VALIDATED, or MODERATED status can be approved. Once APPROVED, marks are locked.

---

## Grading System

KCSE uses a 12-point grading scale. The overall grade is computed from the best 7 subjects, with English and Kiswahili counted as compulsory.

| Grade | Points | Score Range  |
|-------|--------|--------------|
| A     | 12     | 80 – 100     |
| A-    | 11     | 75 – 79.99   |
| B+    | 10     | 70 – 74.99   |
| B     | 9      | 65 – 69.99   |
| B-    | 8      | 60 – 64.99   |
| C+    | 7      | 55 – 59.99   |
| C     | 6      | 50 – 54.99   |
| C-    | 5      | 45 – 49.99   |
| D+    | 4      | 40 – 44.99   |
| D     | 3      | 35 – 39.99   |
| D-    | 2      | 30 – 34.99   |
| E     | 1      | 0 – 29.99    |
| X     | 0      | Absent / Cancelled |

---

## Security Considerations

### Rate limiting

The public result lookup endpoint is throttled to 20 requests per hour per anonymous IP. Every query — successful or not — is recorded in the `ResultQuery` table with the IP address, user agent, and whether the candidate was found.

### Name verification

The lookup requires the candidate's full name in addition to the index number. The system checks that at least two name tokens match the registered name, preventing unauthorized result access even when an index number is known.

### Audit logging

All significant actions are written to `AuditLog` with the acting user, IP address, timestamp, and a description. Logs are append-only and ordered by timestamp descending. The admin UI exposes the last 500 entries with filtering by action type and index number.

### Result withholding

Results with status `WITHHELD` or `CANCELLED` in `OverallResult` are blocked from the public API. The candidate receives a message directing them to contact KNEC.

---

## Development Notes

### Adding a new examination year

1. Create an `ExaminationYear` record via Django admin with status `REGISTRATION_OPEN`
2. Progress the status through the lifecycle as the examination proceeds
3. Set status to `RESULTS_RELEASED` to make results available on the public portal

### Grade computation

Grade computation (assigning a `GradingScale` FK based on final score) and overall result aggregation are not handled automatically by the API. These should be implemented as Django management commands or Celery tasks that run after marks approval. The models are fully structured to receive these computed values.

### Caching

The `/api/reference/years/` and `/api/reference/grading-scale/` endpoints are cached for one hour using Django's default cache backend. Configure `CACHES` in settings to use Redis or Memcached in production.

### Pagination

The `CandidateListView` does not currently enforce pagination limits in the provided code. Add `pagination_class` and `page_size` settings in production to prevent large response payloads.