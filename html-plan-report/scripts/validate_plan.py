#!/usr/bin/env python3
"""Check an HTML plan written with the html-plan-report skill. Standard library only.

Usage:
  python3 scripts/validate_plan.py plans/<task>.plan.html
      Run every check. Exit 0 when clean (warnings allowed), 1 when there are errors.
  python3 scripts/validate_plan.py plans/<task>.plan.html --questions
      Print the Claude Code AskUserQuestion payload(s), built from the page's undecided
      decisions, as JSON: {"prompts": [{"questions": [...]}, ...]}. Exit 1 if decisions are malformed.
  python3 scripts/validate_plan.py assets/plan-template.html --template
      Check a template: placeholders are expected, everything else is checked.
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
REQUIRED = {
    "full": ["decide", "tldr", "goals", "current", "approach", "steps", "files", "changes", "testing", "risks", "open"],
    "lite": ["tldr", "behaviour", "fix", "testing", "risks"],
}
BUILT = {"implemented", "implemented-deviations"}  # statuses that need a #deviations section
STATUSES = {"draft", "awaiting", "approved", "implemented", "implemented-deviations", "superseded"}
PLACEHOLDER = re.compile(r"\{\{[A-Z][A-Z0-9_]*\}\}")
REMOTE = re.compile(r"^\s*(https?:)?//", re.I)
CSS_REMOTE = re.compile(r"(url\(\s*['\"]?\s*(https?:)?//|@import\s+(url\()?\s*['\"]?\s*(https?:)?//)", re.I)
RESOURCE_ATTRS = {
    "script": ["src"], "img": ["src", "srcset"], "iframe": ["src"], "source": ["src", "srcset"],
    "video": ["src", "poster"], "audio": ["src"], "embed": ["src"], "object": ["data"],
    "image": ["href", "xlink:href"], "use": ["href", "xlink:href"], "track": ["src"],
}
MAX_BYTES = 150 * 1024


class Node:
    __slots__ = ("tag", "attrs", "children", "parent", "line", "text")

    def __init__(self, tag, attrs, parent, line):
        self.tag, self.attrs, self.parent, self.line = tag, attrs, parent, line
        self.children, self.text = [], []

    def classes(self):
        return set((self.attrs.get("class") or "").split())

    def walk(self):
        yield self
        for c in self.children:
            yield from c.walk()

    def find_all(self, pred):
        return [n for n in self.walk() if pred(n)]

    def get_text(self):
        parts = list(self.text)
        for c in self.children:
            parts.append(c.get_text())
        return " ".join(p for p in parts if p).strip()


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", {}, None, 1)
        self.stack = [self.root]
        self.styles = []  # (line, css text)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, {k: (v if v is not None else "") for k, v in attrs}, self.stack[-1], self.getpos()[0])
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        node = Node(tag, {k: (v if v is not None else "") for k, v in attrs}, self.stack[-1], self.getpos()[0])
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        if self.stack[-1].tag == "style":
            self.styles.append((self.getpos()[0], data))
        if data.strip():
            self.stack[-1].text.append(re.sub(r"\s+", " ", data.strip()))


class Report:
    def __init__(self):
        self.errors, self.warnings = [], []

    def error(self, msg, line=None, kind="general"):
        self.errors.append((line, msg, kind))

    def warn(self, msg, line=None):
        self.warnings.append((line, msg, "general"))

    def print(self, out=sys.stdout):
        for kind, items in (("ERROR", self.errors), ("WARN ", self.warnings)):
            for line, msg, _ in items:
                where = f" (line {line})" if line else ""
                print(f"{kind}  {msg}{where}", file=out)
        e, w = len(self.errors), len(self.warnings)
        if e:
            print(f"{e} error{'s' if e != 1 else ''}, {w} warning{'s' if w != 1 else ''}. Fix the errors and run again.", file=out)
        else:
            print(f"OK: no errors, {w} warning{'s' if w != 1 else ''}.", file=out)


def parse(path):
    raw = Path(path).read_text(encoding="utf-8")
    tb = TreeBuilder()
    tb.feed(raw)
    tb.close()
    return raw, tb


def template_kind(root):
    for m in root.find_all(lambda n: n.tag == "meta" and n.attrs.get("name") == "plan-template"):
        if m.attrs.get("content") in REQUIRED:
            return m.attrs["content"]
    return "full"


def decisions(root):
    return root.find_all(lambda n: "decision" in n.classes() and n.tag == "div")


def check_decision(d, report):
    did = d.attrs.get("data-id", "")
    if not re.fullmatch(r"D\d+", did):
        report.error(f"decision has data-id {did!r}; use D1, D2, …", d.line, kind="decision")
        return None
    if "data-decided" in d.attrs:
        if not d.find_all(lambda n: "decided" in n.classes()):
            report.error(f"{did} is marked data-decided but has no .decided block recording the choice", d.line, kind="decision")
        return None
    header = d.attrs.get("data-header", "").strip()
    if not header:
        report.error(f"{did} has no data-header; add a terminal label of 12 characters or fewer", d.line, kind="decision")
    elif len(header) > 12 and not PLACEHOLDER.fullmatch(header):
        report.error(f"{did} data-header {header!r} is {len(header)} characters; Claude Code allows 12", d.line, kind="decision")
    opts = d.find_all(lambda n: "opt" in n.classes())
    if not 2 <= len(opts) <= 4:
        report.error(f"{did} has {len(opts)} options; the terminal prompt needs 2 to 4", d.line, kind="decision")
    rec = []
    built = []
    for o in opts:
        label = o.attrs.get("data-label", "").strip()
        if not label:
            report.error(f"{did} has an option without data-label (the short name shown in the terminal)", o.line, kind="decision")
        inputs = o.find_all(lambda n: n.tag == "input")
        is_rec = any(i.attrs.get("data-recommended") == "1" for i in inputs)
        if is_rec:
            rec.append(o)
        smalls = o.find_all(lambda n: n.tag == "small")
        spans = o.find_all(lambda n: n.tag == "span")
        desc = (smalls[0].get_text() if smalls else (spans[0].get_text() if spans else "")).strip()
        built.append({"label": label, "description": desc[:200], "recommended": is_rec})
    if len(rec) != 1:
        report.error(f"{did} has {len(rec)} recommended options; mark exactly one with data-recommended=\"1\"", d.line, kind="decision")
    h3 = d.find_all(lambda n: n.tag == "h3")
    title = re.sub(rf"^{did}\s*[:.]\s*", "", h3[0].get_text()) if h3 else did
    return {"id": did, "header": header, "title": title, "options": built}


def run_checks(path, allow_placeholders=False):
    report = Report()
    raw, tb = parse(path)
    root = tb.root
    kind = template_kind(root)

    if not allow_placeholders:
        for i, line in enumerate(raw.splitlines(), 1):
            for m in PLACEHOLDER.finditer(line):
                report.error(f"placeholder {m.group(0)} left in the plan; replace it (show literal braces as &#123;&#123;)", i)

    for n in root.walk():
        for attr in RESOURCE_ATTRS.get(n.tag, []):
            v = n.attrs.get(attr, "")
            if v and any(REMOTE.match(part.strip().split(" ")[0]) for part in v.split(",")):
                report.error(f"remote resource <{n.tag} {attr}=\"{v[:60]}\">; inline it (data: URI) or remove it", n.line)
        if n.tag == "link" and REMOTE.match(n.attrs.get("href", "")):
            report.error(f"remote <link href=\"{n.attrs['href'][:60]}\">; plans load nothing from the network", n.line)
        if CSS_REMOTE.search(n.attrs.get("style", "")):
            report.error(f"remote url() in a style attribute on <{n.tag}>", n.line)
    for line, css in tb.styles:
        if CSS_REMOTE.search(css):
            report.error("remote url() or @import in <style>; plans load nothing from the network", line)

    ids = {}
    for n in root.walk():
        i = n.attrs.get("id")
        if i:
            if i in ids:
                report.error(f"duplicate id \"{i}\" (first at line {ids[i]})", n.line)
            else:
                ids[i] = n.line
    sections = {n.attrs["id"]: n for n in root.find_all(lambda n: n.tag == "section" and n.attrs.get("id"))}
    for sid in REQUIRED[kind]:
        if sid not in sections:
            report.error(f"missing <section id=\"{sid}\">; the {kind} template requires it (SKILL.md, What goes in each section)")
    version = next((n.attrs["data-version"] for n in root.walk() if "data-version" in n.attrs), "")
    if version.isdigit() and int(version) > 1:
        if "changelog" not in sections:
            report.error(f"version {version} needs a <section id=\"changelog\"> (markup in references/visual-guide.md)")
        if not root.find_all(lambda n: "changed" in n.classes() and "callout" in n.classes()):
            report.warn(f"version {version} has no \"What changed\" banner under the header")

    for svg in root.find_all(lambda n: n.tag == "svg"):
        if svg.attrs.get("aria-hidden") == "true" or (svg.parent and svg.parent.tag == "button"):
            continue
        has_title = any(c.tag == "title" for c in svg.children)
        if not (has_title or svg.attrs.get("aria-label")):
            report.error("diagram <svg> has no <title> or aria-label; screen readers get nothing", svg.line)
        if svg.attrs.get("role") != "img":
            report.warn("diagram <svg> should have role=\"img\"", svg.line)
        if svg.find_all(lambda n: n.tag == "marker"):
            report.warn("diagram defines its own <marker>; use the page's shared #arrowhead instead", svg.line)

    steps = root.find_all(lambda n: n.tag == "li" and n.attrs.get("data-step"))
    testing_text = sections["testing"].get_text() if "testing" in sections else ""
    seen = set()
    for s in steps:
        sid = s.attrs["data-step"]
        if not re.fullmatch(r"S\d+", sid):
            report.error(f"step id {sid!r} should look like S1, S2, …", s.line)
            continue
        if sid in seen:
            report.error(f"step id {sid} is used twice", s.line)
        seen.add(sid)
        if testing_text and not re.search(rf"\b{sid}\b", testing_text):
            report.error(f"step {sid} is not referenced in #testing; add the test that proves it", s.line)
    if kind == "full" and "steps" in sections and not steps:
        report.error("#steps has no <li data-step=\"S1\"> items; give each step an ID")

    status = root.find_all(lambda n: "status" in n.classes() and "badge" in n.classes())
    if len(status) != 1:
        report.error(f"expected one status badge (class=\"badge status\"), found {len(status)}")
    else:
        st = status[0].attrs.get("data-status", "")
        if st not in STATUSES:
            report.error(f"status {st!r} is not one of: {', '.join(sorted(STATUSES))}", status[0].line)
        elif st in BUILT and "deviations" not in sections:
            report.error(f"status {st!r} needs a <section id=\"deviations\"> (markup in references/visual-guide.md)", status[0].line)

    ds = decisions(root)
    dids = [d.attrs.get("data-id") for d in ds]
    for dup in {x for x in dids if x and dids.count(x) > 1}:
        report.error(f"decision {dup} appears more than once", kind="decision")
    open_ds = [x for x in (check_decision(d, report) for d in ds) if x]
    if len(open_ds) > 4:
        report.warn(f"{len(open_ds)} open decisions; the terminal prompt takes 4 at a time. Consider splitting the plan.")
    if kind == "full" and "decide" in sections and not ds and not sections["decide"].find_all(lambda n: "no-decisions" in n.classes()):
        report.error("#decide has no decisions and no <p class=\"no-decisions\"> note", kind="decision")

    external = root.find_all(lambda n: n.tag == "a" and REMOTE.match(n.attrs.get("href", "")))
    if external and "sources" not in sections:
        report.warn("the plan links to outside material but has no visible #sources section")

    if (Path(path).parent / "index.html").exists() and not root.find_all(lambda n: n.tag == "a" and "back" in n.classes()):
        report.warn("index.html sits next to this plan, but the plan has no \"← All plans\" link (a.back)")

    check_assets(path, root, tb, report, allow_placeholders)

    size = len(raw.encode("utf-8"))
    if size > MAX_BYTES:
        report.warn(f"file is {size // 1024} KB; move appendix material into <details> or trim")
    return report, open_ds


def check_assets(path, root, tb, report, template_mode):
    """Plans link the shared _assets/; standalone bundles inline them instead."""
    bundle = any(n.tag == "meta" and n.attrs.get("name") == "plan-bundle" for n in root.walk())
    css = any(n.tag == "link" and n.attrs.get("href") == "_assets/plan.css" for n in root.walk())
    js = any(n.tag == "script" and n.attrs.get("src") == "_assets/plan.js" for n in root.walk())
    legacy = any("--accent" in text and "--surface" in text for _, text in tb.styles)
    if bundle:
        if css or js:
            report.error("standalone bundle still links _assets/; rebuild it with scripts/bundle_plan.py")
        return
    if legacy and not css:
        report.error(f"plan still inlines the template's CSS and script; run scripts/update_index.py {Path(path).parent} --migrate")
        return
    if not css:
        report.error('missing <link rel="stylesheet" href="_assets/plan.css"> in <head>')
    if not js:
        report.error('missing <script src="_assets/plan.js"></script> in <head>')
    if legacy:
        report.warn("plan links _assets/ but also inlines the template's CSS; delete the inline <style>")
    if not template_mode and (css or js) and not (Path(path).parent / "_assets" / "plan.css").exists():
        report.warn(f"_assets/ is missing next to this plan; run scripts/update_index.py {Path(path).parent}")


GO_AHEAD = {
    "question": "Go ahead and build with these choices?",
    "header": "Go-ahead",
    "options": [
        {"label": "Approve and build", "description": "Record the choices in the plan, then start implementing."},
        {"label": "Revise the plan", "description": "Change the plan first. Nothing gets built yet."},
    ],
    "multiSelect": False,
}


def build_questions(open_ds):
    qs = []
    for d in open_ds:
        opts = sorted(d["options"], key=lambda o: not o["recommended"])
        qs.append({
            "question": f"{d['id']}: {d['title']} (compare the options under {d['id']} in the plan)",
            "header": d["header"],
            "options": [{"label": o["label"] + (" (Recommended)" if o["recommended"] else ""),
                         "description": o["description"]} for o in opts],
            "multiSelect": False,
        })
    prompts = [qs[i:i + 4] for i in range(0, len(qs), 4)] or [[]]
    if len(prompts[-1]) < 4:
        prompts[-1].append(GO_AHEAD)
    else:
        prompts.append([GO_AHEAD])
    return {"prompts": [{"questions": p} for p in prompts]}


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    flags = {a for a in argv if a.startswith("--")}
    if len(args) != 1 or flags - {"--questions", "--template"}:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    path = args[0]
    if not Path(path).is_file():
        print(f"ERROR  no such file: {path}", file=sys.stderr)
        return 2
    report, open_ds = run_checks(path, allow_placeholders="--template" in flags)
    if "--questions" in flags:
        decision_errors = [e for e in report.errors if e[2] == "decision"]
        if decision_errors:
            r = Report()
            r.errors = decision_errors
            r.print(sys.stderr)
            return 1
        print(json.dumps(build_questions(open_ds), indent=2, ensure_ascii=False))
        return 0
    report.print()
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
