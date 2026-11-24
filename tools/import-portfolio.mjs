#!/usr/bin/env node
/**
 * IoTLab Docs — portfolio importer.
 *
 * Imports docs/portfolio markdown into BookStack via the REST API:
 *   shelf "IoTLab Portfolio" -> one Book -> Chapters per section/project ->
 *   each .md file becomes a Page, ordered by each README's own TOC. The
 *   single book keeps the docs flowing in one direction — foundations
 *   first, each project in sequence, appendix last.
 *
 * - Local image refs (../../assets/screenshots/x.png) are uploaded through
 *   the image-gallery API into the page's own gallery.
 * - Relative .md links are rewritten in a second pass to BookStack page URLs.
 * - Idempotent: chapters and pages are matched by name and updated, not
 *   duplicated.
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

// Single book, chapters in reading order. `dir` is relative to CONTENT_DIR;
// empty dir = shared docs root. `files` pins an explicit order for root
// chapters; project chapters derive order from their README's own TOC.
const BOOK = {
  name: 'IoTLab Portfolio',
  description: 'End-to-end technical documentation for the IoTLab application portfolio — read top to bottom: foundations, then each project, then the appendix.',
};

const CHAPTERS = [
  {
    dir: '',
    name: 'Start Here',
    description: 'Shared foundations: how the sites work, and what the projects require.',
    files: ['README.md', 'how-websites-work.md', 'development-requirements.md'],
    introName: 'Introduction — IoTLab Portfolio',
  },
  { dir: 'projects/iotlab-website', name: 'IoTLab Website', description: 'Public IoTLab website: pages, dynamic content, events, and the assistant.' },
  { dir: 'projects/reservation', name: 'Reservation Platform', description: 'Laboratory reservation platform: booking lifecycle, calendar, self-service.' },
  { dir: 'projects/borrowing', name: 'Borrowing Platform', description: 'Equipment borrowing platform: catalog, QR borrowing and returns.' },
  { dir: 'projects/admin-console', name: 'Admin Console', description: 'Admin console and unified API: auth, operations, content, security tools.' },
  {
    dir: '',
    name: 'Appendix',
    description: 'Supporting material: evidence policy, writing references, and the screenshot index.',
    files: ['evidence-policy.md', 'references.md', 'assets/README.md'],
  },
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

/**
 * Ordered page list for a chapter dir. Explicit `files` keep their listed
 * order. Otherwise: README first, README-TOC order, leftovers alphabetical.
 * Returns {file, abs, isReadme}.
 */
async function pagesFor(dir, explicitFiles) {
  const abs = path.join(CONTENT_DIR, dir);
  if (explicitFiles) {
    return explicitFiles
      .filter((f) => existsSync(path.join(abs, f)))
      .map((f) => ({ file: f, abs: path.join(abs, f), isReadme: f.toLowerCase() === 'readme.md' }));
  }
  const files = (await readdir(abs)).filter((f) => f.endsWith('.md'));
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
  return [readme, ...ordered].filter(Boolean)
    .map((f) => ({ file: f, abs: path.join(abs, f), isReadme: f === readme }));
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
for (const c of CHAPTERS) {
  for (const { file, abs, isReadme } of await pagesFor(c.dir, c.files)) {
    const md = readFileSync(abs, 'utf8');
    plan.push({
      chapter: c.name, bookDir: c.dir, file, abs,
      name: isReadme ? (c.introName || `Introduction — ${c.name}`) : h1(md),
      markdown: stripH1(md),
      priority: plan.filter((p) => p.chapter === c.name).length + 1,
    });
  }
}
console.log(`Plan: ${plan.length} pages across ${CHAPTERS.length} chapters.`);
for (const p of plan) console.log(`  [${p.chapter}] p${p.priority} ${p.name}  <- ${p.bookDir}/${p.file}`);
if (DRY) process.exit(0);

// ---------- shelf + book ----------
const shelves = (await api('GET', 'shelves?count=500')).data;
let shelf = shelves.find((s) => s.name === 'IoTLab Portfolio');
if (!shelf) shelf = await api('POST', 'shelves', { name: 'IoTLab Portfolio', description: 'IoTLab system documentation portfolio.' });
console.log(`Shelf: ${shelf.name} (#${shelf.id})`);

const books = (await api('GET', 'books?count=500')).data;
let book = books.find((x) => x.name === BOOK.name);
if (!book) book = await api('POST', 'books', { name: BOOK.name, description: BOOK.description });
const bookSlug = book.slug;
console.log(`Book: ${BOOK.name} (#${book.id}, slug ${bookSlug})`);

// ---------- chapters + pages ----------
const chapters = (await api('GET', `chapters?filter[book_id]=${book.id}&count=500`)).data;
const pages = (await api('GET', `pages?filter[book_id]=${book.id}&count=500`)).data;
const slugMap = new Map();
for (const [ci, c] of CHAPTERS.entries()) {
  let chapter = chapters.find((x) => x.name === c.name);
  const chapterPayload = { book_id: book.id, name: c.name, description: c.description || '', priority: ci + 1 };
  if (chapter) chapter = await api('PUT', `chapters/${chapter.id}`, chapterPayload);
  else chapter = await api('POST', 'chapters', chapterPayload);
  console.log(`Chapter ${ci + 1}: ${c.name} (#${chapter.id})`);

  for (const p of plan.filter((x) => x.chapter === c.name)) {
    const hit = pages.find((e) => e.name === p.name && e.chapter_id === chapter.id);
    const payload = { chapter_id: chapter.id, name: p.name, markdown: p.markdown, priority: p.priority };
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

// ---------- assign book to shelf ----------
await api('PUT', `shelves/${shelf.id}`, { books: [book.id] });

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
