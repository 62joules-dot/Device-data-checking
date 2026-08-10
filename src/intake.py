"""
Intake for the 'type + quantity' summary shape (the client's real file).

The client's Excel is a summary: ID, Type de Machine, quantity. It has none of the
per-unit selling data. This module:
  1. reads that summary (drops TOTAL / blank rows, parses '- Terminée' status),
  2. classifies each type and derives brand/model hints only where confident,
  3. emits per-type records (everything unknown = MISSING, never invented),
  4. builds a REUSABLE per-unit data-collection template (one row per physical unit)
     that the client fills once and the normal pipeline then consumes - for these
     devices and any future ones.
"""
import re
import os
import unicodedata
import pandas as pd

from knowledge import classify, TYPES
from price_hints import suggest as suggest_price

MISSING = "MISSING"

# Confident brand hints for well-known device names (verify, but not invented).
BRAND_HINTS = {
    "visia": "Canfield", "hairmetrix": "Canfield", "vectra": "Canfield",
    "optimas": "Cynosure", "lumecca": "Cynosure/InMode", "morpheus": "InMode",
    "coolsculpting": "Allergan/Zeltiq", "cool elite": "Allergan",
    "emtone": "BTL", "emsculpt": "BTL",
    "softwave": "SoftWave", "jet peel": "TavTech/Cesam",
    "accent prime": "Alma", "accent": "Alma",
    "ultraformer": "Classys", "onda": "DEKA",
    "oxygeneo": "Pollogen/Lumenis", "miradry": "miraDry", "dermalux": "Dermalux",
}

# Columns of the reusable data-collection template (French labels for the client).
TEMPLATE_COLUMNS = [
    "ID", "Unité #", "Type de Machine", "Famille (auto)", "Marque", "Modèle",
    "Année", "Numéro de série", "État", "Pays", "Options", "Accessoires",
    "Prix minimum", "Prix conseillé", "Prix premium", "Prix = suggestion auto (à vérifier)",
    "TVA récupérable (oui/non)",
    "Livraison possible (oui/non)", "Photos (noms de fichiers / URLs)", "Priorité (1-3)", "Statut",
]


def _strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", str(s)) if unicodedata.category(c) != "Mn")


def _brand_hint(type_text):
    low = _strip_accents(type_text).lower()
    for key, brand in BRAND_HINTS.items():
        if key in low:
            return brand
    return MISSING


def read_summary(xlsx_path):
    """Return cleaned list of {id, type, quantity, status} rows, TOTAL/blank dropped."""
    df = pd.read_excel(xlsx_path)
    # find columns flexibly
    cols = {c: _strip_accents(c).lower().strip() for c in df.columns}
    id_col = next((c for c, n in cols.items() if n == "id" or "id" in n and len(n) <= 4), df.columns[0])
    type_col = next((c for c, n in cols.items() if "type" in n or "machine" in n or "device" in n and "number" not in n), df.columns[1])
    qty_col = next((c for c, n in cols.items() if "number" in n or "quantit" in n or "nombre" in n or "qty" in n), df.columns[-1])

    rows = []
    for _, r in df.iterrows():
        rid = r.get(id_col)
        rtype = r.get(type_col)
        qty = pd.to_numeric(r.get(qty_col), errors="coerce")
        if pd.isna(rtype) or str(rtype).strip() == "":
            continue
        t = str(rtype).strip()
        if "total" in _strip_accents(t).lower():   # drop the TOTAL row
            continue
        status = "active"
        m = re.search(r"-\s*termin", _strip_accents(t).lower())
        if m:
            status = "terminee"
            t = re.sub(r"-\s*[Tt]ermin\w*", "", t).strip()  # clean the label off the name
        rows.append({
            "id": str(rid).strip() if not pd.isna(rid) else MISSING,
            "type": t,
            "quantity": int(qty) if not pd.isna(qty) else MISSING,
            "status": status,
        })
    return rows


def to_type_records(summary_rows):
    """One record per machine TYPE, with classification + safe hints, rest MISSING."""
    records = []
    for row in summary_rows:
        dtype = classify("", row["type"], "")
        meta = TYPES[dtype]
        rec = {
            "id": row["id"],
            "brand": _brand_hint(row["type"]),
            "model": row["type"],           # keep the client's exact naming as model
            "device_type": dtype,
            "device_family_label_fr": meta["label_fr"],
            "quantity": row["quantity"],
            "status": row["status"],
            # all sellable fields absent in the source -> flagged, not invented:
            "year": MISSING, "serial_number": MISSING, "options": [], "accessories": [],
            "condition": MISSING, "country": MISSING,
            "price_min": None, "price_recommended": None, "price_premium": None,
            "vat_recoverable": MISSING, "delivery_possible": MISSING,
            "photos": [], "priority": "1" if row["status"] == "active" else "3",
            "phone": MISSING, "email": MISSING,
        }
        needed = ["condition", "country", "price_recommended", "photos"]
        rec["_missing_required"] = [f for f in needed if rec.get(f) in (MISSING, None, [])]
        rec["_publishable"] = False  # never publishable from summary alone
        records.append(rec)
    return records


def build_template(summary_rows, out_xlsx):
    """Reusable per-UNIT intake sheet: one row per physical device to be filled."""
    rows = []
    for row in summary_rows:
        dtype = classify("", row["type"], "")
        fam = TYPES[dtype]["label_fr"]
        brand = _brand_hint(row["type"])
        price = suggest_price(row["type"])   # (min, rec, premium) or None
        qty = row["quantity"] if isinstance(row["quantity"], int) else 1
        for u in range(1, qty + 1):
            rows.append({
                "ID": row["id"], "Unité #": u, "Type de Machine": row["type"],
                "Famille (auto)": fam,
                "Marque": "" if brand == MISSING else brand,
                "Modèle": row["type"], "Année": "", "Numéro de série": "",
                "État": "", "Pays": "", "Options": "", "Accessoires": "",
                "Prix minimum": price[0] if price else "",
                "Prix conseillé": price[1] if price else "",
                "Prix premium": price[2] if price else "",
                "Prix = suggestion auto (à vérifier)": "OUI - à ajuster" if price else "à renseigner",
                "TVA récupérable (oui/non)": "", "Livraison possible (oui/non)": "",
                "Photos (noms de fichiers / URLs)": "", "Priorité (1-3)": "",
                "Statut": row["status"],
            })
    df = pd.DataFrame(rows, columns=TEMPLATE_COLUMNS)
    os.makedirs(os.path.dirname(out_xlsx), exist_ok=True)
    df.to_excel(out_xlsx, index=False, engine="openpyxl")
    return {"template": out_xlsx, "unit_rows": len(rows)}
