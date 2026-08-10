"""
Step 6 - scraper orchestrator.

Adapter pattern: each source implements fetch(model, max_results) -> [listing dict].
- MockAdapter: offline, deterministic, used for tests and dry-runs.
- PlaywrightAdapter: live scraping template you run locally (needs `playwright install`).

Run offline demo:
    python research/scraper.py --mock "Candela GentleMax Pro" "Cynosure PicoSure"
"""
import json
import sys
try:
    from research.stats import analyse_all       # imported as package (cli.py)
except ImportError:
    from stats import analyse_all                 # run directly from research/


class MockAdapter:
    """Deterministic fake data so the pipeline is testable without network."""
    name = "mock"

    def fetch(self, model, max_results=30):
        base = sum(ord(c) for c in model) % 5000 + 8000
        rows = []
        countries = ["France", "Espagne", "Italie", "Allemagne"]
        for i in range(6):
            rows.append({
                "source": "mock", "model": model,
                "price": base + i * 1500,
                "currency": "EUR",
                "country": countries[i % len(countries)],
                "status": "active", "url": f"https://example.com/{model}/{i}",
            })
        # a couple of "sold" comps
        rows.append({"source": "mock", "model": model, "price": base + 500,
                     "currency": "EUR", "country": "France", "status": "sold",
                     "url": "https://example.com/sold", "date_posted": "2025-01-10",
                     "date_removed": "2025-02-20"})
        return rows[:max_results]


class PlaywrightAdapter:
    """
    Live scraping template. Fill `search_url` and the result selectors per source.
    Selectors WILL need verification against the live DOM (these sites change and
    this sandbox can't reach them). Run locally after `pip install playwright` and
    `playwright install chromium`.
    """
    name = "playwright"

    def __init__(self, source_config):
        self.cfg = source_config  # {"search_url_template", "item_selector", "price_selector", ...}

    def fetch(self, model, max_results=30):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise RuntimeError("playwright not installed. Run: pip install playwright && playwright install chromium")

        results = []
        url = self.cfg["search_url_template"].format(query=model.replace(" ", "+"))
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, timeout=30000)
            items = page.query_selector_all(self.cfg["item_selector"])[:max_results]
            for it in items:
                price_el = it.query_selector(self.cfg["price_selector"])
                price_txt = price_el.inner_text() if price_el else ""
                price = _parse_price(price_txt)
                link_el = it.query_selector(self.cfg.get("link_selector", "a"))
                results.append({
                    "source": self.cfg.get("name", "web"), "model": model,
                    "price": price, "currency": "EUR",
                    "country": self.cfg.get("country"), "status": "active",
                    "url": link_el.get_attribute("href") if link_el else url,
                })
            browser.close()
        return results


def _parse_price(txt):
    s = "".join(c for c in str(txt) if c.isdigit())
    return int(s) if s else None


def research(models, adapters, max_results=30):
    by_model = {}
    for model in models:
        listings = []
        for a in adapters:
            try:
                listings += a.fetch(model, max_results)
            except Exception as e:
                print(f"[warn] adapter {getattr(a,'name','?')} failed for {model}: {e}", file=sys.stderr)
        by_model[model] = listings
    return analyse_all(by_model)


if __name__ == "__main__":
    args = sys.argv[1:]
    use_mock = "--mock" in args
    models = [a for a in args if not a.startswith("--")]
    if not models:
        models = ["Candela GentleMax Pro", "Cynosure PicoSure"]
    adapters = [MockAdapter()] if use_mock else [MockAdapter()]  # swap in PlaywrightAdapter live
    out = research(models, adapters)
    print(json.dumps(out, ensure_ascii=False, indent=2))
