"""
Test suite. Run:  python -m pytest tests/ -q   (from src/)
or:               python tests/test_pipeline.py
"""
import os
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_ROOT, "src"))

from normalize import normalize, MISSING
from generate import generate
from knowledge import classify
from research.stats import analyse_model
from exporters.ebay_file_exchange import _condition_id

SAMPLE = os.path.join(_ROOT, "data", "sample_devices.xlsx")


def test_classifier():
    assert classify("Candela", "GentleMax Pro") == "laser_hair_removal"
    assert classify("Cynosure", "PicoSure") == "picosecond_laser"
    assert classify("InMode", "Morpheus8") == "rf_microneedling"
    assert classify("Unknown", "XYZ") == "aesthetic_generic"


def test_normalize_flags_missing_not_invents():
    recs = normalize(SAMPLE)
    assert len(recs) == 5
    by_id = {r["id"]: r for r in recs}
    # DEV-003 (Morpheus8) and DEV-004 (Alma) had no recommended price
    assert "price_recommended" in by_id["DEV-003"]["_missing_required"]
    assert by_id["DEV-003"]["_publishable"] is False
    # nothing invented: missing serial stays MISSING
    assert by_id["DEV-002"]["serial_number"] == MISSING


def test_generate_multilingual_titles():
    recs = normalize(SAMPLE)
    gen = generate(recs[0])
    for platform in ("leboncoin", "wallapop", "facebook", "ebay", "machinio", "kitmondo"):
        assert gen["titles"][platform]
    for lang in ("fr", "es", "en"):
        assert gen["detailed_description"][lang]
        assert gen["keywords"][lang]


def test_ebay_condition_ids():
    assert _condition_id("Neuf") == 1000
    assert _condition_id("Excellent") == 2500
    assert _condition_id("Bon état") == 3000


def test_research_stats():
    listings = [
        {"status": "active", "price": 10000, "country": "France", "model": "X"},
        {"status": "active", "price": 12000, "country": "France", "model": "X"},
        {"status": "active", "price": 14000, "country": "Espagne", "model": "X"},
        {"status": "sold", "price": 11000, "country": "France", "model": "X"},
    ]
    a = analyse_model("X", listings)
    assert a["asking_price"]["median"] == 12000
    assert a["asking_price"]["min"] == 10000
    assert a["best_country_by_volume"] == "France"
    assert a["sold_price"]["median"] == 11000


def _run_all():
    passed = 0
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn(); passed += 1; print(f"  ok  {name}")
    print(f"\n{passed} tests passed")


if __name__ == "__main__":
    _run_all()
