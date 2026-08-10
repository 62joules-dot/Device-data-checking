"""
Process the client's 'type + quantity' summary file end to end.

Run:  python intake_run.py ../data/../<client file>.xlsx
Outputs to output/intake/:
  - type_records.json         one record per machine type (classified, hints, MISSING flags)
  - listing_drafts.json       per-type listing drafts (titles + FR/ES/EN descriptions)
  - data_collection.xlsx      REUSABLE per-unit intake sheet to fill (works for future devices too)
  - MISSING_REPORT.md         exactly what the client must provide before anything can go live
"""
import json
import os
import sys

from intake import read_summary, to_type_records, build_template, MISSING
from generate import generate
from outreach.generate_outreach_pack import generate as generate_outreach
from outreach.consolidate_contacts import build as build_contacts_master
from outreach.build_broker_email import build as build_broker_email
from outreach.build_wave6_email import build as build_wave6_email
from make_fill_in_test import build as build_test_sheet
from make_fiche import build as build_fiche
from classifieds_registry import rows as classifieds_rows, COLUMNS as CLASSIFIEDS_COLS


def run(client_xlsx, outdir="../output/intake"):
    os.makedirs(outdir, exist_ok=True)
    summary = read_summary(client_xlsx)
    records = to_type_records(summary)

    drafts = []
    for rec in records:
        gen = generate(rec)
        drafts.append({
            "id": rec["id"], "type": rec["model"], "device_type": rec["device_type"],
            "quantity": rec["quantity"], "status": rec["status"],
            "brand_hint": rec["brand"],
            "titles": gen["titles"],
            "short_description": gen["short_description"],
            "detailed_description": gen["detailed_description"],
            "categories": gen["categories"], "tags": gen["tags"],
        })

    # Wave 2 classifieds directory (where to post, which language, which link)
    try:
        import pandas as _pd
        _pd.DataFrame(classifieds_rows())[CLASSIFIEDS_COLS].to_excel(
            os.path.join(outdir, "plateformes_directory.xlsx"), index=False, engine="openpyxl")
    except Exception as e:
        print(f"[info] platforms directory skipped: {e}")

    tmpl = build_template(summary, os.path.join(outdir, "data_collection.xlsx"))
    # fill-in TEST sheet (2 worked examples + instructions) for a quick trial
    try:
        build_test_sheet(src=os.path.join(outdir, "data_collection.xlsx"),
                         out=os.path.join(outdir, "data_collection_TEST.xlsx"))
        build_fiche(src=os.path.join(outdir, "data_collection.xlsx"),
                    out=os.path.join(outdir, "FICHE_A_REMPLIR.xlsx"))
    except Exception as e:
        print(f"[info] test sheet skipped: {e}")

    # Wave 3 & 4 outreach / consignment pack
    outreach_res = generate_outreach(records, outdir=os.path.join(outdir, "outreach"))

    # Wave 5 contacts master + ready-to-send broker email (skips cleanly if no contact files)
    contacts_res, broker_res = None, None
    try:
        contacts_res = build_contacts_master(os.path.join(outdir, "outreach", "Contacts_Master.xlsx"))
    except Exception as e:
        print(f"[info] contacts master skipped: {e}")
    try:
        broker_res = build_broker_email(records, outdir=os.path.join(outdir, "outreach"))
    except Exception as e:
        print(f"[info] broker email skipped: {e}")
    wave6_res = None
    try:
        wave6_res = build_wave6_email(records, outdir=os.path.join(outdir, "outreach"))
    except Exception as e:
        print(f"[info] wave6 email skipped: {e}")

    json.dump(records, open(os.path.join(outdir, "type_records.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2, default=str)
    json.dump(drafts, open(os.path.join(outdir, "listing_drafts.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2, default=str)

    # human-readable missing report
    active = [r for r in records if r["status"] == "active"]
    terminee = [r for r in records if r["status"] != "active"]
    total_units = sum(r["quantity"] for r in records if isinstance(r["quantity"], int))
    active_units = sum(r["quantity"] for r in active if isinstance(r["quantity"], int))

    lines = [
        "# Missing-data report",
        "",
        f"Source file describes **{len(records)} machine types** / **{total_units} physical units** "
        f"({active_units} active, {total_units - active_units} marked 'Terminée').",
        "",
        "The source file contains **type + quantity only**. To publish any listing, each unit still needs:",
        "",
        "| Field | Needed for |",
        "|---|---|",
        "| Prix conseillé (+ min / premium) | every platform |",
        "| État (condition) | every platform |",
        "| Pays (location) | every platform |",
        "| Photos (hosted URLs for eBay) | every platform |",
        "| Année, N° de série | trust / eBay item specifics |",
        "| Options, Accessoires | description quality |",
        "| TVA récupérable, Livraison | buyer info |",
        "| Téléphone, Email (global, set once in config.py) | contact |",
        "",
        "### Per type",
        "| ID | Type | Family (auto) | Brand hint | Qty | Status |",
        "|---|---|---|---|---|---|",
    ]
    for r in records:
        lines.append(f"| {r['id']} | {r['model']} | {r['device_type']} | "
                     f"{'' if r['brand']==MISSING else r['brand']} | {r['quantity']} | {r['status']} |")
    lines += [
        "",
        "### What to do next",
        "1. Open **data_collection.xlsx** (one row per physical unit, pre-filled with ID, type, "
        "family and brand hint).",
        "2. Fill price / condition / country / year / serial / photos per unit.",
        "3. Run: `python cli.py build ../output/intake/data_collection.xlsx` — the full pipeline "
        "(listings, JSON, eBay & feed exports, priority queue) then runs on real data.",
        "",
        "This template + pipeline is reusable for any future devices: add rows, re-run.",
    ]
    open(os.path.join(outdir, "MISSING_REPORT.md"), "w", encoding="utf-8").write("\n".join(lines))

    return {
        "types": len(records), "total_units": total_units, "active_units": active_units,
        "template_unit_rows": tmpl["unit_rows"], "outdir": outdir,
        "outreach": {"auction_houses": outreach_res["auction_houses"],
                     "channels": outreach_res["outreach_channels"]},
        "contacts_master": (contacts_res or {}).get("total"),
        "broker_email": bool(broker_res),
        "wave6": {"ok": (wave6_res or {}).get("ok_contacts"),
                  "high_risk_quarantined": (wave6_res or {}).get("high_risk_quarantined")} if wave6_res else None,
    }


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/uploads/listing_devices.xlsx"
    print(json.dumps(run(path), ensure_ascii=False, indent=2))
