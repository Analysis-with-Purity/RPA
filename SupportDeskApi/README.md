# Support Desk API

Support ticketing backend for a perfume brand. Fronts **UiPath Orchestrator** (intake queue) and
**UiPath Data Fabric** (system of record). No database of its own.

Node 20+ · TypeScript · Express · zod · JWT

---

## 1. How it fits together

```
                      ┌──────────────── website / storefront
                      │  POST /api/tickets
                      ▼
              ┌───────────────────┐
              │  support-desk-api │
              └───────┬───────────┘
       intake         │                     everything else
   (single writer)    │                    (direct read/write)
                      ▼                              │
              Q_Intake (Orchestrator)                │
                      │                              │
        SupportTicketIntake robot                    │
                      │                              │
                      ▼                              ▼
              ┌──────────────────────────────────────────┐
              │  Data Fabric                             │
              │   SupportTicket · TicketComment          │
              │   TicketIntakeException                  │
              └──────────────────────────────────────────┘
```

**Ticket creation is the one path that goes through the queue.** The robot owns validation,
duplicate detection and the `Status = "Not Assigned"` guarantee, so there is exactly one writer
for new tickets. `POST /api/tickets` therefore returns **202 Accepted** with a ticket id, not the
stored record.

Everything after creation — assignment, status, comments, refunds — writes straight to Data
Fabric, because an agent typing a reply expects it to appear immediately.

---

## 2. Quick start

```bash
npm install
cp .env.example .env      # fill in UIPATH_CLIENT_ID / SECRET / JWT_SECRET
npm run build
npm start
```

Then:

```bash
curl localhost:8080/api/health            # liveness, no UiPath calls
curl localhost:8080/api/health/upstream   # proves token + Orchestrator + Data Fabric
curl localhost:8080/api/config            # what the website form should render
```

`npm run dev` runs from source with `--watch`.

### Getting a UiPath credential

The API authenticates as an **External Application** using client credentials — never a user PAT.

1. Automation Cloud → **Admin → External Applications → Add Application**
2. Application Type: **Confidential application**
3. **Add Scopes → Application Scopes** for:
   - Orchestrator: `OR.Queues.Read`, `OR.Queues.Write`, `OR.Folders.Read`, `OR.Assets.Read`
   - Data Fabric: schema read, data read, data write
4. Copy the App ID and App Secret into `UIPATH_CLIENT_ID` / `UIPATH_CLIENT_SECRET`
5. Copy the **exact** scope strings shown on the app page into `UIPATH_SCOPES`

Scope tokens for Data Fabric have changed name across releases. If the token request comes back
`400` mentioning scope, that is the cause — the error message says so explicitly.

### Getting an agent token

```bash
curl -X POST localhost:8080/api/auth/dev-token \
  -H 'content-type: application/json' \
  -d '{"subject":"amara@brand.com","name":"Amara Nwosu","roles":["supervisor"]}'
```

This route is **disabled when `NODE_ENV=production`**. In production, issue tokens from your
identity provider signed with the same `JWT_SECRET`, or swap `middleware/auth.ts` for JWKS
verification against your IdP.

---

## 3. API surface

### Public — the website calls these, no token

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/config` | Categories, subcategories, priorities, channels, SLA policies, field limits |
| `POST` | `/api/tickets` | Submit a ticket → **202** with `ticketId` |
| `GET` | `/api/tickets/:ticketId` | Status lookup. Returns `logged`, `processing` or `needs_attention` |
| `GET` | `/api/tickets/:ticketId/comments` | Customer-visible thread (internal notes excluded) |
| `POST` | `/api/tickets/:ticketId/replies?email=` | Customer reply — email must match the ticket |
| `POST` | `/api/tickets/:ticketId/satisfaction` | CSAT score 1–5, optional comment |

### Agent — `Authorization: Bearer <jwt>`

| Method | Path | Role | Purpose |
|---|---|---|---|
| `GET` | `/api/agent/tickets` | agent | Search: status, priority, category, agent, group, order, batch, SKU, refund, date range, `openOnly`, `breachedOnly` |
| `GET` | `/api/agent/tickets/:id` | agent | Full ticket |
| `GET` | `/api/agent/tickets/:id/transitions` | agent | Legal next statuses — render only valid buttons |
| `PATCH` | `/api/agent/tickets/:id` | agent | Edit fields (re-plans SLA on priority change) |
| `POST` | `/api/agent/tickets/:id/claim` | agent | Self-assign |
| `POST` | `/api/agent/tickets/:id/assign` | agent | Assign to someone; starts the SLA clock |
| `POST` | `/api/agent/tickets/:id/status` | agent | Transition status |
| `POST` | `/api/agent/tickets/:id/resolve` | agent | Resolve with notes + optional customer reply |
| `POST` | `/api/agent/tickets/:id/close` | agent | Close, optional CSAT |
| `POST` | `/api/agent/tickets/:id/escalate` | **supervisor** | Raise level/priority, re-plan SLA |
| `GET` | `/api/agent/tickets/:id/comments` | agent | Full thread including internal notes |
| `POST` | `/api/agent/tickets/:id/comments` | agent | Post reply or internal note |
| `POST` | `/api/agent/tickets/:id/refund/request` | agent | Request a refund |
| `POST` | `/api/agent/tickets/:id/refund/decision` | **supervisor** | Approve / reject |
| `POST` | `/api/agent/tickets/:id/refund/settle` | **supervisor** | Mark paid |

### Ops & metrics — `Authorization: Bearer <jwt>`

| Method | Path | Role | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | — | Liveness |
| `GET` | `/api/health/upstream` | — | Token + Orchestrator + all three entities |
| `GET` | `/api/metrics/summary` | agent | Counts by status/priority/category/group, refund totals, CSAT |
| `GET` | `/api/metrics/sla` | agent | Breach counts, due-soon, 20 worst offenders |
| `GET` | `/api/metrics/workload` | agent | Open + breached per agent |
| `GET` | `/api/metrics/batches` | agent | **Batch-code rollup — the recall / adverse-event view** |
| `GET` | `/api/metrics/intake-health` | agent | Intake failure counts by reason |
| `GET` | `/api/intake-exceptions` | **supervisor** | Failed submissions |
| `GET` | `/api/intake-exceptions/:id` | **supervisor** | One failure incl. raw payload |
| `POST` | `/api/intake-exceptions/:id/replay` | **supervisor** | **Re-queue from captured payload** |
| `POST` | `/api/intake-exceptions/:id/resolve` | **supervisor** | Mark triaged |

---

## 4. Domain rules worth knowing

**`Status` is never accepted from a client.** Not on intake, not anywhere. The automation writes
`Not Assigned`; agents change it only through `/status`, which enforces the transition table in
`config/catalog.ts`. An illegal move returns `409` naming the from/to pair.

**Category can raise priority.** `Health & Safety` forces **Urgent**, `Authenticity` forces
**High**. A customer reporting an allergic reaction as "Low" is still treated as Urgent, and the
response says the priority was raised and why.

**Health & Safety requires `batchCode`.** Refused at the boundary with a message telling the
customer where to find it. An untraceable adverse-event report is not worth accepting — without a
batch you cannot investigate or recall.

**Contactability is enforced.** `customerEmail` or `customerPhone` — at least one.

**Placeholders are treated as absent.** `""`, `"n/a"`, `"-"`, `"none"`, `"null"` normalise to
undefined, so an unfilled form field cannot fail email validation. This is the single most common
way an intake integration breaks.

**SLA breach is computed on read**, not trusted from a stored flag, so a ticket that went overdue
overnight reports correctly. The stored `SlaBreached` column stays the SLA workflow's to own.

**Refunds have their own state machine**, independent of ticket status:
`None → Requested → Approved → Processed`, with `Rejected` appealable back to `Requested`.
Approving money requires `supervisor`.

**First response is stamped automatically** the first time an agent posts a non-internal comment.

---

## 5. Error contract

RFC7807-shaped. Every response carries `reqId`, echoed in the `x-request-id` header.

```json
{
  "type": "https://support-desk.api/errors/validation_error",
  "title": "Request validation failed.",
  "status": 400,
  "code": "validation_error",
  "details": { "fieldErrors": [{ "field": "batchCode", "message": "..." }] },
  "reqId": "dc833c56-d196-4302-9632-7d2f5a54aa55"
}
```

| Status | Code | Meaning |
|---|---|---|
| 400 | `validation_error` | Body or query failed schema. `details.fieldErrors` is field-addressable |
| 401 | `unauthorized` | Missing, invalid or expired agent token |
| 403 | `forbidden` | Authenticated but wrong role |
| 404 | `not_found` | No such ticket / comment / exception |
| 409 | `conflict` | Illegal status or refund transition, or duplicate queue reference |
| 422 | `business_rule_violation` | Well-formed but breaks a rule |
| 429 | `rate_limited` | Intake rate limit |
| 502 | `upstream_error` | UiPath unreachable or rejected the call |

A `502` is never silent: the message names which upstream failed and, for the common
misconfigurations, what to change.

---

## 6. Security posture

- **JWT pinned to HS256.** An `alg: none` or RS256 token signed with a key we do not control is
  rejected. Issuer and audience are both verified.
- **Customer replies require the email on file.** A wrong email returns the *same* 404 as a
  missing ticket — knowing a ticket id alone reveals nothing.
- **Two projections.** `toPublicTicketDto` strips internal notes, the assigned agent's email,
  audit columns and AI scoring. Customers never see the agent-facing shape.
- **Internal notes are filtered server-side**, in the query, not in the client.
- **Secrets never logged.** `authorization`, `cookie`, `client_secret`, `access_token`,
  `password` and `customerPhone` are redacted by the logger.
- **Helmet, CORS allowlist, 256 kb body cap, per-IP intake rate limit.**
- **Graceful shutdown** drains in-flight requests, so a rolling deploy cannot abort a submission
  after the queue item was created but before the response was sent.

---

## 7. Configuration

Every variable is in `.env.example`. Two deserve attention:

**`DATA_FABRIC_API_SEGMENT`** — the docs specify `datafabric_/api`, but this tenant's own
`EntitiesStore.json` reports `dataservice_/entities`. The two have coexisted across releases, so
the segment is configurable. If `/api/health/upstream` shows the Data Fabric checks returning 404,
switch to `dataservice_/api`. The health response says exactly this in its `hint`.

**`UIPATH_FOLDER_KEY`** — preferred over `UIPATH_FOLDER_PATH`, because `X-UIPATH-FolderKey`
accepts the GUID directly and avoids resolving a numeric folder id per request.

---

## 8. Prerequisites in UiPath

| Requirement | Status |
|---|---|
| `SupportTicket` entity | exists — extended with 9 commerce/refund fields |
| `TicketIntakeException` entity | exists |
| `TicketComment` entity | **must exist for comment endpoints** |
| `Q_Intake` queue in `Shared` | exists, `AcceptAutomaticallyRetry = false` |
| `SupportTicketIntake` process + queue trigger | deployed and enabled |
| External Application with the scopes above | **you create this** |

`GET /api/health/upstream` reports each entity individually, so a missing one is immediately
obvious rather than surfacing as a confusing 404 on first use.

---

## 9. Deploying

Stateless and horizontally scalable — the only shared state is the cached UiPath token, held
per-process. Any container host works.

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

```bash
npm ci && npm run build && docker build -t support-desk-api .
```

Point your platform's health probe at `/api/health` (liveness) and `/api/health/upstream`
(readiness). Set `CORS_ORIGINS` to your real storefront origins — never `*` in production.

---

## 10. Layout

```
src/
├── config/
│   ├── env.ts          zod-validated environment; refuses to boot on bad config
│   └── catalog.ts      categories, SLA policies, status machine, routing groups
├── uipath/
│   ├── token.ts        client-credentials with caching + concurrent-call coalescing
│   ├── dataFabric.ts   entity query/insert/update/delete, casing-tolerant
│   └── orchestrator.ts AddQueueItem + queue transaction lookup
├── domain/
│   ├── schemas.ts      every request shape, mirroring Data Fabric column limits
│   ├── ticket.ts       record → DTO, plus the public projection
│   ├── sla.ts          SLA planning and read-time breach evaluation
│   └── ids.ts          ticket id generation (Crockford base32)
├── services/           intake · tickets · comments · refunds · metrics · exceptions
├── middleware/         auth (JWT + roles) · validation · error handler
├── routes/             public · agent · ops
├── app.ts
└── index.ts
```
