# Bookify API Reference

Base URL: `http://localhost:5000/api`

All responses share a consistent envelope:

```jsonc
// success
{ "success": true, "message": "Success", "data": { ... } }

// list (paginated)
{ "success": true, "data": { "items": [...], "pagination": { "page": 1, "limit": 12, "total": 40, "pages": 4, "hasMore": true } } }

// error
{ "success": false, "message": "Validation failed", "details": [ ... ] }
```

Authentication uses a **Bearer JWT** (`Authorization: Bearer <token>`); the
token is also set as an httpOnly cookie on login/register.

---

## Auth — `/api/auth`

| Method | Endpoint            | Auth | Body                                   |
|--------|---------------------|------|----------------------------------------|
| POST   | `/register`         | —    | `name, email, password, phone?, city?` |
| POST   | `/login`            | —    | `email, password`                      |
| POST   | `/logout`           | —    | —                                      |
| GET    | `/me`               | ✅   | —                                      |
| POST   | `/forgot-password`  | —    | `email`                                |
| POST   | `/reset-password`   | —    | `email, otp, password`                 |

---

## Listings — `/api/restaurants`, `/api/plays`, `/api/events`

All three share an identical surface.

| Method | Endpoint        | Auth   | Notes                                |
|--------|-----------------|--------|--------------------------------------|
| GET    | `/`             | —      | List + filters (see below)           |
| GET    | `/:idOrSlug`    | —      | Single listing + embedded reviews    |
| GET    | `/:id/similar`  | —      | Related listings in the same city    |
| POST   | `/`             | admin  | Create                               |
| PATCH  | `/:id`          | admin  | Update                               |
| DELETE | `/:id`          | admin  | Delete                               |

**Query params for `GET /`**

```
page, limit, search, sort (newest|rating|popular|price-low|price-high),
city, featured, minRating
restaurants → cuisine, priceRange, feature   (comma-separated)
plays       → genre, language
events      → category, upcoming
```

---

## Bookings — `/api/bookings` *(auth required)*

| Method | Endpoint        | Body                                              |
|--------|-----------------|---------------------------------------------------|
| POST   | `/`             | `itemType, itemId, contact, reservation?|tickets?`|
| GET    | `/me`           | `?status&page` — current user's bookings          |
| GET    | `/:id`          | Single booking                                    |
| POST   | `/:id/confirm`  | `razorpayPaymentId, razorpayOrderId, razorpaySignature` |
| PATCH  | `/:id/cancel`   | Cancel & release inventory                        |

Dining bookings with amount `0` confirm instantly. Plays/events return a
`payment` object (`provider`, `orderId`, `keyId`, `amount`, `currency`) — the
client opens **Razorpay Checkout** with the `orderId`, then `POST /:id/confirm`
finalizes the booking after the server verifies the Razorpay signature.

---

## Reviews — `/api/reviews`

| Method | Endpoint   | Auth | Notes                            |
|--------|------------|------|----------------------------------|
| GET    | `/?itemId` | —    | Reviews for a listing            |
| POST   | `/`        | ✅   | `itemType, itemId, rating, comment` (upserts) |
| DELETE | `/:id`     | ✅   | Owner or admin                   |

---

## Users — `/api/users/me` *(auth required)*

| Method | Endpoint              | Notes                          |
|--------|-----------------------|--------------------------------|
| PATCH  | `/`                   | Update `name, phone, city`     |
| POST   | `/avatar`             | `multipart/form-data` image    |
| GET    | `/favorites`          | Favorites grouped by type      |
| POST   | `/favorites`          | Toggle `{ refType, refId }`    |
| GET    | `/recently-viewed`    | Recently viewed listings       |

---

## Admin — `/api/admin` *(admin only)*

| Method | Endpoint          | Notes                              |
|--------|-------------------|------------------------------------|
| GET    | `/stats`          | Totals, revenue, 7-day trend       |
| GET    | `/users`          | `?search&role&page`                |
| PATCH  | `/users/:id`      | `{ role, isVerified }`             |
| DELETE | `/users/:id`      | Remove a user                      |
| GET    | `/bookings`       | `?status&itemType&page`            |
| PATCH  | `/bookings/:id`   | `{ status }`                       |
| POST   | `/uploads`        | `multipart/form-data` image        |

---

## Status Codes

`200` OK · `201` Created · `400` Validation/Bad Request · `401` Unauthenticated
· `403` Forbidden · `404` Not Found · `409` Conflict · `429` Rate Limited
· `500` Server Error

## Health

`GET /api/health` → `{ success: true, message: "Bookify API is healthy" }`
