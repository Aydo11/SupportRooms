import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Storage adapter. The app only ever calls `storage.put()`, so swapping local
 * disk for S3/R2/Blob is a one-file change.
 *
 * Visibility matters more than the driver. Public files (advert photos, logos)
 * are served straight from the web root. Private files (referral attachments,
 * verification evidence, ID) are written OUTSIDE the web root and can only be
 * read through /api/documents/[id], which checks permissions and writes an audit
 * entry. Nothing private is ever guessable from a URL.
 *
 * Env: STORAGE_DRIVER=local|s3, PRIVATE_UPLOAD_DIR, S3_BUCKET, S3_REGION,
 *      S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_BASE_URL
 */
export type Visibility = "public" | "private";
export type StoredFile = {
  /** Public URL, or an opaque `private:` key that only the document route resolves. */
  url: string;
  key: string;
  mimeType: string;
  sizeBytes: number;
  visibility: Visibility;
};

export const LIMITS = {
  image: { maxBytes: 8 * 1024 * 1024, mime: ["image/jpeg", "image/png", "image/webp", "image/avif"] },
  video: { maxBytes: 200 * 1024 * 1024, mime: ["video/mp4", "video/quicktime", "video/webm"] },
  document: {
    maxBytes: 15 * 1024 * 1024,
    mime: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
};

/** Magic bytes, because a browser-supplied MIME type is just a claim. */
const SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  // DOCX and other OOXML files are zip archives.
  { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: [0x50, 0x4b, 0x03, 0x04] },
];

export function validateUpload(file: File, kind: keyof typeof LIMITS) {
  const rule = LIMITS[kind];
  if (!rule.mime.includes(file.type)) {
    return `That file type isn't supported. Allowed: ${rule.mime.join(", ")}.`;
  }
  if (file.size > rule.maxBytes) {
    return `That file is too large. Maximum ${Math.round(rule.maxBytes / 1024 / 1024)}MB.`;
  }
  if (file.size === 0) return "That file is empty.";
  return null;
}

/**
 * Second check, after the bytes are in hand: does the file actually look like
 * what it claims to be? Stops an executable or an SVG (which can carry script)
 * being uploaded as image/png.
 */
export async function verifyFileContents(file: File, buffer: Buffer) {
  const expected = SIGNATURES.filter((signature) => signature.mime === file.type);
  if (!expected.length) return null; // No signature on file for this type — size and MIME checks stand.

  const matches = expected.some((signature) =>
    signature.bytes.every((byte, index) => buffer[(signature.offset ?? 0) + index] === byte),
  );
  return matches ? null : "That file doesn't look like the type it claims to be.";
}

interface StorageDriver {
  put(file: File, folder: string, visibility?: Visibility): Promise<StoredFile>;
  /** Absolute path or signed URL for a private key, used only by the document route. */
  read(key: string): Promise<Buffer>;
}

const PRIVATE_DIR = process.env.PRIVATE_UPLOAD_DIR ?? path.join(process.cwd(), "var", "private-uploads");
const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads");

/** Keys are generated, never taken from the filename, so path traversal isn't possible. */
function makeKey(folder: string, file: File) {
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/\.\./g, "");
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  return `${safeFolder}/${randomUUID()}.${ext || "bin"}`;
}

const localDriver: StorageDriver = {
  async put(file, folder, visibility = "public") {
    const key = makeKey(folder, file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const root = visibility === "private" ? PRIVATE_DIR : PUBLIC_DIR;
    const target = path.join(root, key);

    // Belt and braces: the resolved path must stay inside the root.
    if (!target.startsWith(path.join(root, ""))) throw new Error("Invalid upload path.");

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);

    return {
      url: visibility === "private" ? `private:${key}` : `/uploads/${key}`,
      key,
      mimeType: file.type,
      sizeBytes: file.size,
      visibility,
    };
  },

  async read(key) {
    const target = path.join(PRIVATE_DIR, key.replace(/^private:/, ""));
    if (!target.startsWith(path.join(PRIVATE_DIR, ""))) throw new Error("Invalid key.");
    const { readFile } = await import("fs/promises");
    return readFile(target);
  },
};

const s3Driver: StorageDriver = {
  async put() {
    // Install @aws-sdk/client-s3 and implement PutObjectCommand here. Private
    // objects must go to a bucket with public access blocked, and `read` should
    // return a short-lived signed URL rather than the bytes.
    throw new Error(
      "S3 storage driver not implemented. Set STORAGE_DRIVER=local or implement src/lib/storage.ts.",
    );
  },
  async read() {
    throw new Error("S3 storage driver not implemented.");
  },
};

export const storage: StorageDriver = process.env.STORAGE_DRIVER === "s3" ? s3Driver : localDriver;

export const isPrivateKey = (url: string) => url.startsWith("private:");
