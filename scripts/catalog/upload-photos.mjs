#!/usr/bin/env node
/**
 * Puts the web review page's photos into Supabase Storage.
 * --------------------------------------------------------
 * `build-review-page.mjs --web` writes every photo in two sizes to
 * `.catalog-cache/fotot/` and lists the ones the page uses in
 * `te-perdorura.json`. This script uploads exactly those, into the public
 * bucket named in `web.json`, as `t/<key>.webp` and `m/<key>.webp`.
 *
 * Only new files travel: a key names a picture's content, so a file that is up
 * there once never changes. What has been uploaded is remembered in
 * `.catalog-cache/fotot/ngarkuar.json`, and storage answering "already exists"
 * counts as success too — a lost ledger costs one quick pass, not a mess.
 *
 * Uploading needs a write permission the page itself must never have. It is
 * granted for the duration of the upload only (see `supabase/vendimet.sql`):
 *   create policy fotot_ngarkim on storage.objects for insert to anon with check (bucket_id = 'fotot');
 * and taken away again right afterwards:
 *   drop policy fotot_ngarkim on storage.objects;
 *
 * Usage:
 *   node scripts/catalog/upload-photos.mjs            # everything still missing
 *   node scripts/catalog/upload-photos.mjs --limit 1  # a single file, to test
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SIZES, derivativePath } from "./lib/photo-derivatives.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const PHOTO_DIR = path.join(ROOT, ".catalog-cache", "fotot");
const LEDGER = path.join(PHOTO_DIR, "ngarkuar.json");
const CONCURRENCY = 6;
const ATTEMPTS = 4;

async function main() {
  const limit = Number(flag("limit", 0)) || 0;
  const config = JSON.parse(fs.readFileSync(path.join(HERE, "web.json"), "utf8"));
  const manifestFile = path.join(PHOTO_DIR, "te-perdorura.json");
  if (!fs.existsSync(manifestFile)) {
    console.error("\n  Keine Fotoliste gefunden — zuerst build-review-page.mjs --web ausführen.\n");
    process.exit(1);
  }

  const { keys } = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const done = new Set(loadLedger());
  const todo = [];
  for (const key of keys) {
    for (const size of Object.keys(SIZES)) {
      const name = `${size}/${key}.webp`;
      if (!done.has(name)) todo.push({ name, file: derivativePath(PHOTO_DIR, size, key) });
    }
  }
  const queue = limit ? todo.slice(0, limit) : todo;
  const total = queue.length;

  console.log(`\n  Fotos hochladen — ${keys.length} Fotos, ${todo.length} Dateien fehlen noch${limit ? `, ${total} davon jetzt` : ""}`);
  console.log(`  ${"-".repeat(60)}`);

  let uploaded = 0;
  let existed = 0;
  let bytes = 0;
  let finished = 0;
  let sinceSave = 0;
  const failed = [];

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      try {
        const result = await upload(config, item);
        if (result === "exists") existed += 1;
        else {
          uploaded += 1;
          bytes += result;
        }
        done.add(item.name);
        sinceSave += 1;
        // An interrupted upload should not have to start from nothing.
        if (sinceSave >= 200) {
          saveLedger(done);
          sinceSave = 0;
        }
      } catch (error) {
        failed.push({ name: item.name, reason: error.message });
      }
      finished += 1;
      if (finished % 100 === 0 || finished === total) process.stdout.write(`     ${finished}/${total}\r`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  saveLedger(done);

  console.log(`     ${uploaded} hochgeladen (${(bytes / 1024 / 1024).toFixed(1)} MB), ${existed} waren schon da          `);
  if (failed.length) {
    console.log(`     ${failed.length} fehlgeschlagen:`);
    for (const item of failed.slice(0, 10)) console.log(`        ${item.name}: ${item.reason}`);
    process.exitCode = 1;
  }
  console.log("");
}

async function upload(config, { name, file }) {
  const body = fs.readFileSync(file);
  const url = `${config.supabaseUrl}/storage/v1/object/${config.bucket}/${name}`;
  for (let attempt = 1; ; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: config.publishableKey,
          "content-type": "image/webp",
          // A key names the content, so the file behind an address never
          // changes: browsers may keep it for a year instead of asking again.
          "cache-control": "max-age=31536000",
          "x-upsert": "false",
        },
        body,
      });
    } catch (error) {
      if (attempt >= ATTEMPTS) throw error;
      await wait(attempt);
      continue;
    }
    if (response.ok) return body.length;

    const text = await response.text();
    // Storage says "already there" as 409, or as a 400 carrying the 409 inside.
    if (response.status === 409 || /Duplicate|already exists/i.test(text)) return "exists";
    if ((response.status === 429 || response.status >= 500) && attempt < ATTEMPTS) {
      await wait(attempt);
      continue;
    }
    throw new Error(`HTTP ${response.status} ${text.slice(0, 160)}`);
  }
}

const wait = (attempt) => new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));

function loadLedger() {
  try {
    return JSON.parse(fs.readFileSync(LEDGER, "utf8"));
  } catch {
    return [];
  }
}

function saveLedger(done) {
  fs.writeFileSync(LEDGER, `${JSON.stringify([...done].sort())}\n`, "utf8");
}

function flag(name, fallback) {
  const argv = process.argv.slice(2);
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
