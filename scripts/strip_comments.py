#!/usr/bin/env python3
"""
Safely remove comments and emojis from project files.

Features
- Protects http/https URLs
- Creates .bak backups
- Skips node_modules, .git, venv
- Supports JS, TS, CSS, HTML, SQL, JSON, MD
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EXTS = {'.js', '.ts', '.css', '.html', '.htm', '.sql', '.json', '.md'}
SKIP_DIRS = {'.git', 'node_modules', 'venv', '.venv', '__pycache__'}

DRY_RUN = False


# -------- Regex --------

RE_BLOCK = re.compile(r'/\*.*?\*/', re.DOTALL)
RE_HTML = re.compile(r'<!--.*?-->', re.DOTALL)
RE_SQL = re.compile(r'--.*?$', re.MULTILINE)

# JS single-line comments
RE_JS_SINGLE = re.compile(r'^\s*//.*?$', re.MULTILINE)

# URL protector
RE_URL = re.compile(r'https?://[^\s\'"]+')

# emoji ranges
RE_EMOJI = re.compile(
    '['
    '\U0001F300-\U0001FAFF'
    '\u2600-\u27BF'
    ']+',
    flags=re.UNICODE
)


def protect_urls(text):
    urls = []

    def repl(match):
        urls.append(match.group(0))
        return f"__URL_{len(urls)-1}__"

    text = RE_URL.sub(repl, text)
    return text, urls


def restore_urls(text, urls):
    for i, u in enumerate(urls):
        text = text.replace(f"__URL_{i}__", u)
    return text


modified = []

for p in ROOT.rglob('*'):

    if p.is_dir():
        continue

    if any(part in SKIP_DIRS for part in p.parts):
        continue

    if p.suffix.lower() not in EXTS:
        continue

    try:
        s = p.read_text(encoding="utf-8")
    except:
        continue

    orig = s

    # protect URLs first
    s, urls = protect_urls(s)

    # remove emojis
    s = RE_EMOJI.sub('', s)

    ext = p.suffix.lower()

    if ext in {'.js', '.ts'}:
        s = RE_BLOCK.sub('', s)
        s = RE_JS_SINGLE.sub('', s)

    elif ext == '.css':
        s = RE_BLOCK.sub('', s)

    elif ext in {'.html', '.htm', '.md'}:
        s = RE_HTML.sub('', s)

    elif ext == '.sql':
        s = RE_BLOCK.sub('', s)
        s = RE_SQL.sub('', s)

    elif ext == '.json':
        s = RE_BLOCK.sub('', s)

    # restore URLs
    s = restore_urls(s, urls)

    # remove extra blank lines
    s = re.sub(r'\n{3,}', '\n\n', s)

    if s != orig:

        if DRY_RUN:
            print("Would modify:", p)
            continue

        bak = p.with_suffix(p.suffix + ".bak")
        bak.write_text(orig, encoding="utf-8")

        p.write_text(s, encoding="utf-8")

        modified.append(str(p))


print("\nModified files:")
for m in modified:
    print(" -", m)

print("\nBackups saved as .bak")