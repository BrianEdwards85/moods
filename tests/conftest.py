import os

# Must be set before importing app so Dynaconf loads the [testing] environment
os.environ["MOODS_ENV"] = "testing"

import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--server-url",
        default=None,
        help="Run integration tests against a live server instead of in-process ASGI",
    )


def pytest_collection_modifyitems(items):
    for item in items:
        if "/integration/" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "/unit/" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
