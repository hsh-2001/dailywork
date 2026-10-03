import { Input } from "antd";
import { Search } from "lucide-react";

interface NoteSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NoteSearch({ value, onChange }: NoteSearchProps) {
  return (
    <Input
      allowClear
      value={value}
      onChange={(event) => onChange(event.target.value)}
      prefix={<Search size={16} className="text-slate-400" aria-hidden="true" />}
      placeholder="Search notes..."
      aria-label="Search notes by title or content"
      className="!h-9 !rounded-lg"
    />
  );
}
