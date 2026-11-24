# IoTLab Docs Tools

## `import-portfolio.mjs`

Imports the IoTLab portfolio markdown (`docs/portfolio/` in the projects
workspace, or any `--content-dir`) into this BookStack instance via the REST
API.

Structure produced — a single book read in one direction, chapters as
sections:

```
Shelf: IoTLab Portfolio
  Book: IoTLab Portfolio
    Chapter: Start Here          <- README.md, how-websites-work, development-requirements
    Chapter: IoTLab Website      <- projects/iotlab-website/*.md
    Chapter: Reservation Platform <- projects/reservation/*.md
    Chapter: Borrowing Platform  <- projects/borrowing/*.md
    Chapter: Admin Console       <- projects/admin-console/*.md
    Chapter: Appendix            <- evidence-policy, references, assets/README
```

- A project `README.md` becomes its chapter's first page
  ("Introduction — {chapter}"); the portfolio root README becomes
  "Introduction — IoTLab Portfolio".
- Page order follows each project README's own table-of-contents link
  order; the two root chapters use their explicit `files` lists.
- Local `../../assets/screenshots/*.png` refs are uploaded through the
  image-gallery API into each page's own gallery, then embedded as served
  URLs.
- Relative `.md` links are resolved to BookStack `/books/<book>/page/<page>`
  URLs in a second pass after all pages exist.
- Re-runs update chapters/pages matched by name — no duplicates.

### Environment

| Var | Purpose |
|---|---|
| `BOOKSTACK_URL` | Instance base URL, no trailing slash |
| `BOOKSTACK_TOKEN_ID` / `BOOKSTACK_TOKEN_SECRET` | API token pair (needs "Access System API" permission) |

### Usage

```bash
node tools/import-portfolio.mjs --dry          # print the page plan only
node tools/import-portfolio.mjs                # run the import
node tools/import-portfolio.mjs --content-dir /path/to/docs/portfolio
```

No npm dependencies — Node 18+ (`fetch` builtin) is sufficient.
