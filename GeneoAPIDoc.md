# Edunura × Geneo — User Info API

**Base URL:** `https://api.edunura.in`  
**Environment:** Staging / Production

---

## Verify Token (User Info API)

This endpoint is called by Geneo's backend to validate the SSO token and retrieve the student's profile.

```
POST /api/geneo/verify-token
```

### Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <token>` | ✅ Yes |
| `Content-Type` | `application/json` | ✅ Yes |

> The `<token>` is the JWT received in the SSO redirect URL as the `token` query parameter.

### Request Body

```json
{
  "uniqueId": "EDU-STU-USER-23"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `uniqueId` | string | The `uid` from the SSO redirect URL (format: `EDU-STU-USER-{userId}`) |

### Success Response — `200 OK`

```json
{
  "uniqueId": "EDU-STU-USER-23",
  "name": "Harsha Vardhan",
  "userType": "student",
  "mode": "learn",
  "classes": ["6", "7"],
  "subjects": ["Mathematics", "Science"],
  "subjectCodes": ["M", "S"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `uniqueId` | string | Edunura's internal student ID (format: `EDU-{ROLE}-USER-{id}`) |
| `name` | string | Full name of the user |
| `userType` | string | Role of the user (`student`, `teacher`, or `admin`) |
| `mode` | string | The interaction mode (`learn` or `assess`) |
| `classes` | string[] | Unique classes the student is enrolled in (Geneo-enabled courses) |
| `subjects` | string[] | Unique subject names (e.g., "Mathematics") |
| `subjectCodes` | string[] | Unique subject shorthand codes (e.g., "M") |

### Error Responses

| Status | Message | Reason |
|--------|---------|--------|
| `401` | `Authorization header with Bearer token is required` | Missing or malformed Authorization header |
| `403` | `Invalid or expired token` | JWT signature invalid or token has expired |
| `403` | `Token has been revoked or does not exist` | Student logged out or token was revoked |
| `403` | `uniqueId does not match token owner` | `uniqueId` in body doesn't match the token's owner |
| `403` | `No active Geneo-enabled enrollment found for this student` | Student not enrolled in a Geneo-linked course |

---

## SSO Flow Overview

1. Student clicks **"Open in Geneo"** on Edunura.
2. Edunura calls `POST /api/geneo/generate-token` (internal) and gets a signed JWT + redirect URL.
3. Student is redirected to:
   ```
   https://learn-stage.geneo.in/sso-redirect/edunura?uid=EDU-STU-USER-23&token=<jwt>
   ```
4. Geneo's backend calls `POST /api/edunura.in/geneo/verify-token` with the token to authenticate the student.
5. Edunura responds with `userId`, `class`, and `subject`.

---

## JWT Details

| Property | Value |
|----------|-------|
| Algorithm | `HS256` |
| Issuer (`iss`) | `https://api.edunura.in` |
| Expiry | 24 hours from generation |
| Payload fields | `profileId`, `name`, `role`, `mode` |

> The shared JWT secret (`GENEO_JWT_SECRET`) will be exchanged securely out-of-band.

---

*For integration queries, contact the Edunura technical team.*
