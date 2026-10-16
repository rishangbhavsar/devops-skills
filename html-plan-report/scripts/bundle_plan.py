#!/usr/bin/env python3
"""Make one plan shareable as a single file. Standard library only.

Usage:
  python3 scripts/bundle_plan.py .plan/<task>.plan.html [-o OUT.html]

Inlines the plan's _assets/plan.css and _assets/plan.js and drops the "← All plans" link, writing
<task>.standalone.html next to the plan (the index ignores it). Use it to email, attach or upload
a plan; inside the repo, plans keep linking the shared _assets/.
"""
import re
import sys
from pathlib import Path

CSS_LINK = re.compile(r'<link rel="stylesheet" href="_assets/plan\.css">\n?')
JS_LINK = re.compile(r'<script src="_assets/plan\.js"( defer)?></script>\n?')
BACK = re.compile(r'\s*<a class="back" href="index\.html">[^<]*</a>')


def bundle(plan: Path, out: Path):
    s = plan.read_text(encoding="utf-8")
    assets = plan.parent / "_assets"
    css, js = assets / "plan.css", assets / "plan.js"
    for f in (css, js):
        if not f.exists():
            raise SystemExit(f"ERROR  {f} is missing; run scripts/update_index.py {plan.parent} first")
    if not CSS_LINK.search(s) or not JS_LINK.search(s):
        raise SystemExit("ERROR  this plan does not link _assets/plan.css and _assets/plan.js; nothing to bundle")
    # The functions keep "\" sequences in the assets from being read as regex escapes.
    s = CSS_LINK.sub(lambda m: "<style>\n" + css.read_text(encoding="utf-8") + "</style>\n", s, count=1)
    s = JS_LINK.sub(lambda m: "<script>\n" + js.read_text(encoding="utf-8") + "</script>\n", s, count=1)
    s = BACK.sub("", s, count=1)
    s = s.replace("<head>", '<head>\n<meta name="plan-bundle" content="standalone">', 1)
    out.write_text(s, encoding="utf-8")
    return out


def main(argv):
    args = [a for a in argv if a != "-o"]
    out = None
    if "-o" in argv:
        i = argv.index("-o")
        if i + 1 >= len(argv):
            print("ERROR  -o needs a file name", file=sys.stderr)
            return 2
        out = Path(argv[i + 1])
        args = argv[:i] + argv[i + 2:]
    if len(args) != 1 or args[0].startswith("-"):
        print(__doc__.strip(), file=sys.stderr)
        return 2
    plan = Path(args[0])
    if not plan.is_file():
        print(f"ERROR  no such file: {plan}", file=sys.stderr)
        return 2
    out = out or plan.with_name(plan.name.replace(".plan.html", ".standalone.html"))
    print(bundle(plan, out))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
