"""
Steps 2 & 3 - Listing creation + categorisation.

For each record, produce:
  - SEO titles per platform (Leboncoin, Wallapop, Facebook, eBay, Machinio, Kitmondo)
  - short + detailed descriptions in FR / ES / EN
  - keyword set (per language) and tags
  - category path per platform

This uses a deterministic, template-based generator so it runs offline and is
reviewable. For higher-variety marketing copy at scale, `enrich_with_llm()` shows
where to plug the Anthropic API (one call per device) - left optional so the
pipeline never blocks on network.
"""
from knowledge import classify, TYPES

MISSING = "MISSING"

# Platform title length ceilings (approx, keep titles inside these)
TITLE_LIMITS = {
    "leboncoin": 60, "wallapop": 50, "facebook": 90,
    "ebay": 80, "machinio": 90, "kitmondo": 90,
}

COND_FR = {"neuf": "Neuf", "excellent": "Très bon état", "bon": "Bon état",
           "used": "Occasion", "refurbished": "Reconditionné"}


def _cond_word(condition, lang):
    c = str(condition).lower()
    base = "used"
    for k in ("neuf", "new", "excellent", "bon", "good", "refurb", "recond"):
        if k in c:
            base = {"neuf": "neuf", "new": "neuf", "excellent": "excellent",
                    "bon": "bon", "good": "bon", "refurb": "refurbished",
                    "recond": "refurbished"}[k]
            break
    words = {
        "neuf": {"fr": "Neuf", "es": "Nuevo", "en": "New"},
        "excellent": {"fr": "Excellent état", "es": "Excelente estado", "en": "Excellent condition"},
        "bon": {"fr": "Bon état", "es": "Buen estado", "en": "Good condition"},
        "used": {"fr": "Occasion", "es": "Segunda mano", "en": "Used"},
        "refurbished": {"fr": "Reconditionné", "es": "Reacondicionado", "en": "Refurbished"},
    }
    return words.get(base, words["used"])[lang]


def _fmt_price(rec):
    p = rec.get("price_recommended")
    return f"{p:,}".replace(",", " ") + " €" if isinstance(p, int) else "Prix sur demande"


def _truncate(text, limit):
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def generate(rec: dict) -> dict:
    dtype = classify(rec.get("brand", ""), rec.get("model", ""),
                     " ".join(rec.get("options", []) if isinstance(rec.get("options"), list) else []))
    meta = TYPES[dtype]
    brand = rec.get("brand", "") if rec.get("brand") != MISSING else ""
    model = rec.get("model", "") if rec.get("model") != MISSING else ""
    year = rec.get("year", "") if rec.get("year") not in (MISSING, None) else ""
    country = rec.get("country", "") if rec.get("country") != MISSING else ""
    bm = f"{brand} {model}".strip()

    label = {"fr": meta["label_fr"], "es": meta["label_es"], "en": meta["label_en"]}

    # ---- Titles (SEO: brand + model + type + condition + year) ----
    def title(lang, extra=""):
        parts = [bm, label[lang], _cond_word(rec.get("condition", ""), lang)]
        if year:
            parts.append(str(year))
        if extra:
            parts.append(extra)
        return " – ".join([p for p in parts if p])

    titles = {
        "leboncoin": _truncate(title("fr"), TITLE_LIMITS["leboncoin"]),
        "wallapop":  _truncate(title("es"), TITLE_LIMITS["wallapop"]),
        "facebook":  _truncate(title("fr", "Matériel pro"), TITLE_LIMITS["facebook"]),
        "ebay":      _truncate(title("en"), TITLE_LIMITS["ebay"]),
        "machinio":  _truncate(title("en", "Aesthetic Laser"), TITLE_LIMITS["machinio"]),
        "kitmondo":  _truncate(title("en"), TITLE_LIMITS["kitmondo"]),
    }

    # ---- Descriptions ----
    opts = rec.get("options", []) or []
    accs = rec.get("accessories", []) or []
    opts_line = {"fr": "Options : " + (", ".join(opts) if opts else "—"),
                 "es": "Opciones: " + (", ".join(opts) if opts else "—"),
                 "en": "Options: " + (", ".join(opts) if opts else "—")}
    accs_line = {"fr": "Accessoires inclus : " + (", ".join(accs) if accs else "—"),
                 "es": "Accesorios incluidos: " + (", ".join(accs) if accs else "—"),
                 "en": "Included accessories: " + (", ".join(accs) if accs else "—")}
    vat = rec.get("vat_recoverable")
    vat_line = {
        "fr": "TVA récupérable" if vat == "yes" else ("Hors TVA / non récupérable" if vat == "no" else "TVA : à préciser"),
        "es": "IVA deducible" if vat == "yes" else ("Sin IVA / no deducible" if vat == "no" else "IVA: a confirmar"),
        "en": "VAT recoverable" if vat == "yes" else ("VAT-exempt / not recoverable" if vat == "no" else "VAT: to confirm"),
    }
    deliv = rec.get("delivery_possible")
    deliv_line = {
        "fr": "Livraison possible" if deliv == "yes" else ("Retrait sur place" if deliv == "no" else "Livraison : à convenir"),
        "es": "Envío posible" if deliv == "yes" else ("Recogida en persona" if deliv == "no" else "Envío: a convenir"),
        "en": "Shipping available" if deliv == "yes" else ("Local pickup" if deliv == "no" else "Shipping: to arrange"),
    }

    short = {
        "fr": f"{bm} — {label['fr'].lower()}, {_cond_word(rec.get('condition',''),'fr').lower()}. {_fmt_price(rec)}. {deliv_line['fr']}. Localisation : {country or 'à préciser'}.",
        "es": f"{bm} — {label['es'].lower()}, {_cond_word(rec.get('condition',''),'es').lower()}. {_fmt_price(rec)}. {deliv_line['es']}. Ubicación: {country or 'a confirmar'}.",
        "en": f"{bm} — {label['en'].lower()}, {_cond_word(rec.get('condition',''),'en').lower()}. {_fmt_price(rec)}. {deliv_line['en']}. Location: {country or 'to confirm'}.",
    }

    intro = {
        "fr": f"À vendre : {bm}, {label['fr'].lower()}" + (f" (année {year})" if year else "") + f". État : {_cond_word(rec.get('condition',''),'fr').lower()}.",
        "es": f"En venta: {bm}, {label['es'].lower()}" + (f" (año {year})" if year else "") + f". Estado: {_cond_word(rec.get('condition',''),'es').lower()}.",
        "en": f"For sale: {bm}, {label['en'].lower()}" + (f" (year {year})" if year else "") + f". Condition: {_cond_word(rec.get('condition',''),'en').lower()}.",
    }
    closing = {
        "fr": "Matériel professionnel destiné à un usage par praticiens qualifiés. Facture disponible. Contactez-nous pour photos supplémentaires et modalités.",
        "es": "Equipo profesional destinado a profesionales cualificados. Factura disponible. Contáctenos para más fotos y condiciones.",
        "en": "Professional equipment intended for qualified practitioners. Invoice available. Contact us for more photos and terms.",
    }

    def detailed(lang):
        return "\n".join([
            intro[lang],
            "",
            opts_line[lang],
            accs_line[lang],
            vat_line[lang],
            deliv_line[lang],
            f"{'Prix' if lang=='fr' else ('Precio' if lang=='es' else 'Price')} : {_fmt_price(rec)}",
            "",
            closing[lang],
            "",
            ("Mots-clés" if lang == "fr" else ("Palabras clave" if lang == "es" else "Keywords")) + ": " + ", ".join(meta["keywords"][lang]),
        ])

    detailed_desc = {lang: detailed(lang) for lang in ("fr", "es", "en")}

    tags = sorted(set(
        meta["keywords"]["en"][:4] + meta["keywords"]["fr"][:4] + meta["keywords"]["es"][:4]
        + [w for w in [brand, model] if w]
    ))

    return {
        "device_type": dtype,
        "titles": titles,
        "short_description": short,
        "detailed_description": detailed_desc,
        "keywords": meta["keywords"],
        "tags": tags,
        "categories": meta["categories"],
    }


# ---- Optional: richer copy via Anthropic API (one call per device) ----
def enrich_with_llm(rec, generated, client=None, model="claude-sonnet-4-5"):
    """
    Placeholder integration point. If you pass an Anthropic client, this would
    request 3 richer marketing descriptions (FR/ES/EN) using the structured facts,
    with a strict instruction to never invent specs. Kept optional so run_all works
    offline. Returns `generated` unchanged if no client given.
    """
    if client is None:
        return generated
    # Example (uncomment and adapt when running with credentials):
    # prompt = f"Facts: {rec}\nWrite an SEO marketing description in FR, ES, EN. " \
    #          f"Do not invent specs not present in the facts."
    # resp = client.messages.create(model=model, max_tokens=1500,
    #        messages=[{"role":"user","content":prompt}])
    # ... parse and merge into generated["detailed_description"] ...
    return generated
