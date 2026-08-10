# Platform Playbook — Waves 1 to 4

How each platform actually accepts listings, what the system does for it, and the
manual steps where automation isn't possible. Three methods:

- **AUTO** — real bulk feed / upload / API. The system produces the file; you upload it.
- **SEMI** — no bulk feed. Pre-filled data + form-fill assist; you review and submit.
- **CONSIGNMENT / OUTREACH** — you can't self-list. You submit to a house or contact
  buyers directly. The system produces contact lists + ready-to-send templates.

---

## Wave 1 — open & publish first

| Platform | Method | What the system gives you | Your step |
|---|---|---|---|
| **eBay Pro** | AUTO | `exports/ebay_file_exchange.csv` | Seller Hub → Reports → Upload. Set numeric category, host photos. |
| **DOTmed** | AUTO | `exports/dotmed_upload.tsv` + `dotmed_feed.json` | Must be a DOTmed "Trusted" upload user. Upload the TSV, or wire the JSON feed/API. Set exact DOTmed category. |
| **Bimedis** | SEMI | `exports/bimedis_submission.csv` | Post via a Bimedis PRO account (unlimited listings). Ask their team about bulk import of the CSV. |

## Wave 2 — immediately after

| Platform | Method | What the system gives you | Your step |
|---|---|---|---|
| **Machinio** | AUTO | `exports/machinio_feed.csv` | Send through your Machinio dealer feed setup. |
| **Leboncoin Pro** | SEMI | `automation/leboncoin.json` + form-fill assist | `python posters/formfill_assist.py leboncoin ...` — log in, review, submit. |
| **Exapro** | CONSIGNMENT-LITE | `exports/exapro_submission.csv` | Email offers to **info@exapro.eu** (their agents list them) or post via the seller form. Commission only on sale; non-exclusive. |
| **AFME / Trade Medical / DeviceBridge / AestheticEquip** | SEMI | prepared CSV + assist stubs | Confirm each site's add-listing URL; post via account or the assist script. |

## Wave 3 — broader distribution

| Channel | Method | What the system gives you | Your step |
|---|---|---|---|
| **Wallapop** | SEMI | `automation/wallapop.json` + assist | `formfill_assist.py wallapop ...`; review + submit. |
| **Facebook Marketplace** | SEMI | `automation/facebook.json` + assist | `formfill_assist.py facebook ...`; logged-in profile; submit yourself. |
| **Lecoindupro** | SEMI | assist (`lecoindupro`) | Verify selectors on the deposit form, then run the assist. |
| **MedSpa Listings** | SEMI | assist stub | Confirm add-listing URL; post via account. |
| **LinkedIn** | OUTREACH | `outreach/template_linkedin_post.txt` | Paste as a post; DM clinics/distributors. No bulk automation (ToS). |
| **WhatsApp Business** | OUTREACH | `outreach/template_whatsapp_broadcast.txt` | Broadcast to your buyer/broker list. For scale, use the official WhatsApp Business API. |
| **Facebook groups** | OUTREACH | LinkedIn/broker templates | Post manually in specialist groups; follow each group's rules. |
| **Distributor & broker networks** | OUTREACH | `outreach/template_broker_email.txt` | Email known brokers; log in `outreach/tracker.csv`. |

## Wave 4 — auctions & liquidation (all CONSIGNMENT)

You **do not** self-list on these. You submit the equipment; the house inspects,
appraises, and runs the sale. The system gives you `outreach/contacts_auctions.csv`,
`outreach/template_auction_consignment_email.txt`, and `outreach/tracker.csv`.

Manual method for every one below is the same 4 steps:
1. Open the house's "Sell / Consign with us" page (URLs in `contacts_auctions.csv`).
2. Send the consignment email template (auto-filled with your inventory).
3. They reply with process, fees, and the next sale date.
4. Log it in `tracker.csv`.

Houses included (verify each current sell page): **British Medical Auctions** (the
medical/aesthetic specialist — start here), Troostwijk (TWK), Surplex, EquipNet,
Ritchie Bros., Go-Dove / Liquidity Services, Vavato, PS Auction, Auctelia,
Industrial Auctions, Apex Auctions, and **BidSpotter** (post via one of its listed
auctioneers rather than directly).

---

## Honest summary of what "automated" means per wave

- **Truly automated (feed/upload/API):** eBay, DOTmed, Machinio, Kitmondo.
- **Semi-automated (pre-filled, you submit):** Leboncoin, Wallapop, Facebook, Lecoindupro,
  Bimedis, and the niche marketplaces — no API exists, so full auto = account bans.
- **Not self-listing at all:** Exapro (agent-listed), every Wave 4 auction house
  (consignment), and LinkedIn / WhatsApp / FB groups / brokers (outreach). For these
  the deliverable is contact lists + ready-to-send templates + a tracker — which is
  how equipment actually sells through those channels.

This is the maximum that is technically real. Anything promising headless auto-posting
to auctions, LinkedIn, WhatsApp or broker networks would break on contact with the
platforms and risk banning the accounts.
