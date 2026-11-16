# Changelog

All notable changes to this project. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Add new versions at the top.

## [1.0.0] - 2026-11-16

### Changed
- First stable release: the version submitted for the final project. The API in `docs/api.md` (auth, hotels, bookings and hotel reviews R1 to R5) is now stable; later breaking changes will bump the major version.

## [0.11.0] - 2026-11-15

### Added
- A6 (NFR4): `npm run seed` imports demo data for the real database: the admin, two demo users (`user1@gmail.com`, `user2@gmail.com`, password `12345678`), all hotels from `_data/hotel.csv`, and five bookings. Three have already checked out (reviewable, R1) and two have not (reviewing them gives 400). Dates are relative to the day you seed.

### Changed
- The seeder also removes reviews and the demo users when it resets, and no longer fixes a hotel id for the old appointment tests.

## [0.10.0] - 2026-11-15

### Added
- A4 (FR3 to FR9, NFR2): booking endpoints finished per `docs/api.md`. `GET /hotels/:hotelId/bookings` now also limits a user's list to that hotel (before, the hotel id was ignored for users).
- Postman tests in `30-bookings` for view, list (own, admin all, per hotel), update and delete: 401, 403, 404 and 400 cases, and admin access.

### Changed
- Viewing, updating or deleting someone else's booking returns 403 (was 401). A missing or invalid booking id returns 404 (an invalid id was 500).
- Booking lists and `GET /bookings/:id` populate the hotel's `name`, `address` and `tel` as in `docs/api.md`.

## [0.9.0] - 2026-11-15

### Added
- B5 (R5): an admin can `DELETE /api/v1/reviews/:id` for any review (200). Other users still get 403 on someone else's review; editing stays owner only (admin 403).
- Deleting a booking (owner or admin) deletes its review, and the hotel's `averageRating` and `reviewCount` are recalculated.
- Postman tests in `40-reviews` for admin delete (200, 404 after, 403 for a non-admin), the booking and hotel cascades (review gone, averages correct, other hotels unchanged) and the stats fields on the hotel endpoints. Hotel delete removing its reviews (added in A5) is now tested.

### Fixed
- `POST` and `PUT /api/v1/hotels` ignore `averageRating` and `reviewCount` in the body, so an admin can no longer overwrite the review stats by hand (R4).

## [0.8.1] - 2026-11-15

### Fixed
- A5 (FR3): `GET`, `PUT` and `DELETE /hotels/:id` return 404 for a missing hotel (was 400). An invalid id also gives 404.
- `PUT /hotels/:id` with invalid data (e.g. an empty name) returns 400 with `{ success: false, message }` instead of 500.
- `GET /hotels` no longer includes each hotel's bookings. The list is public, so it exposed other users' bookings (NFR2).

### Changed
- Deleting a hotel also deletes its reviews, along with its bookings, as `docs/api.md` says.

### Added
- Postman tests in `20-hotels` for admin update and delete, 403 for a user, 404 for a missing or invalid id, 400 on an invalid update, and the cascade (the deleted hotel's booking is gone, other bookings stay).

## [0.8.0] - 2026-11-15

### Added
- B3 (R3, R4): `GET /api/v1/reviews` (login) lists the caller's own reviews, newest first, with the hotel's name; admins get all reviews.
- `GET /api/v1/reviews/:id` (public) shows one review with the reviewer's name only and the hotel's name.
- `PUT /api/v1/reviews/:id` (review owner only, admins included get 403) changes `rating` and/or `comment`; other body fields are ignored. Bad rating or comment over 1000 characters gives 400.
- `DELETE /api/v1/reviews/:id` (review owner) deletes the review; someone else gets 403. Admin delete of any review follows in B5 (R5).
- Missing or invalid review id gives 404. The hotel's `averageRating` and `reviewCount` are recalculated after every edit and delete.
- Postman tests in `40-reviews` for the list (own only, admin all), view, edit and delete: 401, 403, 404 and 400 cases and the average after each change.

## [0.7.0] - 2026-11-15

### Added
- `POST /api/v1/bookings/:bookingId/reviews` (B2, R1, R2): the booking's owner rates the hotel (whole number 1 to 5) with an optional comment, once the booking's `checkOutDate` has passed. `hotel` and `user` are taken from the booking, never from the body. Errors: 401 not logged in, 404 missing or invalid booking id, 403 not the booking's owner (admins included), 400 before check-out, 400 already reviewed, 400 bad rating or comment over 1000 characters. The hotel's `averageRating` and `reviewCount` update after each new review.
- Postman tests in `40-reviews` for creating reviews, with two test users of their own and their bookings before and after check-out in `tests/fixtures/40-reviews.js`.

## [0.6.0] - 2026-11-14

### Changed
- BREAKING (A3, FR3): bookings use `checkInDate` and `checkOutDate` instead of `apptDate`. Check-out must be after check-in and the stay 1 to 3 nights; otherwise `POST /hotels/:hotelId/bookings` and `PUT /bookings/:id` return 400 with `{ success: false, message }`.
- `PUT /bookings/:id` only updates the two dates and runs the date rules on both.

### Added
- Booking `nights` virtual (whole days between check-in and check-out), included in JSON.
- Test fixtures: one future and one past-check-out booking for user1, one past-check-out booking for user2.
- Postman tests in `30-bookings` for 1 and 3 nights (201) and 0 nights, 4 nights, check-out before check-in and missing dates (400).

### Removed
- The "max 3 bookings per user" rule; the limit is now 3 nights per booking.

## [0.5.0] - 2026-11-14

### Added
- `GET /api/v1/hotels/:hotelId/reviews` (B4, R4): public list of a hotel's reviews, newest first, with the reviewer's name only, plus `count` and `averageRating` (1 decimal, `null` when the hotel has no reviews). A missing or invalid hotel id gives 404.
- Postman tests in `40-reviews` for the hotel review list: averages and counts, only that hotel's reviews, public access, empty hotel, 404 cases.

## [0.4.0] - 2026-11-14

### Added
- User `tel` (required) on the model and `POST /auth/register`.
- Postman collection `10-auth` covering register, login, me and logout, success and failure cases.

### Changed
- Register errors (missing field, invalid email, duplicate email, short password) return 400 with `{ success: false, message }`.
- Login with an unknown email now returns 401 (was 400); error bodies use `message` instead of `msg`.
- `GET /auth/logout` now requires login, as in `docs/api.md`.

## [0.3.0] - 2026-11-14

### Added
- Review model (B1): `user`, `hotel`, `booking` (unique index, one review per booking), `rating` (whole number 1 to 5, required), `comment` (max 1000 characters), `createdAt`, `updatedAt`.
- `Review.calcAverageRating(hotelId)` runs after every review save, update and delete and keeps the hotel's rating up to date.
- Hotel `averageRating` (1 decimal, `null` when no reviews) and `reviewCount` (default 0), shown by `GET /hotels/:id`; `reviews` virtual on Hotel.
- Postman collection `40-reviews` and fixture `40-reviews.js` covering the model rules and the average after create, edit and delete.

## [0.2.0] - 2026-11-13

### Changed
- BREAKING: renamed the domain from Hospital/Appointment to Hotel/Booking: models, controllers, routes, Swagger, seeder and test fixtures. Endpoints are now `/api/v1/hotels` and `/api/v1/bookings` (the old `/hospitals` and `/appointments` paths are gone). Bookings keep `apptDate` until A3.
- Hotel `address` and `tel` are now required.

### Added
- Postman collections `20-hotels` and `30-bookings` covering the renamed endpoints.

## [0.1.0] - 2026-11-13

### Added
- Project base imported from Assignment 7.2 (hospitals, appointments, auth, ownership rules), tagged `assignment-7-base`.
- Security middleware (helmet, rate limit, NoSQL and XSS sanitizing), logout and Swagger docs from Assignment 10.
- `npm test`: Newman collections against an in-memory MongoDB, with a smoke collection.
- CI on pull requests and `main`; automatic `v<version>` tags and releases.
- Project docs: requirements, API contract, task board.
