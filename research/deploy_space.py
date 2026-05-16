#!/usr/bin/env python3
"""
Deploy the T20 Score Predictor to a Hugging Face Space.

Usage:
    python deploy_space.py

Requirements:
    - HF_TOKEN set in your environment (or .env file)
    - pip install huggingface_hub

What this script does:
    1. Creates a new Gradio Space (or reuses it if it already exists)
    2. Uploads app.py and requirements.txt to the Space repo
    3. Adds MODAL_TOKEN_ID and MODAL_TOKEN_SECRET as Space secrets

You still need to set the Modal secrets manually — the HF Hub API does not
allow writing secret values from code (by design). The script will print a
direct link to the Secrets settings page instead.
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from huggingface_hub import HfApi, RepoCard, create_repo, upload_file

load_dotenv(override=True)

# ── Configuration ─────────────────────────────────────────────────────────────
HF_TOKEN   = os.environ.get("HF_TOKEN")
SPACE_NAME = "t20-score-predictor"   # change if you want a different slug
SDK        = "gradio"
SCRIPT_DIR = Path(__file__).parent

if not HF_TOKEN:
    sys.exit("ERROR: HF_TOKEN not found. Set it in your .env file or environment.")

api = HfApi(token=HF_TOKEN)

# ── 1. Resolve HF username ────────────────────────────────────────────────────
user = api.whoami()["name"]
repo_id = f"{user}/{SPACE_NAME}"
print(f"Deploying as: {repo_id}")

# ── 2. Create (or reuse) the Space ────────────────────────────────────────────
try:
    create_repo(
        repo_id=repo_id,
        repo_type="space",
        space_sdk=SDK,
        token=HF_TOKEN,
        exist_ok=True,       # no-op if it already exists
        private=False,
    )
    print(f"Space ready: https://huggingface.co/spaces/{repo_id}")
except Exception as e:
    sys.exit(f"ERROR creating Space: {e}")

# ── 3. Upload app files ───────────────────────────────────────────────────────
files_to_upload = [
    SCRIPT_DIR / "app.py",
    SCRIPT_DIR / "requirements.txt",
]

for file_path in files_to_upload:
    if not file_path.exists():
        print(f"WARNING: {file_path.name} not found, skipping.")
        continue
    api.upload_file(
        path_or_fileobj=str(file_path),
        path_in_repo=file_path.name,
        repo_id=repo_id,
        repo_type="space",
        token=HF_TOKEN,
        commit_message=f"Deploy {file_path.name}",
    )
    print(f"Uploaded: {file_path.name}")

# ── 4. Remind about Modal secrets ─────────────────────────────────────────────
print()
print("=" * 60)
print("ACTION REQUIRED: add Modal secrets to your Space")
print("=" * 60)
print(f"  https://huggingface.co/spaces/{repo_id}/settings")
print()
print("  Add these two secrets (Settings → Variables and secrets):")
print("    MODAL_TOKEN_ID      →  ak-...")
print("    MODAL_TOKEN_SECRET  →  as-...")
print()
print("  (Secret values cannot be written via the API for security reasons.)")
print("=" * 60)
print()
print(f"Space URL: https://huggingface.co/spaces/{repo_id}")
