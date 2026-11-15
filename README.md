# TacoCat Hotel Booking API

REST API for booking hotel stays (up to 3 nights) and reviewing hotels after check-out. Final project for 2110503 Software Development Practice, group TacoCat.

## Run it

```bash
npm install
cp config/config.env.example config/config.env   # then fill in MONGO_URI and JWT_SECRET
npm run seed                                      # optional demo data: admin@gmail.com, user1@gmail.com, user2@gmail.com (password 12345678)
npm run dev
```

API at `http://localhost:5000/api/v1`, Swagger docs at `http://localhost:5000/api-docs`.

## Test it

```bash
npm test
```

Runs every Postman collection in `tests/collections` with Newman against an in-memory MongoDB. No database or secrets needed.

## Docs

- [AGENTS.md](AGENTS.md): how to work on this repo (rules, testing, git, versioning)
- [docs/requirements.md](docs/requirements.md): what the system must do
- [docs/api.md](docs/api.md): endpoint contract
- [docs/tasks.md](docs/tasks.md): task board
- [CHANGELOG.md](CHANGELOG.md)

Changes from the original Assignment 7 code: compare `assignment-7-base...main` on GitHub.
