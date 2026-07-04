# Ranch Companion

A multi-tenant farm and livestock management platform with role-based dashboards for farmers, vets, farm managers, and clients — including health record tracking, breeding and movement logs, and an AI-powered farm assistant.

## Features

- **Role-based access** — separate dashboards and permissions for farmers, vets, farm managers, and clients
- **Livestock tracking** — health records, breeding records, and movement history per animal
- **AI farm assistant** — chat-based farming advice and automated health record analysis
- **QR-based traceability** — quick lookup and identification for individual animals
- **Team & access management** — role requests, approvals, and audit logging for farm access

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Data & Auth**: Supabase (Postgres, Auth, Edge Functions)
- **State/data fetching**: TanStack Query
- **Testing**: Vitest, React Testing Library
- **CI/CD**: GitHub Actions (lint, test, build on every push/PR)

## Getting Started

Requires [Node.js](https://nodejs.org/) and npm.

```sh
# Clone the repository
git clone https://github.com/bigsmoke256/ranch-companion-v2.git
cd ranch-companion-v2

# Install dependencies
npm install

# Start the local dev server
npm run dev
```

### Environment variables

You'll need a Supabase project. Copy `.env.example` (or create `.env`) with:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Available scripts

```sh
npm run dev            # start local dev server
npm run build           # production build
npm run lint            # run ESLint
npm run test            # run test suite once
npm run test:watch      # run tests in watch mode
npm run test:coverage   # run tests with coverage report
```

## Project Status

Actively developed. Current focus areas:
- Code-splitting to reduce bundle size
- Accessibility audit
- Expanding automated test coverage

## License

Private project — all rights reserved.
