# 🕵️ Bug Hunt

A gamified Python debugging platform. You play a detective: every case is a broken Python program, and your job is to find the bug and fix it in a real code editor.

## ✨ Features

- **Three difficulty levels** (Easy, Medium, Hard) with cases that unlock one by one
- **Real code editor** (Monaco) with a free **Run** button and a **Submit** button
- **Hidden test cases**: a case is solved only when every test passes
- **XP system**: earn XP for solving, spend XP on hints and skips
- **Attempts and lockout**: 5 attempts, then a 10 minute lockout after 5 wrong answers
- **Sliding login session**: stays alive while you are active, expires when you go idle
- **AI-generated cases**: Gemini writes a case, Judge0 runs the reference solution to produce the expected outputs
- **Admin panel** (ADMIN role only, admins are sent to `/admin` after login):
  - Dashboard overview
  - View all users, check a user's progress, and delete users
  - View all cases and their details
  - Generate new cases (no fixed limit per level)

---

## 🧰 Tech Stack

| Part | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL with Prisma |
| Auth | JWT (bcrypt password hashing) |
| Code execution | Judge0 |
| AI | Google Gemini (case generation) |

---

## 🏗️ How It Works

```
Browser (Next.js)  ──►  NestJS API  ──►  PostgreSQL (Prisma)
                            │
                            ├──►  Judge0   (runs Python code)
                            └──►  Gemini   (generates cases)
```

### Game rules (enforced on the server)

- **Unlocking:** a case opens only when the previous case is solved or skipped. The first case of Medium or Hard needs the **last** case of the level before it, so levels can have any number of cases.
- **Attempts:** a wrong submit costs 1 attempt. At 0 attempts the player is locked for 10 minutes, then attempts reset to 5.
- **Hints and skips** cost XP, and the cost depends on the level.
- **Safe updates:** attempts, XP, hints and skips use single-step conditional database updates and transactions, so double clicks or parallel requests cannot cheat the system.
- **Explanations** are hidden until the case is solved.

### Sliding session

1. Login returns a JWT (`JWT_EXPIRES_IN` controls its life).
2. While the user is active (click, typing, mouse, scroll, touch), the frontend calls `POST /auth/refresh` every 10 minutes and saves the new token.
3. If the user is idle longer than the token's life, the next request gets a `401` and they are sent to `/login?expired=true`.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- A Judge0 instance or API key
- A Gemini API key (only needed for case generation)

### 1. Clone

```bash
git clone <your-repo-url>
cd bug-hunt
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (use your own values, never commit this file):

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bughunt"
JWT_SECRET="a-long-random-string"
JWT_EXPIRES_IN="30m"
GEMINI_API_KEY="your-gemini-key"
JUDGE0_URL="your-judge0-url"
JUDGE0_KEY="your-judge0-key"
```

Set up the database and start the server:

```bash
npx prisma migrate dev
npm run start:dev
```

The API runs on `http://localhost:3000` and Swagger docs are at `http://localhost:3000/api`.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:3001` if the backend uses port 3000).

---

## 📁 Project Structure

```
bug-hunt/
├── backend/
│   └── src/
│       ├── auth/          # register, login, me, refresh
│       ├── challenges/    # game rules, generator
│       ├── runner/        # Judge0 integration
│       ├── admin/         # admin routes
│       └── prisma/        # database service
└── frontend/
    └── src/
        ├── app/           # pages: landing, login, challenges, levels, case
        └── lib/           # apiFetch, types, session refresh hook
```

---

## 🔌 Main API Routes

| Method | Route | What it does |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in, returns a JWT |
| GET | `/auth/me` | Current user (xp, attempts, role) |
| POST | `/auth/refresh` | New token for an active session |
| GET | `/challenges` | All cases with their state (OPEN, LOCKED, SOLVED, SKIPPED) |
| GET | `/challenges/:id` | One case |
| POST | `/challenges/:id/submit` | Judge a solution against the test cases |
| POST | `/challenges/:id/hint` | Reveal the next hint (costs XP) |
| POST | `/challenges/:id/skip` | Skip a case (costs XP) |
| POST | `/runner/run` | Run code for free |
| POST | `/challenges/generate` | Generate a new case (admin) |
| GET | `/admin/dashboard` | Admin dashboard data (admin) |
| GET | `/admin/users` | List all users (admin) |
| DELETE | `/admin/users/:id` | Delete a user (admin) |
| GET | `/admin/users/:id/progress` | One user's progress (admin) |
| GET | `/admin/challenges` | List all cases (admin) |
| GET | `/admin/challenges/:id` | One case with full details (admin) |

---

## 🗺️ Roadmap

- [ ] Short-lived access tokens plus httpOnly refresh-token cookies
- [ ] Show "X of Y tests passed" after a wrong answer
- [ ] Leaderboard
- [ ] Rate limiting on login and run
- [ ] Support for more languages than Python
- [ ] Automated tests and deployment

---

## 📚 What I Learned

- Designing a JWT session that does not log players out mid-game
- Avoiding race conditions with conditional database updates and transactions
- Enforcing game rules on the server instead of trusting the UI
- Running untrusted code safely through a sandbox (Judge0)
- Debugging React lifecycle issues (the Monaco editor crash on fast navigation)

---
