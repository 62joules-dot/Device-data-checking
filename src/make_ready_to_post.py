"""
Build the ready-to-post pack (copy-paste HTML) + a listings review xlsx from
a completed run's master_database.json.

Usage: python make_ready_to_post.py <output_dir>
"""
import json
import os
import sys
import pandas as pd


def _esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build(outdir):
    master_path = os.path.join(outdir, "master_database.json")
    if not os.path.exists(master_path):
        print("no master_database.json in", outdir); return
    m = json.load(open(master_path, encoding="utf-8"))

    blocks, n = "", 0
    for r in m:
        if not (r.get("_publishable") and r.get("price_recommended")):
            continue
        n += 1
        g = r["generated"]
        price = f"{r['price_recommended']:,} €".replace(",", " ")
        fr, en, es = (_esc(g["detailed_description"][k]) for k in ("fr", "en", "es"))
        blocks += f"""<div class="m"><div class="h"><span class="num">{n}</span> {_esc(r.get('brand',''))} {_esc(r.get('model',''))} — <span class="pr">{price}</span></div>
<div class="grp"><label>Titre (Leboncoin / FR)</label><div class="f"><textarea rows="2">{_esc(g['titles']['leboncoin'])}</textarea><button onclick="cp(this)">Copier</button></div></div>
<div class="grp"><label>Titre (eBay / EN)</label><div class="f"><textarea rows="2">{_esc(g['titles']['ebay'])}</textarea><button onclick="cp(this)">Copier</button></div></div>
<div class="grp"><label>Description Français</label><div class="f"><textarea rows="8">{fr}</textarea><button onclick="cp(this)">Copier</button></div></div>
<div class="grp"><label>Description English</label><div class="f"><textarea rows="8">{en}</textarea><button onclick="cp(this)">Copier</button></div></div>
<div class="grp"><label>Descripción Español</label><div class="f"><textarea rows="8">{es}</textarea><button onclick="cp(this)">Copier</button></div></div>
<div class="ph">📷 Ajoute tes {len(r.get('photos') or [])} photos au moment de poster.</div></div>"""

    html = f"""<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>62 JOULES — Prêt à poster</title><style>
:root{{--ink:#0f2233;--muted:#5b6b78;--line:#dfe5e9;--teal:#0e7c86;--bg:#f4f7f8}}*{{box-sizing:border-box}}body{{margin:0;font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--ink)}}.wrap{{max-width:820px;margin:0 auto;padding:24px}}h1{{font-size:23px;margin:0 0 2px}}.lead{{color:var(--muted);font-size:14px;margin-bottom:18px}}.m{{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:16px}}.h{{font-size:16px;font-weight:700;margin-bottom:10px}}.num{{display:inline-flex;width:24px;height:24px;background:var(--teal);color:#fff;border-radius:50%;align-items:center;justify-content:center;font-size:13px;margin-right:6px}}.pr{{color:var(--teal)}}.grp{{margin:10px 0}}label{{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase}}.f{{display:flex;gap:8px;margin-top:4px}}textarea{{flex:1;font-family:inherit;font-size:13px;border:1px solid var(--line);border-radius:8px;padding:8px 10px;resize:vertical;background:#fbfcfd}}button{{background:var(--teal);color:#fff;border:none;border-radius:8px;padding:0 14px;font-weight:600;cursor:pointer;font-size:13px;white-space:nowrap}}.ph{{margin-top:8px;font-size:12.5px;color:var(--muted);background:#eef6f6;border:1px solid #cfe6e7;border-radius:8px;padding:8px 10px}}</style></head><body><div class="wrap"><h1>62 JOULES — Annonces prêtes à poster ({n})</h1><div class="lead">Copie le titre + la description, colle sur la plateforme, ajoute tes photos, publie. FR=Leboncoin, EN=eBay/international, ES=Wallapop.</div>{blocks}</div><script>function cp(b){{const t=b.previousElementSibling;t.select();document.execCommand('copy');b.textContent='Copié ✓';setTimeout(()=>b.textContent='Copier',1200);}}</script></body></html>"""
    open(os.path.join(outdir, "PRET_A_POSTER.html"), "w", encoding="utf-8").write(html)

    rows = []
    for r in m:
        g = r["generated"]
        rows.append({
            "Marque": r.get("brand"), "Modèle": r.get("model"),
            "Prix (€)": r.get("price_recommended") or "À COMPLÉTER",
            "Titre eBay": g["titles"]["ebay"], "Titre Leboncoin": g["titles"]["leboncoin"],
            "Description FR": g["detailed_description"]["fr"],
            "Description EN": g["detailed_description"]["en"],
            "Description ES": g["detailed_description"]["es"],
            "Prêt": "OUI" if (r.get("_publishable") and r.get("price_recommended")) else "NON — prix manquant",
        })
    pd.DataFrame(rows).to_excel(os.path.join(outdir, "listings_a_verifier.xlsx"), index=False, engine="openpyxl")
    print(f"ready-to-post: {n} machines -> PRET_A_POSTER.html + listings_a_verifier.xlsx")


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else "../output")
