import type { INoteRequest } from "@/shares/dtos/note/note";

export function parseNoteRequest(value: unknown): INoteRequest | null {
  if (!value || typeof value !== "object") return null;

  const body = value as Record<string, unknown>;
  if (typeof body.title !== "string" || typeof body.content !== "string") {
    return null;
  }

  const title = body.title.trim();
  const content = body.content.trim();
  if (!title || title.length > 200 || !content) return null;

  return { title, content };
}
