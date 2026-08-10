"""
Master CLI - one entry point for the whole system.

Examples:
    python cli.py build ../data/sample_devices.xlsx      # listings + JSON + Tier-A feeds
    python cli.py research --mock                         # market research (offline demo)
    python cli.py all ../data/sample_devices.xlsx --mock  # everything
"""
import argparse
import json
import os
import sys

from run_all import run
from research.scraper import research as run_research, MockAdapter
from outreach.generate_outreach_pack import generate as generate_outreach


def _models_from_master(outdir):
    path = os.path.join(outdir, "master_database.json")
    if not os.path.exists(path):
        return []
    data = json.load(open(path, encoding="utf-8"))
    seen, models = set(), []
    for r in data:
        m = f"{r.get('brand','')} {r.get('model','')}".strip()
        if m and m not in seen:
            seen.add(m); models.append(m)
    return models


def cmd_build(args):
    rep = run(args.xlsx, outdir=args.out)
    print(json.dumps(rep, ensure_ascii=False, indent=2))


def cmd_research(args):
    models = args.models or _models_from_master(args.out)
    if not models:
        sys.exit("No models given and no master_database.json found. Run `build` first.")
    adapters = [MockAdapter()]  # swap PlaywrightAdapter(source_cfg) for live scraping
    result = run_research(models, adapters)
    os.makedirs(args.out, exist_ok=True)
    path = os.path.join(args.out, "market_research.json")
    json.dump(result, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Wrote {path}")
    print(json.dumps(result, ensure_ascii=False, indent=2))


def cmd_all(args):
    rep = run(args.xlsx, outdir=args.out)
    print("=== BUILD ==="); print(json.dumps(rep, ensure_ascii=False, indent=2))
    models = _models_from_master(args.out)
    result = run_research(models, [MockAdapter()])
    json.dump(result, open(os.path.join(args.out, "market_research.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    print("\n=== RESEARCH (mock) ==="); print(json.dumps(result, ensure_ascii=False, indent=2))
    # Wave 3 & 4 outreach / consignment pack
    master = json.load(open(os.path.join(args.out, "master_database.json"), encoding="utf-8"))
    o = generate_outreach(master, outdir=os.path.join(args.out, "outreach"))
    print(f"\n=== OUTREACH === {o['auction_houses']} auction houses, {o['outreach_channels']} channels -> {o['outdir']}")


def main():
    ap = argparse.ArgumentParser(description="Medical-device multi-marketplace listing engine")
    sub = ap.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build"); b.add_argument("xlsx"); b.add_argument("--out", default="../output")
    b.set_defaults(func=cmd_build)

    r = sub.add_parser("research"); r.add_argument("models", nargs="*")
    r.add_argument("--mock", action="store_true"); r.add_argument("--out", default="../output")
    r.set_defaults(func=cmd_research)

    a = sub.add_parser("all"); a.add_argument("xlsx"); a.add_argument("--mock", action="store_true")
    a.add_argument("--out", default="../output"); a.set_defaults(func=cmd_all)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
