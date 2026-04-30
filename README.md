# Project Tracker Web App

Full-stack web app where users can create projects, assign tasks, and track progress with role-based access control (`admin`, `member`).

## Features

- Authentication: signup/login/logout with JWT (HTTP-only cookie)
- Role-based access:
  - Admin: create projects, add team members, create tasks, update any task
  - Member: view assigned tasks/projects and update own task status
- Project and team management
- Task management: create, assign, due date, status updates
- Dashboard: total/todo/in-progress/done/overdue task summary
- REST APIs with validations and MongoDB relationships

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- EJS + vanilla JS frontend

## Setup

1. Install dependencies:
   - `npm install`
2. Copy env:
   - `cp .env.example .env` (or create `.env` manually on Windows)
3. Update `.env`:
   - `PORT=3000`
   - `MONGO_URI=<your MongoDB URI>`
   - `JWT_SECRET=<strong secret>`
4. Run:
   - `npm run dev`
5. Open:
   - `http://localhost:3000`

## API Endpoints

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Projects

- `GET /api/projects` (admin: all, member: own/team projects)
- `POST /api/projects` (admin only)
- `PATCH /api/projects/:id/team` (admin only, add team member)

### Tasks

- `GET /api/tasks` (admin: all, member: assigned)
- `POST /api/tasks` (admin only)
- `PATCH /api/tasks/:id/status` (admin or assigned member)

### Dashboard

- `GET /api/dashboard` (summary + task list based on role)

## Data Relationships

- `Project.createdBy -> User`
- `Project.teamMembers[] -> User`
- `Task.project -> Project`
- `Task.assignedTo -> User`
- `Task.createdBy -> User`

## Railway Deployment (Mandatory)

1. Push this repository to GitHub.
2. In Railway, click **New Project** -> **Deploy from GitHub repo**.
3. Add environment variables in Railway service:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `PORT` (optional; Railway injects one automatically)
4. Railway detects Node app and runs:
   - Build: `npm install`
   - Start: `npm start` (from `railway.json`)
5. Open the generated Railway public URL.

## Notes

- For production, use a managed MongoDB (MongoDB Atlas).
- You can extend team assignment UI with searchable user dropdown instead of raw User ID input.
