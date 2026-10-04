import type { ReactNode } from "react";

function safeHref(value: string) {
  const trimmed = value.trim();
  return /^(https?:\/\/|mailto:|\/)/i.test(trimmed) ? trimmed : null;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern).filter(Boolean);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return <del key={key}>{part.slice(2, -2)}</del>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return <span key={key}>{link[1]}</span>;
      return (
        <a
          key={key}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
          className="text-blue-700 underline underline-offset-2"
        >
          {link[1]}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function isBlockStart(line: string) {
  return /^#{1,3}\s|^>\s?|^```|^[-*+]\s|^\d+\.\s/.test(line);
}

export default function NoteContent({
  content,
  onTaskToggle,
  tasksDisabled = false,
}: {
  content: string;
  onTaskToggle?: (lineIndex: number, completed: boolean) => void;
  tasksDisabled?: boolean;
}) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={`code-${index}`} className="overflow-hidden rounded bg-slate-100 px-2 py-1 font-mono text-xs leading-4">
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Heading = `h${heading[1].length}` as "h1" | "h2" | "h3";
      blocks.push(
        <Heading
          key={`heading-${index}`}
          className={
            heading[1].length === 1
              ? "text-base font-bold text-slate-900"
              : heading[1].length === 2
                ? "text-sm font-bold text-slate-900"
                : "text-sm font-semibold text-slate-800"
          }
        >
          {renderInline(heading[2], `heading-${index}`)}
        </Heading>,
      );
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`} className="border-l-2 border-slate-300 pl-2 text-slate-600">
          {quoteLines.map((quote, quoteIndex) => (
            <p key={quoteIndex}>{renderInline(quote, `quote-${index}-${quoteIndex}`)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    const listMatch = line.match(/^([-*+]\s|\d+\.\s)(.*)$/);
    if (listMatch) {
      const ordered = /^\d+\./.test(listMatch[1]);
      const items: string[] = [];
      const itemLineIndexes: number[] = [];
      while (index < lines.length) {
        const match = lines[index].match(/^([-*+]\s|\d+\.\s)(.*)$/);
        if (!match || /^\d+\./.test(match[1]) !== ordered) break;
        items.push(match[2]);
        itemLineIndexes.push(index);
        index += 1;
      }
      const List = ordered ? "ol" : "ul";
      const isTaskList = !ordered && items.some((item) => /^\[([ xX])\]\s?/.test(item));
      blocks.push(
        <List
          key={`list-${index}`}
          style={ordered || isTaskList ? { listStyleType: "none", paddingInlineStart: 0 } : undefined}
          className={ordered ? "my-3 space-y-1 pl-0" : isTaskList ? "my-3 space-y-2 pl-0" : "list-inside list-disc"}
        >
          {items.map((item, itemIndex) => {
            const task = item.match(/^\[([ xX])\]\s?(.*)$/);
            const taskCompleted = task?.[1].toLowerCase() === "x";
            return (
              <li key={itemIndex} className={ordered || task ? "flex items-start gap-2.5 leading-6" : undefined}>
                {task ? (
                  <>
                    {onTaskToggle ? (
                      <button
                        type="button"
                        aria-label={`${taskCompleted ? "Mark incomplete" : "Mark complete"}: ${task[2]}`}
                        aria-pressed={taskCompleted}
                        disabled={tasksDisabled}
                        onClick={() => onTaskToggle(itemLineIndexes[itemIndex], !taskCompleted)}
                        className={`mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded border transition-colors disabled:opacity-50 ${taskCompleted ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white hover:border-blue-500"}`}
                      >
                        {taskCompleted && <span aria-hidden="true" className="text-[10px] leading-none">✓</span>}
                      </button>
                    ) : (
                      <span
                        role="img"
                        aria-label={taskCompleted ? "Completed" : "Not completed"}
                        className={`mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded border ${taskCompleted ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}
                      >
                        {taskCompleted && <span aria-hidden="true" className="text-[10px] leading-none">✓</span>}
                      </span>
                    )}
                    <span className={taskCompleted ? "text-slate-400 line-through" : "min-w-0"}>
                      {renderInline(task[2], `task-${index}-${itemIndex}`)}
                    </span>
                  </>
                ) : ordered ? (
                  <>
                    <span aria-hidden="true" className="w-5 shrink-0 text-right font-medium tabular-nums text-slate-500">{itemIndex + 1}.</span>
                    <span className="min-w-0">{renderInline(item, `list-${index}-${itemIndex}`)}</span>
                  </>
                ) : (
                  renderInline(item, `list-${index}-${itemIndex}`)
                )}
              </li>
            );
          })}
        </List>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    if (paragraph.length === 0) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`}>
        {paragraph.map((paragraphLine, lineIndex) => (
          <span key={lineIndex}>
            {lineIndex > 0 && <br />}
            {renderInline(paragraphLine, `paragraph-${index}-${lineIndex}`)}
          </span>
        ))}
      </p>,
    );
  }

  return <div className="space-y-1.5">{blocks}</div>;
}
