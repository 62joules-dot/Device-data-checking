# Run guide

## 0. Setup (once)
```bash
pip install -r requirements.txt
# only if you'll use scraping or the form-fill assist:
playwright install chromium
```

## 1. Configure (once per batch)
Edit `src/config.py`:
- `SELLER.phone`, `SELLER.email` — blank values stay flagged as MISSING, never invented.
- `EBAY.site_id` — 71=FR, 186=ES, 101=IT, 77=DE, 3=UK.
- `LLM.enabled = True` + set `ANTHROPIC_API_KEY` env var — optional richer descriptions.

## 2b. If your file is a TYPE + QUANTITY summary (like the first client file)
When the Excel only lists machine types and counts (no prices/condition/photos),
run intake first — it classifies each type and builds a reusable per-unit sheet:
```bash
cd src
python intake_run.py /path/to/summary.xlsx
```
Outputs to `output/intake/`:
- `data_collection.xlsx` — **one row per physical unit, pre-filled with ID/type/family/brand hint.**
  Fill in price, condition, country, year, serial, photos. This is your reusable
  intake sheet for these and all future devices.
- `listing_drafts.json` — per-type draft titles + FR/ES/EN descriptions to reuse.
- `MISSING_REPORT.md` — exactly what's still needed before anything can go live.

Then feed the filled sheet back into the normal pipeline:
```bash
python cli.py build ../output/intake/data_collection.xlsx
```

## 2. Build listings + Tier-A feeds
```bash
cd src
python cli.py build ../data/YOUR_FILE.xlsx
```
Produces in `output/`:
- `master_database.json` — clean central DB (Step 1)
- `automation/<platform>.json` — per-platform publish JSON (Step 4)
- `exports/ebay_file_exchange.csv` — **upload directly at eBay Seller Hub** (Step 7, Tier A)
- `exports/machinio_feed.csv`, `exports/kitmondo_feed.csv` — dealer feeds (Tier A)
- `priority_queue.json` — publish order (Step 5)
- `report.json` — what's ready vs what's missing

## 3. Market research (Step 6)
```bash
python cli.py research --mock                 # offline demo (deterministic)
python cli.py research "Candela GentleMax Pro" # named models
```
For LIVE scraping: in `research/scraper.py` swap `MockAdapter()` for
`PlaywrightAdapter(source_cfg)` and fill the search URL + selectors per source.
Outputs `output/market_research.json` (asking-price min/median/max, competition,
best country; sold-price only where publicly available — flagged otherwise).

## 4. Everything at once
```bash
python cli.py all ../data/YOUR_FILE.xlsx --mock
```

## 5. Publishing

### Tier A — automated (safe)
- **eBay**: Seller Hub → Reports → Upload → pick `ebay_file_exchange.csv`.
  Before first upload, replace `TODO_EBAY_CATEGORY_ID` with the numeric leaf
  category for your site, and host photos at public URLs (eBay rejects local files).
- **Machinio / Kitmondo**: send the feed CSV through your dealer feed setup.

### Tier B — human-in-the-loop assist (Leboncoin / Wallapop / Facebook)
```bash
python posters/formfill_assist.py leboncoin ../output/automation/leboncoin.json
```
Opens a real browser, you log in once, it pre-fills each form, you attach photos
and click submit yourself. This protects the accounts. It does NOT auto-submit,
solve CAPTCHAs, or evade detection — doing that is what gets accounts banned.
Verify the selectors in `posters/formfill_assist.py` against the live pages first.

## 6. Tests
```bash
python tests/test_pipeline.py
```

## What's verified here vs what needs your environment
| Component | Status |
|---|---|
| Normalize / generate / categorize / priority | ✅ verified, tests pass |
| eBay File Exchange CSV export | ✅ verified (valid format, condition IDs) |
| Machinio / Kitmondo feed export | ✅ verified |
| Market-research stats engine | ✅ verified with tests |
| Live scraping (Playwright adapters) | ⚙️ runnable locally; selectors need verifying |
| Tier-B form-fill assist | ⚙️ runnable locally; needs your logins + selector check |
| eBay Sell API live post | ⚙️ needs your OAuth token |
| LLM enrichment | ⚙️ needs ANTHROPIC_API_KEY |
