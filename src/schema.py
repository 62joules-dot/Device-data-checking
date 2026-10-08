"""
Master schema for the medical-device listing system.

One record = one machine. Every field the client asked for in Step 1 lives here.
`ALIASES` lets the normalizer match messy real-world Excel headers (FR/EN, spacing,
accents) onto our canonical field names, so the pipeline runs on the real file
without hand-editing column names.
"""

# Canonical fields (Step 1 "Centralisation")
FIELDS = [
    "brand",              # marque
    "model",              # modèle
    "year",               # année
    "serial_number",      # numéro de série
    "usage_counter",      # compteur (tirs, heures d'utilisation...)
    "options",            # options
    "accessories",        # accessoires
    "condition",          # état
    "country",            # pays où se trouve la machine
    "price_min",          # prix minimum
    "price_recommended",  # prix conseillé
    "price_premium",      # prix premium
    "vat_recoverable",    # TVA récupérable ou non
    "delivery_possible",  # possibilité de livraison
    "photos",             # photos associées (list of paths/URLs)
    "priority",           # priorité de vente
]

# Contact / logistics fields needed for the automation JSON (Step 4) but usually
# global rather than per-row. Filled from config, overridable per row.
CONTACT_FIELDS = ["phone", "email"]

# Accepts many header spellings -> canonical field. Lowercased, accent-insensitive
# matching is done in normalize.py, so list plain lowercase variants here.
ALIASES = {
    "brand": ["brand", "marque", "manufacturer", "fabricant"],
    "model": ["model", "modele", "modl", "machine", "appareil", "designation", "reference", "ref"],
    "year": ["year", "annee", "an", "date"],
    "serial_number": ["serial", "serial number", "serial no", "sn", "numero de serie", "n serie", "num serie"],
    "usage_counter": ["counter", "compteur", "compteur de tirs", "compteur tirs", "shots", "shot count",
                       "nombre de tirs", "heures", "heures d utilisation", "hours", "usage"],
    "options": ["options", "option"],
    "accessories": ["accessories", "accessoires", "accessoire", "included", "inclus"],
    "condition": ["condition", "etat", "state", "grade"],
    "country": ["country", "pays", "localisation", "location", "lieu"],
    "price_min": ["price min", "prix minimum", "prix mini", "min price", "floor", "prix plancher", "reserve"],
    "price_recommended": ["price recommended", "prix conseille", "prix recommande", "asking", "prix", "price", "prix de vente"],
    "price_premium": ["price premium", "prix premium", "prix max", "prix haut", "premium"],
    "vat_recoverable": ["vat", "tva", "vat recoverable", "tva recuperable", "recuperable"],
    "delivery_possible": ["delivery", "livraison", "livraison possible", "shipping", "expedition", "port"],
    "photos": ["photos", "photo", "images", "image", "pictures", "pics"],
    "priority": ["priority", "priorite", "prio", "rank"],
    "phone": ["phone", "telephone", "tel", "mobile", "gsm"],
    "email": ["email", "e-mail", "mail", "courriel"],
}

# Fields that MUST be present for a listing to be publishable. If missing, the
# record is flagged rather than invented (client's explicit instruction in Step 7).
REQUIRED_FOR_PUBLISH = ["brand", "model", "condition", "country", "price_recommended"]

# Default global contact/logistics config. Edit these once for the whole batch.
DEFAULT_CONFIG = {
    "phone": "",           # e.g. "+33 6 12 34 56 78"  -> leave blank to flag as MISSING
    "email": "",           # e.g. "seb@example.com"
    "seller_name": "",
    "default_delivery": "Sur devis / à convenir",
}
