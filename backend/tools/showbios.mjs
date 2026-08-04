import { readFileSync } from "node:fs";
import { extractBio } from "./guess-instagram.mjs";
const rows = readFileSync("nolink-found2.jsonl","utf8").split("\n").filter(Boolean).map(JSON.parse);
for (const r of rows) {
  if (!r.handle) continue;
  console.log(`@${r.handle}  <-  ${r.name}  [${r.suburb}]`);
  console.log("   " + extractBio(r.text, r.handle).slice(0, 230));
  console.log();
}
