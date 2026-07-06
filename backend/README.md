# BrajMart HR Backend

Production-grade Express API for the BrajMart HR portal.

## Stack

- Node.js + Express
- MongoDB Atlas via Mongoose
- JWT access tokens and HTTP-only refresh cookies
- Google OAuth ID token verification
- Resend email sending
- ImageKit document uploads
- Helmet, CORS, HPP, rate limiting, request-size limits

## Local Setup

1. Use `backend/.env` as the active backend environment file.
2. Keep `backend/.env.example` as the safe template for future setup.
3. Fill `MONGODB_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in `backend/.env`.
4. Optional integrations: `GOOGLE_CLIENT_ID`, `RESEND_API_KEY`, and ImageKit keys.
5. Run:

```bash
cd backend
npm install
npm run dev
```

The API listens on `http://localhost:5000`. The Vite frontend proxies `/api` to this port.

## Core Endpoints

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/google/config`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/verify`
- `POST /api/v1/auth/password-reset/complete`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET/POST/PATCH/DELETE /api/v1/users`
- `GET/POST/PATCH /api/v1/documents`
- `GET/POST /api/v1/messages`
- `POST /api/v1/email/send`

## Upload Policy

- Employees, HR, and super-admins can upload files.
- HR and super-admins can upload for other employees.
- Allowed files: PDF, DOC, DOCX, JPG, PNG, WEBP.
- Maximum upload size: 12 MB.
- JPG, PNG, and WEBP uploads are auto-rotated, resized to max 1800px width, and converted to WEBP when that reduces storage.
- Original and optimized sizes are stored with each document record.

## MongoDB Atlas Auth Fix

If startup shows `bad auth : authentication failed`, check `backend/.env`:

- Use a MongoDB Atlas **Database Access** user, not your Atlas login.
- URL-encode special password characters in `MONGODB_URI`.
- Confirm the user has `readWrite` access to the selected database.
- Confirm Atlas Network Access allows your current IP address.
- Restart `npm run dev` after changing `.env`.

## Permanent Accounts

On startup the backend ensures the permanent HR and super-admin accounts exist and are active. Configure the same backend environment in production before using these accounts.

- HR portal: `hr@brajmart.com`
- Super admin portal: `anish@brajmart.com`

## Deployment

Use Render for the backend with `backend/render.yaml`.

Use Vercel for the frontend. The current frontend rewrite points `/api/*` to `https://brajmart-hr-platform-2.onrender.com/api/*`; alternatively set `VITE_API_BASE_URL` to `https://brajmart-hr-platform-2.onrender.com/api/v1`.
