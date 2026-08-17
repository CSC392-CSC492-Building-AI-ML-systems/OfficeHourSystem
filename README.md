# HourSpace

HourSpace is an office-hour management system for University of Toronto
Mississauga computer science courses. It supports course scheduling, student
interest, help queues, classlist management, and TCard-based check-ins.

## Technology

- Next.js 16
- React 19
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS
- Docker
- pnpm

## How to run locally as a developer

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

Optionally load demo accounts and one CSC108 offering:

```bash
pnpm db:seed
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

Local identity comes from `DEV_UTORID` in `.env` (no Shibboleth). After
seeding, use `teststudent`, `testta`, `testinstructor`, or `testadmin`. Change
the value and restart `pnpm dev` to switch users. `testadmin` must stay listed
in `adminList.txt` to reach `/admin`.

Production authenticates through Apache + Shibboleth and injects a `utorid`
header. See `config/apache-shibboleth.conf`.

## Available Commands

| Command                 | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `pnpm dev`              | Start the development server            |
| `pnpm build`            | Create a production build               |
| `pnpm start`            | Start the production server             |
| `pnpm typecheck`        | Run TypeScript checks                   |
| `pnpm lint`             | Run ESLint                              |
| `pnpm test`             | Run unit and integration tests          |
| `pnpm test:unit`        | Run unit tests                          |
| `pnpm test:integration` | Run integration tests                   |
| `pnpm db:setup`         | Start Postgres and apply migrations     |
| `pnpm db:migrate`       | Apply Prisma migrations                 |
| `pnpm db:seed`          | Load demo users and one course offering |

## Routes

After login, admins land on `/admin` and everyone else on `/course`.

| Path                                    | Who                                                   |
| --------------------------------------- | ----------------------------------------------------- |
| `/`                                     | Public landing page                                   |
| `/course`                               | Course picker                                         |
| `/course/my-queue`                      | Student's live queue tickets                          |
| `/course/stats`                         | Instructor course stats (picker and overview)         |
| `/course/stats/sessions?offering=`      | Per-session stats list                                |
| `/course/stats/session?session=`        | Single session stats                                  |
| `/course/[offeringPublicId]/student`    | Student dashboard for one offering                    |
| `/course/[offeringPublicId]/instructor` | Instructor workspace (staff, queues, schedule, scan)  |
| `/admin`                                | Platform admin (offerings, classlists, impersonation) |

## Production

On the server, with a clone of this repo and a production `.env` in the repo
root:

```bash
bash scripts/deploy.sh
```

The script pulls the latest `master`, starts Postgres, applies Prisma
migrations, and rebuilds the app container. GitHub Actions on `master` runs
the same script on the self-hosted runner at **hourspace.utm.utoronto.ca**.

## Project Structure

```text
src/
  app/          Pages, UI components, and API routes
  actions/      Server actions
  services/     Application workflows
  lib/          Queries, authentication, and shared utilities
prisma/         Prisma schema and migrations
scripts/        Development seeds and deployment scripts
config/         Apache / Shibboleth configuration examples
public/         Static assets
```

## Contributing

Before starting a substantial change, contact a project maintainer or Professor
Rutwa Engineer to confirm the scope and ownership of the work.

Use a dedicated branch for each change and keep pull requests focused. Run
`pnpm typecheck`, `pnpm lint`, and `pnpm test` before requesting review.

## Contact

For project access, contribution questions, or deployment coordination, contact
the repository maintainers or Professor Rutwa Engineer.
