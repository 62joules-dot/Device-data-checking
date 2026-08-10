# Automation & market-research blueprint

This is the honest, deliverable-grade plan for Steps 4, 6 and 7. Share the relevant
parts with the client so expectations match reality.

## 1. Publishing: two tiers, not one

The six platforms are NOT equally automatable. Treating them as one "auto-post" bucket
is how accounts get banned. Split them:

### Tier A — real bulk / feed upload (safe to automate)
| Platform | Mechanism | Notes |
|---|---|---|
| eBay | File Exchange / Sell API / bulk CSV | Fully automatable. Map `output/automation/ebay.json` → eBay item fields. |
| Machinio | Data feed / dealer upload | Built for used industrial/medical equipment. Feed-based. |
| Kitmondo | Dealer listing upload | Similar; supports batch dealer listings. |
| DOTmed* | Bulk listing (30 free) | *Not in the 6 but ideal for medical — worth adding. |

These consume the JSON directly. This is where the "automated" promise is real.

### Tier B — no posting API, bot-posting = ban risk (semi-automated)
| Platform | Reality |
|---|---|
| Leboncoin | No public posting API; aggressive anti-bot. Post by hand from pre-generated content. |
| Wallapop | Same; mobile-first, bot detection. |
| Facebook Marketplace | Same; automated posting violates ToS, high ban risk. |

**Correct deliverable for Tier B:** the JSON + a form-fill *assist* (a Browser-Use /
Playwright script that opens the new-listing page and pre-fills fields from the JSON,
then **stops for a human to review + submit**). This keeps a human in the loop, which is
what keeps the accounts alive. Full headless posting here is the thing to refuse — say so
to the client rather than promise it and have accounts nuked mid-batch.

## 2. How an agent consumes the JSON (Step 7)

Each `output/automation/<platform>.json` is a list of objects with the client's exact
field names (`titre, description, prix, categorie, photos, localisation, telephone,
email, mode_de_livraison, tva, etat, marque, modele`) plus control fields:
- `_ready_to_publish` — gate. Agent skips anything `false`.
- `_missing_fields` — what to fix first.
- `_platform`, `_device_id`, `_tags`.

Agent loop (pseudocode):
```
for item in load(platform.json):
    if not item["_ready_to_publish"]:
        log_skip(item["_device_id"], item["_missing_fields"]); continue
    page = open_new_listing(platform)          # Playwright / Browser Use
    fill(page, title=item["titre"], desc=item["description"], price=item["prix"], ...)
    upload_photos(page, item["photos"])
    if platform in TIER_A: submit(page)
    else:                  pause_for_human_review(page)   # Tier B
```

## 3. Market research (Step 6) — what's real vs not

Be straight with the client here; this is the over-promised part of the brief.

| Requested | Feasibility | How |
|---|---|---|
| Active listings (brokers, dealers, individuals) | ✅ Scrapeable | Firecrawl / Playwright over Machinio, Kitmondo, DOTmed, eBay search, Leboncoin search per model. |
| Average **asking** price | ✅ Computable | Aggregate scraped asking prices per model. |
| Expired listings | ⚠️ Partial | Only where the platform keeps them visible; otherwise not retrievable. |
| Live auctions | ⚠️ Partial | Some auction houses list publicly (e.g. medical/lab auction sites); scrape those. |
| **Actually-sold** price | ❌ Mostly not public | eBay "sold" filter is the rare exception. Elsewhere this data is private — do not promise a number the internet doesn't contain. |
| Avg time-to-sell | ❌ Mostly not public | Estimable only where listing post + removal dates are both visible. |
| Best country / competition level | ✅ Derivable | From volume + asking-price spread of scraped listings per country. |

**Recommendation:** deliver Step 6 as a scraper that outputs, per model:
asking-price distribution (min/median/max), listing count per country, competition level,
and — where available — eBay sold comps. Clearly mark "sold price / time-to-sell:
insufficient public data" rather than fabricating.

## 4. Compliance flag (pass to client, their responsibility)
Reselling used medical/aesthetic devices in the EU touches CE marking, device
traceability, and some platforms restrict health-equipment listings. Some items may be
flagged regardless of posting method. Prioritise the clean, high-value, CE-marked units
first (already reflected in `priority_queue.json`).

## 5. Suggested milestone split (for the freelancer)
The paid $58 milestone described a different job (WhatsApp/CRM/lead-gen in make.com).
Re-scope cleanly:
- **M1 – Data + listing engine** (this package): normalized DB, multilingual listings,
  categorisation, automation JSON, priority queue. ← deliverable today.
- **M2 – Tier-A auto-publish** (eBay/Machinio/Kitmondo feed integration).
- **M3 – Tier-B form-fill assist** (Browser-Use scripts, human-in-loop).
- **M4 – Market-research scraper** (Step 6, with the caveats above).
Price each milestone to the real work.
