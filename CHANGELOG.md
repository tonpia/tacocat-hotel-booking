# Changelog

All notable changes to this project. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Add new versions at the top.

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
