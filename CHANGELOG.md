# Changelog

All notable changes to this project. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Add new versions at the top.

## [0.1.0] - 2026-11-13

### Added
- Project base imported from Assignment 7.2 (hospitals, appointments, auth, ownership rules), tagged `assignment-7-base`.
- Security middleware (helmet, rate limit, NoSQL and XSS sanitizing), logout and Swagger docs from Assignment 10.
- `npm test`: Newman collections against an in-memory MongoDB, with a smoke collection.
- CI on pull requests and `main`; automatic `v<version>` tags and releases.
- Project docs: requirements, API contract, task board.
