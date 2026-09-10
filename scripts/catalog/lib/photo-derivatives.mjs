/**
 * Photo keys and the two web sizes of every photo.
 * ------------------------------------------------
 * The web review page does not carry its photos inside itself the way the
 * Artifact page has to; it points at files. Each photo therefore gets:
 *
 *  - a key: the first 16 hex characters of the SHA-1 of the file's bytes. The
 *    same picture downloaded twice — one shop photo answering for several of
 *    our articles, an alternative that is another article's chosen photo —
 *    collapses into one key, and the ERP codes ("1469.", codes with a slash)
 *    never have to become a file name.
 *  - two WebP files named after that key: `t/<key>.webp`, a 400 px box that
 *    fills a card, and `m/<key>.webp`, a 1200 px box for the large view, where
 *    the pharmacist compares the photo with the pack in their hand.
 *
 * Because the key comes from the content, a file is never encoded or uploaded
 * twice, and a photo that changes gets a new address — no browser can keep
 * showing a stale copy.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const SIZES = {
  t: { box: 400, quality: 72 },
  m: { box: 1200, quality: 78 },
};

export const derivativePath = (outDir, size, key) => path.join(outDir, size, `${key}.webp`);

/**
 * Turns every listed photo into its key and both sizes. `files` are
 * repo-relative paths; duplicates are fine. A photo that will not decode is
 * returned in `failed` instead of stopping the run — the same rule the Artifact
 * build follows for a truncated download.
 */
export async function prepareDerivatives(files, { root, outDir, concurrency = 4, onProgress } = {}) {
  // Thousands of different images pass through once each; libvips' operation
  // cache would only hold on to memory.
  sharp.cache(false);
  for (const size of Object.keys(SIZES)) {
    const dir = path.join(outDir, size);
    fs.mkdirSync(dir, { recursive: true });
    // Leftovers of an interrupted run.
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith(".tmp")) fs.rmSync(path.join(dir, name), { force: true });
    }
  }

  const cache = loadKeyCache(outDir);
  const queue = [...new Set(files.filter(Boolean))];
  const total = queue.length;
  const keys = new Map();
  const failed = [];
  // A quarter of the files are the same picture under another name. The first
  // one to reach a key encodes it; the others wait for that instead of writing
  // the same file at the same moment.
  const encoding = new Map();
  let done = 0;

  async function worker() {
    while (queue.length) {
      const file = queue.shift();
      try {
        const key = keyFor(root, file, cache);
        if (!encoding.has(key)) encoding.set(key, ensureDerivatives(path.join(root, file), key, outDir));
        await encoding.get(key);
        keys.set(file, key);
      } catch (error) {
        failed.push({ file, reason: error.message });
      }
      done += 1;
      // Hashing a gigabyte of photos is the slow half of a first run; saving
      // along the way means an interruption does not throw that work away.
      if (done % 500 === 0) saveKeyCache(outDir, cache);
      onProgress?.(done, total);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  saveKeyCache(outDir, cache);
  return { keys, failed };
}

/**
 * Remembers keys between runs, by path, size and modification time: hashing
 * every photo again on each build would cost more than encoding the few new
 * ones.
 */
function keyFor(root, file, cache) {
  const stat = fs.statSync(path.join(root, file));
  const known = cache[file];
  if (known && known.size === stat.size && known.mtimeMs === stat.mtimeMs) return known.key;

  const bytes = fs.readFileSync(path.join(root, file));
  const key = crypto.createHash("sha1").update(bytes).digest("hex").slice(0, 16);
  cache[file] = { size: stat.size, mtimeMs: stat.mtimeMs, key };
  return key;
}

async function ensureDerivatives(file, key, outDir) {
  for (const [size, { box, quality }] of Object.entries(SIZES)) {
    const target = derivativePath(outDir, size, key);
    if (fs.existsSync(target)) continue;
    // Written under a temporary name and renamed at the end: an interrupted run
    // must never leave a half file that the next run would take as finished.
    const partial = `${target}.${process.pid}.tmp`;
    await sharp(file)
      .rotate()
      .resize(box, box, { fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toFile(partial);
    fs.renameSync(partial, target);
  }
}

function loadKeyCache(outDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(outDir, "celesat.json"), "utf8"));
  } catch {
    return {};
  }
}

function saveKeyCache(outDir, cache) {
  fs.writeFileSync(path.join(outDir, "celesat.json"), `${JSON.stringify(cache)}\n`, "utf8");
}
