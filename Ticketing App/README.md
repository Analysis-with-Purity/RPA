# Ticketing App

Customer portal, agent console and the `/api/v1` integration layer for the support-ticket
platform. Next.js 16 · React 19 · TypeScript · Tailwind v4 · TanStack Query.

> **Architecture, layer interactions and full setup are in the [root README](../README.md).**
> This file covers only what you need to work inside this package.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in UIPATH_ORG / UIPATH_TENANT / UIPATH_SECRET / UIPATH_FOLDER_ID
npm run uipath:check         # validates token + folder + queue, never prints the secret
npm run dev
```

Open <http://localhost:3000>. The customer portal runs standalone; only `/agent` needs the
`SupportDeskApi` service on `:8080`.

If UiPath is not configured the app still boots — ticket creation reports `uipath.skipped`
rather than failing.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server on `:3000` |
| `npm run build` | Standalone production build |
| `npm start` | Serve the production build |
| `npm run dist` | Assemble a self-contained `dist/` → `node dist/server.js` |
| `npm run uipath:check` | Verify Orchestrator connectivity, list reachable folders, confirm the queue |
| `npm run lint` | ESLint |

## Layout

```
src/
├── app/
│   ├── (marketing)/          landing page
│   ├── (auth)/               login
│   ├── (customer)/           dashboard, ticket list, ticket detail, new ticket
│   ├── agent/                back-office console (needs SupportDeskApi)
│   └── api/v1/               health · meta · tickets · dashboard/stats
│                             tickets/[id] · /activity · /messages · /start-process
├── components/               ui primitives, feature components by domain
├── lib/
│   ├── server/               server-only UiPath integration — see below
│   ├── api/ + query/         customer-portal data layer (TanStack Query)
│   ├── agent-api/            Support Desk API client for /agent
│   ├── mock-data/            reference data: categories, departments, agents
│   └── types/                shared domain types
└── hooks/
```

### The server integration layer

Everything that talks to UiPath lives in `src/lib/server/` and is server-only —
`UIPATH_SECRET` has no `NEXT_PUBLIC_` prefix, so it never reaches the browser.

| File | Responsibility |
|---|---|
| `uipath.ts` | Orchestrator queue trigger on ticket submit |
| `orchestration.ts` | Queue names, command references, and the intake / triage / status / assign / escalate payloads |
| `data-fabric.ts` | Entity query, insert and update against the Data Fabric REST API |
| `ticket-repository.ts` | Reads, filtering, sorting, activity timeline, dashboard aggregation |
| `ticket-mapper.ts` | Data Fabric record ↔ app `Ticket` shape |
| `http.ts` | JSON envelope, CORS headers, preflight |

Two conventions worth knowing before you change anything here:

**Queue payload keys are fixed by the robot, not by this code.** The intake workflow reads
`CustomerName` / `CustomerEmail` / `CreatedDate`. An earlier version sent `RequesterName` /
`RequesterEmail` / `CreatedAt`; the robot ignored them silently and tickets were created with
blank customer details. See `uipath.ts:49-59`.

**The API never writes a new ticket.** Creation goes through the queue so the robot stays the
single writer and owns the `Status = "Not Assigned"` guarantee. `POST /api/v1/tickets` returns
`202`, and `GET /api/v1/tickets/{id}` returns `404` until the workflow has run. `PATCH` likewise
queues a command and returns the *current* ticket rather than an optimistic one.

## Docs

Design and build guides live in [`docs/`](docs/) — architecture reference, Studio Web build
walkthroughs, the REST API reference, and the [BPMN model](docs/bpmn/).

## Note on Next.js version

This project targets **Next.js 16**, which has breaking changes relative to older releases —
notably that route handler `params` is a `Promise` and must be awaited. Check
`node_modules/next/dist/docs/` before relying on remembered API shapes.
