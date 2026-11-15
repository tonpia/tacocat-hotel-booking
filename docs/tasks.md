# Task board

Status: `todo`, `doing` (work started, not finished), `done` (set in the card's own PR; on `main` once that PR is merged), `blocked` (reason in Notes).
Type: `code` cards are done in this repo through PRs; `human` cards are done by the owner outside the repo (recording, slides, deploy settings).
Edit only your own rows. A card can start when everything in "Depends on" is `done` on `main` and the card has no open PR yet.

## Person A: base system

| ID | Owner | Type | Status | Depends on | Task | Req | Branch | PR | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | A | code | done | | Rename the domain: Hospital to Hotel, Appointment to Booking (models, controllers, routes, `/api/v1/hotels`, `/api/v1/bookings`, Swagger, error messages, seeder, `tests/fixtures/10-base.js`). Make Hotel `address` and `tel` required. No behaviour change beyond renaming; bookings keep `apptDate` for now. | FR3 | a/A1-rename-hotel-booking | | |
| A2 | A | code | done | | Auth: add required `tel` to User and register; register errors give 400 with a message; login wrong password 401, unknown email 401. `tests/collections/10-auth`. | FR1, FR2 | a/A2-auth-tel | | |
| A3 | A | code | done | A1 | Booking model: replace `apptDate` with `checkInDate` and `checkOutDate`; validate check-out after check-in and 1 to 3 nights; `nights` virtual. Remove the old "max 3 appointments per user" rule. Update fixtures with one future and one past-check-out booking for user1 and one for user2. | FR3 | a/A3-booking-dates | [#10](https://github.com/tonpia/tacocat-hotel-booking/pull/10) | |
| A4 | A | code | done | A3 | Booking endpoints per `docs/api.md`: create under hotel (404 missing hotel), list own or all, get, update dates, delete; ownership failures give 403 (base code used 401). `tests/collections/30-bookings`. | FR3 to FR9, NFR2 | a/A4-booking-crud | [#13](https://github.com/tonpia/tacocat-hotel-booking/pull/13) | |
| A5 | A | code | done | A1 | Hotel admin CRUD tests and cascade: deleting a hotel deletes its bookings (and its reviews once the Review model exists); `getHotel` 404 for a missing id instead of 400. `tests/collections/20-hotels`. | FR3 | a/A5-hotel-crud-cascade | [#11](https://github.com/tonpia/tacocat-hotel-booking/pull/11) | Review cascade is in the Hotel hook; its test belongs to B5 (no review endpoint on main yet). |
| A6 | A | code | done | A3 | Demo seeder for the real database: admin, 2 users, hotels from a hotel CSV (or adapt `_data`), bookings including past check-outs so reviews can be demoed. | NFR4 | a/A6-demo-seeder | [#15](https://github.com/tonpia/tacocat-hotel-booking/pull/15) | Seeder has no Postman test (it only fills the real database); checked by reading the CSV and the bookings in code. |
| A7 | A | code | todo | A4, A5 | Swagger docs for auth, hotels and bookings match `docs/api.md`. | NFR4 | | | |
| A8 | A | code | todo | A4 | `docs/diagrams.md`: use case diagram, class diagram (UML profile) and sequence diagrams for the changed base flows (register, login, create booking, edit/delete booking), in Mermaid or PlantUML. Not for reviews. | slides | | | |
| A9 | A | code | todo | A4 | `docs/changes-from-assignment-7.md`: summary of what changed since tag `assignment-7-base`, by file, with the compare link, ready to paste into slides. Update again before submission. | slides | | | |
| A10 | A | human | todo | A6 | Deploy (e.g. Render + Atlas), set env vars, run the full Postman collection against it. | NFR | | | |

## Person B: hotel reviews

| ID | Owner | Type | Status | Depends on | Task | Req | Branch | PR | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | B | code | done | A1 | Review model per `docs/api.md`: unique index on `booking`, integer rating 1 to 5, comment max 1000; `Review.calcAverageRating(hotelId)` static run after save and delete; add `averageRating` and `reviewCount` to Hotel. | R1, R2, R4 | b/B1-review-model | [#5](https://github.com/tonpia/tacocat-hotel-booking/pull/5) | |
| B2 | B | code | done | B1, A3 | `POST /bookings/:bookingId/reviews` with all R1/R2 checks. `tests/fixtures/40-reviews.js` (bookings with past and future check-out) and `tests/collections/40-reviews` with every failure case in `docs/requirements.md`. | R1, R2 | b/B2-create-review | [#9](https://github.com/tonpia/tacocat-hotel-booking/pull/9) | |
| B3 | B | code | done | B2 | `GET /reviews`, `GET /reviews/:id`, `PUT /reviews/:id` (owner only), `DELETE /reviews/:id` (owner); average recalculated after edit and delete. Tests incl. 403 on someone else's review. | R3, R4 | b/B3-own-reviews | [#12](https://github.com/tonpia/tacocat-hotel-booking/pull/12) | |
| B4 | B | code | done | B1 | `GET /hotels/:hotelId/reviews` public with `count` and `averageRating`; `GET /hotels/:id` shows `averageRating`, `reviewCount`. Tests. | R4 | b/B4-hotel-reviews | [#7](https://github.com/tonpia/tacocat-hotel-booking/pull/7) | |
| B5 | B | code | done | B3, A5 | Admin delete any review; cascade: deleting a booking deletes its review, deleting a hotel deletes its reviews, averages stay correct. Tests. | R5 | b/B5-admin-delete-cascade | [#14](https://github.com/tonpia/tacocat-hotel-booking/pull/14) | |
| B6 | B | code | done | B5 | Swagger docs for all review endpoints. | NFR4 | b/B6-review-swagger | [#16](https://github.com/tonpia/tacocat-hotel-booking/pull/16) | Review docs live in `config/swagger-reviews.js`, merged into `config/swagger.js` with four spread lines. |
| B7 | B | code | done | B5 | `docs/review-feature.md`: how to use R1 to R5 step by step in Postman (requests, bodies, expected responses), as the script for the how-to video and the extra-credit slide. | R1 to R5 | b/B7-review-howto | [#20](https://github.com/tonpia/tacocat-hotel-booking/pull/20) | Every request was run against `npm run seed` data; codes and messages are the real ones. |
| B8 | B | human | todo | B7 | Record the how-to video for R1 to R5 and put the link in the slides. | extra credit | | | |
| B9 | B | human | todo | A8, A9, B8 | Assemble the slide deck (see `docs/requirements.md`, Final presentation) and submit on myCourseVille. | submission | | | |
