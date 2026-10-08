"""
Domain knowledge for aesthetic / medical devices.

Two jobs:
  1) classify(brand, model, options) -> a device_type key
  2) per device_type, provide platform categories, tags, and FR/ES/EN keyword banks

This is what makes listings SEO-real instead of generic. Extend the dicts as you
learn the actual inventory. Everything here is data, not hard-coded English.
"""

# ---- 1. Device-type detection -------------------------------------------------
# Ordered list of (device_type, [trigger substrings, lowercased]).
# First match wins; a model name usually decides it, brand is a fallback signal.
TYPE_SIGNATURES = [
    ("imaging_analysis",   ["visia", "hairmetrix", "vectra", "observ", "quantificare", "antera", "skin analysis", "imaging"]),
    ("multi_platform",     ["optimas", "lumecca", "workstation", "platform station", "elite iq"]),
    ("laser_hair_removal", ["gentlemax", "gentlelase", "soprano", "primelase", "motus", "vectus", "lightsheer", "epil"]),
    ("picosecond_laser",   ["picosure", "picoway", "pico", "enlighten"]),
    ("tattoo_qswitch",     ["q-switch", "qswitch", "revlite", "spectra", "nd:yag tattoo"]),
    ("rf_microneedling",   ["morpheus", "morpheus8", "secret rf", "vivace", "genius", "intensif", "profound"]),
    ("hifu",               ["ultherapy", "hifu", "ultraformer", "doublo", "sofwave"]),
    ("acoustic_wave",      ["softwave", "shockwave", "acoustic wave", "storz", "swiss dolorclast", "z wave"]),
    ("ipl_platform",       ["harmony", "m22", "lumenis", "elos", "icon", "bbl", "ellipse", "ipl"]),
    ("body_contouring",    ["coolsculpting", "cool elite", "emsculpt", "emsculpt neo", "truscult", "sculpsure",
                            "cryolipolysis", "cristal", "cooltech", "onda", "emtone", "trusculpt"]),
    ("sweat_reduction",    ["miradry", "mira dry"]),
    ("hydro_oxygen_facial",["jet peel", "jetpeel", "oxygeneo", "geneo", "hydrafacial", "hydra facial", "aquapure"]),
    ("rf_skin_tightening", ["thermage", "venus", "exilis", "tempsure", "indiba", "accent prime", "accent",
                            "radiofrequency", "radiofrequence"]),
    ("cryotherapy_cooling",["cryo 6", "zimmer cryo", "cryo6", "skin cooling"]),
    ("vascular_laser",     ["excel v", "vbeam", "dye laser", "vascular"]),
    ("co2_laser",          ["co2", "fraxel", "acupulse", "smartxide"]),
    ("led_phototherapy",   ["led", "dermalux", "celluma", "phototherapy"]),
    ("aesthetic_generic",  []),  # fallback
]

# ---- 2. Per-type metadata -----------------------------------------------------
# categories: suggested category path per platform (used in Step 3 output).
# keywords: buyer search terms, split by language, for titles/descriptions/tags.
TYPES = {
    "laser_hair_removal": {
        "label_en": "Laser Hair Removal System",
        "label_fr": "Laser épilation définitive",
        "label_es": "Láser depilación definitiva",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Medical & Aesthetic Lasers > Hair Removal",
            "kitmondo": "Aesthetic & Cosmetic > Laser Systems",
        },
        "keywords": {
            "en": ["laser hair removal", "diode laser", "alexandrite laser", "Nd:YAG", "aesthetic laser", "permanent hair removal", "used medical laser"],
            "fr": ["laser épilation", "épilation définitive", "laser diode", "laser alexandrite", "laser esthétique occasion", "matériel esthétique professionnel"],
            "es": ["láser depilación", "depilación definitiva", "láser diodo", "láser alejandrita", "aparatología estética", "equipo estético segunda mano"],
        },
    },
    "picosecond_laser": {
        "label_en": "Picosecond Laser",
        "label_fr": "Laser picoseconde",
        "label_es": "Láser picosegundo",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Medical & Aesthetic Lasers > Tattoo Removal",
            "kitmondo": "Aesthetic & Cosmetic > Laser Systems",
        },
        "keywords": {
            "en": ["picosecond laser", "tattoo removal laser", "pigmentation laser", "skin rejuvenation", "used picosecond"],
            "fr": ["laser picoseconde", "détatouage laser", "laser pigmentation", "photorajeunissement", "laser esthétique occasion"],
            "es": ["láser picosegundo", "eliminación tatuajes láser", "láser pigmentación", "rejuvenecimiento", "láser segunda mano"],
        },
    },
    "rf_microneedling": {
        "label_en": "RF Microneedling System",
        "label_fr": "Radiofréquence micro-aiguilles",
        "label_es": "Radiofrecuencia microagujas",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > RF Devices",
            "kitmondo": "Aesthetic & Cosmetic > RF & Microneedling",
        },
        "keywords": {
            "en": ["RF microneedling", "radiofrequency microneedling", "skin tightening", "fractional RF", "used aesthetic device"],
            "fr": ["radiofréquence micro-aiguilles", "microneedling RF", "raffermissement cutané", "RF fractionnée", "appareil esthétique occasion"],
            "es": ["radiofrecuencia microagujas", "microneedling RF", "tensado facial", "RF fraccional", "equipo estético usado"],
        },
    },
    "hifu": {
        "label_en": "HIFU Ultrasound System",
        "label_fr": "HIFU ultrasons focalisés",
        "label_es": "HIFU ultrasonidos focalizados",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > HIFU",
            "kitmondo": "Aesthetic & Cosmetic > Ultrasound / HIFU",
        },
        "keywords": {
            "en": ["HIFU", "focused ultrasound", "non-surgical facelift", "skin lifting", "used HIFU device"],
            "fr": ["HIFU", "ultrasons focalisés", "lifting sans chirurgie", "raffermissement", "appareil HIFU occasion"],
            "es": ["HIFU", "ultrasonido focalizado", "lifting sin cirugía", "reafirmante", "equipo HIFU usado"],
        },
    },
    "ipl_platform": {
        "label_en": "IPL / Multi-application Platform",
        "label_fr": "Plateforme IPL multi-applications",
        "label_es": "Plataforma IPL multiaplicación",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Medical & Aesthetic Lasers > IPL",
            "kitmondo": "Aesthetic & Cosmetic > IPL Systems",
        },
        "keywords": {
            "en": ["IPL", "intense pulsed light", "photorejuvenation", "multi-platform laser", "used IPL machine"],
            "fr": ["IPL", "lumière pulsée", "photorajeunissement", "plateforme laser", "IPL occasion"],
            "es": ["IPL", "luz pulsada intensa", "fotorejuvenecimiento", "plataforma láser", "IPL usado"],
        },
    },
    "body_contouring": {
        "label_en": "Body Contouring / Cryolipolysis System",
        "label_fr": "Remodelage corporel / cryolipolyse",
        "label_es": "Remodelación corporal / criolipólisis",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > Body Contouring",
            "kitmondo": "Aesthetic & Cosmetic > Body Contouring",
        },
        "keywords": {
            "en": ["cryolipolysis", "fat freezing", "body contouring", "EMS body sculpting", "used slimming device"],
            "fr": ["cryolipolyse", "amincissement", "remodelage corporel", "sculpting musculaire", "appareil minceur occasion"],
            "es": ["criolipólisis", "reducción grasa", "remodelación corporal", "esculpido muscular", "equipo adelgazante usado"],
        },
    },
    "rf_skin_tightening": {
        "label_en": "RF Skin Tightening System",
        "label_fr": "Radiofréquence raffermissement",
        "label_es": "Radiofrecuencia reafirmante",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > RF Devices",
            "kitmondo": "Aesthetic & Cosmetic > RF Systems",
        },
        "keywords": {
            "en": ["radiofrequency", "skin tightening", "anti-aging device", "RF facial", "used RF machine"],
            "fr": ["radiofréquence", "raffermissement", "anti-âge", "RF visage", "appareil RF occasion"],
            "es": ["radiofrecuencia", "reafirmante", "antienvejecimiento", "RF facial", "equipo RF usado"],
        },
    },
    "cryotherapy_cooling": {
        "label_en": "Skin Cooling / Cryo System",
        "label_fr": "Refroidissement cutané / cryo",
        "label_es": "Enfriamiento cutáneo / crio",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > Accessories",
            "kitmondo": "Aesthetic & Cosmetic > Accessories",
        },
        "keywords": {
            "en": ["skin cooling", "cryo air", "laser cooling device", "Zimmer cryo", "used cooling unit"],
            "fr": ["refroidissement cutané", "cryo air", "refroidisseur laser", "Zimmer cryo", "occasion"],
            "es": ["enfriamiento cutáneo", "crio aire", "enfriador láser", "Zimmer cryo", "usado"],
        },
    },
    "vascular_laser": {
        "label_en": "Vascular Laser",
        "label_fr": "Laser vasculaire",
        "label_es": "Láser vascular",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Medical & Aesthetic Lasers > Vascular",
            "kitmondo": "Aesthetic & Cosmetic > Laser Systems",
        },
        "keywords": {
            "en": ["vascular laser", "pulsed dye laser", "rosacea treatment", "vein removal laser", "used vascular laser"],
            "fr": ["laser vasculaire", "laser à colorant pulsé", "couperose", "laser varicosités", "laser occasion"],
            "es": ["láser vascular", "láser colorante pulsado", "rosácea", "láser varices", "láser usado"],
        },
    },
    "co2_laser": {
        "label_en": "CO2 Fractional Laser",
        "label_fr": "Laser CO2 fractionné",
        "label_es": "Láser CO2 fraccionado",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Medical & Aesthetic Lasers > CO2",
            "kitmondo": "Aesthetic & Cosmetic > Laser Systems",
        },
        "keywords": {
            "en": ["CO2 laser", "fractional CO2", "skin resurfacing", "ablative laser", "used CO2 laser"],
            "fr": ["laser CO2", "CO2 fractionné", "resurfaçage cutané", "laser ablatif", "laser CO2 occasion"],
            "es": ["láser CO2", "CO2 fraccionado", "resurfacing", "láser ablativo", "láser CO2 usado"],
        },
    },
    "led_phototherapy": {
        "label_en": "LED Phototherapy System",
        "label_fr": "Photothérapie LED",
        "label_es": "Fototerapia LED",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > LED",
            "kitmondo": "Aesthetic & Cosmetic > LED Therapy",
        },
        "keywords": {
            "en": ["LED phototherapy", "LED light therapy", "anti-acne LED", "skin rejuvenation LED", "used LED panel"],
            "fr": ["photothérapie LED", "luminothérapie", "LED anti-acné", "rajeunissement LED", "LED occasion"],
            "es": ["fototerapia LED", "terapia de luz LED", "LED antiacné", "rejuvenecimiento LED", "LED usado"],
        },
    },
    "imaging_analysis": {
        "label_en": "Skin/Hair Imaging & Analysis System",
        "label_fr": "Système d'imagerie et diagnostic cutané",
        "label_es": "Sistema de imagen y diagnóstico cutáneo",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > Diagnostic & Imaging",
            "kitmondo": "Aesthetic & Cosmetic > Diagnostic",
        },
        "keywords": {
            "en": ["skin analysis system", "facial imaging", "3D imaging", "hair analysis", "consultation device", "used aesthetic diagnostic"],
            "fr": ["diagnostic cutané", "imagerie faciale", "analyse de peau", "analyse capillaire", "cabine diagnostic", "matériel esthétique occasion"],
            "es": ["diagnóstico cutáneo", "imagen facial", "análisis de piel", "análisis capilar", "equipo diagnóstico", "aparatología usada"],
        },
    },
    "multi_platform": {
        "label_en": "Multi-application Aesthetic Workstation",
        "label_fr": "Plateforme esthétique multi-applications",
        "label_es": "Plataforma estética multiaplicación",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > Multi-application Platforms",
            "kitmondo": "Aesthetic & Cosmetic > Platforms",
        },
        "keywords": {
            "en": ["multi-application platform", "aesthetic workstation", "IPL RF platform", "microneedling IPL", "used aesthetic platform"],
            "fr": ["plateforme multi-applications", "station esthétique", "plateforme IPL RF", "microneedling IPL", "plateforme esthétique occasion"],
            "es": ["plataforma multiaplicación", "estación estética", "plataforma IPL RF", "microneedling IPL", "plataforma estética usada"],
        },
    },
    "acoustic_wave": {
        "label_en": "Acoustic Wave / Shockwave System",
        "label_fr": "Ondes acoustiques / ondes de choc",
        "label_es": "Ondas acústicas / ondas de choque",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > Acoustic Wave",
            "kitmondo": "Aesthetic & Cosmetic > Acoustic Wave",
        },
        "keywords": {
            "en": ["acoustic wave therapy", "shockwave device", "cellulite treatment", "used shockwave", "aesthetic acoustic"],
            "fr": ["ondes acoustiques", "ondes de choc", "traitement cellulite", "appareil ondes de choc occasion", "esthétique"],
            "es": ["ondas acústicas", "ondas de choque", "tratamiento celulitis", "equipo ondas de choque usado", "estética"],
        },
    },
    "sweat_reduction": {
        "label_en": "Sweat Reduction System (microwave)",
        "label_fr": "Traitement de l'hyperhidrose (micro-ondes)",
        "label_es": "Tratamiento de hiperhidrosis (microondas)",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > Hyperhidrosis",
            "kitmondo": "Aesthetic & Cosmetic > Specialty",
        },
        "keywords": {
            "en": ["sweat reduction", "hyperhidrosis treatment", "miraDry", "underarm sweat device", "used microwave aesthetic"],
            "fr": ["traitement transpiration", "hyperhidrose", "miraDry", "sudation aisselles", "micro-ondes esthétique occasion"],
            "es": ["reducción sudoración", "hiperhidrosis", "miraDry", "sudor axilas", "microondas estético usado"],
        },
    },
    "hydro_oxygen_facial": {
        "label_en": "Hydro / Oxygen Facial System",
        "label_fr": "Soin visage hydro / oxygène",
        "label_es": "Tratamiento facial hidro / oxígeno",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment > Facial Systems",
            "kitmondo": "Aesthetic & Cosmetic > Facial Systems",
        },
        "keywords": {
            "en": ["oxygen facial", "hydro facial", "jet peel", "skin infusion device", "used facial machine"],
            "fr": ["soin oxygène", "hydro soin visage", "jet peel", "infusion cutanée", "appareil soin visage occasion"],
            "es": ["facial de oxígeno", "hidrofacial", "jet peel", "infusión cutánea", "equipo facial usado"],
        },
    },
    "aesthetic_generic": {
        "label_en": "Aesthetic / Medical Device",
        "label_fr": "Appareil esthétique / médical",
        "label_es": "Equipo estético / médico",
        "categories": {
            "leboncoin": "Matériel professionnel > Matériel médical",
            "wallapop": "Salud y belleza > Aparatología estética",
            "facebook": "Business Equipment > Medical & Salon",
            "ebay": "Business & Industrial > Healthcare, Lab & Dental > Medical Aesthetics",
            "machinio": "Aesthetic Equipment",
            "kitmondo": "Aesthetic & Cosmetic",
        },
        "keywords": {
            "en": ["aesthetic device", "medical aesthetic equipment", "used cosmetic machine", "clinic equipment"],
            "fr": ["appareil esthétique", "matériel médico-esthétique", "machine esthétique occasion", "équipement clinique"],
            "es": ["equipo estético", "aparatología médico-estética", "máquina estética usada", "equipo clínica"],
        },
    },
}


def classify(brand: str, model: str, options: str = "") -> str:
    """Return the best device_type key from brand/model/options text."""
    haystack = " ".join(str(x or "").lower() for x in (model, brand, options))
    for dtype, triggers in TYPE_SIGNATURES:
        for t in triggers:
            if t in haystack:
                return dtype
    return "aesthetic_generic"
