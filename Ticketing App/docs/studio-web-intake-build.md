# Build "Purity – Intake Orchestrator" in Studio Web — full guide

A single, follow-once guide to build the RPA workflow that fires when a ticket is
submitted, and stores it in Data Fabric marked **Unassigned**.

- **Trigger:** New item added to queue `Q_Intake` (the app already enqueues here
  on `POST /api/v1/tickets`).
- **Action:** Create a `Ticket` record in Data Service with `Status = Unassigned`,
  `Assigned = false`.

Build **Part 1** first and get it running end-to-end. **Part 2** (AI + routing) is
optional polish you add later on the same canvas.

---

## Prerequisites (already done)

- ✅ `Ticket` entity in Data Service with 12 fields.
- ✅ `Q_Intake` queue exists in your folder (Id `7626318`).
- ✅ App triggers the queue on submit.
- ✅ Queue trigger activity added as the first block.

---

## Part 1 — Minimal working workflow

### Step 1 — confirm the trigger output name

Click the **New Item Added to Queue** trigger. In its properties it produces an
**output** (the queue item). Note the exact name it shows — commonly
**`Queue Item`** or `CurrentQueueItem`. Everywhere below where I write
`Queue Item`, use *your* actual name.

Make sure **Queue = `Q_Intake`** and the folder is the one with your queue.

### Step 2 — add "Create Entity Record"

Below the trigger, click **+** → search activities for **`Create Entity Record`**
→ add it. (If two versions appear, choose **Create Entity Record** — the
Data Service one.)

In its properties:

1. **Entity:** select **Ticket**.
2. It expands to show all your fields. Map each one. For the queue values use the
   expression editor (the `fx` icon) and enter the expressions below.

| Ticket field | Set it to (expression) |
| --- | --- |
| `TicketId` | `Queue Item.SpecificContent("TicketId").ToString` |
| `Subject` | `Queue Item.SpecificContent("Subject").ToString` |
| `Description` | `Queue Item.SpecificContent("Description").ToString` |
| `Category` | `Queue Item.SpecificContent("Category").ToString` |
| `Department` | `Queue Item.SpecificContent("Department").ToString` |
| `Priority` | `Queue Item.SpecificContent("Priority").ToString` |
| `Status` | `"Unassigned"`  *(literal text — the requirement)* |
| `Assigned` | `False`  *(Boolean — the requirement)* |
| `Tags` | `Queue Item.SpecificContent("Tags").ToString` |
| `RequesterName` | `Queue Item.SpecificContent("RequesterName").ToString` |
| `RequesterEmail` | `Queue Item.SpecificContent("RequesterEmail").ToString` |
| `CreatedAt` | `DateTime.UtcNow`  *(safe default; see note)* |

> **CreatedAt note:** the app sends an ISO date string. `DateTime.UtcNow` always
> works. If you'd rather store the app's timestamp, use
> `DateTime.Parse(Queue Item.SpecificContent("CreatedAt").ToString)` — if that
> ever errors on a record, switch back to `DateTime.UtcNow`.

> **Field keys the app sends** (case-sensitive): `TicketId, Channel, Subject,
> Description, Category, Department, Priority, Status, Assigned, Tags,
> CustomerRef, RequesterName, RequesterEmail, CreatedAt, Phase`.

### Step 3 — (recommended) mark the queue item done

Add **Set Transaction Status** (or **Update Queue Item Status**) after Create
Entity Record → set status **Successful**, referencing the same `Queue Item`.
Keeps the queue clean and lets you see processed vs. failed items.

### Step 4 — wrap in Try Catch (optional but nice)

Put Steps 2–3 inside a **Try Catch**. In **Catch**, add a **Log Message**
(the error) so a bad record never silently disappears. Ticket creation in the
app is unaffected either way — this runs *after* the ticket already exists.

### Step 5 — save & publish

1. **Save** (top bar).
2. **Publish** (top-right) → target your Orchestrator **folder** (Id `7626318`).
   This uploads the process package and registers the queue trigger.

### Step 6 — make sure it can run

In **Orchestrator**:

1. **Automations/Processes** → confirm `Purity – Intake Orchestrator` is there.
2. **Triggers** → confirm the `Q_Intake` **queue trigger** exists and is
   **enabled** (publishing usually creates it; enable it if it's off).
3. **Robots:** the folder needs a **serverless / unattended robot** to execute.
   If runs stay "Pending," that's the missing piece — assign a serverless robot
   to the folder (Admin → Tenant → Robots, or the folder's Settings).

### Step 7 — test end-to-end

1. In the app, **submit a new ticket**.
2. App enqueues it → trigger fires → job runs.
3. **Data Service → Ticket → Data tab:** a new row appears with
   **Status = Unassigned**, **Assigned = false**. ✅
4. If nothing appears: **Orchestrator → Jobs** shows the run + any error;
   **Queues → Q_Intake** shows the item's status (New/InProgress/Successful/Failed).

That's the requirement met: *submit a ticket → stored in Data Fabric →
marked Unassigned.*

---

## Part 2 — enhancements (add later, same canvas)

Add these **between** the trigger and Create Entity Record so the record is
richer when it's written.

### 2a. AI classify (GenAI)

Add **Generate Content** (GenAI). Prompt:

```
System: You are a support triage classifier. Respond with ONLY compact JSON.
User: Classify this ticket. Return:
{"intent":"Billing|Technical|AccountAccess|FeatureRequest|Complaint|Cancellation|GeneralInquiry",
 "sentiment":"Positive|Neutral|Frustrated|Angry|Critical",
 "urgencyScore":0-100,"confidence":0.0-1.0}
Subject: [Queue Item.SpecificContent("Subject").ToString]
Description: [Queue Item.SpecificContent("Description").ToString]
```

Then **Deserialize JSON** the output. (To store these you'd add `Intent`,
`Sentiment`, `UrgencyScore` fields to the `Ticket` entity first.)

### 2b. Smart routing (Data Service)

**Query Entity Records** on an `Agent` entity where `Available = true` → **For Each**
→ score by skill/workload → pick best. If none, **Add Queue Item** to a
`Q_Escalation` queue instead of assigning.

### 2c. Write the decision back to the app (HTTP Request)

**HTTP Request** →
```
Method: PATCH
URL:    https://<your-app>/api/v1/tickets/<TicketId>
Body:   { "assignedAgentId": "<BestAgentId>", "status": "assigned" }
Header: Content-Type: application/json
```
So the assignment shows up live in the app UI. (Store the app base URL in an
Orchestrator **Asset** rather than hardcoding.)

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Job stays **Pending** | No robot in the folder — assign a serverless/unattended robot. |
| **`SpecificContent` key error** | Key name/case doesn't match the list in Step 2. |
| **CreatedAt** parse error | Use `DateTime.UtcNow` instead of `DateTime.Parse(...)`. |
| Record not appearing | Check **Orchestrator → Jobs** for the error; check the queue item status. |
| Trigger never fires | **Triggers** page → ensure the `Q_Intake` queue trigger is **Enabled**. |
