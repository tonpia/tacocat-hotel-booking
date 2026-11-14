# Working on this repo

Hotel Booking REST API for the 2110503 Software Development Practice final project (group TacoCat). Two people:

- **Person A** owns the base system: auth, hotels, bookings, seed data, base diagrams.
- **Person B** owns the hotel review feature (R1 to R5) and its tests.

Submission deadline: **Mon 16 Nov 2026 23:59 (Asia/Bangkok)**. After Mon 16 Nov 12:00 only fixes, no new features.

## Read before changing code

| Document | Read it when you need to... |
| --- | --- |
| `docs/requirements.md` | Know what a card must do (requirement IDs FR1 to FR9, R1 to R5, NFR). |
| `docs/api.md` | Add or change an endpoint. This is the contract both people code against. |
| `docs/tasks.md` | Pick work, see who owns what, update a card's status. |
| `CHANGELOG.md` | Add your entry and bump the version (see Versioning). |

## Stack and layout

Node.js 22, Express 5, Mongoose 8 (MongoDB), JWT auth (bcryptjs, cookie + bearer), helmet, rate limit, NoSQL/XSS sanitizing, Swagger at `/api-docs`.

| Path | Contents |
| --- | --- |
| `server.js` | App setup, middleware, route mounting. Exports `app`; only listens when run directly. |
| `models/`, `controllers/`, `routes/` | One file per resource. |
| `middleware/auth.js` | `protect` (requires login) and `authorize(...roles)`. Use these; do not write new auth checks. |
| `middleware/security.js` | Sanitizers. |
| `config/swagger.js` | OpenAPI docs. Document every endpoint you add. |
| `config/config.env` | Real settings, gitignored. Copy from `config/config.env.example`. |
| `seeder.js`, `_data/` | Demo data for the real database (`npm run seed`). |
| `tests/` | Test runner, fixtures and Postman collections (see Testing). |

The code was imported from Assignment 7.2 (tag `assignment-7-base`) and Assignment 10. `git diff assignment-7-base..main` is the "code changed from the original" shown in the final presentation, so keep changes readable: rename and refactor in their own commits, not mixed with features.

## Rules every change follows

- Response shape: `{ success: true, data, ...extra }` or `{ success: false, message }`.
- Status codes: 200 OK, 201 created, 400 invalid input or broken business rule, 401 not logged in or bad credentials, 403 logged in but not allowed (not the owner, wrong role), 404 not found.
- Enforce rules on the server (model validators, unique indexes, ownership checks in controllers). Admin bypasses ownership checks unless the requirement says otherwise.
- Users only ever see their own bookings and reviews in "my" lists; admins see all.
- Never commit secrets, tokens, real connection strings or `config/config.env`.

## Testing

`npm test` starts an in-memory MongoDB, seeds it from `tests/fixtures/*.js` (in file-name order), starts the API on a random port and runs every `tests/collections/*.postman_collection.json` with Newman. The database is reset before each collection. No real database or secrets needed. `npm test -- reviews` runs only collections whose file name contains `reviews`.

| File | Owner |
| --- | --- |
| `tests/collections/00-smoke...` | shared, keep passing |
| `tests/collections/10-auth...`, `20-hotels...`, `30-bookings...` | A |
| `tests/collections/40-reviews...` | B |
| `tests/fixtures/10-base.js` | A (users, hotels, bookings; values usable as `{{name}}` in collections) |
| `tests/fixtures/40-reviews.js` | B (extra data reviews need, e.g. bookings with a past check-out) |

Every endpoint you add or change gets tests for the success case and each rule's failure case. A PR is ready only when `npm test` passes locally and in CI.

## Git workflow

- Never push to `main`. Branch from `main` and open a PR to `main`. No review is required.
- Merging: turn on auto-merge as soon as the PR is open (`gh pr merge <number> --auto --squash --delete-branch`). GitHub squash-merges it as soon as the required checks `test` and `version` pass. If a check fails, fix it on the branch; the PR merges once it is green. Set your card to `done` in `docs/tasks.md` in the PR itself, since it merges without further steps.
- Branch names: `a/<card-id>-<slug>` or `b/<card-id>-<slug>`, e.g. `a/A4-booking-crud`.
- Start a card only when everything in its "Depends on" column is `done` (merged). PRs merge within minutes of passing CI, so there is no need to stack branches.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, `ci:`), small and focused. Scope optional, e.g. `feat(bookings): limit stays to 3 nights`.
- Commit under your own git identity (your name and the email on your GitHub account) so the GitHub Contributors graph shows who did what. No co-author trailers or tool attribution lines in commits or PR descriptions.
- In the same PR, update your card in `docs/tasks.md` (status, branch, PR link). Only edit your own cards.
- Take turns. A and B open PRs alternately: if the newest PR in the repo is yours, wait for the other person's next PR before opening another feature PR. Exceptions: the other person has no card they can start, or they have opened no PR in the last 8 hours (they are idle), so you go instead of stalling. Merge in the same alternating order where possible, so `main` and the Contributors graph show both people working throughout.

## Versioning

The project uses [Semantic Versioning](https://semver.org/). The version lives in `package.json` (and `package-lock.json`); `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/).

- Every PR that changes behaviour bumps the version and adds a `CHANGELOG.md` section for that version:
  - `feat` (new endpoint or capability): minor, e.g. 0.3.0 to 0.4.0
  - `fix`: patch, e.g. 0.4.0 to 0.4.1
  - a breaking change to an endpoint in `docs/api.md` before 1.0.0: minor, with "BREAKING" in the changelog entry
  - `docs`, `test`, `ci`, `chore`, `refactor` only: no bump, no changelog section needed
- Bump with `npm version <major|minor|patch> --no-git-tag-version` so the lock file matches.
- If `main` moved to the same or a higher version while your PR was open, rebase and bump again from `main`'s version.
- Tags are created automatically: when `main` gets a version with no tag, CI tags it `v<version>` and makes a GitHub release.
- 1.0.0 is the submitted version.
