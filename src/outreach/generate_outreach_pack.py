"""
Wave 3 & 4 outreach / consignment pack (non-automatable channels).

Auctions and outreach channels don't take automated listings, so instead of
fake posting bots this builds the tools you actually use to sell through them:
  - a directory of auction houses / broker channels (pre-filled, verify on site),
  - ready-to-send templates auto-filled with your inventory summary,
  - a tracker to follow each submission.

Run:  python outreach/generate_outreach_pack.py    (uses intake type_records if present)
"""
import csv
import json
import os

# Known auction / liquidation houses relevant to medical & aesthetic equipment.
# 'method' is always consignment: you submit; they inspect/appraise and list.
# URLs are starting points — VERIFY the current 'sell/consign' page on each site.
AUCTION_HOUSES = [
    ("British Medical Auctions", "Medical/aesthetic specialist (UK)", "consignment", "https://www.britishmedicalauctions.co.uk"),
    ("Troostwijk Auctions (TWK)", "Industrial/medical (EU)", "consignment", "https://www.troostwijkauctions.com"),
    ("Surplex", "Industrial (EU)", "consignment", "https://www.surplex.com"),
    ("EquipNet", "Lab/medical asset recovery", "consignment", "https://www.equipnet.com"),
    ("Ritchie Bros.", "Industrial/heavy (global)", "consignment", "https://www.rbauction.com"),
    ("Go-Dove / Liquidity Services", "Asset liquidation (global)", "consignment", "https://www.go-dove.com"),
    ("Vavato", "Industrial (EU)", "consignment", "https://www.vavato.com"),
    ("PS Auction", "Industrial (EU/Nordics)", "consignment", "https://www.psauction.com"),
    ("Auctelia", "Industrial (EU/FR/BE)", "consignment", "https://www.auctelia.com"),
    ("Industrial Auctions", "Industrial (NL/EU)", "consignment", "https://www.industrial-auctions.com"),
    ("Apex Auctions", "Industrial (UK/global)", "consignment", "https://www.apexauctions.com"),
    ("BidSpotter", "Auctioneer aggregator (post via a listed auctioneer)", "via auctioneer", "https://www.bidspotter.com"),
]

# Wave 3 outreach channels (relationship-based, mostly manual).
OUTREACH_CHANNELS = [
    ("LinkedIn", "Post + direct outreach to clinics/distributors", "manual/social"),
    ("WhatsApp Business", "Broadcast to your buyer/broker contact list", "broadcast (WA Business API optional)"),
    ("Facebook groups", "Post in specialist aesthetic/medical resale groups", "manual (group rules apply)"),
    ("Distributor & broker networks", "Direct email to known brokers", "manual/email"),
]


def _inventory_summary(records):
    lines = []
    for r in records:
        model = r.get("model") or r.get("type") or "?"
        qty = r.get("quantity", "")
        price = r.get("price_recommended") or ""
        country = r.get("country") or ""
        piece = f"- {model}"
        if qty:
            piece += f" (x{qty})"
        if price:
            piece += f" — ~{price} EUR"
        if country and country != "MISSING":
            piece += f" — {country}"
        lines.append(piece)
    return "\n".join(lines)


def generate(records, outdir="../output/outreach", seller_name="", contact_email="", contact_phone=""):
    os.makedirs(outdir, exist_ok=True)
    inv = _inventory_summary(records)
    n_types = len(records)
    total_units = sum(r.get("quantity", 0) for r in records if isinstance(r.get("quantity"), int))

    # 1) contacts directory
    with open(os.path.join(outdir, "contacts_auctions.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["house", "focus", "method", "url", "verified_contact_email", "notes"])
        for name, focus, method, url in AUCTION_HOUSES:
            w.writerow([name, focus, method, url, "", ""])

    # 2) templates
    sig = f"\n\n{seller_name}\n{contact_email}\n{contact_phone}".rstrip()

    auction_email = (
        f"Subject: Consignment enquiry — aesthetic/medical equipment ({total_units} units)\n\n"
        f"Hello,\n\nI have {total_units} units across {n_types} categories of professional "
        f"aesthetic/medical equipment to sell and would like to discuss consignment / auction.\n\n"
        f"Inventory overview:\n{inv}\n\n"
        f"Most units are CE-marked; photos, condition and serial numbers available on request. "
        f"Could you let me know your process, fees, and next available sale?{sig}\n"
    )
    broker_email = (
        f"Subject: Aesthetic equipment available — wholesale / broker\n\n"
        f"Hi,\n\nWe're releasing {total_units} units of aesthetic/medical devices and are open to "
        f"broker/wholesale offers. Summary below — full specs, photos and pricing on request.\n\n{inv}\n"
        f"{sig}\n"
    )
    linkedin_post = (
        f"\U0001F4E2 Professional aesthetic & medical equipment available ({total_units} units).\n\n"
        f"Lasers, RF, body contouring, HIFU, imaging and more — CE-marked, priced to move, "
        f"delivery across Europe.\n\n{inv}\n\nDM me for specs, photos and pricing. #aesthetics "
        f"#medicalequipment #usedmedical #estetica"
    )
    whatsapp_broadcast = (
        f"Hi \U0001F44B — we have {total_units} aesthetic/medical devices available now:\n\n{inv}\n\n"
        f"Photos + prices on request. Reply here if interested or know a buyer."
    )

    for fname, text in [
        ("template_auction_consignment_email.txt", auction_email),
        ("template_broker_email.txt", broker_email),
        ("template_linkedin_post.txt", linkedin_post),
        ("template_whatsapp_broadcast.txt", whatsapp_broadcast),
    ]:
        open(os.path.join(outdir, fname), "w", encoding="utf-8").write(text)

    # 3) tracker
    with open(os.path.join(outdir, "tracker.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["channel", "contact", "method", "date_sent", "response", "status", "notes"])
        for name, focus, method, url in AUCTION_HOUSES:
            w.writerow([name, url, method, "", "", "to contact", ""])
        for name, desc, method in OUTREACH_CHANNELS:
            w.writerow([name, desc, method, "", "", "to do", ""])

    return {"outdir": outdir, "auction_houses": len(AUCTION_HOUSES),
            "outreach_channels": len(OUTREACH_CHANNELS),
            "files": ["contacts_auctions.csv", "template_auction_consignment_email.txt",
                      "template_broker_email.txt", "template_linkedin_post.txt",
                      "template_whatsapp_broadcast.txt", "tracker.csv"]}


if __name__ == "__main__":
    import sys
    src = "../output/intake/type_records.json"
    recs = json.load(open(src, encoding="utf-8")) if os.path.exists(src) else []
    if not recs:
        print("No type_records.json found; run intake_run.py first.", file=sys.stderr)
    res = generate(recs)
    print(json.dumps(res, ensure_ascii=False, indent=2))
