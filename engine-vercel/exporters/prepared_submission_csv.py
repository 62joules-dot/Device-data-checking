"""
Prepared-submission exporter (Tier B - agent/manual posting).

For platforms with no public bulk feed but that accept dealer inventory:
  - Exapro: email offers to info@exapro.eu (agents list them) or post via form.
  - Bimedis: post via PRO account (or ask them about bulk import).
  - Niche marketplaces (Trade Medical, DeviceBridge, AestheticEquip, MedSpa Listings...).

Produces one clean, complete CSV per target so you (or their agent) can post fast
or import. Same 'never invent' rule: unfilled fields stay blank/flagged.
"""
import csv
import os

COLUMNS = [
    "reference", "manufacturer", "model", "device_family", "year", "condition",
    "price_eur", "country", "quantity", "title_en", "description_en",
    "description_fr", "photos", "serial_number", "delivery", "vat_recoverable",
    "contact_email", "contact_phone",
]


def export(master_records, target="exapro", outdir=".", contact_email="", contact_phone=""):
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
            "device_family": gen["device_type"],
            "year": rec.get("year", ""),
            "condition": rec.get("condition", ""),
            "price_eur": rec.get("price_recommended", ""),
            "country": rec.get("country", ""),
            "quantity": rec.get("quantity") if isinstance(rec.get("quantity"), int) else 1,
            "title_en": gen["titles"]["ebay"],
            "description_en": gen["detailed_description"]["en"].replace("\n", " "),
            "description_fr": gen["detailed_description"]["fr"].replace("\n", " "),
            "photos": "|".join(photos) if isinstance(photos, list) else str(photos),
            "serial_number": rec.get("serial_number", ""),
            "delivery": rec.get("delivery_possible", ""),
            "vat_recoverable": rec.get("vat_recoverable", ""),
            "contact_email": contact_email or rec.get("email", ""),
            "contact_phone": contact_phone or rec.get("phone", ""),
        })

    path = os.path.join(outdir, f"{target}_submission.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)
    return {"csv": path, "exported": len(rows), "skipped": skipped}
