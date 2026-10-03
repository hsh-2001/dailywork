"use client";

import { Button, Tooltip } from "antd";
import { Bold, Code2, Heading2, Italic, Link2, List, ListChecks, ListOrdered, Quote, Strikethrough } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

const htmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => htmlEscapes[character]);
}

function inlineHtml(value: string) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function markdownToHtml(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const blocks: string[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { const tag = `h${heading[1].length}`; blocks.push(`<${tag}>${inlineHtml(heading[2])}</${tag}>`); index += 1; continue; }
    if (/^>\s?/.test(line)) {
      const quoted: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quoted.push(inlineHtml(lines[index++].replace(/^>\s?/, "")));
      blocks.push(`<blockquote>${quoted.map((text) => `<p>${text}</p>`).join("")}</blockquote>`); continue;
    }
    const list = line.match(/^([-*+]\s|\d+\.\s)(.*)$/);
    if (list) {
      const ordered = /^\d/.test(list[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].match(/^([-*+]\s|\d+\.\s)(.*)$/);
        if (!item || /^\d/.test(item[1]) !== ordered) break;
        const task = item[2].match(/^\[([ xX])\]\s?(.*)$/);
        items.push(`<li>${task ? `<input type="checkbox" contenteditable="false" ${task[1].toLowerCase() === "x" ? "checked" : ""}> ${inlineHtml(task[2])}` : inlineHtml(item[2])}</li>`);
        index += 1;
      }
      const tag = ordered ? "ol" : "ul";
      const isTaskList = !ordered && items.some((item) => item.includes("type=\"checkbox\""));
      blocks.push(`<${tag}${isTaskList ? ' style="list-style-type:none"' : ""}>${items.join("")}</${tag}>`); continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,3}\s|>\s?|[-*+]\s|\d+\.\s)/.test(lines[index])) paragraph.push(inlineHtml(lines[index++]));
    blocks.push(`<p>${paragraph.join("<br>")}</p>`);
  }
  return blocks.join("");
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";
  const content = Array.from(node.childNodes).map(serializeInline).join("");
  switch (node.tagName) {
    case "STRONG": case "B": return `**${content}**`;
    case "EM": case "I": return `*${content}*`;
    case "DEL": case "S": case "STRIKE": return `~~${content}~~`;
    case "CODE": return `\`${content}\``;
    case "A": {
      const href = node.getAttribute("href") ?? "";
      return /^(https?:\/\/|mailto:)/i.test(href) ? `[${content}](${href})` : content;
    }
    case "BR": return "\n";
    default: return content;
  }
}

function serializeBlock(node: HTMLElement): string {
  const content = Array.from(node.childNodes).map(serializeInline).join("").trim();
  switch (node.tagName) {
    case "H1": return `# ${content}`;
    case "H2": return `## ${content}`;
    case "H3": return `### ${content}`;
    case "BLOCKQUOTE": return Array.from(node.children).map((child) => `> ${serializeBlock(child as HTMLElement)}`).join("\n");
    case "UL": case "OL":
      return Array.from(node.children).map((child, index) => {
        const item = child as HTMLElement;
        const checkbox = item.querySelector<HTMLInputElement>('input[type="checkbox"]');
        const text = Array.from(item.childNodes).filter((part) => !(part instanceof HTMLInputElement)).map(serializeInline).join("").trim();
        const prefix = node.tagName === "OL" ? `${index + 1}. ` : checkbox ? `- [${checkbox.checked ? "x" : " "}] ` : "- ";
        return `${prefix}${text}`;
      }).join("\n");
    case "PRE": return `\`\`\`\n${node.textContent ?? ""}\n\`\`\``;
    case "DIV": case "P": return content;
    default: return content;
  }
}

function htmlToMarkdown(element: HTMLDivElement) {
  const blocks = Array.from(element.childNodes).map((node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    if (["P", "DIV", "H1", "H2", "H3", "BLOCKQUOTE", "UL", "OL", "PRE"].includes(node.tagName)) {
      return serializeBlock(node);
    }
    return serializeInline(node);
  }).filter(Boolean);
  return blocks.join("\n\n");
}

function addTaskCheckbox(listItem: HTMLLIElement) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.setAttribute("contenteditable", "false");
  const spacer = document.createTextNode(" ");
  listItem.insertBefore(checkbox, listItem.firstChild);
  listItem.insertBefore(spacer, checkbox.nextSibling);

  const range = document.createRange();
  range.setStartAfter(spacer);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

interface NoteRichEditorProps { value?: string; onChange?: (value: string) => void; }

export default function NoteRichEditor({ value = "", onChange }: NoteRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);
  const [activeTools, setActiveTools] = useState<Record<string, boolean>>({});

  const refreshActiveTools = useCallback(() => {
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    const anchorElement = anchor instanceof Element ? anchor : anchor?.parentElement;
    if (!anchor || !editorRef.current?.contains(anchor)) {
      setActiveTools({});
      return;
    }

    const block = document.queryCommandValue("formatBlock").toLowerCase().replace(/[<>]/g, "");
    const listItem = anchorElement?.closest("li");
    setActiveTools({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      strike: document.queryCommandState("strikeThrough"),
      heading: /^h[1-3]$/.test(block),
      bulleted: document.queryCommandState("insertUnorderedList") && !listItem?.querySelector("input[type=checkbox]"),
      numbered: document.queryCommandState("insertOrderedList"),
      todo: Boolean(listItem?.querySelector("input[type=checkbox]")),
      quote: block === "blockquote",
      code: block === "pre",
      link: Boolean(anchorElement?.closest("a")),
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActiveTools);
    return () => document.removeEventListener("selectionchange", refreshActiveTools);
  }, [refreshActiveTools]);

  useEffect(() => {
    if (value === lastValue.current) return;
    if (editorRef.current) editorRef.current.innerHTML = markdownToHtml(value);
    lastValue.current = value;
  }, [value]);

  const updateValue = () => {
    if (!editorRef.current) return;
    const markdown = htmlToMarkdown(editorRef.current);
    lastValue.current = markdown;
    onChange?.(markdown);
  };

  const format = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    updateValue();
    requestAnimationFrame(refreshActiveTools);
  };

  const formatTaskList = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand("insertUnorderedList", false);
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    const anchorElement = anchor instanceof Element ? anchor : anchor?.parentElement;
    const listItem = anchorElement?.closest("li");
    if (listItem && !listItem.querySelector("input[type=checkbox]")) addTaskCheckbox(listItem);
    if (listItem?.parentElement) listItem.parentElement.style.listStyleType = "none";
    updateValue();
    requestAnimationFrame(refreshActiveTools);
  };

  const continueTaskList = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") return;
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    const anchorElement = anchor instanceof Element ? anchor : anchor?.parentElement;
    const currentItem = anchorElement?.closest("li");
    if (!currentItem?.querySelector("input[type=checkbox]")) return;

    requestAnimationFrame(() => {
      const nextSelection = window.getSelection();
      const nextAnchor = nextSelection?.anchorNode;
      const nextElement = nextAnchor instanceof Element ? nextAnchor : nextAnchor?.parentElement;
      const nextItem = nextElement?.closest("li");
      if (!nextItem || nextItem.querySelector("input[type=checkbox]")) return;
      addTaskCheckbox(nextItem);
      if (nextItem.parentElement) nextItem.parentElement.style.listStyleType = "none";
      updateValue();
      refreshActiveTools();
    });
  };

  const tools = [
    { key: "bold", label: "Bold", icon: <Bold size={15} />, run: () => format("bold") },
    { key: "italic", label: "Italic", icon: <Italic size={15} />, run: () => format("italic") },
    { key: "strike", label: "Strikethrough", icon: <Strikethrough size={15} />, run: () => format("strikeThrough") },
    { key: "heading", label: "Heading", icon: <Heading2 size={15} />, run: () => format("formatBlock", "h2") },
    { key: "bulleted", label: "Bulleted list", icon: <List size={15} />, run: () => format("insertUnorderedList") },
    { key: "numbered", label: "Numbered list", icon: <ListOrdered size={15} />, run: () => format("insertOrderedList") },
    { key: "todo", label: "To-do list", icon: <ListChecks size={15} />, run: formatTaskList },
    { key: "quote", label: "Quote", icon: <Quote size={15} />, run: () => format("formatBlock", "blockquote") },
    { key: "code", label: "Code", icon: <Code2 size={15} />, run: () => format("formatBlock", "pre") },
    { key: "link", label: "Link", icon: <Link2 size={15} />, run: () => { const href = window.prompt("Enter link URL"); if (href && /^(https?:\/\/|mailto:)/i.test(href)) format("createLink", href); } },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <div className="flex flex-nowrap gap-0 overflow-x-auto border-b border-slate-200 bg-slate-50 p-1">
        {tools.map((tool) => <Tooltip key={tool.label} title={tool.label}><Button type="text" size="small" htmlType="button" aria-label={tool.label} aria-pressed={Boolean(activeTools[tool.key])} icon={tool.icon} onMouseDown={(event) => event.preventDefault()} onClick={tool.run} className={`!h-7 !w-7 !min-w-7 shrink-0 !px-0 ${activeTools[tool.key] ? "!bg-blue-100 !text-blue-700" : "!text-slate-600"}`} /></Tooltip>)}
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder="Write your note... Formatting appears as you type." onInput={() => { updateValue(); refreshActiveTools(); }} onKeyUp={refreshActiveTools} onMouseUp={refreshActiveTools} onKeyDown={continueTaskList} onBlur={updateValue} onClick={(event) => { if ((event.target as HTMLElement).matches('input[type="checkbox"]')) requestAnimationFrame(updateValue); }} onPaste={(event) => { event.preventDefault(); const text = event.clipboardData.getData("text/plain"); document.execCommand("insertText", false, text); updateValue(); }} className="min-h-36 whitespace-pre-wrap break-words px-3 py-2 text-base leading-7 text-slate-800 outline-none sm:min-h-44 [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_h1]:my-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:my-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:my-2 [&_ol]:list-inside [&_ol]:list-decimal [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-slate-100 [&_pre]:p-3 [&_ul]:my-2 [&_ul]:list-inside [&_ul]:list-disc" />
      <style jsx>{`[data-placeholder]:empty:before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; }`}</style>
    </div>
  );
}
