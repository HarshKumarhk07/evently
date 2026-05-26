# Bookify — Dining, Plays & Events

A production-grade, full-stack **MERN** application for discovering and booking
restaurants, theatre and live events. Premium dark UI, glassmorphism, smooth
motion — inspired by apps like BookMyShow and Swiggy Dineout, with
its own branding.

> Three verticals, one platform: **Dining · Plays · Events**

---

## ✨ Highlights

**Frontend**
- React 18 + Vite + Tailwind CSS, mobile-first & fully responsive
- Premium dark theme, purple accent, glassmorphism, animated gradients
- Framer Motion transitions, animated cards, skeleton loaders
- Route-level code splitting, lazy images, debounced search, infinite scroll
- Reusable component library (Button, Input, Modal, Card, Badge, Tabs…)
- Custom hooks, Context API state, API abstraction layer, error boundary
- Protected routes, toast notifications, accessible & SEO-friendly markup

**Backend**
- Express REST API with a clean `routes / controllers / services / models`
  architecture
- JWT auth + bcrypt, role-based authorization (`user` / `admin`)
- Zod validation middleware, global error handling, consistent responses
- Pagination, filtering, search, rate limiting, Helmet, CORS, compression
- Cloudinary uploads, Razorpay payments, Nodemailer emails — all optional with
  graceful mock fallbacks so the app runs with **zero external keys**

---

## 🧱 Tech Stack

| Layer       | Technology                                            |
|-------------|-------------------------------------------------------|
| Frontend    | React, Vite, Tailwind CSS, React Router, Axios        |
| Animation   | Framer Motion · Icons: Lucide React                   |
| State       | React Context API                                     |
| Backend     | Node.js, Express.js                                   |
| Database    | MongoDB + Mongoose                                    |
| Auth        | JWT + bcryptjs                                        |
| Payments    | Razorpay (mock-mode fallback)                         |
| Media       | Cloudinary (optional)                                 |
| Maps        | Leaflet + React-Leaflet                               |
| Email       | Nodemailer (console fallback)                         |

---

## 📂 Project Structure

```
event/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # API abstraction layer (one client per resource)
│   │   ├── components/      # ui · layout · listing · booking · admin · …
│   │   ├── context/         # AuthContext, LocationContext
│   │   ├── hooks/           # useFetch, useDebounce, useInfiniteScroll, …
│   │   ├── lib/             # axios, constants, formatters, helpers
│   │   ├── pages/           # route pages (home, listing, detail, auth, …)
│   │   ├── App.jsx          # routing + code splitting
│   │   └── main.jsx         # entry + providers
│   └── vite.config.js
│
└── server/                  # Express + MongoDB backend
    └── src/
        ├── config/          # env, db, cloudinary
        ├── controllers/     # request handlers
        ├── middleware/      # auth, validation, errors, rate limiting, upload
        ├── models/          # Mongoose schemas
        ├── routes/          # REST route definitions
        ├── services/        # payment & email services
        ├── utils/           # helpers, seed script
        ├── validators/      # Zod schemas
        ├── app.js           # Express app
        └── server.js        # entry point
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally, **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1 — Backend

```bash
cd server
cp .env.example .env        # adjust MONGO_URI / JWT_SECRET if needed
npm install
npm run seed                # loads sample restaurants, plays, events, users
npm run dev                 # → http://localhost:5000
```

### 2 — Frontend

```bash
cd client
cp .env.example .env        # defaults work out of the box (Vite proxy)
npm install
npm run dev                 # → http://localhost:5173
```

Open **http://localhost:5173**.

### Demo accounts (created by the seed script)

| Role  | Email                | Password   |
|-------|----------------------|------------|
| User  | user@bookify.app     | `user123`  |
| Admin | admin@bookify.app    | `admin123` |

> Razorpay, Cloudinary and Brevo are **optional**. With no keys, payments run in
> mock mode, image uploads are disabled gracefully, and emails print to the
> server console.

---

## 📜 Available Scripts

**server/**
| Script          | Description                          |
|-----------------|--------------------------------------|
| `npm run dev`   | Start API with nodemon               |
| `npm start`     | Start API (production)               |
| `npm run seed`  | Reset DB & load sample data          |

**client/**
| Script            | Description                  |
|-------------------|------------------------------|
| `npm run dev`     | Vite dev server              |
| `npm run build`   | Production build             |
| `npm run preview` | Preview the production build |

---

## 📖 More Documentation

- [`API.md`](./API.md) — REST API reference
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — deploy to Vercel, Render & Atlas

---

## 📝 License

Released for educational / portfolio use. Not affiliated with any existing
brand — all naming and design is original.
