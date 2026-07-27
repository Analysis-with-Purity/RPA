# UiPath Integration — Ticketing REST API (PoC)

This app now exposes a REST API under `/api/v1` that UiPath robots can call with
the **HTTP Request** activity to read and write tickets.

> **Proof-of-concept caveats**
> - **No authentication.** Every endpoint is open. Keep the URL private and the
>   tunnel short-lived. Do not expose real data this way.
> - **No database.** Data lives in server memory and **resets on restart**.
> - Both the web UI and the API share the same in-memory store, so a ticket a
>   robot creates immediately appears in the web app (and vice-versa).

---

## 1. Make the API reachable from UiPath Cloud

UiPath **Cloud** robots run in UiPath's cloud, so they need a **public HTTPS URL**.
Your local dev server (`http://localhost:3000`) is not reachable from there.

**Option A — Quick tunnel (fastest for a PoC).** With the app running (`npm run dev`
or `npm run build && npm start`), expose it:

```bash
# Cloudflare (no signup):
cloudflared tunnel --url http://localhost:3000

# or ngrok:
ngrok http 3000
```

Either prints a public URL like `https://random-name.trycloudflare.com`. That is
your **API base URL**; the API root is `<base>/api/v1`.

**Option B — Deploy it as a container (recommended for a stable URL).** A
production `Dockerfile` is included (multi-stage, runs Next's standalone server).

```bash
docker build -t purity-support .
docker run -p 3000:3000 purity-support
# app + API now on http://localhost:3000 ; verify:
curl http://localhost:3000/api/v1/health
```

Push that image to any container host that gives you a public HTTPS URL —
**Azure Container Apps**, AWS App Runner / ECS, **Google Cloud Run**, Render,
Fly.io, or a VM running Docker. Use a **single always-on instance** (not scaled
to zero / not serverless-with-multiple-instances) so the in-memory PoC data
stays consistent. That host's URL + `/api/v1` is your API base.

> No Docker? `npm run dist` produces a self-contained `./dist`; run it anywhere
> with `node dist/server.js` (listens on `$PORT`, default 3000).

> If the API must stay on a private network, run a **self-hosted / unattended
> UiPath robot** on a machine that can reach it, instead of a cloud robot.

---

## 2. Endpoint reference

Base URL: `{{apiBase}}` = `<public-url>/api/v1`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| GET | `/meta` | Valid category / department / agent IDs, statuses, priorities |
| GET | `/tickets` | List tickets (query: `search`, `status`, `priority`, `departmentId`, `sort`) |
| POST | `/tickets` | Create a ticket |
| GET | `/tickets/{id}` | Get one ticket |
| PATCH | `/tickets/{id}` | Update status / priority / assignment |
| GET | `/tickets/{id}/messages` | List conversation messages |
| POST | `/tickets/{id}/messages` | Add a message (as customer or agent) |
| GET | `/tickets/{id}/activity` | List the audit/activity timeline |
| GET | `/dashboard/stats` | Aggregate counts + trend |

Responses are JSON. Successful bodies are wrapped as `{ "data": ... }`; errors are
`{ "error": "message" }` with a `4xx` status. Lists look like
`{ "data": { "tickets": [...], "total": 12 } }`.

### Valid reference values (from `GET /meta`)

- **categoryId**: `cat-technical`, `cat-billing`, `cat-account`, `cat-feature`, `cat-bug`, `cat-general`
- **departmentId**: `dept-support`, `dept-billing`, `dept-engineering`, `dept-sales`
- **agentId**: `agent-mira`, `agent-daniel`, `agent-lena`, `agent-tobi`, `agent-priya`
- **status**: `submitted`, `assigned`, `in_progress`, `awaiting_customer`, `resolved`, `closed`
- **priority**: `low`, `medium`, `high`, `urgent`

---

## 3. Request / response examples

### Create a ticket

```
POST {{apiBase}}/tickets
Content-Type: application/json

{
  "subject": "Nightly data sync failed",
  "description": "The 02:00 sync did not complete. Filed automatically by UiPath.",
  "categoryId": "cat-technical",
  "departmentId": "dept-engineering",
  "priority": "high",
  "tags": ["automation", "sync"],
  "requesterName": "Batch Monitor",
  "requesterEmail": "monitor@yourco.com"
}
```

Response `201`:

```json
{ "data": { "id": "TCK-2038", "status": "submitted", "priority": "high", "...": "..." } }
```

Grab `data.id` for the follow-up calls.

### Update status / assign an agent

```
PATCH {{apiBase}}/tickets/TCK-2038
Content-Type: application/json

{ "status": "in_progress", "assignedAgentId": "agent-priya", "actorName": "UiPath Bot" }
```

### Post an agent reply

```
POST {{apiBase}}/tickets/TCK-2038/messages
Content-Type: application/json

{ "body": "Our team has been paged and is investigating.", "authorRole": "agent", "authorName": "UiPath Bot" }
```

### Find tickets to work (e.g. all urgent, highest priority first)

```
GET {{apiBase}}/tickets?priority=urgent&sort=priority
```

---

## 4. Configure the UiPath HTTP Request activity

1. Add the **HTTP Request** activity (package: `UiPath.Web.Activities`).
2. **Endpoint**: `{{apiBase}}/tickets` (build the full URL; store `apiBase` in a
   UiPath **Asset** or config so you can swap the tunnel/deploy URL easily).
3. **Method**: `GET` / `POST` / `PATCH` as per the table above.
4. **Headers**: add `Content-Type: application/json` for POST/PATCH.
5. **Body** (POST/PATCH): the JSON string shown above (use `String.Format` or a
   serialized dictionary to inject dynamic values).
6. **Response**: capture into a `String` output, then **Deserialize JSON**
   (`UiPath.WebAPI.Activities`) into a `JObject` and read `data.id`, `data.status`, etc.
7. Check the **status code** output: `200`/`201` = success; `404` = not found;
   `422` = validation error (read `error` for the reason).

**Typical robot flow**
1. `POST /tickets` → read `data.id`.
2. Do the automation work.
3. `PATCH /tickets/{id}` to move status to `resolved`.
4. `POST /tickets/{id}/messages` to log an agent note.

---

## 5. Local smoke test (simulate the robot)

```bash
curl -s http://localhost:3000/api/v1/health

# create
curl -s -X POST http://localhost:3000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test from curl","description":"hello from the robot loop","categoryId":"cat-technical","departmentId":"dept-engineering","priority":"high"}'

# update (replace TCK-XXXX)
curl -s -X PATCH http://localhost:3000/api/v1/tickets/TCK-2038 \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress","assignedAgentId":"agent-priya"}'
```

---

## 6. Building a `dist/` artifact (for packagers/pipelines)

Some pipelines/packagers (including "pack a `dist` into a UiPath NuGet" tools)
expect a `dist/` folder. Next.js normally builds to `.next/`, so run:

```bash
npm run dist        # next build (standalone) + assembles ./dist
node dist/server.js # runs the whole app incl. /api/v1 on $PORT (default 3000)
```

`dist/` is a **self-contained Node server** (server.js + trimmed node_modules +
static/public assets). A static export was deliberately NOT used because it
cannot include the `/api/v1` endpoints or the dynamic ticket route.

> **Critical:** packaging `dist/` into a `.nupkg` does not make UiPath *run* it.
> UiPath Orchestrator executes automation packages, not Node web servers. The
> package is only an artifact — something still has to run `node dist/server.js`
> on a host (VM/container) and expose it at a public HTTPS URL for cloud robots
> to reach (see §1). If your pipeline does that on the other end, you're set.

## 7. Hardening checklist (before this is more than a PoC)

- [ ] Add authentication (API key header or OAuth2) and require it on `/api/v1/*`.
- [ ] Replace the in-memory store with a database (Prisma + Postgres) — only
      `src/lib/server/ticket-store.ts` changes; routes and UI stay the same.
- [ ] Lock CORS down to known origins.
- [ ] Deploy to a stable host with a fixed HTTPS domain instead of a tunnel.
- [ ] Add rate limiting and request logging.
