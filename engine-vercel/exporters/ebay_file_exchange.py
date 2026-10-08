"""
eBay File Exchange exporter (Tier A - real bulk upload).

Produces a CSV you upload at eBay Seller Hub > Reports > Upload. This is a
genuinely supported bulk path, so listings created this way are legitimate.

Only devices with `_ready_to_publish` and a price are exported; the rest are
written to a `_skipped` report so nothing gets posted half-formed.
"""
import csv
import os
from config import EBAY, EBAY_CONDITION_IDS


def _condition_id(condition: str) -> int:
    c = str(condition).lower()
    for key, cid in EBAY_CONDITION_IDS.items():
        if key in c:
            return cid
    return 3000  # default: Used


def _photo_field(photos):
    """eBay wants pipe-separated absolute image URLs. Local filenames won't work
    on live eBay; they must be hosted URLs. We pass them through and flag if they
    look like bare filenames."""
    if not photos or photos == "MISSING":
        return "", True
    urls = photos if isinstance(photos, list) else [photos]
    joined = "|".join(str(u) for u in urls)
    needs_hosting = not any(str(u).startswith("http") for u in urls)
    return joined, needs_hosting


# eBay File Exchange header row. The Action column encodes site/version.
def _header():
    action_col = (
        f"*Action(SiteID={EBAY['site_id']}|Country={EBAY['country']}"
        f"|Currency={EBAY['currency']}|Version={EBAY['fx_version']})"
    )
    return [
        action_col, "*Category", "*Title", "*Description", "*ConditionID",
        "PicURL", "*Format", "*Duration", "*StartPrice", "*Quantity",
        "*Location", "Brand", "MPN", "*ReturnsAcceptedOption",
        "PayPalAccepted", "PayPalEmailAddress", "DispatchTimeMax",
    ]


def export(master_records, category_id_map=None, outdir=None):
    """
    master_records: list from run_all (each has the raw fields + 'generated').
    category_id_map: optional {device_type: eBay_numeric_category_id}. If absent,
                     the Category cell is left with a TODO marker (eBay needs a
                     numeric leaf category, which must be looked up per site).
    Returns dict with paths + counts.
    """
    outdir = outdir or EBAY.get("outdir", ".")
    os.makedirs(outdir, exist_ok=True)
    category_id_map = category_id_map or {}

    rows, skipped, hosting_warnings = [], [], []
    for rec in master_records:
        gen = rec["generated"]
        auto_ready = rec.get("_publishable") and rec.get("price_recommended")
        if not auto_ready:
            skipped.append({"id": rec["id"], "reason": rec.get("_missing_required") or "no price"})
            continue

        pic, needs_hosting = _photo_field(rec.get("photos"))
        if needs_hosting:
            hosting_warnings.append(rec["id"])

        cat = category_id_map.get(gen["device_type"], "TODO_EBAY_CATEGORY_ID")
        rows.append([
            "Add",
            cat,
            gen["titles"]["ebay"],
            gen["detailed_description"]["en"].replace("\n", "<br>"),
            _condition_id(rec.get("condition", "")),
            pic,
            EBAY["listing_format"],
            EBAY["listing_duration"],
            rec["price_recommended"],
            EBAY["quantity"],
            rec.get("country", ""),
            rec.get("brand", ""),
            rec.get("model", ""),
            EBAY["return_policy"],
            "1" if EBAY.get("paypal_email") else "0",
            EBAY.get("paypal_email", ""),
            EBAY["dispatch_time_max"],
        ])

    csv_path = os.path.join(outdir, "ebay_file_exchange.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(_header())
        w.writerows(rows)

    return {
        "csv": csv_path,
        "exported": len(rows),
        "skipped": skipped,
        "photos_need_hosting": hosting_warnings,
        "notes": [
            "Category cells marked TODO_EBAY_CATEGORY_ID need a numeric leaf category "
            "ID for your eBay site (look up per model, or pass category_id_map).",
            "PicURL must be publicly hosted image URLs, not local filenames.",
        ],
    }
