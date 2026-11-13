# Requirements

Source: course spec `docs/SW_Dev_Projects.pdf`, project 1 (Hotel Booking), plus the additional requirements assigned to group TacoCat.

## Base functional requirements (Hotel Booking)

| ID | Requirement | Acceptance |
| --- | --- | --- |
| FR1 | A user can register with name, telephone number, email and password. | `POST /auth/register` with all four fields gives 201 and a token. Missing any field, invalid email, duplicate email or password under 6 characters gives 400. |
| FR2 | A registered user can log in with email and password, and log out. | Correct credentials give 200 and a token (body and `token` cookie). Wrong credentials give 401. Logout clears the cookie. |
| FR3 | A registered user can book up to 3 nights by giving the date and the hotel. The hotel list shows name, address and telephone number. | `GET /hotels` is public and each hotel has `name`, `address`, `tel`. A booking needs a hotel, `checkInDate` and `checkOutDate`; 1 to 3 nights is 201, 0 or more than 3 nights, or check-out not after check-in, is 400. |
| FR4 | A user can view their own bookings. | `GET /bookings` returns only the caller's bookings, with the hotel's name, address and tel. |
| FR5 | A user can edit their own bookings. | Owner can change dates (same 1 to 3 night rule) on `PUT /bookings/:id`. Another user gets 403. |
| FR6 | A user can delete their own bookings. | Owner gets 200 on `DELETE /bookings/:id`. Another user gets 403. |
| FR7 | Admin can view any booking. | Admin `GET /bookings` returns all bookings; `GET /bookings/:id` works for any booking. |
| FR8 | Admin can edit any booking. | Admin `PUT /bookings/:id` works on any booking, same validation. |
| FR9 | Admin can delete any booking. | Admin `DELETE /bookings/:id` works on any booking. |

## Additional requirements (TacoCat): hotel reviews

| ID | Requirement | Acceptance |
| --- | --- | --- |
| R1 | A registered user can rate a hotel 1 to 5 stars and write a review after the check-out date of their booking has passed. | `POST /bookings/:bookingId/reviews` with `rating` (integer 1 to 5) and `comment` gives 201 when the booking is the caller's and its `checkOutDate` is before now. Before check-out: 400. Someone else's booking: 403. Rating outside 1 to 5 or not an integer: 400. Not logged in: 401. |
| R2 | Only one review per hotel booking. | A second review for the same booking gives 400 (also enforced by a unique index on `Review.booking`). |
| R3 | A user can view, edit and delete their own reviews. | `GET /reviews` returns only the caller's reviews. Owner can `PUT` (rating, comment) and `DELETE /reviews/:id`; another user gets 403. |
| R4 | Anyone can view all reviews and the average rating of a selected hotel. | `GET /hotels/:hotelId/reviews` is public and returns the reviews plus `averageRating` (rounded to 1 decimal, `null` when no reviews) and `count`. `GET /hotels/:id` includes `averageRating` and `reviewCount`, kept correct after every create, edit and delete. |
| R5 | Admin can delete any hotel review. | Admin `DELETE /reviews/:id` gives 200 for any review. |

When a hotel is deleted, its bookings and reviews are deleted. When a booking is deleted, its review is deleted.

## Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR1 | REST web API only, no frontend. MongoDB. |
| NFR2 | Security: username/password auth, transactions are confidential (users only see their own bookings and reviews). |
| NFR3 | Performance: each request answers within 3 seconds. |
| NFR4 | Usability: the API is usable and testable from Postman. |

## Final presentation (due Mon 16 Nov 2026 23:59)

One slide file (PPT or PDF, max 20 MB), no report. It must show: the assigned topic; the code changed from Assignment 7; use case, class (UML profile) and sequence diagrams for the changed base parts; the team split (GitHub Contributors graph); the additional requirements claimed as extra credit, each with a how-to video link (no diagrams for these); the GitHub repo link. The demo runs on the real program.
