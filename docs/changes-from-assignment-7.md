# Changes since Assignment 7

For the "code changed from Assignment 7" slide. Compare link (everything since tag `assignment-7-base`):

https://github.com/tonpia/tacocat-hotel-booking/compare/assignment-7-base...main

Written at version 1.0.0, the submitted version. To see the full list of files: `git diff --stat assignment-7-base..v1.0.0`. Review feature files (B) are listed in their own section, the base parts (A) first.

## In one slide

- Domain renamed: Hospital becomes Hotel, Appointment becomes Booking (`/api/v1/hotels`, `/api/v1/bookings`).
- Bookings have a check-in and a check-out date, 1 to 3 nights, instead of one appointment date and a limit of 3 bookings per user.
- Auth: `tel` is required, errors have clear status codes (400 invalid input, 401 bad login), and there is a logout endpoint.
- Ownership failures return 403 (the base code returned 401); missing or invalid ids return 404.
- Hotels need `address` and `tel`; the public hotel list no longer exposes bookings; deleting a hotel deletes its bookings and reviews.
- Security middleware and Swagger docs from Assignment 10 are included (helmet, rate limit, NoSQL and XSS sanitizing).
- New: hotel reviews (R1 to R5, person B), automated Postman tests with an in-memory database, CI, semantic versioning, demo seeder, diagrams.

## By file: base system (person A)

| Area | File | What changed |
| --- | --- | --- |
| Models | `models/Hospital.js` to `models/Hotel.js` | Renamed. `address` and `tel` required; `averageRating` (null until reviewed) and `reviewCount`; virtuals `bookings` and `reviews`; deleting a hotel deletes its bookings and reviews. |
| | `models/Appointment.js` to `models/Booking.js` | `apptDate` replaced by `checkInDate` and `checkOutDate`; validators: check-out after check-in and 1 to 3 nights; `nights` virtual; deleting a booking deletes its review. |
| | `models/User.js` | Required `tel`; password length message. |
| Controllers | `controllers/auth.js` | `tel` on register; register errors give 400 with a message (duplicate email, validation); login gives 400 for missing fields and 401 for unknown email or wrong password; new `logout`. |
| | `controllers/hospitals.js` to `controllers/hotels.js` | Renamed; 404 for a missing or invalid id (was 400/500); 400 on invalid update; list does not populate bookings (bookings are private); cascade on delete. |
| | `controllers/appointments.js` to `controllers/bookings.js` | Renamed; dates instead of `apptDate`; no 3-bookings-per-user limit; create under a hotel (404 for a missing hotel, 400 for bad dates); update changes dates only; 403 for someone else's booking (admin allowed); 404 for a missing or invalid id; a user's list can be narrowed to one hotel. |
| Routes | `routes/hospitals.js`, `routes/appointments.js` to `routes/hotels.js`, `routes/bookings.js` | Renamed; hotel routes nest `/:hotelId/bookings`. `routes/auth.js` adds `GET /auth/logout`. |
| App | `server.js` | Mounts the renamed routes and the review routes; adds security middleware and `/api-docs`; the 404 message says Hotel. |
| Seed | `seeder.js`, `_data/hospital.csv` to `_data/hotel.csv` | Admin, two demo users, all hotels from the CSV, five bookings (three already checked out, two not). |
| Docs for the API | `config/swagger.js`, `config/swagger-base.js` | OpenAPI for auth, hotels and bookings, matching `docs/api.md`. |

## By file: tests, tooling and docs (shared)

| File | What changed |
| --- | --- |
| `tests/run.js`, `tests/fixtures/`, `tests/collections/` | `npm test` starts an in-memory MongoDB, seeds fixtures, starts the API and runs the Postman collections with Newman. Replaces the old `node autograde.js` test script. Collections: `00-smoke`, `10-auth`, `20-hotels`, `30-bookings` (base), `40-reviews` (review). |
| `.github/workflows/ci.yml`, `release.yml`, `pull_request_template.md` | CI with required checks `test` and `version`; tags and releases from `package.json`; PR template. |
| `package.json`, `CHANGELOG.md` | Project renamed, semantic version (now 1.0.0), changelog for every feature and fix. |
| `AGENTS.md`, `CLAUDE.md`, `docs/requirements.md`, `docs/api.md`, `docs/tasks.md` | Team rules, requirements, the API contract and the task board. |
| `docs/diagrams.md`, `docs/diagrams/` | Use case, class (REST UML profile) and sequence diagrams for the changed base parts, in the chapter 6 format, with full-size images and their sources. |
| `README.md`, `config/config.env.example` | Run instructions and the settings template. |

## By file: reviews (person B), for completeness

`models/Review.js`, `controllers/reviews.js`, `routes/reviews.js`, `config/swagger-reviews.js`, `tests/fixtures/40-reviews.js`, `tests/collections/40-reviews...`, `docs/review-feature.md`: the hotel review feature (R1 to R5). Not part of the base-system diagrams.

## Releases

Each merged feature or fix has a version tag and GitHub release (`v0.1.0` to `v1.0.0`); the breaking renames are marked BREAKING in `CHANGELOG.md`. 1.0.0 is the submitted version.
