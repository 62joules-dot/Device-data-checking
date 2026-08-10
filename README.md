# Medical-device multi-marketplace listing engine

Turns one Excel inventory into publish-ready, multilingual listings + per-platform
automation JSON for 6 marketplaces (Leboncoin, Wallapop, Facebook Marketplace,
eBay, Machinio, Kitmondo).

## Run it
```bash
pip install -r requirements.txt
cd src
python3 cli.py all ../data/YOUR_FILE.xlsx --mock
```
Outputs appear in `output/`. Full command reference in **RUN_GUIDE.md**.

## Components
| Module | Does |
|---|---|
| `src/normalize.py` | Excel → clean central DB, flags missing fields |
| `src/knowledge.py` | device classification + per-platform categories & multilingual keywords |
| `src/generate.py` | titles, short/detailed descriptions FR/ES/EN, tags |
| `src/llm_enrich.py` | optional richer copy via Anthropic API (no-invention rule) |
| `src/exporters/ebay_file_exchange.py` | eBay bulk-upload CSV (Tier A) |
| `src/exporters/machinio_kitmondo_feed.py` | dealer feed CSVs (Tier A) |
| `src/posters/formfill_assist.py` | Leboncoin/Wallapop/Facebook human-in-loop assist (Tier B) |
| `src/research/` | Step 6 market-research scraper + stats engine |
| `src/cli.py` | one entry point: `build`, `research`, `all` |
| `tests/test_pipeline.py` | test suite (all passing) |

## How it maps to the 7-step brief
| Brief step | Where it lives | Output |
|---|---|---|
| 1. Centralisation | `normalize.py` | `output/master_database.json` (clean records, missing fields flagged) |
| 2. Annonces (titles, FR/ES/EN, short+detailed, keywords) | `generate.py` + `knowledge.py` | inside each record's `generated` block |
| 3. Catégorisation (category/tags per platform) | `knowledge.py` | `categories` + `tags` per record |
| 4. JSON publication | `run_all.py` → `build_automation_record` | `output/automation/<platform>.json` |
| 5. Priorités | `run_all.py` → `priority_score` | `output/priority_queue.json` |
| 6. Veille (market research) | see `AUTOMATION_BLUEPRINT.md` | design + approach (not fully auto — see caveats) |
| 7. Automatisation | `output/automation/*.json` consumed by Playwright/Browser Use | see blueprint |

## Key design decisions
- **Missing data is flagged, never invented.** Any absent field becomes the string
  `MISSING`; `_missing_fields` and `_ready_to_publish` tell the agent (and you) exactly
  what to fix before posting. This is the client's explicit Step-7 instruction.
- **Flexible Excel ingestion.** `schema.ALIASES` matches messy FR/EN headers
  (accents, spacing) onto canonical fields, so the real file works without renaming columns.
- **Device intelligence.** `knowledge.py` classifies each machine (laser hair removal,
  picosecond, RF microneedling, HIFU, IPL, body contouring…) and attaches the right
  category path and buyer keywords per platform and per language — this is what makes
  titles/descriptions SEO-real.

## Plugging in the real inventory
1. Drop the real `.xlsx` in `data/`.
2. Fill global contact + delivery once in `schema.py → DEFAULT_CONFIG`
   (`phone`, `email`). Blank values stay flagged as `MISSING` on purpose.
3. Re-run. Check `output/report.json` for the completeness summary.

## Optional: richer marketing copy at scale
`generate.enrich_with_llm()` is a ready hook to call the Anthropic API once per device
for higher-variety FR/ES/EN descriptions, with a hard rule to never invent specs. The
pipeline runs fully offline without it.
