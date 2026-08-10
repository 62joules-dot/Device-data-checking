"""
Step 1 - Centralisation.

Reads the client's Excel (any reasonable header spelling) and outputs a clean list
of records matching schema.FIELDS. Missing required fields are flagged, never invented.
"""
import unicodedata
import pandas as pd
from schema import FIELDS, CONTACT_FIELDS, ALIASES, REQUIRED_FOR_PUBLISH, DEFAULT_CONFIG

MISSING = "MISSING"  # explicit sentinel the automation layer checks for


def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def _norm_header(h) -> str:
    s = _strip_accents(str(h).strip().lower())
    if " (" in s:                      # drop friendly suffixes like "photos (urls)"
        s = s.split(" (")[0]
    return s.replace("_", " ").replace("-", " ").strip()


def _build_header_map(columns):
    """Map each source column -> canonical field using ALIASES (accent-insensitive)."""
    canon_by_alias = {}
    for field, aliases in ALIASES.items():
        for a in aliases:
            canon_by_alias[_norm_header(a)] = field
    mapping = {}
    for col in columns:
        key = _norm_header(col)
        if key in canon_by_alias:
            mapping[col] = canon_by_alias[key]
    return mapping


def _to_bool_str(val):
    s = str(val).strip().lower()
    if s in ("oui", "yes", "true", "1", "y", "o", "si", "x"):
        return "yes"
    if s in ("non", "no", "false", "0", "n"):
        return "no"
    return MISSING


def _clean_price(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).replace("€", "").replace("EUR", "").replace(" ", "").replace(",", ".")
    s = "".join(ch for ch in s if ch.isdigit() or ch == ".")
    try:
        return round(float(s)) if s else None
    except ValueError:
        return None


def _split_list(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return []
    return [p.strip() for p in str(val).replace(";", ",").split(",") if p.strip()]


import re as _re


def _fix_photo_urls(items):
    """Convert Google Drive 'view' links to direct-view URLs; keep others as-is."""
    out = []
    for p in items:
        m = _re.search(r"/d/([A-Za-z0-9_-]+)", str(p))
        if m:
            out.append(f"https://drive.google.com/uc?export=view&id={m.group(1)}")
        elif str(p).strip():
            out.append(str(p).strip())
    return out


def _read_excel_smart(xlsx_path):
    """Read the sheet even if it has a title banner: find the real header row
    (the one containing ID/Marque/Type), otherwise use row 0."""
    raw = pd.read_excel(xlsx_path, header=None)
    hdr = 0
    for i in range(min(10, len(raw))):
        cells = [_strip_accents(str(x)).strip().lower() for x in raw.iloc[i].tolist()]
        if any(c in ("id", "marque", "type de machine", "modele", "brand", "model") for c in cells):
            hdr = i
            break
    df = pd.read_excel(xlsx_path, header=hdr)
    df.columns = [str(c).strip() for c in df.columns]
    # drop pure template/example rows and empty rows
    if "ID" in df.columns:
        df = df[~df["ID"].astype(str).str.startswith("EX-000")]
    return df.dropna(how="all")


def normalize(xlsx_path: str, config: dict = None) -> list:
    config = {**DEFAULT_CONFIG, **(config or {})}
    df = _read_excel_smart(xlsx_path)
    header_map = _build_header_map(df.columns)

    records = []
    for i, row in df.iterrows():
        rec = {"id": f"DEV-{i+1:03d}"}
        # map known columns
        canon_row = {}
        for src_col, field in header_map.items():
            canon_row[field] = row[src_col]

        for field in FIELDS + CONTACT_FIELDS:
            raw = canon_row.get(field, None)
            if field in ("price_min", "price_recommended", "price_premium"):
                rec[field] = _clean_price(raw)
            elif field in ("vat_recoverable", "delivery_possible"):
                rec[field] = _to_bool_str(raw)
            elif field in ("photos", "options", "accessories"):
                vals = _split_list(raw)
                rec[field] = _fix_photo_urls(vals) if field == "photos" else vals
            elif field in ("phone", "email"):
                v = None if raw is None or (isinstance(raw, float) and pd.isna(raw)) else str(raw).strip()
                rec[field] = v or config.get(field) or MISSING
            else:
                if raw is None or (isinstance(raw, float) and pd.isna(raw)) or str(raw).strip() == "":
                    rec[field] = MISSING
                else:
                    rec[field] = str(raw).strip()

        # completeness check
        missing = [f for f in REQUIRED_FOR_PUBLISH if rec.get(f) in (MISSING, None)]
        rec["_missing_required"] = missing
        rec["_publishable"] = len(missing) == 0
        records.append(rec)

    return records


if __name__ == "__main__":
    import json, sys
    recs = normalize(sys.argv[1] if len(sys.argv) > 1 else "data/sample_devices.xlsx")
    print(json.dumps(recs, ensure_ascii=False, indent=2, default=str))
