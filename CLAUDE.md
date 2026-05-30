# MediSync Zambia — Phase 1

## What this is
A simple webapp for Zambian clinics. Doctors register patients,
record visits with vitals and diagnosis, and write prescriptions.
Online only. No offline yet.

## Tech stack
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL
- Frontend: Next.js 14 with App Router + TypeScript + Tailwind CSS
- Auth: JWT tokens
- Database: PostgreSQL running in Docker

## Rules
- Use UUIDs for all primary keys, never integers
- Every table has created_at and updated_at columns
- NRC format: 6 digits / 2 digits / 1 digit (example: 123456/78/1)
- Zambian phone: starts with +260 or 0, then 9 digits
- Use Pydantic v2 for schemas
- Hash passwords with bcrypt
- Enable CORS for http://localhost:3000

## What NOT to build yet
- Offline sync
- Mobile app
- Referrals
- Lab/pharmacy modules
- Multi-country support

Stay focused on the simple core only.