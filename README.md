# HourSpace

HourSpace is an office-hour management system for University of Toronto
Mississauga computer science courses. It supports course scheduling, student
interest, help queues, classlist management, and TCard-based check-ins.

## Features

- Office-hour scheduling and recurring sessions
- Upcoming session and interest tracking
- Help Centre check-in and queue management
- TCard-based student lookup
- Course offering and classlist management
- Office-hour attendance and course statistics

## Technology

- Next.js 16
- React 19
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS
- Docker

## Getting Started

### Requirements

- Node.js 22 or later
- Corepack
- Docker with Docker Compose

### Installation

Enable Corepack and install the project dependencies:

```bash
corepack enable
pnpm install
```

Create a local environment file from the provided example:

```bash
cp .env.example .env
```

Use `.env.example` as the configuration reference and provide values suitable
for your local environment. Do not commit `.env` or any credentials.

Set up the local PostgreSQL service and apply the checked-in migrations:

```bash
pnpm db:setup
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Available Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Start the production server |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm lint` | Run ESLint |

## Continuous Deployment

The repository includes a continuous deployment workflow. Updates merged into
`master` are deployed through the configured GitHub Actions self-hosted runner.

## Project Structure

```text
src/
  app/          Pages, UI components, and API routes
  actions/      Server actions
  services/     Application workflows
  lib/          Queries, authentication, and shared utilities
prisma/         Prisma schema and migrations
scripts/        Development and deployment scripts
config/         Server configuration examples
public/         Static assets
```

## Contributing

Before starting a substantial change, contact a project maintainer or Professor
Rutwa Engineer to confirm the scope and ownership of the work.

Use a dedicated branch for each change and keep pull requests focused. Run the
relevant type checks and lint checks before requesting review.

## Contact

For project access, contribution questions, or deployment coordination, contact
the repository maintainers or Professor Rutwa Engineer.
