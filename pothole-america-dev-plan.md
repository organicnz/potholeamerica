# Pothole America — Development Plan

> **Product principle:** Every pothole becomes a public community case—not a private 311 ticket.

The MVP succeeds when someone photographs a pothole, neighbors confirm it, Pothole America gets it to the correct authority, everyone watches what happens, and the community—not just the agency—decides whether it was actually fixed.

---

## 1. Product Structure

The main navigation should be extremely simple:

| Area | Purpose |
|---|---|
| **Map** | All public pothole cases |
| **Feed** | New, trending, nearby and recently resolved |
| **Report** | Photo → location → description → publish |
| **Cases** | Cases I'm following/reporting |
| **Profile** | Contributions and community impact |

The home screen should probably be the map.

Pins should immediately communicate state:

`New → Confirmed → Reported → Acknowledged → In progress → Agency says fixed → Community verified`

Maintain **two statuses**:

```text
Official status: CLOSED
Community status: ❌ STILL BROKEN
```

That distinction is fundamental to Pothole America.

---

## 2. Technology Architecture

Core stack:

```text
                   POTHOLE AMERICA
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     Next.js Web       iOS App      Android App
     App Router        SwiftUI          Swift
          │              │              │
          └──────────────┼──────────────┘
                         │
                     Supabase
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    PostgreSQL        Storage          Realtime
     + PostGIS        Photos           Events
        │
        ├── Auth
        ├── Edge Functions
        ├── RLS
        ├── Cron jobs
        └── Webhooks
                         │
                  Civic integration
                         │
         ┌───────────────┼────────────────┐
         │               │                │
      Open311         City APIs         Email /
                                        manual
```

### Next.js

Use Next.js App Router for the public web app, admin tools, SEO, and public case URLs such as:

```text
/case/PA-38291
```

Public case pages should be indexable and easily shareable.

### Supabase

Use Supabase for:

- PostgreSQL
- PostGIS
- Auth
- Storage
- Realtime
- Edge Functions
- Cron jobs
- Webhooks
- Row Level Security

RLS should be implemented from day one.

### Swift

Create a reusable Swift package:

```text
PotholeCore/
    Models/
    Supabase/
    Cases/
    Location/
    Media/
    Notifications/
    Routing/
```

Then use it from:

```text
iOS
 └── SwiftUI
      └── PotholeCore

Android
 └── Android UI / Java interoperability layer
      └── PotholeCore
```

Share models, API logic, session/auth logic, location logic, image handling, validation, and business rules.

---

## 3. Core Database

Do not call the main table `potholes`.

Use:

```sql
cases
```

This allows later expansion into sidewalks, streetlights, dumping, drainage, signs, accessibility issues, and other civic infrastructure problems.

### Suggested schema

```text
profiles
 ├ id
 ├ username
 ├ avatar_url
 ├ city
 ├ reputation
 └ created_at


cases
 ├ id
 ├ public_id             -- PA-000184
 ├ reporter_id
 ├ category_id
 ├ title
 ├ description
 ├ location geography(Point)
 ├ address
 ├ community_status
 ├ official_status
 ├ severity
 ├ jurisdiction_id
 ├ agency_id
 ├ confirmation_count
 ├ follower_count
 ├ comment_count
 ├ created_at
 ├ submitted_at
 └ resolved_at


case_media
 ├ case_id
 ├ user_id
 ├ storage_path
 ├ type
 ├ captured_at
 └ is_resolution_photo


case_confirmations
 ├ case_id
 ├ user_id
 └ created_at


case_followers
 ├ case_id
 ├ user_id
 └ created_at


case_comments
 ├ case_id
 ├ user_id
 ├ body
 └ created_at


case_events
 ├ case_id
 ├ event_type
 ├ actor_type
 ├ actor_id
 ├ payload jsonb
 └ created_at


jurisdictions
 ├ id
 ├ name
 ├ type
 ├ state
 └ boundary geometry(MultiPolygon)


agencies
 ├ id
 ├ jurisdiction_id
 ├ name
 ├ website
 └ reporting_method


agency_routes
 ├ jurisdiction_id
 ├ category_id
 ├ agency_id
 ├ connector_id
 └ metadata jsonb


agency_submissions
 ├ case_id
 ├ agency_id
 ├ external_case_id
 ├ submitted_at
 ├ status
 └ raw_response jsonb


agency_responses

connectors

notifications

moderation_flags

case_duplicates
```

### PostGIS

PostGIS should support queries such as:

```sql
Find unresolved potholes
within 100 meters
created within the last 90 days.
```

---

## 4. Report Workflow

The reporting experience is the most important UX in the app.

### Screen 1 — Capture

```text
See a pothole?

[ Take Photo ]
```

Also allow choosing an existing photo.

### Screen 2 — Location

Automatically determine location:

```text
📍 Broadway & 21st St
Sacramento, California

[map]
       ●
```

Allow the user to move the pin.

### Screen 3 — Duplicate Detection

Before creating another case:

```text
Someone may have already reported this.

12 ft away
Reported 4 days ago
18 confirmations

[ CONFIRM THIS POTHOLE ]
```

Instead of:

```text
Pothole A
Pothole A
Pothole A
Pothole A
```

create one stronger case:

```text
Pothole A
👥 137 residents confirm
```

### Screen 4 — Severity and Description

Keep it simple:

```text
How bad is it?

○ Minor
● Significant
○ Dangerous

Anything else?
_____________________
```

### Primary action

Use:

```text
Publish
```

not:

```text
Submit to Government
```

The case is first published to the community. Government routing is a subsequent platform action.

---

## 5. Public Case Page

The public case page is the heart of Pothole America.

Example:

```text
PA-001824

🚧 POTHOLE

Broadway & 21st Street
Sacramento, CA

[ PHOTO ]

⚠️ STILL OPEN

Reported Sep 12

          37
     PEOPLE CONFIRM

[ I SEE IT TOO ]

────────────────────────

Responsible agency

Sacramento Public Works

Official case
#311-938271

────────────────────────

TIMELINE

Sep 12
📸 Tarlan reported this pothole

Sep 12
👥 8 residents confirmed

Sep 13
📤 Submitted to Public Works

Sep 13
🏛 Agency acknowledged report

Sep 18
🏛 City marked case completed

Sep 19
📸 Sarah added new photo

❌ Community says NOT FIXED

────────────────────────

23 following
11 comments

[ Follow Case ]
[ Add Evidence ]
[ Share ]
```

The public timeline is the product.

---

## 6. Community System

Do not build a generic social network first.

Avoid:

- Friends
- Private messaging
- Follower graphs
- General social posting

The social layer should revolve around **places and cases**.

### Core actions

- **Confirm**
- **Follow**
- **Comment**
- **Add photo**
- **Add evidence**
- **Verify repair**
- **Dispute repair**
- **Share**

### Profiles

Profiles should emphasize impact:

```text
@tarlan

Sacramento

CASE IMPACT

Reported            34
Confirmed           112
Resolved            21
Evidence added      18

🏆 21 problems fixed
```

Later add:

```text
Sacramento contributors
California contributors
Neighborhood contributors
```

Do not reward pure posting volume. Reward **verified civic impact**.

---

## 7. Map

Users should be able to filter:

```text
Open
Confirmed
Reported
In progress
Unresolved >30 days
Resolved
```

Use clustering once case density increases.

A selected pin can show:

```text
[photo]

Pothole
Broadway & 21st

👥 43 confirm
⏱ Open 27 days

View Case →
```

The web map should be public and usable without authentication.

---

## 8. Jurisdiction Engine

The jurisdiction engine eventually becomes one of the platform's most valuable components.

### Input

```text
38.57283,-121.48291
+
pothole
```

### Output

```json
{
  "jurisdiction": "...",
  "roadOwner": "...",
  "agency": "...",
  "department": "...",
  "service": "...",
  "connector": "open311"
}
```

### Launch scope

Do not build the whole United States first.

Start with a local pilot:

```text
California
 └ Sacramento County
      ├ Sacramento
      ├ Citrus Heights
      ├ Elk Grove
      └ County roads

California State
 └ Caltrans
```

Jurisdictions must be data-driven, not hardcoded.

Adding a new city should mostly mean:

1. Import boundaries.
2. Define agency ownership.
3. Define issue routing.
4. Attach connector configuration.

---

## 9. Government Connectors

Create one internal interface:

```typescript
interface CivicConnector {
    getServices()
    submitCase()
    getCaseStatus()
    getCaseUpdates()
}
```

Implementations:

```text
Open311Connector
CustomAPIConnector
EmailConnector
ManualConnector
```

Do not make the platform dependent on Open311.

Some agencies will have:

- Open311
- REST APIs
- Custom portals
- Email
- Web forms
- Manual workflows

The community case should continue to exist regardless of whether an agency integration exists.

---

## 10. Status Model

Keep community status separate from government status.

### Community status

```text
NEW
CONFIRMED
OPEN
FIXED_PENDING_VERIFICATION
RESOLVED
REOPENED
```

### Official status

```text
NOT_SUBMITTED
SUBMITTED
ACKNOWLEDGED
IN_PROGRESS
CLOSED
REJECTED
UNKNOWN
```

This creates powerful combinations like:

```text
Government:

✅ CLOSED

Community:

🚨 STILL OPEN
127 confirmations
Open for 63 days
```

---

## 11. Moderation

Moderation needs to exist in the MVP.

Potential moderation actions:

```text
report case
report photo
report comment
merge duplicate
move pin
wrong category
not public property
not a pothole
already fixed
```

Admin routes:

```text
/moderation
/cases
/users
/agencies
/jurisdictions
/connectors
/categories
```

Include a visible warning:

> **Not for emergencies. Call 911 for immediate danger.**

Avoid exposing unnecessary personal location history.

A user's public profile does not need to reveal exactly where they were when confirming a case.

---

## 12. Security

Use Supabase RLS from day one.

Example permission model:

```text
Anyone
    READ published cases

Authenticated users
    CREATE cases

Reporter
    EDIT limited case fields

Nobody
    directly modifies confirmation_count

Nobody
    directly changes official_status

Service role / RPC
    handles counters,
    routing,
    submissions,
    moderation
```

Sensitive actions should go through controlled database functions or server-side APIs.

Examples:

```text
confirm_case()
resolve_case()
merge_cases()
submit_case_to_agency()
verify_resolution()
```

---

## 13. MVP Build Order

Build in this order:

| Phase | Deliverable |
|---|---|
| **Foundation** | Supabase schema, PostGIS, auth, profiles, RLS |
| **Cases** | Create/report/view/edit pothole |
| **Media** | Photo capture/upload/compression |
| **Map** | Public map, pins, clustering, nearby queries |
| **Community** | Confirm, follow, comment, evidence |
| **Duplicates** | Detect nearby existing cases |
| **Timeline** | Complete immutable case history |
| **Moderation** | Reports, merge, admin panel |
| **Jurisdiction** | Polygon lookup + agency routing |
| **311** | First official government connector |
| **Tracking** | Agency case number + status updates |
| **Resolution** | After photo + community verification |
| **Notifications** | Case updates + nearby changes |
| **Public launch** | SEO case pages, city pages, sharing |

Government integration intentionally comes later.

First make Pothole America useful even when the government does not cooperate.

---

## 14. What Not to Build in V1

Do not build:

- AI pothole detection
- Nationwide jurisdiction database
- Private messaging
- Organizations
- Petitions
- City leaderboards
- Elaborate reputation points
- General “report anything” categories
- Government dashboards
- Paid subscriptions
- Blockchain
- Complex AI agents scraping city websites

Keep the core loop excellent:

```text
📸 Report

        ↓

🗺 Public case

        ↓

👥 Community confirms

        ↓

🏛 Correct authority

        ↓

⏱ Everyone tracks

        ↓

🔧 Government repairs

        ↓

📸 Community verifies

        ↓

✅ RESOLVED
```

---

## 15. V1 Definition of Success

Do not define success primarily as downloads.

Define success as:

> **A person reports a real pothole through Pothole America, strangers nearby join that case, the responsible government receives it, and eventually somebody uploads photographic proof that it was repaired.**

If that loop works repeatedly in one city, the product has validated the core RosYama-style community model for the U.S.

From there, **Pothole America** can grow from a pothole app into a national public-accountability network for physical infrastructure.

---

## 16. Recommended Launch Strategy

### Phase 1 — Sacramento Pilot

Focus on potholes and road surface defects only.

Initial jurisdiction support:

- City of Sacramento
- Sacramento County
- Caltrans

Core objective:

> Prove that Pothole America can determine who is responsible, create a public community case, route it correctly, track the response, and verify the repair.

### Phase 2 — Sacramento Metro

Add surrounding cities and agencies.

Improve:

- Duplicate detection
- Neighborhood activity
- Case escalation
- Notifications
- Resolution verification

### Phase 3 — California

Create reusable jurisdiction import tooling.

Add:

- Major California metros
- Statewide agency support
- City/agency performance metrics
- Public dashboards

### Phase 4 — Nationwide

Scale the jurisdiction and connector model across the U.S.

Long-term platform value:

> **A public civic network that knows how to take a real-world infrastructure problem from photographic evidence to the correct government agency—and keeps the entire process visible to the community.**
