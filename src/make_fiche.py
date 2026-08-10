"""
Build FICHE_A_REMPLIR.xlsx — the single fill-in sheet the client completes.

Two tabs:
  Guide    — every column explained (mandatory ones highlighted)
  Machines — his devices (one row each), pre-filled, with 2 worked example rows

Referenced by the client Getting-Started guide. Generated automatically by intake_run.
"""
import os
import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font
from openpyxl.utils import get_column_letter

EXAMPLES = [
    {'ID': 'EX-001', 'Unité #': 1, 'Type de Machine': 'Optimas (Morpheus/Lumecca)',
     'Famille (auto)': 'Multi-application Aesthetic Workstation', 'Marque': 'Cynosure',
     'Modèle': 'Optimas', 'Année': 2020, 'Numéro de série': 'EX-OPT-0001', 'État': 'Bon',
     'Pays': 'France', 'Options': 'Morpheus RF; Lumecca IPL', 'Accessoires': 'Chariot; pièces à main',
     'Prix minimum': 25000, 'Prix conseillé': 38000, 'Prix premium': 52000,
     'Prix = suggestion auto (à vérifier)': 'EXEMPLE', 'TVA récupérable (oui/non)': 'oui',
     'Livraison possible (oui/non)': 'oui',
     'Photos (noms de fichiers / URLs)': 'https://exemple.com/optimas1.jpg; https://exemple.com/optimas2.jpg',
     'Priorité (1-3)': 1, 'Statut': 'active'},
    {'ID': 'EX-002', 'Unité #': 1, 'Type de Machine': 'Coolsculpting / Cool ELITE',
     'Famille (auto)': 'Body Contouring / Cryolipolysis System', 'Marque': 'Allergan',
     'Modèle': 'CoolSculpting Elite', 'Année': 2019, 'Numéro de série': 'EX-CS-0002', 'État': 'Excellent',
     'Pays': 'France', 'Options': '4 applicateurs', 'Accessoires': 'Chariot; applicateurs',
     'Prix minimum': 20000, 'Prix conseillé': 32000, 'Prix premium': 45000,
     'Prix = suggestion auto (à vérifier)': 'EXEMPLE', 'TVA récupérable (oui/non)': 'oui',
     'Livraison possible (oui/non)': 'oui',
     'Photos (noms de fichiers / URLs)': 'https://exemple.com/coolsculpting1.jpg',
     'Priorité (1-3)': 1, 'Statut': 'active'},
]

GUIDE = [
    ("ID", "déjà rempli", "Identifiant machine (ne pas modifier)"),
    ("Unité #", "déjà rempli", "Numéro de l'unité si plusieurs identiques"),
    ("Type de Machine", "déjà rempli", "Nom de la machine (déjà rempli)"),
    ("Famille (auto)", "auto", "Catégorie détectée automatiquement"),
    ("Marque", "vérifier", "Fabricant (ex: Cynosure, Alma, BTL)"),
    ("Modèle", "vérifier", "Modèle exact"),
    ("Année", "À REMPLIR", "Année de fabrication (ex: 2020)"),
    ("Numéro de série", "À REMPLIR", "N° de série de l'appareil"),
    ("État", "OBLIGATOIRE", "Neuf / Excellent / Bon / Correct"),
    ("Pays", "OBLIGATOIRE", "Pays où se trouve la machine (ex: France)"),
    ("Options", "conseillé", "Pièces à main, applicateurs, modules... séparés par ;"),
    ("Accessoires", "conseillé", "Chariot, lunettes, pédale... séparés par ;"),
    ("Prix minimum", "ajuster", "Prix plancher (interne, non publié)"),
    ("Prix conseillé", "OBLIGATOIRE", "Prix de vente visé (publié)"),
    ("Prix premium", "ajuster", "Prix haut (interne, non publié)"),
    ("TVA récupérable (oui/non)", "oui/non", "La TVA est-elle récupérable ?"),
    ("Livraison possible (oui/non)", "oui/non", "Livraison possible ?"),
    ("Photos (noms de fichiers / URLs)", "OBLIGATOIRE", "Liens https des photos, séparés par ; (héberger en ligne pour eBay/DOTmed)"),
    ("Priorité (1-3)", "déjà rempli", "1 = urgent, 3 = moins urgent"),
    ("Statut", "déjà rempli", "active / terminee"),
]


def build(src="../output/intake/data_collection.xlsx", out="../output/intake/FICHE_A_REMPLIR.xlsx"):
    base = pd.read_excel(src)
    machines = pd.concat([pd.DataFrame(EXAMPLES)[base.columns], base], ignore_index=True)
    guide = pd.DataFrame(GUIDE, columns=["Colonne", "À remplir ?", "Explication"])

    with pd.ExcelWriter(out, engine="openpyxl") as w:
        guide.to_excel(w, sheet_name="Guide", index=False)
        machines.to_excel(w, sheet_name="Machines", index=False)

    wb = load_workbook(out)
    hf, hfont = PatternFill("solid", fgColor="1F3A5F"), Font(color="FFFFFF", bold=True)
    oblig = PatternFill("solid", fgColor="FCE4D6")
    g = wb["Guide"]
    for c in g[1]:
        c.fill, c.font = hf, hfont
    g.column_dimensions["A"].width = 34; g.column_dimensions["B"].width = 14; g.column_dimensions["C"].width = 74
    for row in g.iter_rows(min_row=2, max_col=3):
        if row[1].value in ("OBLIGATOIRE", "À REMPLIR"):
            for c in row:
                c.fill = oblig
    m = wb["Machines"]
    for c in m[1]:
        c.fill, c.font = hf, hfont
    exfill = PatternFill("solid", fgColor="FFF2CC")
    for r in (2, 3):
        for c in m[r]:
            c.fill = exfill
    m.freeze_panes = "A2"
    for i in range(1, len(machines.columns) + 1):
        m.column_dimensions[get_column_letter(i)].width = 20
    wb.save(out)
    return {"file": out, "rows": len(machines)}


if __name__ == "__main__":
    import json
    print(json.dumps(build(), ensure_ascii=False))
