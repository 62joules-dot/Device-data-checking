"""
Rough used-market price hints (EUR) per device, to pre-fill the intake sheet.

IMPORTANT: these are STARTING ESTIMATES to speed up data entry, NOT quotes or
appraisals. The used aesthetic-device market varies widely by year, condition,
configuration, applicators/handpieces included, and region. Every value must be
verified/adjusted by the seller. The intake sheet marks them as 'à vérifier'.

Returns (min, recommended, premium) or None if no confident hint exists.
"""
import unicodedata

# Ordered: first matching trigger wins. Values are conservative mid-market ranges.
PRICE_HINTS = [
    (["visia", "hairmetrix", "vectra"], (8000, 14000, 22000)),
    (["optimas", "lumecca"],            (25000, 38000, 52000)),
    (["coolsculpting", "cool elite"],   (20000, 32000, 45000)),
    (["emtone"],                        (14000, 22000, 30000)),
    (["softwave"],                      (8000, 13000, 20000)),
    (["jet peel", "jetpeel"],           (5000, 9000, 14000)),
    (["accent prime", "accent"],        (18000, 28000, 38000)),
    (["ultraformer"],                   (15000, 24000, 34000)),
    (["onda"],                          (18000, 27000, 37000)),
    (["oxygeneo"],                      (4000, 7000, 11000)),
    (["miradry"],                       (15000, 24000, 34000)),
    (["dermalux"],                      (6000, 10000, 15000)),
]


def _norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", str(s))
                   if unicodedata.category(c) != "Mn").lower()


def suggest(type_text):
    low = _norm(type_text)
    for triggers, prices in PRICE_HINTS:
        if any(t in low for t in triggers):
            return prices
    return None
