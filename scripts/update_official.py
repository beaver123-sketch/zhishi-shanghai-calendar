#!/usr/bin/env python3
"""Read public notices from official Shanghai cultural bureau list pages.

Only creates *leads*: does not infer exhibition dates, ticket availability, etc.
Failures preserve last successful lead snapshot and are visible to the UI.
No external packages needed. Intended for GitHub Actions scheduled updates.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "site" / "data"
SOURCES = [
    ("上海市文化和旅游局 · 艺术活动", "https://whlyj.sh.gov.cn/yshd/"),
    ("上海市文化和旅游局 · 文旅要闻", "https://whlyj.sh.gov.cn/wlyw/index.html"),
    ("上海市文化和旅游局 · 各区风采", "https://whlyj.sh.gov.cn/gqfc/index.html"),
    ("上海市文化和旅游局 · 便民信息", "https://whlyj.sh.gov.cn/bmxx/index.html"),
]
# Broad but relevant. Fail-closed: this only creates official article links and
# NEVER turns article titles into a date-confirmed event without review.
KEYWORDS = ("演出", "音乐", "艺术", "展览", "展", "音乐剧", "演唱会", "文化", "节庆", "节日", "节", "公园", "花", "市集", "迪士尼", "旅游", "快闪", "活动", "巡游", "夜游", "博物馆", "露营", "打卡")
VALID_PATH = re.compile(r"/([a-zA-Z0-9_]+)/(?P<pub>20\d{6})/[0-9a-zA-Z-]+\.html$")
SH = ZoneInfo("Asia/Shanghai")


class AnchorExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items = []
        self.anchor = None
        self.ignore_depth = 0

    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        if tag in ("script", "style"):
            self.ignore_depth += 1
        if tag == "a" and self.ignore_depth == 0:
            self.anchor = {"href": props.get("href", ""), "title": props.get("title", ""), "text": []}

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.ignore_depth = max(0, self.ignore_depth - 1)
        if tag == "a" and self.anchor:
            self.items.append(self.anchor)
            self.anchor = None

    def handle_data(self, data):
        if self.anchor is not None and not self.ignore_depth:
            self.anchor["text"].append(data)


def read_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def fetch(url: str) -> str:
    # Only URLs hardcoded in SOURCES; no user-provided remote input.
    request = Request(url, headers={
        "User-Agent": "ZhiShi-Shanghai-Calendar/1.0 (public municipal activity notice reader; non-commercial)",
        "Accept": "text/html,application/xhtml+xml",
    })
    with urlopen(request, timeout=22) as response:
        raw = response.read(1_600_000)
        ct = response.headers.get_content_charset()
    # Municipal gov pages may be UTF-8 or GB18030.
    if ct:
        try:
            return raw.decode(ct, errors="replace")
        except LookupError:
            pass
    for enc in ("utf-8", "gb18030"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            pass
    return raw.decode("utf-8", errors="replace")


def extract(html: str, source_url: str, publisher: str, today: dt.date) -> list[dict]:
    parser = AnchorExtractor()
    parser.feed(html)
    result = []
    for anchor in parser.items:
        href = urljoin(source_url, anchor["href"])
        parsed = urlparse(href)
        if parsed.scheme != "https" or parsed.netloc != "whlyj.sh.gov.cn":
            continue
        found = VALID_PATH.search(parsed.path)
        if not found:
            continue
        published_raw = found.group("pub")
        try:
            published = dt.datetime.strptime(published_raw, "%Y%m%d").date()
        except ValueError:
            continue
        if not (today - dt.timedelta(days=90) <= published <= today + dt.timedelta(days=1)):
            continue
        title = " ".join((anchor.get("title") or "").strip().split())
        displayed = " ".join(" ".join(anchor.get("text") or []).split())
        if len(title) < 8:
            title = displayed
        if not (9 <= len(title) <= 150 and any(k in title for k in KEYWORDS)):
            continue
        # Ignore truncated titles as a reliable synopsis only; the original article remains linked.
        if title.endswith("...") or title.endswith("…"):
            continue
        normalized_url = f"https://{parsed.netloc}{parsed.path}"
        result.append({
            "id": hashlib.sha256(normalized_url.encode()).hexdigest()[:16],
            "title": title,
            "url": normalized_url,
            "publishedAt": published.isoformat(),
            "publisher": publisher,
            "verification": "官方资讯线索，日期与场次待核实",
        })
    return result


def run(live: bool = True, pages: dict[str, str] | None = None) -> dict:
    now = dt.datetime.now(SH)
    today = now.date()
    checked_at = now.isoformat(timespec="seconds")
    previous = read_json(DATA / "leads.json", {"items": [], "checkedAt": None})
    retained = {x.get("id"): x for x in previous.get("items", []) if x.get("id")}
    new_items = {}
    success, failed = [], []
    for label, url in SOURCES:
        try:
            html = fetch(url) if live else (pages or {})[url]
            records = extract(html, url, label, today)
            # Empty result may mean markup changed and would be suspicious; preserve old data.
            if not records:
                raise ValueError("未识别到近期有效资讯链接；可能是页面结构改变或当前无更新")
            success.append({"source": label, "count": len(records)})
            for item in records:
                new_items[item["id"]] = item
        except (KeyError, HTTPError, URLError, OSError, ValueError, TimeoutError) as error:
            failed.append({"source": label, "error": str(error)[:180]})
    # Retain prior items on network outages, within the same 90-day publication window.
    cutoff = today - dt.timedelta(days=90)
    keep = [x for x in {**retained, **new_items}.values()
            if x.get("publishedAt") and x["publishedAt"] >= cutoff.isoformat()]
    keep.sort(key=lambda x: (x.get("publishedAt", ""), x["id"]), reverse=True)
    # Update checkedAt only when at least one source completed successfully.
    snapshot = {"schemaVersion": 1, "checkedAt": checked_at if success else previous.get("checkedAt"),
                "items": keep[:100]}
    status = {"checkedAt": checked_at, "success": success, "failed": failed,
              "note": "已爬取资讯只用于线索；具体日期、演出场次和售票状态必须另外核实。"}
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / "leads.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DATA / "update-status.json").write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"success": success, "failed": failed, "leads": len(keep)}


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true", help="Do not fetch and write")
    opt = p.parse_args()
    if opt.dry_run:
        print("Sources: ", *[s[1] for s in SOURCES], sep="\n- ")
    else:
        print(json.dumps(run(), ensure_ascii=False, indent=2))
