/**
 * Replay stored profile text through the attribution rules.
 *
 * The rules were wrong in a way only visible against real pages: matching the whole
 * Instagram page meant a private account with no bio matched its own handle echoed back in
 * the boilerplate. This replays the profiles captured before the fix, so the rules can be
 * checked without touching Instagram — and so these cases stay checkable later.
 */
import { readFileSync } from "node:fs";
import { attribution } from "./guess-instagram.mjs";

const rows = readFileSync(process.argv[2], "utf8").split("\n").filter(Boolean).map(JSON.parse);
const KNOWN_WRONG = new Set([
  "Golden Leaves Cafe", "Bang On Bagels", "Meet Forest",
  "Big Comma Gelato & Coffee", "MATCHA KOBO",
]);

let wrongAccepted = 0, rightAccepted = 0;
for (const r of rows) {
  if (!r.handle || !r.text) continue;
  const v = attribution({ name: r.name, suburb: r.suburb, city: "Melbourne" }, r.text, r.handle);
  const flag = KNOWN_WRONG.has(r.name) ? (v.ok ? "STILL WRONG" : "now rejected") : (v.ok ? "accepted" : "rejected");
  if (KNOWN_WRONG.has(r.name) && v.ok) wrongAccepted++;
  if (!KNOWN_WRONG.has(r.name) && v.ok) rightAccepted++;
  console.log(`${flag.padEnd(13)} @${r.handle.padEnd(24)} ${r.name.slice(0, 30).padEnd(32)} ${v.why}`);
}
console.log(`\nknown-wrong still accepted: ${wrongAccepted}  |  others accepted: ${rightAccepted}`);
