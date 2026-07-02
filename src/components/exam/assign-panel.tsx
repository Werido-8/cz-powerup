import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PERSONNEL } from "@/lib/mock/examAdmin";
import { cn } from "@/lib/utils";

type AssignPanelProps = {
  paperName?: string;
  onCancel?: () => void;
  onAssign: (count: number) => void;
  onDraft?: () => void;
  showDraft?: boolean;
  hideActions?: boolean;
  onSelectionChange?: (count: number) => void;
};

const SELECT_CLS =
  "h-10 w-full appearance-none rounded-[8px] border border-[#DCE8EA] bg-white px-3 text-[13px] text-[#1F3440] transition-colors hover:border-[#B8D4D9] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function AssignPanel({
  onCancel,
  onAssign,
  onDraft,
  showDraft = true,
  hideActions = false,
  onSelectionChange,
}: AssignPanelProps) {
  const [field, setField] = useState("");
  const [team, setTeam] = useState("");
  const [position, setPosition] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const teams = useMemo(() => Array.from(new Set(PERSONNEL.map((p) => p.team))), []);
  const positions = useMemo(() => Array.from(new Set(PERSONNEL.map((p) => p.position))), []);

  const filtered = PERSONNEL.filter(
    (p) =>
      (!field || p.user.includes(field)) &&
      (!team || p.team === team) &&
      (!position || p.position === position),
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someFilteredSelected = filtered.some((p) => selected.has(p.id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((p) => n.delete(p.id));
      } else {
        filtered.forEach((p) => n.add(p.id));
      }
      return n;
    });
  };

  const clearSelection = () => setSelected(new Set());

  useEffect(() => {
    onSelectionChange?.(selected.size);
  }, [onSelectionChange, selected.size]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AAAB0]" />
          <Input
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="按用户名搜索"
            className="h-10 rounded-[8px] border-[#DCE8EA] pl-8 text-[13px] placeholder:text-[#9AAAB0] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
          />
        </div>
        <div className="relative min-w-[140px]">
          <select value={team} onChange={(e) => setTeam(e.target.value)} className={SELECT_CLS}>
            <option value="">全部班组</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="relative min-w-[140px]">
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className={SELECT_CLS}
          >
            <option value="">全部岗位</option>
            {positions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[12.5px] text-muted-foreground">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-[12px] text-[#9AAAB0] transition-colors hover:text-primary"
            >
              清空选择
            </button>
          )}
          <span>
            已选{" "}
            <span className={cn("font-semibold tabular-nums", selected.size > 0 ? "text-primary" : "text-[#1F3440]")}>
              {selected.size}
            </span>{" "}
            人
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[8px] border border-[#DCE8EA]">
        {/* Table header */}
        <div className="flex items-center border-b border-[#DCE8EA] bg-[#F5FAFB] px-4 py-2.5">
          <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              ref={(el) => {
                if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
              }}
              onChange={toggleAll}
              disabled={filtered.length === 0}
              className="h-4 w-4 cursor-pointer rounded-[3px] accent-primary disabled:cursor-not-allowed disabled:opacity-40"
              title={allFilteredSelected ? "取消全选" : "全选当前列表"}
            />
          </div>
          <div className="grid flex-1 grid-cols-[minmax(80px,1fr)_minmax(100px,1.2fr)_minmax(100px,1fr)] gap-3">
            <span className="text-[12px] font-medium text-[#425B66]">姓名</span>
            <span className="text-[12px] font-medium text-[#425B66]">班组</span>
            <span className="text-[12px] font-medium text-[#425B66]">岗位</span>
          </div>
        </div>

        {/* Table body */}
        <div className="max-h-[360px] overflow-y-auto">
          {filtered.map((p) => {
            const isSelected = selected.has(p.id);
            return (
              <label
                key={p.id}
                className={cn(
                  "flex cursor-pointer items-center border-b border-[#EDF3F5] px-4 py-0 last:border-0 transition-colors",
                  isSelected ? "bg-primary-soft/40 hover:bg-primary-soft/60" : "hover:bg-[#F9FBFC]",
                )}
              >
                <div className="mr-3 flex h-12 w-9 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(p.id)}
                    className="h-4 w-4 cursor-pointer rounded-[3px] accent-primary"
                  />
                </div>
                <div className="grid flex-1 grid-cols-[minmax(80px,1fr)_minmax(100px,1.2fr)_minmax(100px,1fr)] items-center gap-3 py-3">
                  <span
                    className={cn(
                      "text-[13px] font-medium",
                      isSelected ? "text-primary" : "text-[#1F3440]",
                    )}
                  >
                    {p.user}
                  </span>
                  <span className="text-[13px] text-muted-foreground">{p.team}</span>
                  <span className="inline-flex">
                    <span className="rounded-full bg-[#F0F5F6] px-2 py-0.5 text-[11.5px] text-[#6B7F88]">
                      {p.position}
                    </span>
                  </span>
                </div>
              </label>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5FAFB]">
                <Users className="h-4 w-4 text-[#9AAAB0]" />
              </div>
              <p className="text-[13px] text-muted-foreground">无匹配人员</p>
              <p className="mt-0.5 text-[12px] text-[#9AAAB0]">请调整筛选条件后重试</p>
            </div>
          )}
        </div>

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#EDF3F5] bg-[#F9FBFC] px-4 py-2">
            <span className="text-[12px] text-muted-foreground">
              共 {filtered.length} 人
              {filtered.length !== PERSONNEL.length && (
                <span className="ml-1 text-[#9AAAB0]">（已筛选，共 {PERSONNEL.length} 人）</span>
              )}
            </span>
            {someFilteredSelected && !allFilteredSelected && (
              <button
                type="button"
                onClick={toggleAll}
                className="text-[12px] text-primary transition-colors hover:text-[#2F8D9D]"
              >
                全选当前 {filtered.length} 人
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons (only shown when hideActions is false) */}
      {!hideActions && (
        <div className="flex items-center justify-end gap-2 pt-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 items-center rounded-[8px] border border-[#DCE8EA] bg-white px-4 text-[13px] font-medium text-[#1F3440] transition-colors hover:bg-[#F5FAFB]"
            >
              取消
            </button>
          )}
          {showDraft && onDraft && (
            <button
              type="button"
              onClick={onDraft}
              className="inline-flex h-9 items-center rounded-[8px] border border-[#DCE8EA] bg-white px-4 text-[13px] font-medium text-[#1F3440] transition-colors hover:bg-[#F5FAFB]"
            >
              暂存草稿
            </button>
          )}
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => {
              if (selected.size === 0) {
                toast.warning("请至少选择一名人员");
                return;
              }
              onAssign(selected.size);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F8D9D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            确认下发
          </button>
        </div>
      )}
    </div>
  );
}
