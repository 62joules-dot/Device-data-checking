"""
Tier B form-fill ASSIST (Leboncoin / Wallapop / Facebook Marketplace).

These platforms have no posting API and ban automated posting. This tool is
deliberately human-in-the-loop: it logs into your own session, opens the
new-listing page, pre-fills the fields from the automation JSON, then STOPS and
waits for you to review and click submit yourself. That keeps the account safe.

It does NOT solve CAPTCHAs, evade detection, or mass-submit. If you want fully
headless bulk posting here, that's the thing that gets accounts banned - don't.

Selectors live in SELECTORS and WILL need verifying against the live page (these
sites change their DOM and this sandbox can't reach them). Run locally:
    pip install playwright && playwright install chromium
    python posters/formfill_assist.py leboncoin ../output/automation/leboncoin.json
"""
import json
import sys

# Per-platform new-listing URL + field selectors. VERIFY selectors on the live site.
SELECTORS = {
    "leboncoin": {
        "url": "https://www.leboncoin.fr/deposer-une-annonce",
        "fields": {
            "titre": "input[name='subject']",
            "description": "textarea[name='body']",
            "prix": "input[name='price']",
        },
        "note": "Login first in the opened browser; category is chosen via a wizard.",
    },
    "wallapop": {
        "url": "https://es.wallapop.com/app/catalog/upload",
        "fields": {
            "titre": "input[name='title']",
            "description": "textarea[name='description']",
            "prix": "input[name='sale_price']",
        },
        "note": "Wallapop is mobile-first; the web upload flow may differ by A/B test.",
    },
    "facebook": {
        "url": "https://www.facebook.com/marketplace/create/item",
        "fields": {
            "titre": "input[aria-label='Title']",
            "prix": "input[aria-label='Price']",
            "description": "textarea[aria-label='Description']",
        },
        "note": "Requires being logged into Facebook in the opened profile.",
    },
    "lecoindupro": {
        "url": "https://www.lecoindupro.com/",
        "fields": {
            "titre": "input[name='title']",
            "description": "textarea[name='description']",
            "prix": "input[name='price']",
        },
        "note": "Pro classifieds; log in first. Selectors to verify on the live deposit form.",
    },
    "aestheticequip": {
        "url": "",  # set to the site's 'add listing' URL
        "fields": {"titre": "input[name='title']", "description": "textarea[name='description']", "prix": "input[name='price']"},
        "note": "Niche aesthetic marketplace — confirm the add-listing URL and selectors.",
    },
    "trademedical": {
        "url": "",
        "fields": {"titre": "input[name='title']", "description": "textarea[name='description']", "prix": "input[name='price']"},
        "note": "Niche medical marketplace — confirm the add-listing URL and selectors.",
    },
    "medspalistings": {
        "url": "",
        "fields": {"titre": "input[name='title']", "description": "textarea[name='description']", "prix": "input[name='price']"},
        "note": "Niche aesthetic/medspa marketplace — confirm the add-listing URL and selectors.",
    },
}


def run(platform, json_path, start_index=0):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("Install playwright: pip install playwright && playwright install chromium")

    if platform not in SELECTORS:
        sys.exit(f"Unknown platform '{platform}'. Options: {list(SELECTORS)}")

    cfg = SELECTORS[platform]
    with open(json_path, encoding="utf-8") as f:
        items = json.load(f)
    items = [it for it in items if it.get("_ready_to_publish")][start_index:]
    if not items:
        sys.exit("Nothing ready to publish (all items have missing fields).")

    print(f"{len(items)} ready listing(s). {cfg['note']}")
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir=f".browser_profile_{platform}", headless=False)
        page = browser.new_page()
        for n, item in enumerate(items, 1):
            print(f"\n[{n}/{len(items)}] {item.get('marque')} {item.get('modele')} -> opening form")
            page.goto(cfg["url"])
            page.wait_for_timeout(2500)  # give the page (and login) time
            for field, selector in cfg["fields"].items():
                val = item.get(field)
                if val in (None, "MISSING", ""):
                    continue
                try:
                    page.fill(selector, str(val), timeout=8000)
                except Exception as e:
                    print(f"   [skip] {field}: selector needs verifying ({e})")
            print("   Photos to attach manually:", item.get("photos"))
            input("   >>> Review the form, attach photos, SUBMIT yourself, then press Enter for the next one...")
        browser.close()
    print("\nDone. Human-in-the-loop assist complete.")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("Usage: python posters/formfill_assist.py <platform> <json_path> [start_index]")
    run(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 0)
