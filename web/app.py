"""
Local HTML interface for the medical-device listing engine.

Run from project root:
    .venv/bin/python web/app.py
Then open http://127.0.0.1:5050
"""
from __future__ import annotations

import json
import os
import sys
import traceback
from pathlib import Path

from flask import (
    Flask,
    jsonify,
    render_template,
    request,
    send_file,
    abort,
)
from werkzeug.utils import secure_filename

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DATA = ROOT / "data"
OUTPUT = ROOT / "output"
UPLOADS = Path(__file__).resolve().parent / "uploads"

sys.path.insert(0, str(SRC))

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32 MB
UPLOADS.mkdir(parents=True, exist_ok=True)


def _read_json(path: Path):
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _safe_under(base: Path, rel: str) -> Path:
    target = (base / rel).resolve()
    if not str(target).startswith(str(base.resolve())):
        abort(400, "Invalid path")
    return target


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/samples")
def api_samples():
    files = sorted(p.name for p in DATA.glob("*.xlsx") if p.is_file())
    return jsonify({"samples": files})


@app.get("/api/dashboard")
def api_dashboard():
    report = _read_json(OUTPUT / "report.json")
    master = _read_json(OUTPUT / "master_database.json") or []
    research = _read_json(OUTPUT / "market_research.json") or {}
    priority = _read_json(OUTPUT / "priority_queue.json") or []

    devices = []
    for r in master:
        gen = r.get("generated") or {}
        devices.append(
            {
                "id": r.get("id"),
                "brand": r.get("brand"),
                "model": r.get("model"),
                "year": r.get("year"),
                "condition": r.get("condition"),
                "country": r.get("country"),
                "price_recommended": r.get("price_recommended"),
                "publishable": r.get("_publishable"),
                "missing": r.get("_missing_required") or [],
                "device_type": gen.get("device_type"),
                "titles": gen.get("titles") or {},
                "short_description": gen.get("short_description") or {},
            }
        )

    exports = []
    exports_dir = OUTPUT / "exports"
    if exports_dir.exists():
        for p in sorted(exports_dir.iterdir()):
            if p.is_file():
                exports.append(
                    {
                        "name": p.name,
                        "path": f"exports/{p.name}",
                        "size": p.stat().st_size,
                    }
                )

    automation = []
    auto_dir = OUTPUT / "automation"
    if auto_dir.exists():
        for p in sorted(auto_dir.glob("*.json")):
            automation.append({"name": p.name, "path": f"automation/{p.name}"})

    intake_missing = None
    miss_path = OUTPUT / "intake" / "MISSING_REPORT.md"
    if miss_path.exists():
        intake_missing = miss_path.read_text(encoding="utf-8")[:4000]

    return jsonify(
        {
            "report": report,
            "devices": devices,
            "research": research,
            "priority": priority,
            "exports": exports,
            "automation": automation,
            "intake_missing_report": intake_missing,
            "has_output": bool(report or devices),
        }
    )


@app.get("/api/download/<path:rel>")
def api_download(rel: str):
    path = _safe_under(OUTPUT, rel)
    if not path.is_file():
        abort(404)
    return send_file(path, as_attachment=True, download_name=path.name)


@app.post("/api/run")
def api_run():
    mode = (request.form.get("mode") or "all").strip()
    sample = (request.form.get("sample") or "").strip()
    xlsx_path: Path | None = None

    if sample:
        candidate = _safe_under(DATA, secure_filename(sample))
        if not candidate.is_file():
            return jsonify({"ok": False, "error": f"Sample not found: {sample}"}), 400
        xlsx_path = candidate
    elif "file" in request.files and request.files["file"].filename:
        f = request.files["file"]
        name = secure_filename(f.filename)
        if not name.lower().endswith((".xlsx", ".xls")):
            return jsonify({"ok": False, "error": "Upload an .xlsx Excel file"}), 400
        dest = UPLOADS / name
        f.save(dest)
        xlsx_path = dest
    else:
        return jsonify({"ok": False, "error": "Choose a sample file or upload an Excel"}), 400

    outdir = str(OUTPUT)
    try:
        if mode == "intake":
            from intake_run import run as intake_run

            result = intake_run(str(xlsx_path), outdir=str(OUTPUT / "intake"))
            return jsonify({"ok": True, "mode": mode, "result": result})

        if mode == "build":
            from run_all import run as build_run

            result = build_run(str(xlsx_path), outdir=outdir)
            return jsonify({"ok": True, "mode": mode, "result": result})

        # all = build + mock research + outreach
        from run_all import run as build_run
        from research.scraper import research as run_research, MockAdapter
        from outreach.generate_outreach_pack import generate as generate_outreach

        result = build_run(str(xlsx_path), outdir=outdir)
        master = _read_json(OUTPUT / "master_database.json") or []
        models = []
        seen = set()
        for r in master:
            m = f"{r.get('brand', '')} {r.get('model', '')}".strip()
            if m and m not in seen:
                seen.add(m)
                models.append(m)
        research = run_research(models, [MockAdapter()]) if models else {}
        with open(OUTPUT / "market_research.json", "w", encoding="utf-8") as fh:
            json.dump(research, fh, ensure_ascii=False, indent=2)
        outreach = generate_outreach(master, outdir=str(OUTPUT / "outreach")) if master else {}
        return jsonify(
            {
                "ok": True,
                "mode": "all",
                "result": result,
                "research_models": len(models),
                "outreach": outreach,
            }
        )
    except Exception as exc:
        return (
            jsonify(
                {
                    "ok": False,
                    "error": str(exc),
                    "trace": traceback.format_exc()[-2000:],
                }
            ),
            500,
        )


if __name__ == "__main__":
    print("MedList UI → http://127.0.0.1:5050")
    app.run(host="127.0.0.1", port=5050, debug=False)
