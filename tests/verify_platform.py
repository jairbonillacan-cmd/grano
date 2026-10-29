#!/usr/bin/env python3
"""
Verification script for DATA TRIAD STUDIO (DE + DA + BI) & Google AI Ultra Bridge.
Follows the webapp-testing skill patterns with Playwright (headless Chromium + networkidle)
and a clean fallback to urllib.request + DOM/bundle inspection when browser binaries are unavailable.
"""

import argparse
import json
import sys
import urllib.error
import urllib.request
from typing import Any, Dict, List, Tuple


def fetch_json(url: str, method: str = "GET", payload: Dict[str, Any] | None = None, timeout: int = 20) -> Tuple[int, Dict[str, Any]]:
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        status = resp.getcode()
        raw = resp.read().decode("utf-8", errors="replace")
        return status, json.loads(raw)


def fetch_text(url: str, timeout: int = 15) -> Tuple[int, str]:
    req = urllib.request.Request(url, headers={"Accept": "text/html,*/*"}, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.getcode(), resp.read().decode("utf-8", errors="replace")


def verify_with_playwright(base_url: str) -> Dict[str, Any]:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        console_errors: List[str] = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        resp = page.goto(base_url, wait_until="networkidle", timeout=20000)
        page.wait_for_load_state("networkidle")

        status_code = resp.status if resp else 0
        raw_html = page.content()
        title = page.title()
        button_count = len(page.locator("button").all())
        body_text = page.locator("body").inner_text()

        browser.close()
        return {
            "mode": "playwright-chromium-headless",
            "status_code": status_code,
            "title": title,
            "raw_html": raw_html,
            "button_count": button_count,
            "has_360_ui": ("360" in body_text or "DATA TRIAD" in title.upper()),
            "console_errors": console_errors,
        }


def verify_with_urllib_fallback(base_url: str) -> Dict[str, Any]:
    status_code, raw_html = fetch_text(base_url)
    title = ""
    if "<title>" in raw_html and "</title>" in raw_html:
        title = raw_html.split("<title>", 1)[1].split("</title>", 1)[0].strip()

    return {
        "mode": "urllib-dom-fallback",
        "status_code": status_code,
        "title": title,
        "raw_html": raw_html,
        "button_count": -1,
        "has_360_ui": "root" in raw_html and "DATA TRIAD STUDIO" in raw_html,
        "console_errors": [],
    }


def run_verification(base_url: str) -> int:
    base_url = base_url.rstrip("/")
    checks: List[Dict[str, Any]] = []

    # 1. Frontend & Direction Contract check (Playwright first, clean fallback to urllib)
    try:
        fe_result = verify_with_playwright(base_url)
    except Exception as pw_exc:
        fe_result = verify_with_urllib_fallback(base_url)
        fe_result["fallback_reason"] = str(pw_exc).splitlines()[0] if str(pw_exc) else "Playwright unavailable"

    raw_html = fe_result.get("raw_html", "")
    contract_keys = ["THESIS:", "OWN-WORLD:", "STORY:", "FIRST VIEWPORT:", "FORM:", "FINISH:"]
    has_direction_contract = all(k in raw_html for k in contract_keys)

    checks.append(
        {
            "check": "1. Main HTML & Direction Contract",
            "passed": fe_result["status_code"] == 200 and has_direction_contract,
            "details": {
                "engine": fe_result["mode"],
                "http_status": fe_result["status_code"],
                "title": fe_result["title"],
                "direction_contract_present": has_direction_contract,
                "button_count": fe_result["button_count"],
            },
        }
    )

    # 2. /api/ai/status endpoint check
    status_url = f"{base_url}/api/ai/status"
    try:
        st_code, st_json = fetch_json(status_url, method="GET")
        status_ok = (
            st_code == 200
            and st_json.get("ok") is True
            and "Google AI Ultra" in str(st_json.get("subscription", ""))
        )
        checks.append(
            {
                "check": "2. /api/ai/status (Google AI Ultra Subscription)",
                "passed": status_ok,
                "details": {
                    "http_status": st_code,
                    "ok": st_json.get("ok"),
                    "subscription": st_json.get("subscription"),
                    "dateCutoff": st_json.get("dateCutoff"),
                    "activeEngine": st_json.get("activeEngine"),
                    "cli": st_json.get("cli"),
                },
            }
        )
    except Exception as exc:
        checks.append(
            {
                "check": "2. /api/ai/status (Google AI Ultra Subscription)",
                "passed": False,
                "details": {"error": str(exc)},
            }
        )

    # 3. /api/ai/query endpoint check (DE + DA + BI structured Spanish response)
    query_url = f"{base_url}/api/ai/query"
    sample_payload = {
        "prompt": "¿Cómo afecta el tamaño de Row Group en Apache Iceberg v3 al análisis en DuckDB y a los KPIs en la Capa Semántica?",
        "moduleTitle": "Módulo 1 — Arquitectura Lakehouse & Formato Físico",
        "activeLens": "360",
        "engineMode": "fast",
        "simulatorState": {"rowGroupMB": 128, "compression": "ZSTD"},
        "relatedNodes": [
            {
                "discipline": "DE",
                "title": "Deletion Vectors en Iceberg v3",
                "connection": "Reduce amplificación de lectura para consultas DA y BI.",
            }
        ],
    }
    try:
        q_code, q_json = fetch_json(query_url, method="POST", payload=sample_payload)
        answer_text = str(q_json.get("answer", ""))
        has_de_da_bi = all(
            token in answer_text
            for token in ["Ingeniería de Datos", "Análisis de Datos", "Business Intelligence"]
        )
        query_ok = q_code == 200 and q_json.get("ok") is True and has_de_da_bi
        checks.append(
            {
                "check": "3. /api/ai/query (Structured Spanish DE + DA + BI Synthesis)",
                "passed": query_ok,
                "details": {
                    "http_status": q_code,
                    "ok": q_json.get("ok"),
                    "source": q_json.get("source"),
                    "has_de_da_bi_sections": has_de_da_bi,
                    "answer_preview": answer_text[:180].replace("\n", " ") + "...",
                },
            }
        )
    except Exception as exc:
        checks.append(
            {
                "check": "3. /api/ai/query (Structured Spanish DE + DA + BI Synthesis)",
                "passed": False,
                "details": {"error": str(exc)},
            }
        )

    all_passed = all(c["passed"] for c in checks)
    report = {
        "target_url": base_url,
        "all_passed": all_passed,
        "checks": checks,
    }

    print("=" * 72)
    print("DATA TRIAD STUDIO — PLATFORM VERIFICATION REPORT")
    print("=" * 72)
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print("=" * 72)

    return 0 if all_passed else 1


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Verify DATA TRIAD STUDIO web platform and AI endpoints.")
    parser.add_argument(
        "--url",
        default="http://127.0.0.1:5174",
        help="Base URL of the running application (default: http://127.0.0.1:5174)",
    )
    args = parser.parse_args()
    sys.exit(run_verification(args.url))


if __name__ == "__main__":
    main()
