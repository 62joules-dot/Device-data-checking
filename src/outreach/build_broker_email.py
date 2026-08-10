"""
Build the ready-to-send Wave 5 broker email.

Uses Sébastien's own approach template (from the Wave 5 file) and auto-fills it with
the REAL inventory (from the intake type_records). Output is one copy-paste email,
plus an optional per-broker mail-merge CSV.
"""
import json
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd
from knowledge import classify, TYPES

TEMPLATE_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "contacts_input", "Wave_5_Brokers_Europe_contacts_completes.xlsx")

FALLBACK_SUBJECT = "Portfolio available for direct purchase – premium aesthetic & medical devices in France"
FALLBACK_BODY = (
    "Dear [Name / Purchasing Team],\n\n"
    "I am contacting you because your company actively purchases, brokers or resells "
    "pre-owned medical-aesthetic equipment in Europe.\n\n"
    "We currently have a portfolio of premium devices available in France, including {BRANDS}.\n\n"
    "{INVENTORY}\n"
    "We can offer:\n"
    "• direct purchase of individual devices;\n"
    "• bulk purchase of several units;\n"
    "• consignment or brokerage;\n"
    "• dealer pricing for selected equipment.\n\n"
    "For each device, we can provide the exact model, year, configuration, serial number, "
    "maintenance history, accessories, photos, location and expected net price.\n\n"
    "Could you please confirm the correct person or purchasing department to receive our "
    "current stock list? Please also let us know the brands and models you are actively seeking.\n\n"
    "Kind regards,\n\nSébastien Cazorla\n62 JOULES\nFrance\n"
    "Mobile / WhatsApp: [your number]\nEmail: [your email]"
)


def _load_template():
    try:
        df = pd.read_excel(TEMPLATE_FILE, sheet_name="Email d’approche", header=None)
        subject, body = None, None
        for _, row in df.iterrows():
            for v in row.tolist():
                if isinstance(v, str):
                    if v.startswith("Portfolio available"):
                        subject = v.strip()
                    if v.startswith("Dear "):
                        body = v.replace("\\n", "\n")
        return subject or FALLBACK_SUBJECT, (body or FALLBACK_BODY)
    except Exception:
        return FALLBACK_SUBJECT, FALLBACK_BODY


def _inventory(records):
    brands, lines = [], []
    for r in records:
        if r.get("status") not in ("active", None):
            continue
        t = r.get("model") or r.get("type") or "?"
        qty = r.get("quantity")
        dtype = r.get("device_type") or classify("", t, "")
        label = TYPES.get(dtype, TYPES["aesthetic_generic"])["label_en"]
        qprefix = f"{qty}× " if isinstance(qty, int) else ""
        lines.append(f"• {qprefix}{t} ({label})")
        b = r.get("brand")
        if b and b != "MISSING":
            brands.append(b.split("/")[0])
    seen, brand_list = set(), []
    for b in brands:
        if b not in seen:
            seen.add(b); brand_list.append(b)
    brands_str = ", ".join(brand_list) if brand_list else "premium aesthetic and medical brands"
    inv_block = "Available now:\n" + "\n".join(lines) + "\n" if lines else ""
    return brands_str, inv_block


def build(records, outdir="../output/outreach", contacts_master=None):
    os.makedirs(outdir, exist_ok=True)
    subject, body = _load_template()
    brands, inv = _inventory(records)

    if "{BRANDS}" in body:
        body = body.replace("{BRANDS}", brands)
    if "{INVENTORY}" in body:
        body = body.replace("{INVENTORY}", inv)
    else:
        # template had a fixed brand paragraph: insert our real inventory after it
        anchor = "and Icoone.\n\n"
        if anchor in body:
            body = body.replace(anchor, anchor + inv + "\n")
        else:
            body = body.rstrip() + "\n\n" + inv

    ready_path = os.path.join(outdir, "broker_email_READY.txt")
    with open(ready_path, "w", encoding="utf-8") as f:
        f.write(f"Subject: {subject}\n\n{body}\n")

    # optional per-broker mail-merge (Dear <Company>) if the contacts master exists
    merge_path = None
    contacts_master = contacts_master or os.path.join(outdir, "Contacts_Master.xlsx")
    if os.path.exists(contacts_master):
        try:
            cm = pd.read_excel(contacts_master, sheet_name="Contacts (tous)")
            rows = []
            for _, c in cm.iterrows():
                company = str(c.get("Société", "")).strip()
                to = str(c.get("Email (fourni)", "")).strip() or str(c.get("Candidats à vérifier", "")).split(";")[0].strip()
                if not company:
                    continue
                personalized = body.replace("[Name / Purchasing Team]", f"{company} Purchasing Team")
                rows.append({"company": company, "to_or_candidate": to,
                             "subject": subject, "body": personalized})
            pd.DataFrame(rows).to_excel(os.path.join(outdir, "broker_email_mailmerge.xlsx"), index=False)
            merge_path = os.path.join(outdir, "broker_email_mailmerge.xlsx")
        except Exception:
            pass

    return {"email": ready_path, "mailmerge": merge_path, "subject": subject, "body": body}


if __name__ == "__main__":
    src = "../output/intake/type_records.json"
    recs = json.load(open(src, encoding="utf-8")) if os.path.exists(src) else []
    res = build(recs)
    print("Wrote:", res["email"])
    if res["mailmerge"]:
        print("Mail-merge:", res["mailmerge"])
    print("\n----- EMAIL -----\n")
    print(f"Subject: {res['subject']}\n")
    print(res["body"])
