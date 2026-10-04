import type { INoteRequest } from "@/shares/dtos/note/note";

export function parseNoteRequest(value: unknown): INoteRequest | null {
  if (!value || typeof value !== "object") return null;

  const body = value as Record<string, unknown>;
  if (typeof body.title !== "string" || typeof body.content !== "string") {
    return null;
  }

  const deadline = body.deadline;
  if (deadline !== undefined && deadline !== null &&
    (typeof deadline !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
      Number.isNaN(Date.parse(`${deadline}T00:00:00Z`)) || new Date(`${deadline}T00:00:00Z`).toISOString().slice(0, 10) !== deadline)) {
    return null;
  }

  const title = body.title.trim();
  const content = body.content.trim();
  if (!title || title.length > 200 || !content) return null;

  return { title, content, deadline: deadline ?? null };
}
