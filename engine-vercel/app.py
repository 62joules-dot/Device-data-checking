"""
Vercel Flask entrypoint. This directory is a self-contained copy of the
engine files engine_api.py actually needs (see ../src for the source of
truth) — kept separate so Vercel's Python build only installs flask/pandas/
openpyxl, not the full requirements.txt (playwright, anthropic) at repo root.
"""
from engine_api import app  # noqa: F401
