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
PUBLIC_PAGES = ("en", "zh", "en/research-engineering", "zh/research-engineering")
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


def render_case_studies():
    template = (ROOT / "case-study-template.html").read_text()
    studies = json.loads((ROOT / "case-studies.json").read_text())
    generated = []
    for study in studies.values():
        for language in ("en", "zh"):
            copy = study[language]
            path = f"{language}/work/{study['slug']}"
            canonical = f"{BASE}/{path}/"
            other = "zh" if language == "en" else "en"
            other_path = f"{other}/work/{study['slug']}"
            links = "".join(
                f'<a class="text-link" href="{html.escape(link["href"], quote=True)}">{html.escape(link["label"])} ↗</a>'
                for link in copy["links"]
            )
            stack = "".join(f'<span class="skill-tag">{html.escape(item)}</span>' for item in copy["stack"])
            metrics = "".join(
                f'<div><strong>{html.escape(item["value"])}</strong><span>{html.escape(item["label"])}</span></div>'
                for item in copy["metrics"]
            )
            sections = "".join(
                '<section class="case-section">'
                f'<h2>{html.escape(section["title"])}</h2>'
                + "".join(f'<p>{html.escape(paragraph)}</p>' for paragraph in section["paragraphs"])
                + '</section>'
                for section in copy["sections"]
            )
            entity = {
                "@type": "SoftwareSourceCode",
                "name": copy["title"].split("—")[0].strip(),
                "description": copy["description"],
                "url": canonical,
                "codeRepository": study["repository"],
                "author": {"@id": f"{BASE}/#person"},
            }
            schema = {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "url": canonical,
                "name": copy["title"],
                "description": copy["description"],
                "inLanguage": "zh-Hans" if language == "zh" else "en",
                "breadcrumb": {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "name": "Jiachen Xie", "item": f"{BASE}/{language}/"},
                        {"@type": "ListItem", "position": 2, "name": "Work" if language == "en" else "作品", "item": f"{BASE}/{language}/#work"},
                        {"@type": "ListItem", "position": 3, "name": entity["name"], "item": canonical},
                    ],
                },
                "mainEntity": entity,
            }
            tokens = {
                "lang": "zh-Hans" if language == "zh" else "en",
                "title": copy["title"], "description": copy["description"],
                "canonical": canonical,
                "englishUrl": f"{BASE}/en/work/{study['slug']}/",
                "chineseUrl": f"{BASE}/zh/work/{study['slug']}/",
                "socialImage": f"{BASE}/assets/social-card.png",
                "jsonLd": json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c"),
                "backHref": f"/{language}/research-engineering/",
                "backLabel": "← Research engineering" if language == "en" else "← 研究工程作品",
                "languageHref": f"/{other_path}/",
                "languageLang": "zh-Hans" if language == "en" else "en",
                "languageLabel": "简体中文" if language == "en" else "English",
                "kicker": copy["kicker"], "headline": copy["headline"], "summary": copy["summary"],
                "links": links,
                "image": study["image"], "imageAlt": copy["imageAlt"],
                "roleLabel": "ROLE" if language == "en" else "职责", "role": copy["role"],
                "stackLabel": "TECHNOLOGIES" if language == "en" else "技术", "stack": stack,
                "metricsLabel": "Key results" if language == "en" else "关键结果", "metrics": metrics,
                "sections": sections, "methodTitle": copy["methodTitle"], "method": copy["method"],
            }
            output = template
            for key, value in tokens.items():
                replacement = value if key in {"links", "stack", "metrics", "sections", "jsonLd"} else html.escape(str(value), quote=True)
                output = output.replace("{{" + key + "}}", replacement)
            assert "{{" not in output, f"Unresolved case template token: {path}"
            directory = ROOT / path
            directory.mkdir(parents=True, exist_ok=True)
            (directory / "index.html").write_text(output)
            generated.append(path)
    return generated


PUBLIC_PAGES += tuple(render_case_studies())

for language in ("en", "zh"):
    directory = ROOT / language
    directory.mkdir(exist_ok=True)
    (directory / "index.html").write_text(render(language))

(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")
(ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{BASE}/{path}/</loc></url>\n" for path in PUBLIC_PAGES) + "</urlset>\n")

for path in PUBLIC_PAGES:
    output = Page((ROOT / path / "index.html").read_text())
    for record in output.records:
        for attr in ("href", "src"):
            value = record["attrs"].get(attr, "")
            target = urlsplit(value)
            if value and not target.scheme and target.path:
                assert target.path.startswith("/"), f"Relative asset would break language pages: {value}"
                assert (ROOT / target.path.lstrip("/")).exists(), f"Missing local target: {value}"
print("Generated /en/, /zh/, robots.txt and sitemap.xml; translations, HTML and local links checked.")
