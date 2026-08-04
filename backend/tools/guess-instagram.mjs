/**
 * Find a cafe's Instagram by guessing its handle, then proving the profile is really it.
 *
 * Google Places returns a website only when the business gave Google one, and never
 * returns Instagram at all. 430 cafes here carry no link of either kind and were recorded
 * as "nowhere to look" — yet OFFSET in Surry Hills, one of them, runs a profile whose bio
 * reads "Premium Matcha from Uji". The gap was Google's, not the cafes'.
 *
 * Searching for the profiles worked and did not scale: Brave answers a few dozen queries
 * and then asks the client to prove it is human, and a blocked search looks exactly like a
 * cafe with no profile. Guessing touches only Instagram, which served 154 profiles without
 * complaint.
 *
 * The guess is never the evidence. A handle built out of the cafe's own name matches that
 * name by construction, so attribution rests entirely on the bio: the profile must name
 * the business AND place itself in the right suburb. That is what stops @offset — whoever
 * that is — being published as a Surry Hills cafe's sourcing claim.
 *
 * Usage: node guess-instagram.mjs <input.json> <output.jsonl> [concurrency]
 *   input.json  [{ "id", "name", "suburb", "city" }, ...]
 */
import { chromium } from "playwright";
import { readFileSync, appendFileSync, existsSync } from "node:fs";

const [, , inputPath, outputPath, concurrencyArg] = process.argv;
const CONCURRENCY = Number(concurrencyArg) || 4;
const NAV_TIMEOUT = 20_000;

/** Words that identify a category, not a business. */
const GENERIC = new Set([
  "cafe", "coffee", "the", "restaurant", "bar", "tea", "house", "co", "and", "shop",
  "kitchen", "eatery", "bakery", "dessert", "desserts", "au", "australia", "roasters",
  "roastery", "espresso", "sweets", "store", "food", "bakehouse", "patisserie", "grocery",
]);

const fold = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const words = (s) => fold(s).split(" ").filter(Boolean);

/** The words that distinguish this business, in order, deduplicated. */
function nameTokens(name) {
  return [...new Set(words(name).filter((w) => w.length >= 3 && !GENERIC.has(w)))];
}

/**
 * Handles worth trying, most likely first.
 *
 * Australian cafes overwhelmingly follow one of a few shapes: the bare brand, the brand
 * joined to its suburb, or the brand with a country or category suffix. "&" is written
 * as either "and" or a bare "n" ("Fork & Path" runs @forknpath), so both are generated.
 */
function candidateHandles(cafe) {
  const raw = words(cafe.name);
  const tokens = nameTokens(cafe.name);
  if (tokens.length === 0) return [];

  // Accounts are usually named for the brand, not the whole trading name: "OFFSET Matcha
  // & Brew" runs @offset.surryhills, so the leading word has to be tried on its own as
  // well as the full string.
  const brandN = raw.map((w) => (w === "and" ? "n" : w)).filter((w) => !GENERIC.has(w)).join("");
  const bases = [
    ...new Set(
      [tokens[0], tokens.slice(0, 2).join(""), tokens.join(""), brandN].filter(
        (b) => b && b.length >= 3
      )
    ),
  ];

  // Kept deliberately short. Every extra shape is another Instagram fetch for every one
  // of hundreds of cafes, and Instagram starts serving login walls when pushed — so a
  // longer list does not just cost time, it costs the hit rate of the guesses that matter.
  const suburb = words(cafe.suburb).join("");
  const lead = bases[0];
  const full = bases[bases.length - 1];
  const out = [];
  if (suburb) out.push(`${lead}.${suburb}`, `${lead}${suburb}`);
  out.push(lead);
  if (full !== lead) out.push(full);
  if (suburb && full !== lead) out.push(`${full}.${suburb}`);

  return [...new Set(out)].filter((h) => h.length >= 3 && h.length <= 30).slice(0, 5);
}

const MISSING = /page (isn'?t|not) available|sorry, this page|user not found/i;

/**
 * Instagram serves the bio to an anonymous client most of the time and a login wall the
 * rest of the time, for the same profile minutes apart. Read as ordinary page text a wall
 * looks like a profile that fails to mention the cafe — which is a rejection, and a
 * permanent one, for a profile that would have matched. So it is detected and retried.
 */
const LOGIN_WALL = /log into instagram|mobile number, username or email|create new account/i;

async function readProfile(page, handle, attempt = 1) {
  await page.goto(`https://www.instagram.com/${handle}/`, {
    timeout: NAV_TIMEOUT,
    waitUntil: "load",
  });
  await page.waitForTimeout(1200);
  const text = await page.evaluate(() => {
    for (const el of document.querySelectorAll("script,style,noscript,svg")) el.remove();
    return (document.body?.innerText || "").replace(/\s+/g, " ").trim();
  });

  if (LOGIN_WALL.test(text) && !MISSING.test(text) && attempt < 2) {
    await page.waitForTimeout(2500);
    return readProfile(page, handle, attempt + 1);
  }
  return text;
}

/**
 * Believe this profile is this cafe only if its own text says so.
 *
 * The handle proves nothing here — it was generated from the cafe's name. The bio has to
 * carry the business name and put itself in the right suburb. Cafes that leave their
 * suburb out of their bio are missed; that is the correct way to be wrong, because the
 * alternative is publishing a stranger's sourcing claim under this cafe's name.
 */
function attribution(cafe, profileText) {
  if (!profileText || MISSING.test(profileText)) return { ok: false, why: "no such profile" };
  if (LOGIN_WALL.test(profileText)) return { ok: false, why: "blocked by login wall", blocked: true };

  const bio = fold(profileText);
  const tokens = nameTokens(cafe.name);
  const suburb = words(cafe.suburb).join(" ");

  const named = tokens.filter((t) => bio.includes(t));
  if (named.length === 0) return { ok: false, why: "profile does not name this business" };
  if (!suburb || suburb.length < 3) return { ok: false, why: "no suburb on record to confirm against" };
  if (!bio.includes(suburb)) return { ok: false, why: `profile is not in ${cafe.suburb}` };

  return { ok: true, why: `bio names the business and places it in ${cafe.suburb}` };
}

const all = JSON.parse(readFileSync(inputPath, "utf8"));
const done = new Set();
if (existsSync(outputPath)) {
  for (const line of readFileSync(outputPath, "utf8").split("\n")) {
    if (line.trim()) try { done.add(JSON.parse(line).id); } catch {}
  }
}
const queue = all.filter((c) => !done.has(c.id));
console.error(`${all.length} cafes, ${done.size} already tried, ${queue.length} to go`);

const browser = await chromium.launch();
let index = 0;
let found = 0;

async function worker() {
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-AU",
    viewport: { width: 1280, height: 900 },
  });
  await ctx.route("**/*", (r) => {
    const t = r.request().resourceType();
    return t === "image" || t === "font" || t === "media" ? r.abort() : r.continue();
  });
  const page = await ctx.newPage();

  while (index < queue.length) {
    const cafe = queue[index++];
    const at = index;
    const row = { id: cafe.id, name: cafe.name, suburb: cafe.suburb, handle: null, text: "" };
    const tried = [];
    try {
      for (const handle of candidateHandles(cafe)) {
        let text = "";
        try {
          text = await readProfile(page, handle);
        } catch {
          continue;
        }
        const verdict = attribution(cafe, text);
        tried.push(`${handle}: ${verdict.why}`);
        if (verdict.blocked) row.blocked = (row.blocked || 0) + 1;
        if (verdict.ok) {
          row.handle = handle;
          row.text = text;
          row.matchedOn = verdict.why;
          break;
        }
      }
    } catch (e) {
      row.error = String(e.message || e).slice(0, 120);
    }
    row.tried = tried.slice(-6);
    if (row.handle) found++;
    appendFileSync(outputPath, JSON.stringify(row) + "\n");
    if (at % 20 === 0 || at === queue.length) {
      console.error(`  ${at}/${queue.length} — ${found} profiles attributed`);
    }
  }
  await ctx.close();
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await browser.close();
console.error(`done: ${found} of ${queue.length} cafes matched to a profile`);
