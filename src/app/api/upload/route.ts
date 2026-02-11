import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Allowed extensions whitelist (no SVG — can contain embedded JS)
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "gif"];
const ALLOWED_VIDEO_EXTENSIONS = ["mp4", "webm", "mov"];
const ALLOWED_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS];

// Magic bytes for file type validation
const MAGIC_BYTES: Record<string, number[][]> = {
  jpg: [[0xff, 0xd8, 0xff]],
  jpeg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47]],
  gif: [[0x47, 0x49, 0x46]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  mp4: [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]], // ftyp
};

function validateMagicBytes(buffer: ArrayBuffer, extension: string): boolean {
  const bytes = new Uint8Array(buffer).slice(0, 12);
  const signatures = MAGIC_BYTES[extension.toLowerCase()];
  if (!signatures) return true; // No signature to check — allow (avif, mov, webm)
  return signatures.some((sig) =>
    sig.every((byte, i) => bytes[i] === byte),
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Extract and validate extension
    const rawExtension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(rawExtension)) {
      return NextResponse.json(
        { error: `Extension .${rawExtension} non autorisée. Extensions autorisées: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 },
      );
    }

    // Block SVG explicitly (even if someone renames it)
    if (file.type === "image/svg+xml" || rawExtension === "svg") {
      return NextResponse.json(
        { error: "Les fichiers SVG ne sont pas autorisés pour des raisons de sécurité" },
        { status: 400 },
      );
    }

    // Validate MIME type
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      return NextResponse.json({ error: "Type de fichier invalide" }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10MB)" },
        { status: 400 },
      );
    }

    // Validate magic bytes (actual file content)
    const buffer = await file.arrayBuffer();
    if (!validateMagicBytes(buffer, rawExtension)) {
      return NextResponse.json(
        { error: "Le contenu du fichier ne correspond pas à son extension" },
        { status: 400 },
      );
    }

    // Generate unique filename with sanitized extension
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = ALLOWED_EXTENSIONS.includes(rawExtension) ? rawExtension : (isVideo ? "mp4" : "jpg");
    const folder = isVideo ? "videos" : "images";
    const filename = `harp/${folder}/${timestamp}-${randomString}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
      type: isVideo ? "video" : "image",
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
