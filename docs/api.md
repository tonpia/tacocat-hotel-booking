# API contract

Base path `/api/v1`. Response shape and status codes are in `AGENTS.md`. "Login" means the `protect` middleware (bearer token or `token` cookie). Change this file in the same PR as the code when an endpoint has to differ, and say so at the top of the PR.

## Models

| Model | Fields |
| --- | --- |
| User | `name` (required), `tel` (required), `email` (required, unique, valid), `password` (required, min 6, hashed, `select: false`), `role` (`user` default, `admin`), `createdAt` |
| Hotel | `name` (required), `address` (required), `district`, `province`, `postalcode`, `tel` (required), `region`, `averageRating` (Number or null, default null), `reviewCount` (default 0); virtuals `bookings`, `reviews` |
| Booking | `user` (ref User), `hotel` (ref Hotel), `checkInDate` (Date, required), `checkOutDate` (Date, required, after check-in, at most 3 nights), `createdAt`; virtual `nights` |
| Review | `user` (ref User), `hotel` (ref Hotel), `booking` (ref Booking, unique), `rating` (integer 1 to 5, required), `comment` (string, max 1000), `createdAt`, `updatedAt` |

Nights = whole days between `checkInDate` and `checkOutDate`.

## Auth (A)

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | body `name, tel, email, password`; 201 `{ success, token }` |
| POST | `/auth/login` | public | body `email, password`; 200 `{ success, token }` |
| GET | `/auth/me` | login | 200 `{ success, data: user }` |
| GET | `/auth/logout` | login | clears cookie; 200 `{ success, data: {} }` |

## Hotels (A)

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/hotels` | public | filter, `select`, `sort`, `page`, `limit` as in the base code; `{ success, count, pagination, data }` |
| GET | `/hotels/:id` | public | includes `averageRating`, `reviewCount` |
| POST | `/hotels` | admin | 201 |
| PUT | `/hotels/:id` | admin | |
| DELETE | `/hotels/:id` | admin | cascades to the hotel's bookings and reviews |

## Bookings (A)

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| GET | `/bookings` | login | user: own bookings; admin: all. Populates hotel `name address tel`. |
| GET | `/hotels/:hotelId/bookings` | login | same rule, limited to that hotel |
| GET | `/bookings/:id` | owner or admin | 403 otherwise |
| POST | `/hotels/:hotelId/bookings` | login | body `checkInDate, checkOutDate`; 201; 404 if hotel missing; 400 if nights not 1 to 3 |
| PUT | `/bookings/:id` | owner or admin | dates only, same validation |
| DELETE | `/bookings/:id` | owner or admin | cascades to its review |

## Reviews (B)

| Method | Path | Access | Notes |
| --- | --- | --- | --- |
| POST | `/bookings/:bookingId/reviews` | login, booking owner | body `rating, comment`; 201. 404 booking missing, 403 not the owner, 400 before check-out, 400 already reviewed, 400 bad rating. Sets `hotel` and `user` from the booking. |
| GET | `/hotels/:hotelId/reviews` | public | `{ success, count, averageRating, data }`, newest first, populates user `name` only |
| GET | `/reviews` | login | user: own reviews; admin: all. Populates hotel `name`. |
| GET | `/reviews/:id` | public | |
| PUT | `/reviews/:id` | owner | body `rating, comment` only; 403 for anyone else (admin included) |
| DELETE | `/reviews/:id` | owner or admin | |

After any review create, update or delete, `Hotel.averageRating` and `Hotel.reviewCount` are recalculated (`Review.calcAverageRating(hotelId)` static).
