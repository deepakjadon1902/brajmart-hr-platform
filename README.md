# BrajMart HR Platform

An HR management platform with employee, HR, team manager, and super admin portals.
Built with React, TypeScript, Redux, Vite, Node.js 20+, Express, and MongoDB.
Features include employee records, teams, attendance, leave approvals, tasks, and notifications.
Install dependencies: run `npm install` in both `backend` and `frontend`.
Configure MongoDB and JWT secrets in `backend/.env` using `backend/.env.example`.
Start the API: run `npm run dev` inside `backend` (default port 5000).
Start the portal: run `npm run dev` inside `frontend` (default port 8080).
Verify changes: run `npm test` in `backend`, and `npm test`, `npm run lint`, and `npm run build` in `frontend`.

Employees stay signed in on their device by default; they can uncheck "Remember me" for a browser session only. Session checks and token renewal run in the background so open forms and attendance actions stay in place during normal refreshes or temporary connection failures. Sessions still end on logout, expiry of the refresh credential, or account deactivation.

Employee check-in and check-out times are recorded by the API. Check-out becomes available 30 minutes after check-in, with a countdown on both the employee Dashboard and Attendance page. Repeated check-ins reuse the saved record, completed attendance stays visible, and an open overnight shift remains available for checkout. HR can correct attendance records.
