#!/usr/bin/env python3
"""Set the version across all project components."""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FILES = {
    "pyproject.toml": (
        r'(version\s*=\s*)"[^"]+"',
        lambda m, v: f'{m.group(1)}"{v}"',
    ),
    "web/package.json": (
        r'("version"\s*:\s*)"[^"]+"',
        lambda m, v: f'{m.group(1)}"{v}"',
    ),
    "android/package.json": (
        r'("version"\s*:\s*)"[^"]+"',
        lambda m, v: f'{m.group(1)}"{v}"',
    ),
    "android/app.config.ts": (
        r"(version:\s*)'[^']+'",
        lambda m, v: f"{m.group(1)}'{v}'",
    ),
}


def update_file(rel_path, pattern, replacement, new_version):
    path = ROOT / rel_path
    original = path.read_text()
    updated = re.sub(pattern, lambda m: replacement(m, new_version), original, count=1)
    if original == updated:
        print(f"  WARNING: no change in {rel_path}")
        return None
    old = re.search(pattern, original).group(0)
    new = re.search(pattern, updated).group(0)
    path.write_text(updated)
    return old, new


def update_gradle(new_version):
    rel = "android/android/app/build.gradle"
    path = ROOT / rel
    original = path.read_text()
    text = original

    # bump versionCode
    vc_match = re.search(r"versionCode\s+(\d+)", text)
    old_code = int(vc_match.group(1))
    new_code = old_code + 1
    text = re.sub(r"(versionCode\s+)\d+", rf"\g<1>{new_code}", text, count=1)

    # set versionName
    text = re.sub(r'(versionName\s+)"[^"]+"', rf'\1"{new_version}"', text, count=1)

    if text == original:
        print(f"  WARNING: no change in {rel}")
        return []
    path.write_text(text)
    return [
        f"  {rel}: versionCode {old_code} -> {new_code}",
        f"  {rel}: versionName -> \"{new_version}\"",
    ]


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <X.Y.Z>")
        sys.exit(1)

    version = sys.argv[1]
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        print(f"Error: invalid version '{version}' (expected X.Y.Z)")
        sys.exit(1)

    print(f"Setting version to {version}\n")
    changes = []

    for rel_path, (pattern, replacement) in FILES.items():
        result = update_file(rel_path, pattern, replacement, version)
        if result:
            changes.append(f"  {rel_path}: {result[0]} -> {result[1]}")

    changes.extend(update_gradle(version))

    if changes:
        print("Changes:")
        for c in changes:
            print(c)
    else:
        print("No changes made.")


if __name__ == "__main__":
    main()
