// Assembles a portable, runnable `dist/` from Next.js `output: "standalone"`.
//
// Next's standalone build (.next/standalone) ships a minimal server.js + the
// node_modules it needs, but NOT the static assets — those must be copied in.
// The result is a self-contained folder you can zip / package / deploy and run
// with:  node dist/server.js   (listens on $PORT, default 3000)

import { existsSync, rmSync, mkdirSync, cpSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");
const dist = join(root, "dist");

if (!existsSync(standalone)) {
  console.error(
    "✗ .next/standalone not found. Run `npm run build` first (needs output: 'standalone')."
  );
  process.exit(1);
}

console.log("📦 Assembling dist/ from standalone build…");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// 1. The standalone server + its trimmed node_modules.
cpSync(standalone, dist, { recursive: true });

// 2. Static assets Next expects alongside the server.
const staticSrc = join(root, ".next", "static");
if (existsSync(staticSrc)) {
  cpSync(staticSrc, join(dist, ".next", "static"), { recursive: true });
}

// 3. Public assets.
const publicSrc = join(root, "public");
if (existsSync(publicSrc)) {
  cpSync(publicSrc, join(dist, "public"), { recursive: true });
}

console.log("✓ dist/ ready. Run it with:  node dist/server.js");
