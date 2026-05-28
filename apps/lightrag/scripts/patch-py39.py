#!/usr/bin/env python3
"""Patch lightrag-hku and dependencies for Python 3.9 compatibility.

Adds 'from __future__ import annotations' to all Python files that use
PEP 604 union syntax (X | Y) so they parse on Python 3.9.
Run this after 'pip install -r requirements.txt'.
"""

import os
import re
import sys


def needs_patch(content: str) -> bool:
    patterns = [
        r"dict\[.*?\]\s*\|\s*None",
        r"list\[.*?\]\s*\|\s*None",
        r"str\s*\|\s*None",
        r"int\s*\|\s*None",
        r"bool\s*\|\s*None",
        r"float\s*\|\s*None",
        r"Any\s*\|\s*None",
        r"\w+\s*\|\s*\w+",
    ]
    for p in patterns:
        if re.search(p, content):
            return True
    return False


def patch_file(path: str) -> bool:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if not needs_patch(content):
        return False
    if content.startswith("from __future__ import annotations"):
        return False

    lines = content.split("\n")
    insert_idx = 0
    if lines and lines[0].startswith("#!"):
        insert_idx = 1

    new_lines = lines[:insert_idx] + ["from __future__ import annotations", ""] + lines[insert_idx:]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(new_lines))
    return True


def main() -> int:
    site_packages = os.path.join(os.path.dirname(sys.executable), "..", "lib", f"python{sys.version_info.major}.{sys.version_info.minor}", "site-packages")
    site_packages = os.path.normpath(site_packages)

    if not os.path.isdir(site_packages):
        print(f"Site-packages not found: {site_packages}")
        return 1

    care_packages = ["lightrag", "pipmaster", "ascii_colors"]
    count = 0

    for pkg in care_packages:
        pkg_dir = os.path.join(site_packages, pkg)
        if not os.path.exists(pkg_dir):
            continue
        for root, _dirs, files in os.walk(pkg_dir):
            for file in files:
                if file.endswith(".py"):
                    if patch_file(os.path.join(root, file)):
                        count += 1

    print(f"Patched {count} files for Python 3.9 compatibility")
    return 0


if __name__ == "__main__":
    sys.exit(main())
