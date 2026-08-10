"""
Build a fill-in TEST sheet from the intake data_collection.xlsx:
adds 2 fully-filled EXAMPLE rows (so results appear immediately) + an Instructions
tab. Data sheet is first so the engine reads it directly:
    python cli.py build ../output/intake/data_collection_TEST.xlsx
"""
import os
import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font

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

INSTRUCTIONS = [
    '1. Les 2 premières lignes (EX-001/EX-002) sont des EXEMPLES déjà remplis. Lance le fichier tel quel pour voir un résultat, ou remplace-les.',
    '2. Remplis par machine : État, Pays, Année, Numéro de série, et surtout Photos (liens https publics).',
    '3. Ajuste les prix (pré-remplis comme estimations).',
    '4. Enregistre, puis : python cli.py build ..\\output\\intake\\data_collection_TEST.xlsx',
    '5. Résultats dans output/ : annonces FR/ES/EN + fichiers eBay, DOTmed, Machinio, Kitmondo.',
    'Obligatoire pour publier : État, Pays, Prix conseillé, Photos. Ce qui manque est signalé, jamais inventé.',
]


def build(src="../output/intake/data_collection.xlsx", out="../output/intake/data_collection_TEST.xlsx"):
    df = pd.read_excel(src)
    combined = pd.concat([pd.DataFrame(EXAMPLES)[df.columns], df], ignore_index=True)
    with pd.ExcelWriter(out, engine="openpyxl") as w:
        combined.to_excel(w, sheet_name="Machines", index=False)
        pd.DataFrame({"INSTRUCTIONS": INSTRUCTIONS}).to_excel(w, sheet_name="Instructions", index=False)
    wb = load_workbook(out)
    ws = wb["Machines"]
    hf, hfont = PatternFill("solid", fgColor="1F3A5F"), Font(color="FFFFFF", bold=True)
    for c in ws[1]:
        c.fill, c.font = hf, hfont
    ex = PatternFill("solid", fgColor="FFF2CC")
    for r in (2, 3):
        for c in ws[r]:
            c.fill = ex
    ws.freeze_panes = "A2"
    for c in wb["Instructions"][1]:
        c.fill, c.font = hf, hfont
    wb["Instructions"].column_dimensions["A"].width = 115
    wb.save(out)
    return {"file": out, "rows": len(combined)}


if __name__ == "__main__":
    import json
    print(json.dumps(build(), ensure_ascii=False))
