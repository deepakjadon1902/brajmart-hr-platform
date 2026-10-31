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
- `GET/POST /api/v1/workspace/tasks`
- `PATCH/DELETE /api/v1/workspace/tasks/:id`
- `GET/POST /api/v1/teams`
- `GET /api/v1/teams/options`
- `PATCH/DELETE /api/v1/teams/:id`

## Task Assignment

HR and super admins can assign tasks across their company. Team managers can assign and manage tasks for members of their own teams. Tasks are saved in MongoDB and appear on the assigned employee's Tasks page. Employees can update only their own task status: Not started, In progress, or Completed. HR and the respective manager see the saved status on their Tasks page, which refreshes every five seconds while visible and when the window regains focus. A Refresh button is also available.

Task deadlines include a date and time in IST (Asia/Kolkata). A date without a time defaults to 11:59 PM IST. Assignments create a private notification for the employee, with an in-app pop-up, unread bell count, and a link to the task. Notifications are saved in MongoDB and can be marked as read in the employee's Notifications page.

Unfinished tasks receive reminders within 24 hours, within one hour, and when the deadline is reached. The backend checks every minute and catches up when notifications are fetched. Each reminder is stored once per task assignment and deadline; completed tasks stop reminders, and rescheduled or reassigned tasks clear obsolete reminders. Pop-ups appear while the portal is open and visible; notifications created while the employee is away remain in the inbox for their next login. The backend must be running to generate scheduled reminders.

Run `npm run test:tasks` from `backend` to verify assignment, MongoDB persistence, employee visibility, status updates, notification delivery, deadline reminders, duplicate prevention, and access restrictions. This integration test uses the database configured in `backend/.env`, creates temporary companies/users/tasks/notifications, and removes its fixtures after completion.

## Teams and Manager Access

Managers create and edit named teams at `/team-manager/teams` by selecting employees. Each employee has one primary team. Employees already in a different team must be removed from that team before they can be added elsewhere. MongoDB transactions commit the team and membership changes together and prevent concurrent managers from claiming the same employee. Use MongoDB Atlas or a replica set with transaction support.

Employees see their team, reporting manager, and colleagues at `/employee/team`, plus a team summary on their Dashboard and Profile. Team membership refreshes every five seconds while the portal is visible. Managers can filter Tasks, Attendance, and Leaves by their teams, monitor check-ins, and approve or reject their members' pending leave. Team activity refreshes every ten seconds. Managers can apply for personal leave but cannot approve their own requests.

Team boundaries are enforced by the API as well as the UI. Managers cannot assign tasks or approve leave for other teams, and team rosters expose only directory information. HR retains company-wide oversight and can change a team's manager. Removing membership or moving an employee to another company removes the previous manager's access without deleting the employee's work, attendance, or leave history. Manager access through an employee designation must be granted by HR.

Run `npm test` for both integration suites, or `npm run test:teams` for team creation, membership changes, concurrency, manager isolation, attendance visibility, leave approval, and employee portal synchronization. The suites use temporary records in the configured database and remove those records after completion.

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
