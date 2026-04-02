import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function saveFile(
  file: File,
  subfolder: string = "documents"
): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> {
  const dir = path.join(UPLOAD_DIR, subfolder);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const ext = path.extname(file.name);
  const uniqueName = `${randomUUID()}${ext}`;
  const filePath = path.join(dir, uniqueName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${subfolder}/${uniqueName}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };
}

export function validateFile(
  file: File,
  acceptedFormats: string[],
  maxSizeMB: number
): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !acceptedFormats.includes(ext)) {
    return `File type .${ext} is not accepted. Allowed: ${acceptedFormats.join(", ")}`;
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File is too large. Maximum size: ${maxSizeMB}MB`;
  }

  return null;
}
