# Build the Orchestration Engine in UiPath Studio Web

A **Studio Web-native** build guide — no REFramework, no state machines, no
custom libraries. Everything here is authored in the browser with Studio Web's
own building blocks: **Queue triggers, Data Service, GenAI, Integration Service,
Action Center, HTTP Request, and control flow**.

> Activity names can vary slightly by package version; the intent maps 1:1 to
> what's in the Activities panel.

---

## Studio Web building blocks we use

| Need | Studio Web activity / feature |
| --- | --- |
| Start on new ticket | **Trigger: “When a queue item is added”** (Orchestrator queue) |
| Start on schedule | **Trigger: “Run on a schedule”** (time trigger) |
| Read the work item | Queue trigger output → `queueItem.SpecificContent(...)` |
| AI classify / draft | **GenAI activities** (“Generate content” / “Chat completion”, “Context Grounding” for KB search) or **Communications Mining** |
| Store in Data Fabric | **Data Service**: Create / Query / Update Entity Record |
| Talk to the app | **HTTP Request** to `/api/v1` |
| Human step | **Action Center**: Create task / Wait for task and resume |
| Notify | **Integration Service** connector (Outlook, Gmail, Slack, WhatsApp) or Add Queue Item |
| Config | Orchestrator **Assets** (thresholds, base URL, API key) |
| Control flow | If, Switch, For Each, While, Try Catch, Assign, Deserialize JSON |

---

## Projects to create (each is a separate Studio Web automation)

| Project | Trigger | Purpose |
| --- | --- | --- |
| **Purity – Intake Orchestrator** | Queue item added → `Q_Intake` | Phases 2–8 for every new ticket (the core process below) |
| **Purity – SLA Monitor** | Schedule, every 1–5 min | Phase 6: scan SLA timers, warn/escalate/breach |
| **Purity – Incident Correlation** | Schedule, every 5–10 min | Phase 9: cluster similar tickets → incident |
| **Purity – Predictive Support** | Schedule, hourly/daily | Phase 10: generate proactive tickets |
| **Purity – Knowledge Learning** | Queue item added → `Q_Knowledge` | Phase 11: KB/FAQ/dataset candidates |
| **Purity – Analytics** | Schedule, daily/weekly/monthly | Phase 12: metrics + report |

---

## One-time setup in Automation Cloud (before building)

1. **Orchestrator → Queues:** create `Q_Intake`, `Q_Routing`, `Q_Escalation`,
   `Q_Knowledge`, `Q_Notifications`, `Q_DeadLetter`.
2. **Data Service:** create entities `Ticket`, `Customer`, `Agent` (fields per
   `docs/orchestration-engine-architecture.md` §7). Publish.
3. **Assets** (Orchestrator, in the process's folder):
   - `Api_BaseUrl` (Text) — your app URL, e.g. `https://…/api/v1`
   - `Api_Key` (Credential) — if you add auth to the app later
   - `Ai_ConfidenceThreshold` (Text/Float) — e.g. `0.7`
   - `Vip_Tiers` (Text) — e.g. `Enterprise,Premium`
4. **GenAI:** ensure GenAI features / a model connection are enabled for the
   tenant (Admin → AI Trust Layer / GenAI). For KB search, create a **Context
   Grounding index** over your knowledge base.
5. **Integration Service:** connect the channels you'll notify on (Outlook/Gmail/
   Slack/WhatsApp) and any CRM you'll read customers from.

**The trigger is already wired.** On `POST /api/v1/tickets`, the app adds a work
item to `Q_Intake` (`triggerTicketWorkflow` in `src/lib/server/uipath.ts`), which
fires your Queue Trigger and starts this process. Just set the env vars in
`.env.example` and create the `Q_Intake` queue + trigger. The RPA process owns
the Data Fabric write (step 6), so the app only triggers — no duplicate records.

---

## Build: “Purity – Intake Orchestrator”

**New → Automation → Trigger: “When a queue item is added” → Queue: `Q_Intake`.**
The trigger outputs a `QueueItem` (call it `in_QueueItem`).

Author this sequence:

### 1. Read the ticket from the queue item
`Assign` activities (String vars):
```
TicketId     = in_QueueItem.SpecificContent("TicketId").ToString
Subject      = in_QueueItem.SpecificContent("Subject").ToString
Description  = in_QueueItem.SpecificContent("Description").ToString
CustomerId   = in_QueueItem.SpecificContent("CustomerRef").ToString
Channel      = in_QueueItem.SpecificContent("Channel").ToString
```

### 2. AI Understanding (GenAI)
Add **Generate content** (GenAI). Prompt (System + User):

```
System: You are a support triage classifier. Respond with ONLY compact JSON.
User:
Classify this ticket. Return:
{"intent":"Billing|Technical|AccountAccess|FeatureRequest|Complaint|Cancellation|GeneralInquiry",
 "sentiment":"Positive|Neutral|Frustrated|Angry|Critical",
 "urgencyScore":0-100,
 "confidence":0.0-1.0}
Subject: {{Subject}}
Description: {{Description}}
```
Then **Deserialize JSON** the output → `Ai`. `Assign`:
```
Intent=Ai("intent").ToString  Sentiment=Ai("sentiment").ToString
Urgency=CInt(Ai("urgencyScore"))  Confidence=CDbl(Ai("confidence"))
```

### 3. Confidence gate (Action Center)
`If  Confidence < CDbl(Asset("Ai_ConfidenceThreshold"))`
→ **Create task** (Action Center) “Review classification” assigned to a triage
group, with the ticket + AI guess → **Wait for task and resume** → read the
human's corrected `Intent/Sentiment/Urgency` from the task outcome.

### 4. Customer Intelligence (Data Service)
**Query Entity Records** → entity `Customer`, filter `CustomerId = CustomerId`
→ first record → `Cust`. `Assign` health score, e.g.:
```
Health = Math.Min(100, CInt(0.4*Cust("CsatAvg")*20 + 0.3*(100-Cust("OpenTicketCount")*5) + 0.3*TierWeight))
IsVip  = Asset("Vip_Tiers").Contains(Cust("Tier").ToString)
```

### 5. Priority Engine (Assign)
```
Priority = CInt( 0.25*CustomerValue + 0.20*SentimentWeight(Sentiment)
                + 0.20*Urgency + 0.15*SlaRisk + 0.10*OpenIncidents
                + 0.10*HistComplaints )
If IsVip Then Priority = Math.Min(100, Priority + 15)
Bucket = If(Priority>=80,"Critical",If(Priority>=60,"High",If(Priority>=35,"Medium","Low")))
```

### 6. Store in Data Fabric — marked Unassigned (Data Service)
**Create Entity Record** → entity `Ticket`:
```
TicketId=TicketId, Subject=Subject, Description=Description,
Intent=Intent, Sentiment=Sentiment, UrgencyScore=Urgency,
PriorityScore=Priority, Priority=Bucket,
Status="Unassigned", Assigned=false,      ← the “mark unassigned” requirement
CustomerId=CustomerId, CreatedAt=DateTime.UtcNow
```
*(This is also where the TypeScript SDK write from `src/lib/server/uipath.ts`
lands if you keep the app-side write instead.)*

### 7. Smart Routing (Data Service + For Each)
**Query Entity Records** → `Agent` where `Available = true` (and language/skill
filters). `For Each` agent → score (skill match, workload, perf, SLA rate) →
track best. `If` no eligible agent → **Add Queue Item** → `Q_Escalation` and skip
assignment.

### 8. Write the decision back to the app (HTTP Request)
**HTTP Request** →
```
Method: PATCH
Url: Asset("Api_BaseUrl") + "/tickets/" + TicketId
Body (JSON): { "assignedAgentId": BestAgentId, "status": "assigned" }
Headers: Content-Type: application/json
```
So the assignment shows up immediately in the customer UI.

### 9. Escalation triggers (If / Switch)
`If  Sentiment="Angry" OrElse Sentiment="Critical" OrElse IsVip
    OrElse ContainsLegalOrFraud(Subject & Description)`
→ **Add Queue Item** → `Q_Escalation` with `{TicketId, Level:1, Trigger, Evidence}`
and (if human sign-off needed) an Action Center approval task.

### 10. Resolution suggestion (GenAI + Context Grounding) — optional
**Context Grounding – Search** your KB index with the ticket text → if a strong
hit, **Generate content** to draft a reply → **HTTP Request** `POST
/tickets/{id}/messages` with `{ body: draft, authorRole:"agent" }` (a draft the
agent can send).

### 11. Notify + wrap up
**Add Queue Item** → `Q_Notifications` (or an Integration Service “Send email/
Slack message” directly). Then **Update queue item status** = Successful.

### 12. Wrap it all in Try Catch
Put steps 2–11 inside **Try Catch**. In **Catch**: **Add Queue Item** →
`Q_DeadLetter` with `{TicketId, Error, Source:"IntakeOrchestrator"}`, log the
error, and set the transaction status to Failed. Ticket creation in the app is
never affected — this process runs after the ticket already exists.

---

## The background processes (compact)

**SLA Monitor** — *Trigger: schedule 1–5 min.* Data Service **Query** open
`SLA_TIMER`s → `For Each`: `Switch` on % elapsed → 75% Add `Q_Notifications`
(warn agent); 90% Add `Q_Escalation` (lead); 100% Add `Q_Escalation` + reassign
via HTTP PATCH.

**Incident Correlation** — *schedule 5–10 min.* Query recent tickets → group by
GenAI similarity / shared keywords → if a cluster ≥ N, **Create Entity Record**
`Incident`, **Update** each ticket's `IncidentId`, notify ops.

**Predictive Support** — *schedule hourly/daily.* Query signals (failed payments,
inactivity ≥14 days, error rates) → for each risk, **Add Queue Item** to
`Q_Intake` (a proactive ticket) + notify Customer Success.

**Knowledge Learning** — *Trigger: queue item added → `Q_Knowledge`* (the app/
closure enqueues here). GenAI classify the resolution into KB/FAQ/dataset/
automation → **Create Entity Record** `KnowledgeCandidate` (status “proposed”) →
Action Center review task.

**Analytics** — *schedule daily/weekly/monthly.* Query tickets/SLA/CSAT →
aggregate with Assigns → write to a reporting entity / send report via
Integration Service.

---

## Publish & run

1. **Publish** each automation from Studio Web (top-right) to your Orchestrator
   folder.
2. Confirm the **Queue triggers** and **Time triggers** are enabled
   (Orchestrator → Triggers).
3. Assign an **unattended / serverless robot** to the folder.
4. Submit a ticket in the app → it lands in `Q_Intake` → **Intake Orchestrator**
   runs → a `Ticket` record appears in Data Service marked **Unassigned**, gets
   an agent (or escalates), and the app UI reflects the assignment.

---

## Why this is Studio Web-correct

- **No REFramework / state machines / Config.xlsx / custom `.xaml` invokes /
  custom classes** — none of which Studio Web supports.
- Uses **triggers + sequences + connector/Data Service/GenAI/Action Center
  activities + Assets**, which is exactly the Studio Web model.
- The multi-process, queue-decoupled topology and the Data Fabric entity model
  from `docs/orchestration-engine-architecture.md` still hold — only the
  *authoring style* changed to match Studio Web.
