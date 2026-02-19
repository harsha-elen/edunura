# Deploying LMS on Dokploy

## Prerequisites
- Dokploy installed on a VPS
- Domain name purchased
- Git repo with this code pushed to GitHub/GitLab

---

## Step 1 — DNS Records

At your domain registrar, add these **A records** pointing to your VPS IP:

| Record | Points to |
|--------|-----------|
| `@` (root) | VPS IP |
| `api` | VPS IP |
| `app` | VPS IP ← skip if using path mode |
| `admin` | VPS IP |
| `teacher` | VPS IP |

---

## Step 2 — Create Project in Dokploy

1. Dokploy → **Projects** → **New Project** → name it (e.g. `client-name`)
2. Inside project → **Create Service** → **Docker Compose**
3. Connect your Git repo
4. Set **Compose File** to: `docker-compose.dokploy.yml`

---

## Step 3 — Set Environment Variables

1. Go to **Environment** tab in the service
2. Copy `.env.docker.example`, fill every `← CHANGE` value, paste it in

**The 8 values you must fill:**

```
DOMAIN=clientdomain.com
ADMIN_EMAIL=admin@clientdomain.com
ADMIN_PASSWORD=SomeStrongPassword
DB_ROOT_PASSWORD=             ← any strong password
DB_PASSWORD=                  ← any strong password (different from root)
JWT_SECRET=                   ← run: openssl rand -hex 64
JWT_REFRESH_SECRET=           ← run: openssl rand -hex 64 (different value)
```

**Student portal routing — pick one:**

| Client wants | Set `STUDENT_BASE_PATH` |
|---|---|
| `app.clientdomain.com` | `/` |
| `clientdomain.com/app` | `/app` |

If using `/app` also change:
```
FRONTEND_URL=https://clientdomain.com
STUDENT_URL=https://clientdomain.com/app
```

---

## Step 4 — Deploy

Click **Deploy**. Dokploy builds all images and starts all containers.
First deploy takes ~5 minutes (building all frontends).

---

## Step 5 — Add Domains in Dokploy

Go to **Domains** tab → **Add Domain** for each service:

**Subdomain mode** (`STUDENT_BASE_PATH=/`):

| Domain | Service | Port |
|--------|---------|------|
| `clientdomain.com` | `landing` | `3000` |
| `api.clientdomain.com` | `backend` | `5000` |
| `app.clientdomain.com` | `student-app` | `80` |
| `teacher.clientdomain.com` | `teacher-app` | `80` |
| `admin.clientdomain.com` | `admin-app` | `80` |

**Path mode** (`STUDENT_BASE_PATH=/app`):

| Domain | Service | Port | Path Prefix |
|--------|---------|------|-------------|
| `clientdomain.com` | `landing` | `3000` | — |
| `api.clientdomain.com` | `backend` | `5000` | — |
| `clientdomain.com` | `student-app` | `80` | `/app` (no StripPrefix) |
| `teacher.clientdomain.com` | `teacher-app` | `80` | — |
| `admin.clientdomain.com` | `admin-app` | `80` | — |

Enable **HTTPS** on each domain — Dokploy handles SSL automatically.

---

## Step 6 — First Login

Go to `https://admin.clientdomain.com` and log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set.

**After login, configure in Admin Panel → Settings:**
- Razorpay (payment keys)
- Zoom (client ID + secret)
- Email (SMTP settings)

**Change the admin password immediately.**

---

## Updating Code (Redeployment)

Push changes to Git, then in Dokploy → **Redeploy**.

To update only one service (e.g. backend fix only):
Dokploy → service → **Redeploy** that specific service.

Enable **Auto Deploy** in Dokploy to redeploy automatically on every `git push`.

---

## New Client Checklist

- [ ] Add DNS A records
- [ ] Create new Project in Dokploy
- [ ] Add Docker Compose service (same repo)
- [ ] Fill `.env.docker.example` with client values → paste in Environment tab
- [ ] Deploy
- [ ] Add 5 domains with HTTPS
- [ ] Login to admin panel → configure Razorpay, Zoom, Email
- [ ] Change admin password
