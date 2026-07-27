# New ticket → UiPath Data Fabric (Unassigned)

When a ticket is submitted, the app writes it into **UiPath Data Fabric**
(Data Service) as an entity record and marks it **Unassigned** — using the
official **UiPath TypeScript SDK** (`@uipath/uipath-typescript`).

```
Ticket app (server build)
  POST /api/v1/tickets → createTicket()
     └─ storeTicketInDataFabric(ticket)   [src/lib/server/uipath.ts]
          UiPath SDK → entities.insertRecordById(TicketEntity, {
            …ticket fields…, Status: "Unassigned", Assigned: false
          })
                 ▼
        Data Fabric entity "Ticket"  ← new record, Unassigned
```

The app makes an **outbound** call to `cloud.uipath.com`, so it does **not**
need a public URL — run it locally with credentials and it writes to your cloud.

---

## Important: the SDK inserts records, not schemas

`@uipath/uipath-typescript` can create/read/update **records** inside an entity,
but it **cannot create the entity definition**. So you create the `Ticket`
entity **once** in Data Service (step 1); the app fills it forever after.

## 1. Create the `Ticket` entity in Data Fabric (one-time)

Automation Cloud → **Data Service** → **Entities** → **Create entity** → name it
`Ticket`, add these fields, then **Publish**. The field **names must match**
the record keys the app sends:

| Field name | Type |
| --- | --- |
| TicketId | Text |
| Subject | Text |
| Description | Text (multi-line) |
| Category | Text |
| Department | Text |
| Priority | Text |
| Status | Text |
| Assigned | Yes/No (Boolean) |
| Tags | Text |
| RequesterName | Text |
| RequesterEmail | Text |
| CreatedAt | Date Time (or Text) |

## 2. Get a secret (PAT) with Data Service access

The SDK's server-side auth uses a **secret** — a Personal Access Token or Bearer
token. In Automation Cloud, create a **Personal Access Token** with **Data
Service** scopes (read + write). Copy it.

## 3. Configure the app

Copy `.env.example` to `.env.local` and fill in:

```
UIPATH_BASE_URL=https://cloud.uipath.com
UIPATH_ORG=sepiaecnvnwd          # your account/org (from your cloud URL)
UIPATH_TENANT=DefaultTenant      # your tenant
UIPATH_SECRET=<your PAT/token>
UIPATH_ENTITY_NAME=Ticket
```

Verify: `GET /api/v1/health` should return `"uipathConfigured": true`.

## 4. Run it

1. Start the server build: `npm run dev` (or `npm start`).
2. Submit a ticket (UI or `POST /api/v1/tickets`). The response includes
   `"uipath": { "stored": true, "recordId": "…" }`.
3. In **Data Service → Ticket**, the new record appears with **Status =
   Unassigned** and **Assigned = false**.

The SDK integration lives in `src/lib/server/uipath.ts`:
`new UiPath({ baseUrl, orgName, tenantName, secret })` → resolve the entity by
name via `entities.getAll()` → `entities.insertRecordById(entityId, record)`.

---

## Notes

- **Best-effort:** if Data Fabric is unreachable or the entity is missing, the
  ticket is still created and the response shows `uipath.stored = false` with the
  reason — nothing is lost.
- The app already creates tickets unassigned (status `submitted`, no agent); the
  Data Fabric record mirrors that (`Status = "Unassigned"`, `Assigned = false`).
- **Server build only** (`server-api-poc` branch). The static bundle can't do
  this — no server to hold the secret or call UiPath.
- The integration follows the SDK's documented API but hasn't been run against a
  live tenant here — step 4 is your first live test. If field names differ from
  the table above, adjust the keys in `toRecord()` to match your entity.

## Optional: also trigger a Studio/RPA process

If you additionally want a UiPath **process** (unattended robot) to run per
ticket — e.g. for downstream automation beyond storage — add an Orchestrator
**Queue + Queue Trigger** and enqueue from the app instead of (or alongside) the
Data Fabric write. That queue-based variant is preserved in git history on this
branch; ask if you want it wired back in.
