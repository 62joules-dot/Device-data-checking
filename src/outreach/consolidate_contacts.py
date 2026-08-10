"""
Consolidate the client's Wave 5 / Wave 6 / Cibles contact files into ONE master.

Answers 'some emails are missing — can you catch them?':
  - merges the 3 files into a single normalized table,
  - extracts the domain from each company website,
  - where an email is missing but a domain exists, proposes standard candidate
    addresses (info@, contact@, sales@) in a SEPARATE 'candidates_to_verify'
    column — clearly marked unverified (never presented as real),
  - flags form-only / messaging-only contacts,
  - leaves a 'verification' column and a note on how to verify (Hunter/Dropcontact).

It does NOT scrape or guarantee emails. Guessed patterns must be verified with a
tool before use, and B2B cold outreach in the EU must respect GDPR (relevance +
opt-out). This just organizes the work.
"""
import re
import os
import pandas as pd

# Drop your Wave 5 / Wave 6 / Cibles contact files in medlist/contacts_input/.
UP = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "contacts_input")
FILES = {
    "Wave5_Brokers": ("Wave_5_Brokers_Europe_contacts_completes.xlsx", "Wave 5 (Brokers)", None),
    "Wave6_Intl":    ("Wave_6_International_Separate.xlsx", "Wave 6", None),
    "Cibles_W5_6":   ("Cibles_plateformes_coordonnees_Wave5_6.xlsx", "Cibles coordonnées", None),
}

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")


def _domain(url):
    if not isinstance(url, str) or not url.strip():
        return ""
    m = re.search(r"https?://([^/]+)", url.strip())
    host = (m.group(1) if m else url).lower()
    return host.replace("www.", "").split("/")[0].strip()


def _has_email(val):
    return bool(isinstance(val, str) and EMAIL_RE.search(val))


def _pick(row, *names):
    for n in names:
        if n in row and pd.notna(row[n]) and str(row[n]).strip() not in ("", "—", "nan"):
            return str(row[n]).strip()
    return ""


def _load(path, sheet, header_row=None):
    raw = pd.read_excel(path, sheet_name=sheet, header=None)
    hdr = header_row
    if hdr is None:
        for i in range(min(8, len(raw))):
            rowvals = [str(x).strip().lower() for x in raw.iloc[i].tolist()]
            if any(v in ("société", "societe", "plateforme / société", "plateforme / societe") for v in rowvals):
                hdr = i
                break
        if hdr is None:
            hdr = 0
    df = pd.read_excel(path, sheet_name=sheet, header=hdr)
    df.columns = [str(c).strip() for c in df.columns]
    return df.dropna(how="all")


def build(outpath="../output/outreach/Contacts_Master.xlsx"):
    os.makedirs(os.path.dirname(outpath), exist_ok=True)
    rows = []
    for wave, (fname, sheet, hdr) in FILES.items():
        p = os.path.join(UP, fname)
        if not os.path.exists(p):
            continue
        df = _load(p, sheet, hdr)
        for _, r in df.iterrows():
            r = r.to_dict()
            company = _pick(r, "Société", "Plateforme / société")
            if not company or company.lower().startswith(("priorité", "rang")):
                continue
            website = _pick(r, "Site web")
            email = _pick(r, "Email", "E-mail / canal")
            phone = _pick(r, "Téléphone / portable", "Téléphone")
            country = _pick(r, "Pays", "Pays / zone", "Pays siège")
            dom = _domain(website)

            has_mail = _has_email(email)
            candidates = ""
            method = ""
            if not has_mail:
                if dom:
                    candidates = "; ".join(f"{p}@{dom}" for p in ("info", "contact", "sales"))
                # if the existing 'email' cell actually holds a form/channel note, keep it
                method = email if (email and not has_mail) else ("web form" if website else "unknown")

            rows.append({
                "Wave": wave, "Société": company, "Pays": country,
                "Site web": website, "Domaine": dom,
                "Email (fourni)": email if has_mail else "",
                "Candidats à vérifier": candidates,
                "Méthode si pas d'email": method,
                "Téléphone": phone,
                "Statut vérif": "email fourni" if has_mail else "à vérifier",
            })

    master = pd.DataFrame(rows).drop_duplicates(subset=["Société", "Domaine"])
    to_verify = master[master["Statut vérif"] == "à vérifier"]

    guide = pd.DataFrame({"COMMENT COMPLÉTER LES EMAILS MANQUANTS": [
        "1. 'Candidats à vérifier' = adresses probables (info@/contact@/sales@ du domaine) — NON vérifiées.",
        "2. Vérifie-les avec un outil avant envoi : Hunter.io, Dropcontact, Snov.io ou Apollo (tous ont un palier gratuit).",
        "3. Sinon : page 'Contact' / 'Sell with us' du site, ou LinkedIn de la société.",
        "4. Beaucoup de brokers n'ont qu'un formulaire — colonne 'Méthode si pas d'email'. Utilise le formulaire.",
        "5. RGPD : prospection B2B autorisée si pertinente + lien de désinscription. Ne jamais envoyer en masse sans opt-out.",
        f"Total sociétés: {len(master)} | emails fournis: {(master['Statut vérif']=='email fourni').sum()} | à vérifier: {len(to_verify)}",
    ]})

    with pd.ExcelWriter(outpath, engine="openpyxl") as w:
        guide.to_excel(w, sheet_name="Guide", index=False)
        master.to_excel(w, sheet_name="Contacts (tous)", index=False)
        to_verify.to_excel(w, sheet_name="À vérifier", index=False)

    return {"file": outpath, "total": len(master),
            "with_email": int((master["Statut vérif"] == "email fourni").sum()),
            "to_verify": len(to_verify)}


if __name__ == "__main__":
    import json
    print(json.dumps(build(), ensure_ascii=False, indent=2))
