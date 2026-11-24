# IoTLab Docs Tools

## `import-portfolio.mjs`

Imports the IoTLab portfolio markdown (`docs/portfolio/` in the projects
workspace, or any `--content-dir`) into this BookStack instance via the REST
API.

Structure produced:

```
Shelf: IoTLab Portfolio
  Book: Foundations              <- shared docs (how-websites-work, evidence policy, ...)
  Book: IoTLab Website           <- projects/iotlab-website/*.md
  Book: Reservation Platform     <- projects/reservation/*.md
  Book: Borrowing Platform       <- projects/borrowing/*.md
  Book: Admin Console            <- projects/admin-console/*.md
```

- `README.md` becomes each book's first page ("Introduction") and the book's
  description text is set from the book definition.
- Page order follows each README's own table-of-contents link order.
- Local `../../assets/screenshots/*.png` references are inlined as base64 data
  URIs; BookStack extracts them into the page's image gallery on save.
- Relative `.md` links are resolved to BookStack `/books/<book>/page/<page>`
  URLs in a second pass after all pages exist.
- Re-runs update pages matched by book + name — no duplicates.

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
