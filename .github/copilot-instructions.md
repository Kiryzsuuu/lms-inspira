- Project: MERN LMS (React + Express + MongoDB)
- Frontend: Vite React in `client/` using Tailwind
- Backend: Express API in `server/` with Mongoose, JWT auth, and RBAC (admin/teacher/student)

Dev commands (from repo root):
- `npm run dev` runs both server and client
- `npm run dev:server` backend only
- `npm run dev:client` frontend only

Notes:
- Backend env vars live in `server/.env` (copy from `server/.env.example`)
- Frontend env vars live in `client/.env` (copy from `client/.env.example`)
