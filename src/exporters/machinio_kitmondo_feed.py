"""
Machinio / Kitmondo dealer-feed exporter (Tier A).

Both platforms ingest dealer inventory feeds. Exact required columns vary by the
feed agreement your account has, so this produces a clean, complete generic
equipment feed (the columns every used-equipment feed needs) that you map to the
platform's template once, then reuse for every batch.
"""
import csv
import os

FEED_COLUMNS = [
    "reference", "manufacturer", "model", "year", "category", "condition",
    "price", "currency", "country", "description_en", "photos", "serial_number",
    "delivery", "vat_recoverable",
]


def export(master_records, platform="machinio", outdir=".", currency="EUR"):
    os.makedirs(outdir, exist_ok=True)
    rows, skipped = [], []
    for rec in master_records:
        gen = rec["generated"]
        if not (rec.get("_publishable") and rec.get("price_recommended")):
            skipped.append({"id": rec["id"], "reason": rec.get("_missing_required") or "no price"})
            continue
        photos = rec.get("photos") or []
        rows.append({
            "reference": rec["id"],
            "manufacturer": rec.get("brand", ""),
            "model": rec.get("model", ""),
            "year": rec.get("year", ""),
            "category": gen["categories"].get(platform, gen["categories"]["machinio"]),
            "condition": rec.get("condition", ""),
            "price": rec["price_recommended"],
            "currency": currency,
            "country": rec.get("country", ""),
            "description_en": gen["detailed_description"]["en"].replace("\n", " "),
            "photos": "|".join(photos) if isinstance(photos, list) else str(photos),
            "serial_number": rec.get("serial_number", ""),
            "delivery": rec.get("delivery_possible", ""),
            "vat_recoverable": rec.get("vat_recoverable", ""),
        })

    path = os.path.join(outdir, f"{platform}_feed.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FEED_COLUMNS)
        w.writeheader()
        w.writerows(rows)
    return {"csv": path, "exported": len(rows), "skipped": skipped}
