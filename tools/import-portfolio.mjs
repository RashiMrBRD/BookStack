#!/usr/bin/env node
/**
 * IoTLab Docs — portfolio importer.
 *
 * Imports docs/portfolio markdown into BookStack via the REST API:
 *   shelf "IoTLab Portfolio" -> one Book per project (+ Foundations for shared
 *   docs) -> each .md file becomes a Page, ordered by each README's own TOC.
 *
 * - Local image refs (../../assets/screenshots/x.png) are inlined as base64
 *   data URIs; the API extracts them into the page's gallery on save.
 * - Relative .md links are rewritten in a second pass to BookStack page URLs.
 * - Idempotent: pages are matched by book + name and updated, not duplicated.
 *
 * Usage:
 *   BOOKSTACK_URL=https://docs.example.com \
 *   BOOKSTACK_TOKEN_ID=... BOOKSTACK_TOKEN_SECRET=... \
 *   node tools/import-portfolio.mjs [--dry] [--content-dir <path>]
 */

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes('--dry');
const dirArg = process.argv.indexOf('--content-dir');
const CONTENT_DIR = dirArg > -1
  ? path.resolve(process.argv[dirArg + 1])
  : path.resolve(scriptDir, '..', '..', 'docs', 'portfolio');

const BASE = (process.env.BOOKSTACK_URL || '').replace(/\/+$/, '');
const TOKEN = `${process.env.BOOKSTACK_TOKEN_ID || ''}:${process.env.BOOKSTACK_TOKEN_SECRET || ''}`;
if (!DRY && (!BASE || !process.env.BOOKSTACK_TOKEN_ID || !process.env.BOOKSTACK_TOKEN_SECRET)) {
  console.error('Set BOOKSTACK_URL, BOOKSTACK_TOKEN_ID, BOOKSTACK_TOKEN_SECRET (or use --dry).');
  process.exit(1);
}

// Book definitions. `dir` is relative to CONTENT_DIR; empty dir = shared docs.
const BOOKS = [
  {
    dir: '',
    name: 'Foundations',
    description: 'Shared IoTLab portfolio foundations: how the sites work, development requirements, evidence policy, and documentation references.',
    files: ['README.md', 'how-websites-work.md', 'development-requirements.md', 'evidence-policy.md', 'references.md', 'assets/README.md'],
  },
  { dir: 'projects/iotlab-website', name: 'IoTLab Website', description: 'Technical handbook for the public IoTLab website.' },
  { dir: 'projects/reservation', name: 'Reservation Platform', description: 'Technical handbook for the laboratory reservation platform.' },
  { dir: 'projects/borrowing', name: 'Borrowing Platform', description: 'Technical handbook for the equipment borrowing platform.' },
  { dir: 'projects/admin-console', name: 'Admin Console', description: 'Technical handbook for the IoTLab admin console and unified API.' },
];

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

async function api(method, endpoint, body) {
  const res = await fetch(`${BASE}/api/${endpoint}`, {
    method,
    headers: { Authorization: `Token ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${endpoint} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? {} : res.json();
}

/** Upload a local image file to a page's gallery; returns the served URL. */
async function uploadImage(pageId, imgPath) {
  // Reuse an existing same-named gallery image on this page (idempotent).
  const existing = (await api('GET', `image-gallery?filter[uploaded_to]=${pageId}&count=500`)).data
    .find((img) => img.name === path.basename(imgPath));
  if (existing) return existing.url;

  const form = new FormData();
  const buf = readFileSync(imgPath);
  form.append('type', 'gallery');
  form.append('uploaded_to', String(pageId));
  form.append('name', path.basename(imgPath));
  form.append('image', new Blob([buf], { type: MIME[path.extname(imgPath).toLowerCase()] }), path.basename(imgPath));
  const res = await fetch(`${BASE}/api/image-gallery`, {
    method: 'POST',
    headers: { Authorization: `Token ${TOKEN}` },
    body: form,
  });
  if (!res.ok) throw new Error(`image-gallery upload ${imgPath} -> ${res.status} ${await res.text()}`);
  const img = await res.json();
  return img.url;
}

const h1 = (md) => (md.match(/^#\s+(.+)$/m) || [null, 'Untitled'])[1].trim();

/** Drop the document's own leading H1 — the BookStack page title renders it. */
const stripH1 = (md) => md.replace(/^\s*#\s+.+\n+/, '');

/** Ordered page list for a book dir: README first, README-TOC order, leftovers alphabetical. */
async function pagesFor(dir, explicitFiles) {
  const abs = path.join(CONTENT_DIR, dir);
  let files = explicitFiles
    ? explicitFiles.filter((f) => existsSync(path.join(abs, f)))
    : (await readdir(abs)).filter((f) => f.endsWith('.md'));
  const readme = files.find((f) => f.toLowerCase() === 'readme.md');
  const rest = files.filter((f) => f !== readme);
  let ordered = [];
  if (readme) {
    const md = readFileSync(path.join(abs, readme), 'utf8');
    const seen = new Set();
    for (const [, link] of md.matchAll(/\]\(([^)#]+\.md)\)/g)) {
      const base = path.basename(link);
      if (rest.includes(base) && !seen.has(base)) { seen.add(base); ordered.push(base); }
    }
  }
  ordered.push(...rest.filter((f) => !ordered.includes(f)).sort());
  return [readme, ...ordered].filter(Boolean).map((f) => ({ file: f, abs: path.join(abs, f) }));
}

/** List local image refs in a doc: [{alt, ref, abs}]. */
function imageRefs(md, fileAbs) {
  const fileDir = path.dirname(fileAbs);
  const refs = [];
  for (const [, alt, ref] of md.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
    if (/^https?:|data:/.test(ref)) continue;
    const imgPath = path.resolve(fileDir, ref);
    if (existsSync(imgPath)) refs.push({ alt, ref, abs: imgPath });
    else console.warn(`  ! missing image ${ref} in ${fileAbs}`);
  }
  return refs;
}

/** Replace local image refs in markdown with already-uploaded URLs. */
function inlineImageUrls(md, fileAbs, urlByRef) {
  const fileDir = path.dirname(fileAbs);
  return md.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, ref) => {
    const hit = urlByRef.get(path.normalize(path.resolve(fileDir, ref)));
    return hit ? `![${alt}](${hit})` : m;
  });
}

/** Rewrite relative .md links to BookStack URLs using the import map. */
function rewriteLinks(md, fileAbs, slugMap) {
  const fileDir = path.dirname(fileAbs);
  return md.replace(/(?<!!)\[([^\]]+)\]\(((?!https?:)[^)\s]+\.md)\)/g, (m, text, ref) => {
    const target = path.normalize(path.resolve(fileDir, ref));
    const hit = slugMap.get(target);
    if (!hit) { console.warn(`  ! unresolved doc link ${ref} in ${fileAbs}`); return m; }
    return `[${text}](${BASE}/books/${hit.bookSlug}/page/${hit.pageSlug})`;
  });
}

// ---------- collect source ----------
const plan = [];
for (const b of BOOKS) {
  for (const { file, abs } of await pagesFor(b.dir, b.files)) {
    const md = readFileSync(abs, 'utf8');
    const isReadme = file.toLowerCase() === 'readme.md';
    plan.push({
      book: b.name, bookDir: b.dir, file, abs,
      name: isReadme ? `Introduction — ${b.name}` : h1(md),
      markdown: stripH1(md),
      priority: plan.filter((p) => p.book === b.name).length + 1,
    });
  }
}
console.log(`Plan: ${plan.length} pages across ${BOOKS.length} books.`);
for (const p of plan) console.log(`  [${p.book}] p${p.priority} ${p.name}  <- ${p.bookDir}/${p.file}`);
if (DRY) process.exit(0);

// ---------- shelf + books ----------
const shelves = (await api('GET', 'shelves?count=500')).data;
let shelf = shelves.find((s) => s.name === 'IoTLab Portfolio');
if (!shelf) shelf = await api('POST', 'shelves', { name: 'IoTLab Portfolio', description: 'IoTLab system documentation portfolio.' });
console.log(`Shelf: ${shelf.name} (#${shelf.id})`);

const books = (await api('GET', 'books?count=500')).data;
const slugMap = new Map();
for (const b of BOOKS) {
  let book = books.find((x) => x.name === b.name);
  if (!book) book = await api('POST', 'books', { name: b.name, description: b.description });
  const bookSlug = book.slug;
  console.log(`Book: ${b.name} (#${book.id}, slug ${bookSlug})`);

  const existing = (await api('GET', `pages?filter[book_id]=${book.id}&count=500`)).data;
  for (const p of plan.filter((x) => x.book === b.name)) {
    const hit = existing.find((e) => e.name === p.name);
    const payload = { book_id: book.id, name: p.name, markdown: p.markdown, priority: p.priority };
    const page = hit
      ? await api('PUT', `pages/${hit.id}`, payload)
      : await api('POST', 'pages', payload);

    // Upload local images into this page's gallery, then re-save with real URLs.
    const refs = imageRefs(p.markdown, p.abs);
    if (refs.length) {
      const urlByRef = new Map();
      for (const r of refs) urlByRef.set(path.normalize(r.abs), await uploadImage(page.id, r.abs));
      p.markdown = inlineImageUrls(p.markdown, p.abs, urlByRef);
      await api('PUT', `pages/${page.id}`, { ...payload, markdown: p.markdown });
    }
    console.log(`  ${hit ? 'updated' : 'created'} p${p.priority}: ${p.name} (#${page.id}, ${refs.length} images)`);
    slugMap.set(path.normalize(p.abs), { bookSlug, pageSlug: page.slug, pageId: page.id });
    p.pageId = page.id;
  }
}

// ---------- assign books to shelf ----------
const bookIds = (await api('GET', 'books?count=500')).data
  .filter((x) => BOOKS.some((b) => b.name === x.name)).map((x) => x.id);
await api('PUT', `shelves/${shelf.id}`, { books: bookIds });

// ---------- second pass: internal link rewrite ----------
let relinked = 0;
for (const p of plan) {
  const out = rewriteLinks(p.markdown, p.abs, slugMap);
  if (out !== p.markdown) {
    await api('PUT', `pages/${p.pageId}`, { name: p.name, markdown: out, priority: p.priority });
    relinked++;
  }
}
console.log(`Done. ${plan.length} pages, ${relinked} pages re-saved with BookStack links.`);
