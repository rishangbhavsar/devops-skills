# Visual guide for plan pages

Read this before adding an optional section, a large-change block or a diagram. Everything here uses the CSS already in the templates; never add colours, fonts or libraries.

## Contents
1. Conventions
2. Optional sections and blocks
3. Diagram rules and sizing
4. Recipes: flow, layered architecture, two-lane sequence, impact map
5. Animation: flowing arrows

## 1. Conventions

- Colours come only from the CSS variables (`--text`, `--muted`, `--accent`, `--accent-soft`, `--ok`, `--warn`, `--risk`, `--line` …). A hard-coded colour breaks light, dark or print.
- Badges always carry a word, never colour alone: `Low`, `new`, `verified`, `Decided`. `badge acc` is the neutral accent pill, for phase labels.
- Tables sit inside `<div class="table-wrap" role="region" aria-labelledby="CAPTION_ID" tabindex="0">` with a `<caption>`, a `<thead>` and `scope="col"` on header cells. Never set `display` on the table itself.
- Callouts the template does not show: `.callout.blocker` for something that stops work, `.callout.note` for something easy to miss.
- Code: give the block a language, `<pre><code class="language-yaml">` (`json`, `toml`, `yaml`, `bash`, `python`, `typescript`, `sql`…); `plan.js` loads highlight.js from cdnjs and colours keys, strings, numbers, keywords and comments in both themes, and offline the code stays plain text. Write comments as plain text in the language, not spans. Blocks that carry their own markup, a diff with `<span class="del">`/`<span class="add">` lines or a file tree with `<span class="c"># purpose</span>` notes, take `class="nohighlight"`. Annotate config and usage examples with trailing comments rather than prose underneath.
- Linear paths use flow chips (`.flow`, as in the template); mark the new piece with `class="new"`. Use an SVG only when the shape is not a line.

## 2. Optional sections and blocks

Insert sections in this order relative to the required ones: Phases after Proposed approach; Rollout after Assumptions and open questions; Deviation log and Changelog last, before Sources.

**Phases** (`<section id="phases">`), when the work spans more than one delivery. The third column is often the best non-goals list.

```html
<section id="phases">
  <h2>Phases</h2>
  <div class="phases">
    <div class="phase now"><span class="badge acc">Phase 1: this plan</span><ul><li>…</li></ul></div>
    <div class="phase"><span class="badge warn">Phase 2: when needed</span><ul><li>…</li></ul></div>
    <div class="phase"><span class="badge info">Later or never</span><ul><li>…</li></ul></div>
  </div>
</section>
```

**Rollout and rollback** (`<section id="rollout">`), only when the change is deployed in stages, migrates data, sits behind a flag, or cannot be undone by a revert: `<h2>Rollout and rollback</h2>` and a short paragraph or list.

**Deviation log** (`<section id="deviations">`), added when building starts; required once the status is `implemented` or `implemented-deviations`.

```html
<section id="deviations">
  <h2>Deviation log</h2>
  <div class="table-wrap" role="region" aria-labelledby="cap-dev" tabindex="0"><table>
    <caption id="cap-dev">Where the build departed from the plan, recorded as it happened</caption>
    <thead><tr><th scope="col">Step</th><th scope="col">Planned</th><th scope="col">Actual</th><th scope="col">Why</th></tr></thead>
    <tbody><tr><td>S2</td><td>…</td><td>…</td><td>…</td></tr></tbody>
  </table></div>
</section>
```
With no deviations, use `<p>None.</p>` instead of the table.

**Changelog** (`<section id="changelog">`), from version 2 on, together with the "What changed" banner under the header:

```html
<section id="changelog">
  <h2>Changelog</h2>
  <div class="table-wrap" role="region" aria-labelledby="cap-log" tabindex="0"><table>
    <caption id="cap-log">Versions of this plan, newest first</caption>
    <thead><tr><th scope="col">Version</th><th scope="col">Date</th><th scope="col">Change</th></tr></thead>
    <tbody><tr><td>2</td><td>…</td><td>…</td></tr><tr><td>1</td><td>…</td><td>Initial plan</td></tr></tbody>
  </table></div>
</section>
```

**Capability matrix**, under Key changes when behaviour varies by type or mode: one row per mode, one column per type, cells `<span class="badge ok">yes</span>` or `<span class="badge risk">no</span>` plus a few words.

**New surfaces**, under Key changes for additive features, where a contract table's "Before" column would be empty: one row per route, CLI command, UI pane or config key, with its behaviour and the step that adds it.

**File tree**, in the File change map when most files are new: `<pre><code>` with the tree and a trailing `<span class="c"># purpose</span>` on each line, before the table of edited files.

**Patterns** (large changes): one row per repeated edit.

```html
<h3>Patterns</h3>
<div class="table-wrap" role="region" aria-labelledby="cap-patterns" tabindex="0"><table>
  <caption id="cap-patterns">Repeated edits, described once</caption>
  <thead><tr><th scope="col">ID</th><th scope="col">Before</th><th scope="col">After</th><th scope="col">Count and where</th><th scope="col">How</th><th scope="col">Step</th></tr></thead>
  <tbody><tr><td>P1</td><td><code>api.get('/users/' + id)</code></td><td><code>sdk.users.get(id)</code></td><td>21 call sites in web/pages</td><td>Codemod</td><td>S6</td></tr></tbody>
</table></div>
```

**Riskiest snippets** (large changes): at most three, 15 lines or fewer each, each tied to a risk row.

```html
<h3>Riskiest snippets</h3>
<p>Retries move from the client into the SDK, so a timeout now retries twice (risk: duplicate writes).</p>
<pre><code>…at most 15 lines…</code></pre>
```

For a large file map, group rows by module and put rows past about 15 inside `<details><summary>Remaining 24 files</summary>…</details>`.

## 3. Diagram rules and sizing

- Draw only what prose and flow chips cannot carry: branches, layers, two actors, where a big change lands. One idea per diagram; at most about eight boxes.
- Every diagram: `<figure><svg viewBox="0 0 860 H" role="img" aria-labelledby="X-t X-d"><title id="X-t">…</title><desc id="X-d">…</desc> … </svg><figcaption>…</figcaption></figure>`. IDs must be unique on the page.
- Arrows: `<path class="arrow" d="…"/>`. The page defines one shared `#arrowhead` marker; never add your own `<marker>`. Use straight or right-angle paths (`H`, `V`), end them 2 units before the box edge, and route them through empty corridors so they never cross text.
- Boxes: `class="box"`; add `accent` for the new or changed thing, `dashed` for optional or fallback, and `chg-new`, `chg-edit`, `chg-del` in impact maps. Always `rx="8"`.
- Text: main labels are 13px (about 7.2 units per character), sub-labels use `class="sub"` at 11px (about 6.2 units per character).
  - **Box width = max(main characters × 7.2, sub characters × 6.2) + 28.** Round up to a multiple of 10.
  - Height 48 for one line; 48–64 for a label plus one or two sub-lines. Baselines: main at top + 20, sub-lines at top + 37 and top + 52.
  - Leave at least 24 units between boxes that an arrow joins.
- If a label does not fit, shorten it before widening the box; move detail into the figcaption or the text.
- Diagrams keep a 640px minimum width and scroll inside their figure on phones, so do not shrink text to fit.

## 4. Recipes

Copy the recipe closest to what you need, then change labels and coordinates using the sizing rule above.

### Left-to-right flow

Use for a pipeline or request path. Four boxes of 170 units; labels up to about 19 characters, sub-labels up to about 23.

```html
<figure>
  <svg viewBox="0 0 860 110" role="img" aria-labelledby="flow-t flow-d">
    <title id="flow-t">Export request flow</title>
    <desc id="flow-d">The reports page calls the export endpoint, which reads the nightly snapshot and streams a CSV file back.</desc>
    <rect class="box" x="10" y="30" width="170" height="52" rx="8"/><text x="24" y="50">Reports page</text><text class="sub" x="24" y="67">button, S2</text>
    <rect class="box accent" x="233" y="30" width="170" height="52" rx="8"/><text x="247" y="50">Export endpoint</text><text class="sub" x="247" y="67">new, S1</text>
    <rect class="box" x="456" y="30" width="170" height="52" rx="8"/><text x="470" y="50">Nightly snapshot</text><text class="sub" x="470" y="67">read only</text>
    <rect class="box" x="679" y="30" width="170" height="52" rx="8"/><text x="693" y="50">CSV download</text><text class="sub" x="693" y="67">streamed</text>
    <path class="arrow" d="M180,56 H231"/><path class="arrow" d="M403,56 H454"/><path class="arrow" d="M626,56 H677"/>
  </svg>
  <figcaption>The only new piece is the endpoint.</figcaption>
</figure>
```

### Layered architecture

Use to show where a change sits in the stack. Row names sit on the left; arrows run down.

```html
<figure>
  <svg viewBox="0 0 860 290" role="img" aria-labelledby="layers-t layers-d">
    <title id="layers-t">Where the export lives in the stack</title>
    <desc id="layers-d">Browser, server and storage layers. The export button and endpoint are new; the archive is optional.</desc>
    <text class="sub" x="10" y="52">Browser</text><text class="sub" x="10" y="152">Server</text><text class="sub" x="10" y="252">Storage</text>
    <rect class="box" x="110" y="20" width="220" height="56" rx="8"/><text x="124" y="53">Reports page</text>
    <rect class="box accent" x="360" y="20" width="220" height="56" rx="8"/><text x="374" y="53">Export button</text>
    <rect class="box" x="110" y="120" width="220" height="56" rx="8"/><text x="124" y="153">GET /reports</text>
    <rect class="box accent" x="360" y="120" width="220" height="56" rx="8"/><text x="374" y="153">GET /reports/export.csv</text>
    <rect class="box" x="110" y="220" width="220" height="56" rx="8"/><text x="124" y="253">reports table</text>
    <rect class="box" x="360" y="220" width="220" height="56" rx="8"/><text x="374" y="253">nightly snapshot</text>
    <rect class="box dashed" x="610" y="220" width="220" height="56" rx="8"/><text x="624" y="253">S3 archive (optional)</text>
    <path class="arrow" d="M220,76 V118"/><path class="arrow" d="M470,76 V118"/>
    <path class="arrow" d="M220,176 V218"/><path class="arrow" d="M470,176 V218"/>
    <path class="arrow dashed" d="M580,248 H608"/>
  </svg>
  <figcaption>New pieces are outlined in the accent colour.</figcaption>
</figure>
```

### Two-lane sequence

Use when two actors take turns (client and server, user and agent). Boxes alternate lanes. Where two arrows meet the same box, one enters above its middle and the other leaves below it, so they never share a segment.

```html
<figure>
  <svg viewBox="0 0 860 310" role="img" aria-labelledby="seq-t seq-d">
    <title id="seq-t">Export handshake between browser and server</title>
    <desc id="seq-d">The browser requests an export, the server checks permissions, the browser shows progress, and the server streams the file.</desc>
    <text x="210" y="28" text-anchor="middle">Browser</text><text x="650" y="28" text-anchor="middle">Server</text>
    <g><rect class="box" x="40" y="50" width="340" height="46" rx="8"/><text x="54" y="70">1. Request the export</text><text class="sub" x="54" y="87">POST /reports/export</text></g>
    <g><path class="arrow" d="M380,73 H420 V128 H478"/><rect class="box accent" x="480" y="116" width="340" height="46" rx="8"/><text x="494" y="136">2. Check permissions</text><text class="sub" x="494" y="153">new guard, S3</text></g>
    <g><path class="arrow" d="M480,150 H440 V196 H382"/><rect class="box" x="40" y="182" width="340" height="46" rx="8"/><text x="54" y="202">3. Show progress</text><text class="sub" x="54" y="219">polls every 2 seconds</text></g>
    <g><path class="arrow" d="M380,214 H420 V271 H478"/><rect class="box" x="480" y="248" width="340" height="46" rx="8"/><text x="494" y="268">4. Stream the file</text><text class="sub" x="494" y="285">chunked, gzip</text></g>
  </svg>
  <figcaption>The handshake, in order.</figcaption>
</figure>
```

### Impact map (large changes)

The first large-change block. One box per module: name, change type, file count and step on the sub-line; the change type is also written out, not shown by colour alone.

```html
<figure>
  <svg viewBox="0 0 860 250" role="img" aria-labelledby="impact-t impact-d">
    <title id="impact-t">Where the SDK migration lands</title>
    <desc id="impact-d">Web pages are edited in 21 files by one pattern, the old API client is deleted, a generated SDK is new, the OpenAPI spec is edited, and a CI codegen job is new.</desc>
    <rect class="box chg-edit" x="20" y="30" width="190" height="64" rx="8"/><text x="36" y="54">web/pages</text><text class="sub" x="36" y="71">edit, 21 files, S6</text><text class="sub" x="36" y="86">one pattern, 21 times</text>
    <rect class="box chg-del" x="20" y="150" width="190" height="64" rx="8"/><text x="36" y="174">web/api-client</text><text class="sub" x="36" y="191">delete, 9 files, S7</text><text class="sub" x="36" y="206">after the last caller</text>
    <rect class="box chg-new" x="330" y="90" width="190" height="64" rx="8"/><text x="346" y="114">sdk/ (generated)</text><text class="sub" x="346" y="131">new, 7 files, S2</text><text class="sub" x="346" y="146">never edited by hand</text>
    <rect class="box chg-edit" x="640" y="30" width="190" height="64" rx="8"/><text x="656" y="54">server/openapi.yaml</text><text class="sub" x="656" y="71">edit, 1 file, S1</text><text class="sub" x="656" y="86">3 endpoints change</text>
    <rect class="box chg-new" x="640" y="150" width="190" height="64" rx="8"/><text x="656" y="174">ci/codegen.yml</text><text class="sub" x="656" y="191">new, 1 file, S3</text><text class="sub" x="656" y="206">fails on drift</text>
    <path class="arrow" d="M210,62 L328,112"/><text class="sub" x="262" y="76" text-anchor="middle">now calls</text>
    <path class="arrow dashed" d="M210,182 L328,134"/><text class="sub" x="262" y="182" text-anchor="middle">replaced by</text>
    <path class="arrow" d="M640,62 L522,112"/><text class="sub" x="598" y="76" text-anchor="middle">generates</text>
    <path class="arrow" d="M640,182 L522,134"/><text class="sub" x="590" y="200" text-anchor="middle">runs codegen</text>
    <rect class="box chg-new" x="300" y="228" width="14" height="14" rx="3"/><text class="sub" x="320" y="239">new</text>
    <rect class="box chg-edit" x="370" y="228" width="14" height="14" rx="3"/><text class="sub" x="390" y="239">edit</text>
    <rect class="box chg-del" x="440" y="228" width="14" height="14" rx="3"/><text class="sub" x="460" y="239">delete</text>
  </svg>
  <figcaption>39 files of change in one picture; the riskiest snippets go underneath.</figcaption>
</figure>
```

## Hover and focus highlight (automatic)

Every diagram highlights on hover or keyboard focus: point at a box and it, its arrows and the boxes at their other ends stay lit while the rest dims; point at an arrow to light it and its two boxes. No markup is needed. `plan.js` reads `rect.box` and `.arrow` (path or line) and connects an arrow to the boxes its first and last points are within 10px of. While an arrow is lit, small dots travel along it in its direction (one per ~150px, none when the reader prefers reduced motion). To keep a diagram interactive, end arrows at box edges (the recipes do) and keep coordinates in plain, untransformed SVG (a `g[transform]` disables it).

## 5. Animation: flowing arrows

Motion is for explaining direction, never decoration. Nothing moves on its own; reduced-motion settings and print turn all of it off. Hovering a box or arrow already sends dots along the lit arrows (see Hover and focus highlight above).

**Flowing arrows** (`class="arrow flowing"`) show continuous movement, such as a stream, a queue or a sync job, with a slow marching dash. Use at most one or two per diagram, and never on an arrow that means "optional" (those are `dashed`). They stop under reduced motion and in print.
