import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Role } from "@prisma/client";
import { apiError, json, withAuth } from "@/lib/api";

const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const maxBytes = 8 * 1024 * 1024;

export const POST = withAuth(null, [Role.ADMIN, Role.ACCOUNTANT], async (_, { request }) => {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return apiError("File is required", 422);
  if (!allowedTypes.has(file.type)) return apiError("Unsupported file type", 422);
  if (file.size > maxBytes) return apiError("File is too large", 422);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const name = `${crypto.randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, name), Buffer.from(await file.arrayBuffer()));

  return json({ url: `/uploads/${name}`, fileName: name, ocrStatus: "queued" }, { status: 201 });
});
