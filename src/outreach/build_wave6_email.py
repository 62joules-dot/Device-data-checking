"""
Wave 6 (international) broker email — same auto-fill as Wave 5, PLUS a hard
compliance split.

Gulf / Middle-East contacts (moderate risk) -> ready-to-send mail-merge.
Russia / CIS or 'Élevé' risk contacts -> quarantined into a DO-NOT-SEND file that
requires sanctions screening, export-control and end-user checks BEFORE any contact.
No ready-to-send email is produced for high-risk targets.
"""
import json
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd
from outreach.build_broker_email import _inventory, _load_template  # reuse

WAVE6_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "contacts_input", "Wave_6_International_Separate.xlsx")

FALLBACK_SUBJECT = "Premium pre-owned medical aesthetic devices available in France"
FALLBACK_BODY = (
    "Dear [Name / Purchasing Team],\n\n"
    "We currently have a portfolio of premium pre-owned medical and aesthetic devices "
    "available in France.\n\n{BRANDS_LINE}{INVENTORY}\n"
    "We are open to:\n• direct purchase;\n• bulk purchase of several devices;\n"
    "• consignment or brokerage;\n• distribution through your clinic and reseller network.\n\n"
    "For each device, we can provide the model, year, configuration, serial number, "
    "maintenance history, accessories, photos, location and expected net dealer price.\n\n"
    "Could you please confirm the appropriate purchasing or commercial contact for "
    "receiving our current stock list?\n\nKind regards,\n\nSébastien Cazorla\n62 JOULES\n"
    "France\nMobile / WhatsApp: [your number]\nEmail: [your email]"
)

HIGH_RISK_NOTE = (
    "DO NOT CONTACT without prior compliance clearance. These targets are in "
    "Russia/CIS or flagged high export/sanctions risk. Before any outreach, screen "
    "against EU/US/UK sanctions lists, verify export-control classification, confirm "
    "end-user and payment route, and get written legal sign-off."
)


def _load_template_wave6():
    try:
        df = pd.read_excel(WAVE6_FILE, sheet_name="Email d’approche", header=None)
        subject, body = None, None
        for _, row in df.iterrows():
            for v in row.tolist():
                if isinstance(v, str):
                    if v.startswith("Premium pre-owned"):
                        subject = v.strip()
                    if v.startswith("Dear "):
                        body = v.replace("\\n", "\n")
        return subject or FALLBACK_SUBJECT, body or FALLBACK_BODY
    except Exception:
        return FALLBACK_SUBJECT, FALLBACK_BODY


def _load_contacts():
    raw = pd.read_excel(WAVE6_FILE, sheet_name="Wave 6", header=None)
    hdr = 0
    for i in range(min(8, len(raw))):
        if any(str(x).strip().lower() == "société" for x in raw.iloc[i].tolist()):
            hdr = i
            break
    df = pd.read_excel(WAVE6_FILE, sheet_name="Wave 6", header=hdr)
    df.columns = [str(c).strip() for c in df.columns]
    df = df.dropna(subset=[c for c in df.columns if c.lower() == "société"] or [df.columns[0]])
    return df


def _is_high_risk(row):
    region = str(row.get("Région", "")).lower()
    risk = str(row.get("Risque conformité/export", "")).lower()
    return ("russie" in region or "cei" in region or "russia" in region
            or "élevé" in risk or "eleve" in risk or "high" in risk)


def build(records, outdir="../output/outreach"):
    os.makedirs(outdir, exist_ok=True)
    subject, body = _load_template_wave6()
    brands, inv = _inventory(records)

    if "{BRANDS_LINE}" in body:
        body = body.replace("{BRANDS_LINE}", f"The available equipment includes {brands}.\n\n")
    if "{INVENTORY}" in body:
        body = body.replace("{INVENTORY}", inv)
    else:
        anchor = "and Icoone.\n\n"
        body = body.replace(anchor, anchor + inv + "\n") if anchor in body else body.rstrip() + "\n\n" + inv

    ready = os.path.join(outdir, "wave6_email_READY.txt")
    with open(ready, "w", encoding="utf-8") as f:
        f.write(f"Subject: {subject}\n\n{body}\n")

    ok_rows, risk_rows = [], []
    try:
        contacts = _load_contacts()
        for _, c in contacts.iterrows():
            company = str(c.get("Société", "")).strip()
            if not company or company.lower().startswith(("priorité", "rang")):
                continue
            rec = {
                "company": company,
                "region": c.get("Région", ""),
                "risk": c.get("Risque conformité/export", ""),
                "email_or_channel": c.get("Email", ""),
                "website": c.get("Site web", ""),
                "phone": c.get("Téléphone / portable", c.get("Téléphone", "")),
            }
            if _is_high_risk(c):
                rec["ACTION"] = HIGH_RISK_NOTE
                risk_rows.append(rec)
            else:
                rec["subject"] = subject
                rec["body"] = body.replace("[Name / Purchasing Team]", f"{company} Purchasing Team")
                ok_rows.append(rec)
    except Exception as e:
        print(f"[info] wave6 contacts split skipped: {e}")

    ok_path = risk_path = None
    if ok_rows:
        ok_path = os.path.join(outdir, "wave6_email_mailmerge_OK.xlsx")
        pd.DataFrame(ok_rows).to_excel(ok_path, index=False)
    if risk_rows:
        risk_path = os.path.join(outdir, "wave6_HIGH_RISK_DO_NOT_SEND.xlsx")
        pd.DataFrame(risk_rows).to_excel(risk_path, index=False)

    return {"email": ready, "ok_contacts": len(ok_rows),
            "high_risk_quarantined": len(risk_rows),
            "ok_file": ok_path, "high_risk_file": risk_path}


if __name__ == "__main__":
    src = "../output/intake/type_records.json"
    recs = json.load(open(src, encoding="utf-8")) if os.path.exists(src) else []
    print(json.dumps(build(recs), ensure_ascii=False, indent=2))
