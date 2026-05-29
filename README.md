# Soccer School Registration Platform

MVP full-stack registration platform for a soccer school.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB Atlas with Mongoose
- Auth: JWT
- Uploads: Multer

## Features

- Public player registration form
- Admin login
- Admin dashboard
- Registration status management
- Search and filter
- Proof of payment upload
- CSV export
- Mobile responsive UI

## Project structure

```text
frontend/
backend/
```

## Setup

1. Install dependencies:

```bash
cd frontend && npm install
cd ../backend && npm install
```

2. Create environment files:

- Copy `frontend/.env.example` to `frontend/.env`
- Copy `backend/.env.example` to `backend/.env`

3. Add your MongoDB Atlas connection string in `backend/.env`.

4. Start the backend:

```bash
cd backend
npm run dev
```

5. Start the frontend:

```bash
cd frontend
npm run dev
```

## Default admin credentials

Set them in `backend/.env`:

```env
ADMIN_EMAIL=admin@soccerschool.com
ADMIN_PASSWORD=admin123
```
