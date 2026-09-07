/**
 * Minimal, dependency-free ZIP reader — just enough to read .xlsx files.
 * ---------------------------------------------------------------------
 * An .xlsx is a ZIP archive of XML parts plus the embedded images under
 * `xl/media/`. Node ships the inflate algorithm but no archive reader, so the
 * central directory is walked by hand here. That keeps the catalog tooling free
 * of npm dependencies, which matters because these scripts run rarely and must
 * still work years from now.
 *
 * Scope on purpose: store (method 0) and deflate (method 8) only, no ZIP64, no
 * encryption. Excel writes plain deflate for files of this size, and a wrong
 * assumption fails loudly below rather than silently returning garbage.
 */
import { inflateRawSync } from "node:zlib";

const SIG_EOCD = 0x06054b50; // end of central directory
const SIG_CENTRAL = 0x02014b50; // central directory file header
const SIG_LOCAL = 0x04034b50; // local file header

/** Opens a ZIP held in memory and returns lazy accessors over its entries. */
export function openZip(buffer) {
  const eocd = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);

  const entries = new Map();
  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(cursor) !== SIG_CENTRAL) {
      throw new Error(`Corrupt ZIP: entry ${i + 1} has no valid central-directory header.`);
    }
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    entries.set(buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength), {
      method: buffer.readUInt16LE(cursor + 10),
      compressedSize: buffer.readUInt32LE(cursor + 20),
      localOffset: buffer.readUInt32LE(cursor + 42),
    });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  const read = (name) => {
    const entry = entries.get(name);
    if (!entry) throw new Error(`Archive has no part named "${name}".`);
    if (buffer.readUInt32LE(entry.localOffset) !== SIG_LOCAL) {
      throw new Error(`Corrupt ZIP: "${name}" has no valid local header.`);
    }
    // The local header repeats the name and extra fields with lengths of their
    // own — the central directory's copies can differ, so read them here.
    const nameLength = buffer.readUInt16LE(entry.localOffset + 26);
    const extraLength = buffer.readUInt16LE(entry.localOffset + 28);
    const start = entry.localOffset + 30 + nameLength + extraLength;
    const raw = buffer.subarray(start, start + entry.compressedSize);
    if (entry.method === 0) return Buffer.from(raw);
    if (entry.method === 8) return inflateRawSync(raw);
    throw new Error(`"${name}" uses compression method ${entry.method}, which this reader does not support.`);
  };

  return {
    names: () => [...entries.keys()],
    has: (name) => entries.has(name),
    read,
    readText: (name) => read(name).toString("utf8"),
  };
}

function findEndOfCentralDirectory(buffer) {
  // The record sits at the very end, but a trailing comment (max 65535 bytes)
  // may follow it, so scan backwards over the largest possible window.
  const earliest = Math.max(0, buffer.length - (22 + 0xffff));
  for (let i = buffer.length - 22; i >= earliest; i -= 1) {
    if (buffer.readUInt32LE(i) === SIG_EOCD) return i;
  }
  throw new Error("No ZIP structure found - is this really an .xlsx file?");
}
