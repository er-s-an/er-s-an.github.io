#!/usr/bin/env python3
"""Render both languages from index.html and i18n.js using the standard library."""
import copy
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
BASE = "https://er-s-an.github.io"
source = (ROOT / "index.html").read_text()
translations = (ROOT / "i18n.js").read_text().split("const chineseCopy = ", 1)[1].split("\n};", 1)[0]
chinese = json.loads(translations + "\n}")
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
MARKERS = {"data-i18n": None, "data-i18n-aria": "aria-label", "data-i18n-content": "content"}
BRAND = {"brand-name": "name", "brand-role": "role", "brand-note": "note"}


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.offsets = [0]
        for line in text.splitlines(keepends=True):
            self.offsets.append(self.offsets[-1] + len(line))
        self.records, self.stack = [], []
        self.feed(text)
        assert not self.stack, "Unclosed HTML elements"

    def position(self):
        line, column = self.getpos()
        return self.offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        raw = self.get_starttag_text()
        record = {"tag": tag, "attrs": dict(attrs), "raw": raw, "start": self.position(), "inner": self.position() + len(raw)}
        self.records.append(record)
        if tag not in VOID:
            self.stack.append(record)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.stack.pop()["end"] = self.position() + len(self.get_starttag_text())

    def handle_endtag(self, tag):
        record = self.stack.pop()
        assert record["tag"] == tag, f"Mismatched HTML: {record['tag']} / {tag}"
        record["end"] = self.position()


def attribute(raw, name, value):
    pattern = rf'(\s{re.escape(name)}=")[^"]*"'
    result, count = re.subn(pattern, lambda match: match[1] + html.escape(value, quote=True) + '"', raw)
    assert count == 1, f"Missing or duplicate {name}: {raw}"
    return result


page = Page(source)
english = {}
for record in page.records:
    for marker, attr in MARKERS.items():
        key = record["attrs"].get(marker)
        if key:
            assert isinstance(chinese.get(key), str), f"Missing Chinese translation: {key}"
            english[f"{marker}:{key}"] = record["attrs"][attr] if attr else source[record["inner"]:record["end"]]
schema_record = next(record for record in page.records if record["attrs"].get("id") == "profile-schema")
schema = json.loads(source[schema_record["inner"]:schema_record["end"]])


def render(language):
    url = f"{BASE}/{language}/"
    changes = []
    for record in page.records:
        attrs, raw = record["attrs"], record["raw"]
        for marker, attr in MARKERS.items():
            key = attrs.get(marker)
            if key and language == "zh":
                if attr:
                    raw = attribute(raw, attr, chinese[key])
                else:
                    changes.append((record["inner"], record["end"], chinese[key]))
        if attrs.get("id") in BRAND and language == "zh":
            changes.append((record["inner"], record["end"], html.escape(chinese[f"brand.makebook.{BRAND[attrs['id']]}"])))
        if record["tag"] == "html":
            raw = attribute(raw, "lang", "zh-Hans" if language == "zh" else "en")
        if attrs.get("rel") == "canonical":
            raw = attribute(raw, "href", url)
        if attrs.get("property") == "og:url":
            raw = attribute(raw, "content", url)
        if attrs.get("property") in ("og:locale", "og:locale:alternate"):
            selected = language if attrs["property"] == "og:locale" else ("en" if language == "zh" else "zh")
            raw = attribute(raw, "content", "zh_CN" if selected == "zh" else "en_US")
        if "data-language" in attrs:
            raw = attribute(raw, "aria-current", "page" if attrs["data-language"] == language else "false")
        if raw != record["raw"]:
            changes.append((record["start"], record["inner"], raw))
    profile = copy.deepcopy(schema)
    profile.update({"@id": url + "#profile", "url": url, "inLanguage": "zh-Hans" if language == "zh" else "en"})
    for field, key in (("name", "page.title"), ("description", "page.description")):
        profile[field] = chinese[key] if language == "zh" else html.unescape(english[f"data-i18n{'-content' if field == 'description' else ''}:{key}"])
    profile["mainEntity"]["description"] = chinese["page.social"] if language == "zh" else english["data-i18n-content:page.social"]
    changes.append((schema_record["inner"], schema_record["end"], "\n" + json.dumps(profile, ensure_ascii=False, indent=2).replace("<", "\\u003c") + "\n  "))
    end = 0
    for start, stop, value in sorted(changes):
        assert end <= start <= stop, "Overlapping HTML replacements"
        end = stop
    result = source
    for start, stop, value in sorted(changes, reverse=True):
        result = result[:start] + value + result[stop:]
    if language == "zh":
        payload = json.dumps(english, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
        result = result.replace("</head>", f'<script type="application/json" id="english-copy">{payload}</script>\n</head>')
    return result


for language in ("en", "zh"):
    directory = ROOT / language
    directory.mkdir(exist_ok=True)
    (directory / "index.html").write_text(render(language))

(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")
(ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{BASE}/{language}/</loc></url>\n" for language in ("en", "zh")) + "</urlset>\n")

for language in ("en", "zh"):
    output = Page((ROOT / language / "index.html").read_text())
    for record in output.records:
        for attr in ("href", "src"):
            value = record["attrs"].get(attr, "")
            target = urlsplit(value)
            if value and not target.scheme and target.path:
                assert target.path.startswith("/"), f"Relative asset would break language pages: {value}"
                assert (ROOT / target.path.lstrip("/")).exists(), f"Missing local target: {value}"
print("Generated /en/, /zh/, robots.txt and sitemap.xml; translations, HTML and local links checked.")
