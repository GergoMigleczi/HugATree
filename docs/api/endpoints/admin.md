# Admin API Endpoints

These endpoints require an **admin** role (JWT access token must include `role: "admin"`).

## GET /admin/users/{id}

Returns user details.

## POST /admin/users/{id}/role

Change a user's role.

**Request body**

- `role`: string; one of `user`, `admin`, `guardian`

## DELETE /admin/users/{id}

Marks a user as inactive.

## POST /admin/trees/{id}/approval

Set approval status for a tree.

**Request body**

- `status`: string; one of `pending`, `approved`, `rejected`

## POST /admin/trees/{id}/guardian

Assign a user as guardian (adopter) of a tree.

**Request body**

- `userId`: integer
