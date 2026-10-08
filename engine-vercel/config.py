"""
Central configuration. Edit this once for the whole batch.

Nothing here is invented at runtime: blank credentials stay blank and the pipeline
flags what's missing rather than guessing.
"""
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE, "data")
OUTPUT_DIR = os.path.join(BASE, "output")

# ---- Seller / contact (global; per-row values in the Excel override these) ----
SELLER = {
    "seller_name": "",
    "phone": "",            # e.g. "+33 6 12 34 56 78"
    "email": "",            # e.g. "seb@example.com"
    "default_delivery": "Sur devis / à convenir",
    "default_country": "",  # fallback if a row has no country
}

# ---- eBay (File Exchange + Sell API) ----
EBAY = {
    "site_id": 71,              # 71 = eBay France. 77=DE, 3=UK, 186=ES, 101=IT, 0=US
    "country": "FR",
    "currency": "EUR",
    "fx_version": 1193,         # File Exchange schema version
    "listing_format": "FixedPrice",
    "listing_duration": "GTC",  # Good 'Til Cancelled
    "quantity": 1,
    "paypal_email": "",
    "return_policy": "ReturnsNotAccepted",
    "dispatch_time_max": 5,
    # Sell API (only needed for live API posting, not for the CSV export):
    "oauth_token": "",          # OAuth user token; leave blank -> API poster refuses
    "sandbox": True,
}

# eBay numeric condition IDs
EBAY_CONDITION_IDS = {
    "neuf": 1000, "new": 1000,
    "excellent": 2500, "refurbished": 2500, "recond": 2500,  # seller refurbished
    "bon": 3000, "good": 3000, "used": 3000,
}

# ---- Market research (Step 6) ----
RESEARCH = {
    "use_playwright": False,     # True to drive real headless browser scraping locally
    "firecrawl_api_key": "",     # optional, if you route scraping through Firecrawl
    "per_model_max_results": 30,
    "sources": ["ebay_sold", "machinio", "kitmondo", "leboncoin"],
}

# ---- LLM enrichment ----
LLM = {
    "enabled": False,            # True to enrich descriptions via Anthropic API
    "api_key": os.environ.get("ANTHROPIC_API_KEY", ""),
    "model": "claude-sonnet-4-5",
    "max_tokens": 1200,
}
