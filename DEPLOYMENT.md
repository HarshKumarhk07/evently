# Deployment Guide

Bookify deploys as three pieces:

| Piece     | Platform        | Cost  |
|-----------|-----------------|-------|
| Database  | MongoDB Atlas   | Free  |
| Backend   | Render          | Free  |
| Frontend  | Vercel          | Free  |

---

## 1 — Database (MongoDB Atlas)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a user with a username & password.
3. **Network Access** → allow `0.0.0.0/0` (or Render's IPs).
4. Copy the connection string:
   `mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/bookify`

---

## 2 — Backend (Render)

1. Push this repo to GitHub.
2. On [Render](https://render.com): **New → Web Service**, pick the repo.
3. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. Add environment variables (see `server/.env.example`):

   | Key            | Value                                  |
   |----------------|----------------------------------------|
   | `NODE_ENV`     | `production`                           |
   | `MONGO_URI`    | your Atlas connection string           |
   | `JWT_SECRET`   | a long random string                   |
   | `CLIENT_URL`   | your Vercel URL (set after step 3)      |
   | `RAZORPAY_KEY_ID` *(optional)*     | Razorpay key id        |
   | `RAZORPAY_KEY_SECRET` *(optional)* | Razorpay key secret    |
   | `CLOUDINARY_*` *(optional)*      | cloud credentials        |
   | `BREVO_API_KEY` *(optional)*        | Brevo API key            |
   | `BREVO_SENDER_EMAIL` *(optional)*   | verified sender email    |
   | `BREVO_SENDER_NAME` *(optional)*    | sender display name      |

5. Deploy. Once live, **seed the database once** from the Render Shell:
   ```bash
   npm run seed
   ```
   A [`render.yaml`](./server/render.yaml) blueprint is included for one-click setup.

---

## 3 — Frontend (Vercel)

1. On [Vercel](https://vercel.com): **Add New → Project**, import the repo.
2. Settings:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variables:

   | Key                            | Value                              |
   |--------------------------------|------------------------------------|
   | `VITE_API_URL`                 | `https://<your-render-app>/api`    |
   | `VITE_RAZORPAY_KEY_ID` *(optional)* | Razorpay key id (same as backend) |

4. Deploy, then copy the Vercel URL back into Render's `CLIENT_URL` and redeploy
   the backend so CORS allows the frontend origin.

### SPA routing

Add a `client/vercel.json` so client-side routes resolve correctly:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## Post-Deploy Checklist

- [ ] `GET /api/health` returns `200`
- [ ] Frontend loads listings (CORS configured)
- [ ] Login works with a seeded demo account
- [ ] A test booking completes end-to-end
- [ ] `JWT_SECRET` is strong and not committed to git
