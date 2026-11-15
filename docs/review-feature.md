# Hotel reviews (R1 to R5): step by step in Postman

Script for the how-to video (card B8) and the extra-credit slide. Every request below was run against the demo data from `npm run seed`; the status codes and messages are the real ones. Ids differ on every seed, so they are written as `{{variables}}`.

| Req | What it allows | Steps |
| --- | --- | --- |
| R1 | A user rates a hotel 1 to 5 stars with a comment, only after the check-out date of their own booking | 3 to 6 |
| R2 | One review per booking | 7 |
| R3 | A user views, edits and deletes their own reviews | 9 to 11 |
| R4 | Anyone sees a hotel's reviews and average rating | 2, 8, 10, 11 |
| R5 | Admin deletes any review | 12 |

## 0. Before recording

1. `config/config.env` filled in (copy from `config/config.env.example`), then `npm run seed` and `npm start` (or use the deployed URL).
2. In Postman make an environment with `baseUrl` = `http://localhost:5000/api/v1` (or the deployed URL).
3. Demo accounts from the seeder, all with password `12345678`:

   | Account | Email | Bookings |
   | --- | --- | --- |
   | Admin | `admin@gmail.com` | none |
   | Demo User One | `user1@gmail.com` | เทพธารินทร์ (checked out 10 days ago), กล้วยน้ำไท 1 (checked out 5 days ago), สินแพทย์ (check-out in 12 days) |
   | Demo User Two | `user2@gmail.com` | เทพธารินทร์ (checked out 4 days ago), กล้วยน้ำไท 1 (check-out in 7 days) |

   The seeder sets dates relative to the day it runs, so the past stays past. Re-seed before each take to start with no reviews.
4. On every login request add this to the **Tests** tab so the token is saved, and use **Auth: Bearer Token** `{{token}}` on the requests that need login:

   ```js
   pm.environment.set('token', pm.response.json().token);
   ```

   Login also sets a `token` cookie. The API reads the bearer header first, so switching user by logging in again is enough. For the "not logged in" step, send it before the first login, or turn off auth and delete the cookie (Postman: Cookies, `localhost`, `token`).

## 1. Find the hotel and the bookings

Log in as user1 and list the bookings:

```http
POST {{baseUrl}}/auth/login
{ "email": "user1@gmail.com", "password": "12345678" }
```

200 `{ "success": true, "token": "eyJ..." }`

```http
GET {{baseUrl}}/bookings
```

200 with 3 bookings, each with `checkInDate`, `checkOutDate`, `nights` and the hotel's `name`, `address`, `tel`. Save as variables:

- `pastBooking`: user1's booking at เทพธารินทร์ (check-out already passed)
- `futureBooking`: user1's booking at สินแพทย์ (check-out not yet)
- `hotelId`: `hotel._id` of `pastBooking`

Then log in as user2, `GET {{baseUrl}}/bookings` and save user2's booking at เทพธารินทร์ as `user2Booking`. Log in as user1 again.

## 2. R4: the hotel has no reviews yet (public)

No login needed (turn auth off to show it).

```http
GET {{baseUrl}}/hotels/{{hotelId}}/reviews
```

200

```json
{ "success": true, "count": 0, "averageRating": null, "data": [] }
```

`GET {{baseUrl}}/hotels/{{hotelId}}` also shows `"averageRating": null, "reviewCount": 0`.

## 3. R1: must be logged in

Auth off, no cookie:

```http
POST {{baseUrl}}/bookings/{{pastBooking}}/reviews
{ "rating": 5, "comment": "Great stay, friendly staff." }
```

401 `{ "success": false, "message": "Not authorize to access this route" }`

## 4. R1: not before check-out

As user1:

```http
POST {{baseUrl}}/bookings/{{futureBooking}}/reviews
{ "rating": 5, "comment": "Great stay, friendly staff." }
```

400 `{ "success": false, "message": "You can review this hotel only after your check-out date" }`

## 5. R1: rating must be a whole number 1 to 5

As user1, on `pastBooking`, send each of `"rating": 0`, `"rating": 6` and `"rating": 3.5`:

```http
POST {{baseUrl}}/bookings/{{pastBooking}}/reviews
{ "rating": 6, "comment": "Great stay, friendly staff." }
```

400 `{ "success": false, "message": "Rating must be a whole number between 1 and 5" }` for all three. A comment over 1000 characters is also 400.

## 6. R1: only your own booking, then a real review

As user1, on user2's booking:

```http
POST {{baseUrl}}/bookings/{{user2Booking}}/reviews
{ "rating": 5, "comment": "Great stay, friendly staff." }
```

403 `{ "success": false, "message": "You can only review your own bookings" }`

As user1, on their own past booking:

```http
POST {{baseUrl}}/bookings/{{pastBooking}}/reviews
{ "rating": 5, "comment": "Great stay, friendly staff." }
```

201

```json
{
  "success": true,
  "data": {
    "_id": "...", "user": "<user1 id>", "hotel": "{{hotelId}}", "booking": "{{pastBooking}}",
    "rating": 5, "comment": "Great stay, friendly staff.", "createdAt": "...", "updatedAt": "..."
  }
}
```

`user` and `hotel` come from the booking, not the body. Save `data._id` as `review1`.

## 7. R2: one review per booking

Send the same request again:

```http
POST {{baseUrl}}/bookings/{{pastBooking}}/reviews
{ "rating": 4, "comment": "Second try" }
```

400 `{ "success": false, "message": "You have already reviewed this booking" }`

The controller checks first, and a unique index on `Review.booking` blocks it in the database too.

## 8. R4: a second review and the average

Log in as user2 and review their booking:

```http
POST {{baseUrl}}/bookings/{{user2Booking}}/reviews
{ "rating": 3, "comment": "Clean room, noisy at night." }
```

201. Save `data._id` as `review2`. Now, with no login:

```http
GET {{baseUrl}}/hotels/{{hotelId}}/reviews
```

200 `{ "success": true, "count": 2, "averageRating": 4, "data": [ ... ] }`, newest first, each review showing only the reviewer's `name` (`"Demo User Two"`, then `"Demo User One"`).

`GET {{baseUrl}}/hotels/{{hotelId}}` shows `"averageRating": 4, "reviewCount": 2`. `GET {{baseUrl}}/reviews/{{review1}}` shows one review, also public.

## 9. R3: my reviews only

Log in as user1:

```http
GET {{baseUrl}}/reviews
```

200 `{ "success": true, "count": 1, "data": [ { "rating": 5, "hotel": { "name": "เทพธารินทร์" }, ... } ] }`: only user1's review, not user2's. (An admin gets all reviews here.)

## 10. R3: edit my review, not someone else's

As user1:

```http
PUT {{baseUrl}}/reviews/{{review1}}
{ "rating": 4, "comment": "Good stay, breakfast could be better." }
```

200 with the new `rating` and `comment` (only these two fields can change). The average is recalculated: `GET {{baseUrl}}/hotels/{{hotelId}}/reviews` now gives `"count": 2, "averageRating": 3.5`.

As user1, on user2's review:

```http
PUT {{baseUrl}}/reviews/{{review2}}
{ "rating": 1 }
```

403 `{ "success": false, "message": "You can only edit your own reviews" }`. Editing is owner only; an admin gets the same 403.

## 11. R3: delete my review, not someone else's

As user1:

```http
DELETE {{baseUrl}}/reviews/{{review2}}
```

403 `{ "success": false, "message": "You can only delete your own reviews" }`

```http
DELETE {{baseUrl}}/reviews/{{review1}}
```

200 `{ "success": true, "data": {} }`. `GET {{baseUrl}}/hotels/{{hotelId}}` now shows `"averageRating": 3, "reviewCount": 1`.

## 12. R5: admin deletes any review

Log in as `admin@gmail.com`. `GET {{baseUrl}}/reviews` lists every user's reviews (here user2's). Then:

```http
DELETE {{baseUrl}}/reviews/{{review2}}
```

200 `{ "success": true, "data": {} }`. The hotel is back to `"averageRating": null, "reviewCount": 0`, and `GET {{baseUrl}}/hotels/{{hotelId}}/reviews` gives `"count": 0, "averageRating": null`.

## 13. Optional: deletes cascade to reviews

- Log in as user2, review `user2Booking` again (201), then `DELETE {{baseUrl}}/bookings/{{user2Booking}}` (200). `GET {{baseUrl}}/reviews/<that review id>` is now 404 `"Review not found"` and the hotel's `reviewCount` is back to 0.
- An admin `DELETE {{baseUrl}}/hotels/:id` deletes the hotel's bookings and their reviews.

## Status codes at a glance

| Case | Status |
| --- | --- |
| Review created | 201 |
| View, edit, delete OK | 200 |
| Not logged in | 401 |
| Someone else's booking or review (edit: admin too) | 403 |
| Booking or review id not found | 404 |
| Before check-out, second review, bad rating, comment over 1000 characters | 400 |

All endpoints are also in Swagger at `/api-docs` under **Review**, and the full contract is in `docs/api.md`. The automated version of these steps is `tests/collections/40-reviews.postman_collection.json` (`npm test -- reviews`).
