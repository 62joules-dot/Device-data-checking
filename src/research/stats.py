"""
Step 6 - market research stats.

Pure computation over a list of scraped listings. No network here, so this is
fully unit-testable. Feed it listings from any adapter (live scraper or mock).

Each listing dict: {source, model, price, currency, country, status, url,
                    date_posted (optional), date_removed (optional)}
status in {"active", "sold", "expired"}.
"""
from statistics import median
from collections import Counter, defaultdict


def _clean_prices(listings, status=None):
    out = []
    for l in listings:
        if status and l.get("status") != status:
            continue
        p = l.get("price")
        if isinstance(p, (int, float)) and p > 0:
            out.append(p)
    return out


def _competition_level(n_active):
    if n_active <= 2:
        return "low"
    if n_active <= 8:
        return "medium"
    return "high"


def analyse_model(model, listings):
    active = _clean_prices(listings, "active")
    sold = _clean_prices(listings, "sold")
    countries = Counter(l.get("country") for l in listings if l.get("status") == "active" and l.get("country"))

    # avg time-to-sell where both dates exist
    durations = []
    for l in listings:
        d0, d1 = l.get("date_posted"), l.get("date_removed")
        if d0 and d1:
            try:
                from datetime import date
                durations.append((date.fromisoformat(str(d1)) - date.fromisoformat(str(d0))).days)
            except Exception:
                pass

    best_country = countries.most_common(1)[0][0] if countries else None

    return {
        "model": model,
        "n_listings": len(listings),
        "n_active": len(active),
        "asking_price": {
            "min": min(active) if active else None,
            "median": round(median(active)) if active else None,
            "max": max(active) if active else None,
        },
        "sold_price": {
            "median": round(median(sold)) if sold else None,
            "note": None if sold else "insufficient public sold-price data",
        },
        "avg_days_to_sell": round(sum(durations) / len(durations)) if durations else None,
        "listings_by_country": dict(countries),
        "best_country_by_volume": best_country,
        "competition_level": _competition_level(len(active)),
    }


def analyse_all(listings_by_model: dict) -> dict:
    return {model: analyse_model(model, lst) for model, lst in listings_by_model.items()}
