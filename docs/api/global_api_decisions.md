
# Global API Decisions

This document captures cross-cutting decisions for the backend API. These choices drive endpoint design, database queries, and frontend behavior. **Trees** and **Observations** are global concepts for the backend, but the following examples may reference them for clarity.


## 1. Visibility and Authentication Rules


**Default rule set:**


- `GET` endpoints are public, but only return approved records.
- Write endpoints (`POST`, `PUT/PATCH`, `DELETE`) require a valid JWT access token.


**Pending/rejected visibility:**


- The creator can view their own pending/rejected submissions.
- Admins/moderators can view everything.


**Implications:**


- Public browsing works without login.
- Unapproved content never leaks to anonymous users.
- The same endpoints can behave differently based on auth (public vs creator vs admin).


## 2. Moderation and Approval Workflow


**Approval status:**


All user-generated records that can be public-facing use `approval_status`:

`pending` | `approved` | `rejected`


**Who can approve:**


Only admin/moderator users can approve/reject.


**Approval behaviour:**


- New submissions default to pending.
- Rejected content remains visible only to the creator and admins (optionally include a rejection reason).


**Decision point (recommended):**


Store moderation metadata:
- `approved_by_user_id`, `approved_at`, `rejection_reason` (either columns or an `approval_events` table).


## 3. Roles and Permissions


**Roles:**


Introduce a global user role concept early (e.g. `users.role`):

`user` | `admin` (extendable to `moderator` later)


**Ownership:**


Every created record must store `created_by_user_id` (or `uploaded_by_user_id`).


**Editing/deleting rules (pick one and keep consistent):**

Recommended: creator can edit/delete their own pending submissions; approved items require a new submission or admin action.


## 4. Source of Truth and History Strategy


**Mutable vs append-only:**


`trees` is the identity record (species, location, creation metadata).
Measurements and changing attributes live in history tables (append-only), e.g. `tree_detail_history`.


**“Current view” rule:**


Public “current tree details” come from:
- The latest approved history record (by `recorded_at`)
- Creator/admin can optionally view pending history records.

This avoids overwriting approved data and keeps an audit trail.


## 5. Endpoint Structure Conventions


**Resource structure:**


Trees are the top-level resource.
Observations are scoped to a tree.


**Recommended patterns:**


```
GET /trees
GET /trees/{treeId}
GET /trees/{treeId}/observations
POST /trees
POST /trees/{treeId}/observations
POST /observations/{observationId}/photos
```


Keep nesting consistent; avoid mixing nested and unrelated flat endpoints unless there’s a strong reason.


## 6. Geo Querying Rules (Map Support)


**Primary query mode:**


Use viewport bounding box for map browsing:
- `minLat`, `maxLat`, `minLng`, `maxLng`


**Optional alternative:**


Radius search:
- `lat`, `lng`, `radiusM`


**Coordinate handling:**


`trees.location` is derived automatically from `location_lat/lng` (generated column).
API returns lat/lng for client rendering; PostGIS is used for querying and spatial index.


**Privacy decision:**


Do we expose precise coordinates publicly?
- **Recommended MVP:** Yes (simpler).
- If privacy matters later: round/jitter for public users, exact for logged-in users.


## 7. Pagination, Limits, and Filtering


**Global pagination rule:**


List endpoints accept:
- `limit` (server-enforced max, e.g. 100)
- Either `cursor` (recommended) or `page`/`pageSize` (simpler)


**Filtering rules:**


- Public endpoints implicitly filter to `approval_status=approved`.
- Admin endpoints can filter explicitly by `approval_status`.


**Map endpoints:**


Prefer viewport queries and strict max results (e.g. cap per request) rather than deep pagination.


## 8. Response and Error Format


**Consistent JSON:**


- Success: return JSON objects with stable shapes.
- Errors: return a consistent structure, e.g.

```json
{
	"error": {
		"code": "validation_error",
		"message": "...",
		"details": { ... }
	}
}
```


**HTTP status codes:**


- 400: malformed request
- 401: not authenticated
- 403: not authorised (e.g. non-admin approving)
- 404: not found
- 422: validation failed


## 9. Photos and File Storage Model


**Storage approach:**


`observation_photos.storage_key` is the reference to object storage (S3/Supabase storage/etc.).


**Upload flow decision:**


- Recommended: direct-to-storage upload (pre-signed URL), then API stores metadata.
- Photos default to pending until approved.


This prevents large multipart uploads through the API and keeps the API stateless.


## 10. Consistency and Idempotency (Mobile-Safe Behaviour)


**Retry-safe behaviour:**


Assume the client may retry POSTs due to network issues.
Recommended options:
- Support an `Idempotency-Key` header for create endpoints, or
- Server-side dedupe rules where possible (MVP can skip if scope is small).


## 11. Timestamps and Timezones


**Global time rule:**


Store timestamps as `TIMESTAMPTZ` in UTC.
Use defaults `DEFAULT NOW()` for `created_at` and event times where appropriate.


## 12. Admin/Moderation Endpoints (Recommended Set)


Plan for admin-only actions such as:


```
POST /admin/trees/{id}/approve
POST /admin/trees/{id}/reject
POST /admin/observations/{id}/approve
POST /admin/observations/{id}/reject
POST /admin/photos/{id}/approve
POST /admin/photos/{id}/reject
```


These keep moderation separated from public endpoints and simplify permissions.