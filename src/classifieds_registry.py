"""
Direct-publish classifieds registry (his refined Wave 2).

These are sites where you post an ad directly (no auction, no API) — the system
writes the listing text, you paste it. Each entry says which language to post in
and which generated text to use (the system produces FR / ES / EN today; IT/DE/PL/
NL/PT/RO/BG can be added later).

'post': how to publish. 'sys' = which generated text to paste now.
URLs are the site homepages (safe); on each, use its "Déposer une annonce /
Inserisci annuncio / Anzeige aufgeben / Dodaj ogłoszenie" button.
"""

# (wave, country, platform, priority A/B, local_lang, sys_text, url, note)
CLASSIFIEDS = [
    # France
    ("W2", "France", "Leboncoin Pro", "A", "FR", "FR", "https://www.leboncoin.fr", "Rubrique matériel pro / médical"),
    ("W2", "France", "LeBonLaser", "A", "FR", "FR", "https://www.lebonlaser.com", "Très ciblé laser/RF/IPL — vérifier dépôt"),
    ("W2", "France", "Le Coin du Pro", "A", "FR", "FR", "https://www.lecoindupro.com", "Rubrique matériel dermatologie"),
    ("W2", "France", "AFME (annonces médecine esthétique)", "A", "FR", "FR", "", "Chercher le site AFME + rubrique dépôt"),
    ("W2", "France", "Médecine Esthétique Occasions", "B", "FR", "FR", "", "Spécialisé occasion médecine esthétique"),
    ("W2", "France", "La Compagnie des Lasers / LCD", "B", "FR", "FR", "", "Reprise pro plutôt que petites annonces"),
    ("W2", "France", "Medical Production", "B", "FR", "FR", "", "Achat/reprise laser d'occasion"),
    # Spain
    ("W2", "Espagne", "Wallapop", "A", "ES", "ES", "https://es.wallapop.com", "Publication directe"),
    ("W2", "Espagne", "Milanuncios", "A", "ES", "ES", "https://www.milanuncios.com", "Rubrique aparatología estética"),
    ("W2", "Espagne", "Beauty Market España", "A", "ES", "ES", "", "Destiné aux centres esthétiques"),
    ("W2", "Espagne", "BeautyMed", "A", "ES", "ES", "", "Cliniques chirurgie/médecine esthétique"),
    ("W2", "Espagne", "SoloStocks", "B", "ES", "ES", "https://www.solostocks.com", "Diffusion B2B"),
    ("W2", "Espagne", "Facebook Marketplace ES + groupes", "B", "ES", "ES", "https://www.facebook.com/marketplace", "Groupes 'Estética segunda mano'"),
    # Italy
    ("W2", "Italie", "Subito.it", "A", "IT", "EN", "https://www.subito.it", "Local IT à ajouter (EN en attendant)"),
    ("W2", "Italie", "eBay.it", "A", "IT", "EN", "https://www.ebay.it", "Import eBay possible"),
    ("W2", "Italie", "Bakeca.it", "B", "IT", "EN", "https://www.bakeca.it", ""),
    ("W2", "Italie", "Kijiji IT / classifieds locaux", "B", "IT", "EN", "", ""),
    # Germany
    ("W2", "Allemagne", "Kleinanzeigen.de", "A", "DE", "EN", "https://www.kleinanzeigen.de", "Local DE à ajouter"),
    ("W2", "Allemagne", "LaserPoint Börse", "A", "DE", "EN", "", "Bourse allemande lasers médicaux d'occasion"),
    ("W2", "Allemagne", "Quoka.de", "B", "DE", "EN", "https://www.quoka.de", ""),
    ("W2", "Allemagne", "markt.de", "B", "DE", "EN", "https://www.markt.de", ""),
    ("W2", "Allemagne", "eBay.de", "A", "DE", "EN", "https://www.ebay.de", "Import eBay"),
    # Poland
    ("W2", "Pologne", "OLX Polska", "A", "PL", "EN", "https://www.olx.pl", "Alma Harmony XL, Cynosure Elite Plus présents"),
    ("W2", "Pologne", "Sprzedajemy.pl", "A", "PL", "EN", "https://sprzedajemy.pl", ""),
    ("W2", "Pologne", "Allegro", "A", "PL", "EN", "https://allegro.pl", "Matériel médical d'occasion"),
    ("W2", "Pologne", "Medipment.pl", "A", "PL", "EN", "https://medipment.pl", "Vrai site médical, catégories lasers"),
    ("W2", "Pologne", "Gratka", "B", "PL", "EN", "https://gratka.pl", ""),
    # Netherlands
    ("W2", "Pays-Bas", "Marktplaats.nl", "A", "NL", "EN", "https://www.marktplaats.nl", "LightSheer et lasers présents"),
    ("W2", "Pays-Bas", "Huidtherapie.nu", "A", "NL", "EN", "", "Marketplace cabinets thérapie cutanée"),
    ("W2", "Pays-Bas", "eBay.nl", "A", "NL", "EN", "https://www.ebay.nl", "Import eBay"),
    # Belgium
    ("W2", "Belgique", "2dehands.be / 2ememain.be", "A", "NL/FR", "FR", "https://www.2dehands.be", "Équivalent Leboncoin"),
    ("W2", "Belgique", "Facebook Marketplace BE", "B", "FR", "FR", "https://www.facebook.com/marketplace", ""),
    # Portugal
    ("W2", "Portugal", "OLX Portugal", "A", "PT", "EN", "https://www.olx.pt", "Matériel esthétique/laser présent"),
    ("W2", "Portugal", "CustoJusto", "A", "PT", "EN", "https://www.custojusto.pt", "Rubrique équipement pro"),
    ("W2", "Portugal", "Facebook Marketplace PT", "B", "PT", "EN", "https://www.facebook.com/marketplace", ""),
    # Austria
    ("W2", "Autriche", "Willhaben.at", "A", "DE", "EN", "https://www.willhaben.at", "Équivalent local Leboncoin"),
    # Switzerland
    ("W2", "Suisse", "Ricardo.ch", "A", "DE/FR", "FR", "https://www.ricardo.ch", "Appareils laser pro présents"),
    ("W2", "Suisse", "Anibis.ch", "B", "DE/FR", "FR", "https://www.anibis.ch", ""),
    ("W2", "Suisse", "Tutti.ch", "B", "DE/FR", "FR", "https://www.tutti.ch", "Annonces beauté/IPL/laser"),
    # Romania
    ("W2", "Roumanie", "OLX.ro", "A", "RO", "EN", "https://www.olx.ro", "PrimeLase, DEKA Motus AX présents"),
    ("W2", "Roumanie", "Publi24", "B", "RO", "EN", "https://www.publi24.ro", ""),
    ("W2", "Roumanie", "Lajumate", "B", "RO", "EN", "https://www.lajumate.ro", ""),
    # Bulgaria
    ("W2", "Bulgarie", "Bazar.bg", "B", "BG", "EN", "https://bazar.bg", "Lasers pro d'occasion vérifiés"),
    ("W2", "Bulgarie", "OLX.bg", "B", "BG", "EN", "https://www.olx.bg", ""),
    # International (priority, feed/import where possible)
    ("W1", "International", "Bimedis", "A", "EN", "EN", "https://bimedis.com", "Catégorie Cosmetic Lasers"),
    ("W1", "International", "DOTmed", "A", "EN", "EN", "https://www.dotmed.com", "Import feed/TSV — auto"),
    ("W1", "International", "Machinio", "A", "EN", "EN", "https://www.machinio.com", "Feed dealer — auto"),
    ("W1", "International", "Exapro", "A", "EN", "EN", "https://www.exapro.com", "Email offres info@exapro.eu"),
    ("W1", "International", "eBay Pro", "A", "EN", "EN", "https://www.ebay.com", "Import File Exchange — auto"),
    ("W1", "International", "Laser & Aesthetics UK", "A", "EN", "EN", "", "Annuaire lasers/esthétique d'occasion"),
    ("W1", "International", "MedWOW", "B", "EN", "EN", "https://www.medwow.com", ""),
]

COLUMNS = ["Wave", "Pays", "Plateforme", "Priorité", "Langue locale",
           "Texte système à utiliser", "URL", "Comment publier"]


def rows():
    out = []
    for wave, country, plat, prio, lang, systxt, url, note in CLASSIFIEDS:
        how = "Import fichier" if ("auto" in note or "Import" in note or "feed" in note.lower()) else "Déposer une annonce → coller le texte"
        out.append({
            "Wave": wave, "Pays": country, "Plateforme": plat, "Priorité": prio,
            "Langue locale": lang, "Texte système à utiliser": systxt,
            "URL": url or "(chercher le site)", "Comment publier": f"{how}. {note}".strip(),
        })
    return out
