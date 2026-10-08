"""
Orchestrator: runs the full pipeline.

  normalize (Step 1)
    -> generate listings + categories (Steps 2 & 3)
    -> build per-platform automation JSON (Step 4)
    -> prioritise (Step 5)
    -> write outputs

Run:  python src/run_all.py data/sample_devices.xlsx
Outputs land in output/.
"""
import json
import os
import sys

from normalize import normalize, MISSING
from generate import generate
from schema import DEFAULT_CONFIG
from llm_enrich import enrich
from exporters.ebay_file_exchange import export as export_ebay
from exporters.machinio_kitmondo_feed import export as export_feed
from exporters.dotmed_feed import export as export_dotmed
from exporters.prepared_submission_csv import export as export_prepared

PLATFORMS = ["leboncoin", "wallapop", "facebook", "ebay", "machinio", "kitmondo"]

# Step 4 required automation fields (client's exact list) -> where to source them.
AUTOMATION_FIELDS = [
    "titre", "description", "prix", "categorie", "photos", "localisation",
    "telephone", "email", "mode_de_livraison", "tva", "etat", "marque", "modele",
]


def build_automation_record(rec, gen, platform, config):
    """Produce one platform-ready JSON object matching the client's Step 4 schema."""
    deliv = rec.get("delivery_possible")
    deliv_txt = {"yes": "Livraison possible", "no": "Retrait sur place"}.get(
        deliv, config.get("default_delivery", MISSING))
    vat = rec.get("vat_recoverable")
    vat_txt = {"yes": "TVA récupérable", "no": "Hors TVA"}.get(vat, MISSING)

    # language of the description per platform market
    lang = {"leboncoin": "fr", "facebook": "fr", "wallapop": "es",
            "ebay": "en", "machinio": "en", "kitmondo": "en"}[platform]

    obj = {
        "titre": gen["titles"][platform],
        "description": gen["detailed_description"][lang],
        "prix": rec.get("price_recommended") if rec.get("price_recommended") is not None else MISSING,
        "categorie": gen["categories"][platform],
        "photos": rec.get("photos") or MISSING,
        "localisation": rec.get("country", MISSING),
        "telephone": rec.get("phone", MISSING),
        "email": rec.get("email", MISSING),
        "mode_de_livraison": deliv_txt,
        "tva": vat_txt,
        "etat": rec.get("condition", MISSING),
        "marque": rec.get("brand", MISSING),
        "modele": rec.get("model", MISSING),
    }
    missing = [k for k, v in obj.items()
               if v == MISSING or v == [] or v is None]
    obj["_platform"] = platform
    obj["_device_id"] = rec["id"]
    obj["_tags"] = gen["tags"]
    obj["_missing_fields"] = missing
    obj["_ready_to_publish"] = len(missing) == 0
    return obj


def priority_score(rec):
    """
    Step 5 ordering. Lower sort value = published first.
    Combines: explicit priority, cash generated (recommended price),
    and 'reste à solder' proxy (if provided). Adapt weights to real columns.
    """
    prio_raw = str(rec.get("priority", "")).lower()
    prio_rank = {"1": 0, "high": 0, "haute": 0, "très recherchée": 0,
                 "2": 1, "medium": 1, "moyenne": 1,
                 "3": 2, "low": 2, "basse": 2}.get(prio_raw, 1)
    price = rec.get("price_recommended") or 0
    # higher price -> higher cash -> earlier; negate so bigger sorts first within same prio
    return (prio_rank, -price)


def run(xlsx_path, config=None, outdir="../output"):
    config = {**DEFAULT_CONFIG, **(config or {})}
    os.makedirs(outdir, exist_ok=True)
    os.makedirs(os.path.join(outdir, "automation"), exist_ok=True)

    records = normalize(xlsx_path, config)

    master, automation_by_platform = [], {p: [] for p in PLATFORMS}
    for rec in records:
        gen = generate(rec)
        gen = enrich(rec, gen)  # no-op unless LLM enabled + key present
        master.append({**rec, "generated": gen})
        for p in PLATFORMS:
            automation_by_platform[p].append(build_automation_record(rec, gen, p, config))

    # Step 5 priority queue
    ordered = sorted(master, key=priority_score)
    queue = [{"rank": i + 1, "id": r["id"],
              "device": f"{r.get('brand','?')} {r.get('model','?')}".strip(),
              "price_recommended": r.get("price_recommended"),
              "priority": r.get("priority"),
              "publishable": r.get("_publishable"),
              "missing_required": r.get("_missing_required")}
             for i, r in enumerate(ordered)]

    # write outputs
    with open(f"{outdir}/master_database.json", "w", encoding="utf-8") as f:
        json.dump(master, f, ensure_ascii=False, indent=2, default=str)
    for p in PLATFORMS:
        with open(f"{outdir}/automation/{p}.json", "w", encoding="utf-8") as f:
            json.dump(automation_by_platform[p], f, ensure_ascii=False, indent=2, default=str)
    with open(f"{outdir}/priority_queue.json", "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2, default=str)

    # Tier-A bulk exporters (eBay File Exchange + Machinio/Kitmondo feeds)
    exp_dir = os.path.join(outdir, "exports")
    os.makedirs(exp_dir, exist_ok=True)
    ebay_res = export_ebay(master, outdir=exp_dir)
    machinio_res = export_feed(master, platform="machinio", outdir=exp_dir)
    kitmondo_res = export_feed(master, platform="kitmondo", outdir=exp_dir)
    dotmed_res = export_dotmed(master, outdir=exp_dir)
    exapro_res = export_prepared(master, target="exapro", outdir=exp_dir)
    bimedis_res = export_prepared(master, target="bimedis", outdir=exp_dir)

    # completeness report
    report = {
        "total_devices": len(records),
        "publishable": sum(1 for r in records if r["_publishable"]),
        "incomplete": [{"id": r["id"], "missing": r["_missing_required"]}
                       for r in records if not r["_publishable"]],
        "platforms": PLATFORMS,
        "tier_a_exports": {
            "ebay": {"file": ebay_res["csv"], "exported": ebay_res["exported"]},
            "dotmed": {"file": dotmed_res["tsv"], "exported": dotmed_res["exported"]},
            "machinio": {"file": machinio_res["csv"], "exported": machinio_res["exported"]},
            "kitmondo": {"file": kitmondo_res["csv"], "exported": kitmondo_res["exported"]},
            "exapro_prepared": {"file": exapro_res["csv"], "exported": exapro_res["exported"]},
            "bimedis_prepared": {"file": bimedis_res["csv"], "exported": bimedis_res["exported"]},
        },
    }
    with open(f"{outdir}/report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    return report


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "data/sample_devices.xlsx"
    rep = run(path)
    print(json.dumps(rep, ensure_ascii=False, indent=2))
