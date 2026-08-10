"""
DOTmed exporter (Tier A - real automation).

DOTmed supports: a JSON REST API, a scraped Listing Feed, and a TSV Upload Tool.
This builds the TSV (upload-tool format) and a JSON feed, both matching DOTmed's
documented spec (https://www.dotmed.com/features/feeds.html).

Notes baked in from the spec:
- Condition must be one of: New, Excellent, Good, Fair, Poor, Parts, Unknown.
- Currency for EU sellers: "Euros".
- Comments: long-form description, simple text (no styled HTML).
- Photos must be public http(s) URLs.
- Category must be an exact DOTmed category name or ID (see descriptions.json);
  left as TODO where we can't map it, rather than guessed.
"""
import csv
import json
import os

DOTMED_CONDITIONS = {
    "neuf": "New", "new": "New",
    "excellent": "Excellent",
    "bon": "Good", "good": "Good",
    "refurb": "Excellent", "recond": "Excellent",
    "fair": "Fair", "poor": "Poor",
}

# TSV column headers exactly as DOTmed's Upload Tool expects (core subset + images).
TSV_HEADERS = [
    "Category", "System Model", "System Mfg", "Comments", "Condition",
    "Listing Type", "Request Type", "Price", "Currency", "Quantity",
    "Your Item ID", "Image1", "Image2", "Image3", "Image4",
]


def _condition(cond):
    c = str(cond).lower()
    for k, v in DOTMED_CONDITIONS.items():
        if k in c:
            return v
    return "Unknown"


def _images(photos):
    urls = [p for p in (photos or []) if str(p).startswith("http")]
    urls += [""] * (4 - len(urls))
    return urls[:4]


def export(master_records, dotmed_category_map=None, outdir="."):
    os.makedirs(outdir, exist_ok=True)
    dotmed_category_map = dotmed_category_map or {}

    tsv_rows, json_listings, skipped, photo_warnings = [], [], [], []
    for rec in master_records:
        gen = rec["generated"]
        if not (rec.get("_publishable") and rec.get("price_recommended")):
            skipped.append({"id": rec["id"], "reason": rec.get("_missing_required") or "no price"})
            continue

        category = dotmed_category_map.get(gen["device_type"], "TODO_DOTMED_CATEGORY")
        comments = gen["detailed_description"]["en"].replace("\n", " ").strip()
        imgs = _images(rec.get("photos"))
        if not any(imgs):
            photo_warnings.append(rec["id"])

        tsv_rows.append([
            category, rec.get("model", ""), rec.get("brand", ""), comments,
            _condition(rec.get("condition")), "equipment", "For Sale",
            rec["price_recommended"], "Euros", rec.get("quantity") if isinstance(rec.get("quantity"), int) else 1,
            rec["id"], *imgs,
        ])
        json_listings.append({
            "mfg": rec.get("brand", ""), "model": rec.get("model", ""),
            "comments": comments, "category": category,
            "price": str(rec["price_recommended"]), "currency": "Euros",
            "condition": _condition(rec.get("condition")), "type": "equipment",
            "wanted": "For Sale", "sku": rec["id"],
            "photos": {"photo": [u for u in imgs if u]},
        })

    tsv_path = os.path.join(outdir, "dotmed_upload.tsv")
    with open(tsv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter="\t")
        w.writerow(TSV_HEADERS)
        w.writerows(tsv_rows)

    json_path = os.path.join(outdir, "dotmed_feed.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"listings": {"listing": json_listings}}, f, ensure_ascii=False, indent=2)

    return {
        "tsv": tsv_path, "json": json_path, "exported": len(tsv_rows),
        "skipped": skipped, "photos_missing": photo_warnings,
        "notes": ["Category cells 'TODO_DOTMED_CATEGORY' need an exact DOTmed category "
                  "name/ID (see https://www.dotmed.com/ajax/requests/api/v2/descriptions.json).",
                  "You must be a DOTmed 'Trusted' upload user to submit feeds."],
    }
