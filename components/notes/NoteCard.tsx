import { Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { CalendarClock, MoreHorizontal, Pin, StickyNote } from "lucide-react";
import dayjs from "dayjs";
import type { INoteResponse } from "@/shares/dtos/note/note";
import NoteContent from "@/components/notes/NoteContent";

interface NoteCardProps {
  note: INoteResponse;
  onOpen: (note: INoteResponse) => void;
  onEdit: (note: INoteResponse) => void;
  onTogglePin: (note: INoteResponse) => void;
  onDelete: (note: INoteResponse) => void;
  isPinning: boolean;
}

export default function NoteCard({
  note,
  onOpen,
  onEdit,
  onTogglePin,
  onDelete,
  isPinning,
}: NoteCardProps) {
  const items: MenuProps["items"] = [
    { key: "edit", label: "Edit note" },
    { key: "pin", label: note.pinned ? "Unpin note" : "Pin note" },
    { type: "divider" },
    { key: "delete", label: "Delete note", danger: true },
  ];

  const handleAction: MenuProps["onClick"] = ({ key }) => {
    if (key === "edit") onEdit(note);
    if (key === "pin") onTogglePin(note);
    if (key === "delete") onDelete(note);
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => onOpen(note)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(note);
        }
      }}
      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 transition hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-blue-500 sm:px-4"
    >
      <div className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-slate-200/70 sm:flex">
        <StickyNote size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-800 sm:text-[15px]">{note.title}</h2>
          {note.pinned && <Pin size={13} className="shrink-0 fill-blue-600 text-blue-600" aria-label="Pinned" role="img" />}
        </div>
        <div className="mt-1 line-clamp-3 max-h-12 overflow-hidden text-xs leading-4 text-slate-500 [&_blockquote]:border-slate-200 [&_blockquote]:pl-2 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs">
          <NoteContent content={note.content} />
        </div>
        {note.deadline && (() => {
          const deadline = dayjs(note.deadline);
          const overdue = deadline.isBefore(dayjs(), "day");
          const dueToday = deadline.isSame(dayjs(), "day");
          const label = overdue ? "Overdue" : dueToday ? "Due today" : "Due";
          const badgeColor = overdue
            ? "bg-red-50 text-red-700 ring-red-200"
            : dueToday
              ? "bg-amber-50 text-amber-700 ring-amber-200"
              : "bg-blue-50 text-blue-700 ring-blue-200";
          return <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4 ring-1 ring-inset ${badgeColor}`}>
            <CalendarClock size={11} aria-hidden="true" />
            <time dateTime={note.deadline}>{label} · {deadline.format("MMM D, YYYY")}</time>
          </span>;
        })()}
      </div>
      <time className="hidden shrink-0 text-xs text-slate-400 md:block" dateTime={note.updatedAt}>
        {dayjs(note.updatedAt).format("MMM D, YYYY")}
      </time>
      <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
        <Dropdown menu={{ items, onClick: handleAction }} trigger={["click"]} placement="bottomRight">
          <Button type="text" size="small" icon={<MoreHorizontal size={18} />} aria-label={`Actions for ${note.title}`} title="Note actions" disabled={isPinning} className="!h-9 !w-9 !min-w-9 !text-slate-500 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" />
        </Dropdown>
      </div>
    </article>
  );
}
