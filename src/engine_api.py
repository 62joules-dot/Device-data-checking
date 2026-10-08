"""
Stateless HTTP wrapper around the listing engine, for the SaaS frontend.

Unlike web/app.py (which reads/writes local output/ and uploads/ for the
one-click local interface), this has no persistent state: each request
gets its own temp directory, runs the pipeline, returns JSON, and cleans
up. Meant to run as its own service (see Dockerfile.engine), called by
the Next.js app's API routes over HTTPS with a shared secret.

Run:
    pip install -r requirements.txt -r requirements-engine.txt
    python3 src/engine_api.py
"""
from __future__ import annotations

import base64
import json
import os
import sys
import tempfile
import traceback
from pathlib import Path

from flask import Flask, jsonify, request

SRC = Path(__file__).resolve().parent
sys.path.insert(0, str(SRC))

from run_all import run  # noqa: E402

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32 MB

API_KEY = os.environ.get("ENGINE_API_KEY", "")


def _check_auth():
    if not API_KEY:
        return True  # no key configured: open (local/dev only)
    got = request.headers.get("X-Api-Key", "")
    return got == API_KEY


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/generate")
def api_generate():
    if not _check_auth():
        return jsonify({"error": "unauthorized"}), 401

    body = request.get_json(silent=True) or {}
    xlsx_b64 = body.get("xlsx_base64")
    config = body.get("config") or {}

    if not xlsx_b64 and "file" in request.files:
        xlsx_bytes = request.files["file"].read()
    elif xlsx_b64:
        try:
            xlsx_bytes = base64.b64decode(xlsx_b64)
        except Exception:
            return jsonify({"error": "xlsx_base64 is not valid base64"}), 400
    else:
        return jsonify({"error": "provide 'file' (multipart) or 'xlsx_base64' (JSON)"}), 400

    with tempfile.TemporaryDirectory() as tmp:
        xlsx_path = os.path.join(tmp, "input.xlsx")
        with open(xlsx_path, "wb") as f:
            f.write(xlsx_bytes)
        outdir = os.path.join(tmp, "output")

        try:
            report = run(xlsx_path, config=config, outdir=outdir)
        except Exception as exc:  # pipeline error -> 400, not a 500 crash
            return jsonify({"error": str(exc), "trace": traceback.format_exc()}), 400

        def _read(name):
            p = os.path.join(outdir, name)
            return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else None

        result = {
            "report": report,
            "master_database": _read("master_database.json"),
            "priority_queue": _read("priority_queue.json"),
            "automation": {
                platform: _read(f"automation/{platform}.json")
                for platform in ["leboncoin", "wallapop", "facebook", "ebay", "machinio", "kitmondo"]
            },
        }
        return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
