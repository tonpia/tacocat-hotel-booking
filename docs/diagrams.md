# Diagrams for the changed base system (A8)

Use case, class (UML profile) and sequence diagrams for the base parts that changed since Assignment 7: hotels, bookings with check-in and check-out dates, and auth with `tel`. Reviews are not included. Diagrams are Mermaid, so GitHub renders them; paste them into the slides as images. Endpoints and rules are in `docs/api.md`.

## 1. Use case diagram

Actors: a visitor who is not logged in, a registered user, and an admin (an admin can do everything a user can).

```mermaid
flowchart LR
  visitor([Visitor])
  user([User])
  admin([Admin])

  subgraph system[Hotel Booking API]
    register(Register)
    login(Log in)
    logout(Log out)
    viewhotels(View hotels and one hotel)
    book(Book a hotel for 1 to 3 nights)
    mybookings(View my bookings)
    editbooking(Change dates of my booking)
    cancelbooking(Delete my booking)
    managehotels(Add, change and delete hotels)
    allbookings(View, change and delete any booking)
  end

  visitor --- register
  visitor --- login
  visitor --- viewhotels
  user --- logout
  user --- viewhotels
  user --- book
  user --- mybookings
  user --- editbooking
  user --- cancelbooking
  admin --- managehotels
  admin --- allbookings
  admin -. also can .-> user
```

## 2. Class diagram (UML profile)

Stereotypes used as the profile: `<<model>>` a Mongoose schema stored in MongoDB, `<<controller>>` request handlers, `<<middleware>>` Express middleware that runs before a controller. Associations come from `ref` fields; the `bookings` link on Hotel is a virtual populate.

```mermaid
classDiagram
  class User {
    <<model>>
    +ObjectId _id
    +String name
    +String tel
    +String email [unique]
    -String password [hashed, select false]
    +String role [user or admin]
    +Date createdAt
    +getSignedJwtToken() String
    +matchPassword(entered) Boolean
  }
  class Hotel {
    <<model>>
    +ObjectId _id
    +String name
    +String address
    +String district
    +String province
    +String postalcode
    +String tel
    +String region
  }
  class Booking {
    <<model>>
    +ObjectId _id
    +Date checkInDate
    +Date checkOutDate [after check-in, max 3 nights]
    +Date createdAt
    +nights() Integer [virtual]
  }
  class AuthController {
    <<controller>>
    +register()
    +login()
    +getMe()
    +logout()
  }
  class HotelController {
    <<controller>>
    +getHotels()
    +getHotel()
    +createHotel()
    +updateHotel()
    +deleteHotel()
  }
  class BookingController {
    <<controller>>
    +getBookings()
    +getBooking()
    +addBooking()
    +updateBooking()
    +deleteBooking()
  }
  class AuthMiddleware {
    <<middleware>>
    +protect()
    +authorize(roles)
  }

  User "1" --> "0..*" Booking : makes
  Hotel "1" --> "0..*" Booking : has
  AuthController ..> User : uses
  HotelController ..> Hotel : uses
  BookingController ..> Booking : uses
  BookingController ..> Hotel : checks it exists
  AuthMiddleware ..> User : loads from token
  HotelController ..> AuthMiddleware : admin only writes
  BookingController ..> AuthMiddleware : login required
```

Rules on the classes: deleting a Hotel deletes its Bookings; a Booking is 1 to 3 nights (`checkOutDate` after `checkInDate`); users only touch their own Bookings, admins any.

## 3. Sequence diagrams

### 3.1 Register

```mermaid
sequenceDiagram
  actor V as Visitor
  participant R as Router /auth
  participant C as AuthController
  participant U as User model
  participant DB as MongoDB

  V->>R: POST /auth/register {name, tel, email, password}
  R->>C: register()
  C->>U: create(name, tel, email, password)
  U->>U: validate (tel required, email format, password min 6)
  U->>U: bcrypt hash password
  U->>DB: save user
  alt invalid or email already used
    C-->>V: 400 {success false, message}
  else saved
    C->>U: getSignedJwtToken()
    C-->>V: 201 {success true, token} and token cookie
  end
```

### 3.2 Log in

```mermaid
sequenceDiagram
  actor V as Visitor
  participant C as AuthController
  participant U as User model
  participant DB as MongoDB

  V->>C: POST /auth/login {email, password}
  alt email or password missing
    C-->>V: 400 {success false, message}
  else
    C->>DB: find user by email (with password)
    alt unknown email
      C-->>V: 401 Invalid credentials
    else found
      C->>U: matchPassword(password)
      alt wrong password
        C-->>V: 401 Invalid credentials
      else match
        C->>U: getSignedJwtToken()
        C-->>V: 200 {success true, token} and token cookie
      end
    end
  end
```

### 3.3 Create a booking

```mermaid
sequenceDiagram
  actor U as User
  participant M as AuthMiddleware
  participant C as BookingController
  participant H as Hotel model
  participant B as Booking model
  participant DB as MongoDB

  U->>M: POST /hotels/:hotelId/bookings {checkInDate, checkOutDate} + token
  alt no or bad token
    M-->>U: 401 Not authorize
  else logged in
    M->>C: addBooking() with req.user
    C->>H: findById(hotelId)
    alt hotel not found
      C-->>U: 404 No hotel with the id of ...
    else found
      C->>B: create(user = req.user, hotel, dates)
      B->>B: validate check-out after check-in, 1 to 3 nights
      alt invalid dates
        C-->>U: 400 {success false, message}
      else valid
        B->>DB: save booking
        C-->>U: 201 {success true, data: booking with nights}
      end
    end
  end
```

### 3.4 Edit a booking (change dates)

```mermaid
sequenceDiagram
  actor U as User or Admin
  participant M as AuthMiddleware
  participant C as BookingController
  participant B as Booking model
  participant DB as MongoDB

  U->>M: PUT /bookings/:id {checkInDate, checkOutDate} + token
  alt no or bad token
    M-->>U: 401 Not authorize
  else logged in
    M->>C: updateBooking()
    C->>DB: findById(id)
    alt missing or invalid id
      C-->>U: 404 No booking with the id of ...
    else found
      alt not the owner and not admin
        C-->>U: 403 not authorized to update this booking
      else owner or admin
        C->>B: set the dates, save()
        B->>B: validate both dates, 1 to 3 nights
        alt invalid
          C-->>U: 400 {success false, message}
        else valid
          B->>DB: save
          C-->>U: 200 {success true, data: booking}
        end
      end
    end
  end
```

### 3.5 Delete a booking

```mermaid
sequenceDiagram
  actor U as User or Admin
  participant M as AuthMiddleware
  participant C as BookingController
  participant DB as MongoDB

  U->>M: DELETE /bookings/:id + token
  alt no or bad token
    M-->>U: 401 Not authorize
  else logged in
    M->>C: deleteBooking()
    C->>DB: findById(id)
    alt missing or invalid id
      C-->>U: 404 No booking with the id of ...
    else found
      alt not the owner and not admin
        C-->>U: 403 not authorized to delete this booking
      else owner or admin
        C->>DB: booking.deleteOne()
        C-->>U: 200 {success true, data: {}}
      end
    end
  end
```
