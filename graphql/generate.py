#!/usr/bin/env python3
"""Generate client-specific GraphQL files from shared .graphql operations."""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OPS_DIR = REPO_ROOT / "graphql" / "operations"

# Ordering matches the existing files exactly.
CLJS_ORDER = [
    "users",
    "user",
    "mood-entries",
    "tags",
    "log-mood",
    "archive-entry",
    "update-tag-metadata",
    "archive-tag",
    "unarchive-tag",
    "send-login-code",
    "verify-login-code",
    "update-user-settings",
    "update-sharing",
    "refresh-token",
    "search-users",
]

TS_QUERIES_ORDER = ["users", "mood-entries", "search-users", "tags"]
TS_MUTATIONS_ORDER = [
    "log-mood",
    "update-tag-metadata",
    "archive-tag",
    "unarchive-tag",
    "send-login-code",
    "verify-login-code",
    "update-user-settings",
    "update-sharing",
    "refresh-token",
]


def read_operation(name: str) -> str:
    return (OPS_DIR / f"{name}.graphql").read_text().strip()


def is_mutation(content: str) -> bool:
    return content.lstrip().startswith("mutation")


def to_screaming_snake(name: str) -> str:
    return name.upper().replace("-", "_")


# -- ClojureScript ------------------------------------------------------------


def format_cljs_def(name: str, content: str) -> str:
    suffix = "mutation" if is_mutation(content) else "query"
    def_name = f"{name}-{suffix}"
    lines = content.split("\n")
    if len(lines) == 1:
        return f'(def {def_name}\n  "{content}")'
    first, *rest = lines
    indented = "\n".join("   " + line for line in rest)
    return f'(def {def_name}\n  "{first}\n{indented}")'


def generate_cljs() -> None:
    header = ";; GENERATED — do not edit. Run: python graphql/generate.py"
    ns = (
        '(ns moods.gql\n  "GraphQL query and mutation strings,'
        ' plus re-graph initialization.")'
    )
    defs = [format_cljs_def(n, read_operation(n)) for n in CLJS_ORDER]
    path = REPO_ROOT / "web" / "src" / "moods" / "gql.cljs"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(header + "\n" + ns + "\n\n" + "\n\n".join(defs) + "\n")
    print(f"  {path.relative_to(REPO_ROOT)}")


# -- TypeScript ----------------------------------------------------------------


def format_ts_export(name: str, content: str) -> str:
    suffix = "MUTATION" if is_mutation(content) else "QUERY"
    const_name = f"{to_screaming_snake(name)}_{suffix}"
    indented = "\n".join("  " + line for line in content.split("\n"))
    return f"export const {const_name} = `\n{indented}\n`;"


def generate_ts() -> None:
    header = "// GENERATED — do not edit. Run: python graphql/generate.py\n"

    queries = [format_ts_export(n, read_operation(n)) for n in TS_QUERIES_ORDER]
    path = REPO_ROOT / "android" / "lib" / "graphql" / "queries.ts"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(header + "\n" + "\n\n".join(queries) + "\n")
    print(f"  {path.relative_to(REPO_ROOT)}")

    mutations = [format_ts_export(n, read_operation(n)) for n in TS_MUTATIONS_ORDER]
    path = REPO_ROOT / "android" / "lib" / "graphql" / "mutations.ts"
    path.write_text(header + "\n" + "\n\n".join(mutations) + "\n")
    print(f"  {path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    print("Generated:")
    generate_cljs()
    generate_ts()
