// UiPath connectivity check. Reads .env.local (via `node --env-file`), reports
// which settings are present (NEVER prints the secret), then validates the
// token + folder and checks the Q_Intake queue exists.
//
// Run:  npm run uipath:check

const {
  UIPATH_BASE_URL = "https://cloud.uipath.com",
  UIPATH_ORG,
  UIPATH_TENANT,
  UIPATH_SECRET,
  UIPATH_FOLDER_ID,
  UIPATH_QUEUE_NAME = "Q_Intake",
} = process.env;

const PLACEHOLDERS = {
  UIPATH_SECRET: "your-pat-or-bearer-token",
  UIPATH_FOLDER_ID: "123456",
  UIPATH_TENANT: "DefaultTenant",
};

function status(name, value) {
  if (!value) return "❌ MISSING";
  if (value === PLACEHOLDERS[name]) {
    return name === "UIPATH_TENANT" ? "⚠️  still 'DefaultTenant' (is that real?)" : "❌ PLACEHOLDER — not set yet";
  }
  if (name === "UIPATH_SECRET") return `✅ set (hidden, length ${value.length})`;
  return `✅ ${value}`;
}

console.log("\nUiPath configuration (.env.local)\n---------------------------------");
console.log("UIPATH_BASE_URL   ", UIPATH_BASE_URL);
console.log("UIPATH_ORG        ", status("UIPATH_ORG", UIPATH_ORG));
console.log("UIPATH_TENANT     ", status("UIPATH_TENANT", UIPATH_TENANT));
console.log("UIPATH_SECRET     ", status("UIPATH_SECRET", UIPATH_SECRET));
console.log("UIPATH_FOLDER_ID  ", status("UIPATH_FOLDER_ID", UIPATH_FOLDER_ID));
console.log("UIPATH_QUEUE_NAME ", UIPATH_QUEUE_NAME);

// Hard blockers (folder id can be discovered, so it's not a hard blocker).
const hardMissing = [];
if (!UIPATH_ORG) hardMissing.push("UIPATH_ORG");
if (!UIPATH_TENANT) hardMissing.push("UIPATH_TENANT");
if (!UIPATH_SECRET || UIPATH_SECRET === PLACEHOLDERS.UIPATH_SECRET) hardMissing.push("UIPATH_SECRET");

if (hardMissing.length) {
  console.log(`\n⏸  Still need: ${hardMissing.join(", ")}. Fill in .env.local and re-run.\n`);
  process.exit(0);
}

const base = UIPATH_BASE_URL.replace(/\/$/, "");
const orchBase = `${base}/${UIPATH_ORG}/${UIPATH_TENANT}/orchestrator_`;
const auth = { Authorization: `Bearer ${UIPATH_SECRET}`, "Content-Type": "application/json" };
const folderKnown = UIPATH_FOLDER_ID && UIPATH_FOLDER_ID !== PLACEHOLDERS.UIPATH_FOLDER_ID;

console.log("\nCalling Orchestrator…\n---------------------");
try {
  // 1) List folders — validates token + tenant, and reveals folder ids.
  const fRes = await fetch(`${orchBase}/odata/Folders?$top=100`, { headers: auth });
  if (fRes.status === 401) {
    console.log("❌ 401 Unauthorized — token invalid/expired, or the TENANT name is wrong.");
    console.log(`   (Tried tenant "${UIPATH_TENANT}". Check Admin → Tenants for the exact name.)\n`);
    process.exit(1);
  }
  if (!fRes.ok) {
    console.log(`❌ ${fRes.status}: ${(await fRes.text()).slice(0, 300)}`);
    process.exit(1);
  }
  const folders = (await fRes.json()).value ?? [];
  console.log(`✅ Auth OK — token + tenant "${UIPATH_TENANT}" resolve. Folders you can access:`);
  for (const f of folders) {
    const mark = folderKnown && String(f.Id) === String(UIPATH_FOLDER_ID) ? "  ← your UIPATH_FOLDER_ID" : "";
    console.log(`   • Id ${f.Id}  —  ${f.FullyQualifiedName || f.DisplayName}${mark}`);
  }

  if (!folderKnown) {
    console.log(`\n⏸  Copy the Id of the folder you want into UIPATH_FOLDER_ID in .env.local, then re-run.\n`);
    process.exit(0);
  }

  // 2) Check the queue exists in that folder.
  const qRes = await fetch(
    `${orchBase}/odata/QueueDefinitions?$filter=Name eq '${UIPATH_QUEUE_NAME}'`,
    { headers: { ...auth, "X-UIPATH-OrganizationUnitId": UIPATH_FOLDER_ID } }
  );
  if (!qRes.ok) {
    console.log(`\n❌ Queue check ${qRes.status}: ${(await qRes.text()).slice(0, 200)}`);
    process.exit(1);
  }
  const qs = (await qRes.json()).value ?? [];
  if (qs.length) {
    console.log(`\n✅ Queue "${UIPATH_QUEUE_NAME}" exists (id ${qs[0].Id}).`);
    console.log("🎉 Ready — submitting a ticket will add an item to this queue.");
    console.log("   Next: create a Queue Trigger on it → your published Studio Web process.\n");
  } else {
    console.log(`\n⚠️  Queue "${UIPATH_QUEUE_NAME}" not found in that folder.`);
    console.log(`   Create it in Orchestrator (name it exactly "${UIPATH_QUEUE_NAME}") and re-run.\n`);
  }
} catch (err) {
  console.log(`❌ Network/error: ${err.message}`);
  process.exit(1);
}
