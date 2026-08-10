"""
Optional description enrichment via the Anthropic API.

Sends only the structured facts and hard-forbids inventing specs. Falls back to
the template descriptions if disabled or no key. One API call per device.
"""
import json
from config import LLM

SYSTEM = (
    "You are a marketplace copywriter for used professional aesthetic/medical devices. "
    "Write ONLY from the facts given. Never invent specifications, years, accessories, "
    "certifications, or performance claims not present in the facts. If a fact is missing, "
    "omit it. Return strict JSON with keys fr, es, en; each value a 90-140 word SEO "
    "description. No preamble, no markdown."
)


def enrich(rec, generated):
    if not LLM.get("enabled") or not LLM.get("api_key"):
        return generated  # offline / disabled: keep template copy
    try:
        import anthropic
    except ImportError:
        print("[warn] anthropic sdk not installed; skipping enrichment")
        return generated

    facts = {
        "brand": rec.get("brand"), "model": rec.get("model"), "year": rec.get("year"),
        "condition": rec.get("condition"), "country": rec.get("country"),
        "options": rec.get("options"), "accessories": rec.get("accessories"),
        "price_eur": rec.get("price_recommended"),
        "vat_recoverable": rec.get("vat_recoverable"),
        "delivery": rec.get("delivery_possible"),
        "device_type": generated["device_type"],
        "keywords": generated["keywords"],
    }
    client = anthropic.Anthropic(api_key=LLM["api_key"])
    resp = client.messages.create(
        model=LLM["model"], max_tokens=LLM["max_tokens"], system=SYSTEM,
        messages=[{"role": "user", "content": "FACTS:\n" + json.dumps(facts, ensure_ascii=False)}],
    )
    text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        data = json.loads(text)
        for lang in ("fr", "es", "en"):
            if data.get(lang):
                generated["detailed_description"][lang] = data[lang]
    except json.JSONDecodeError:
        print(f"[warn] could not parse LLM JSON for {rec['id']}; keeping template copy")
    return generated
