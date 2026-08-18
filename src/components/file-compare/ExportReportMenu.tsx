import { Download, FileSpreadsheet, FileText, FileType2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KbButton } from "@/components/knowledge/ui";

const EXPORT_FORMATS = [
  { key: "pdf", label: "导出为 PDF", hint: "含双栏对照与差异标注", icon: FileText },
  { key: "docx", label: "导出为 Word", hint: "含变更清单表格", icon: FileType2 },
  { key: "xlsx", label: "导出为 Excel", hint: "仅导出变更清单", icon: FileSpreadsheet },
] as const;

export function ExportReportMenu({ taskTitle }: { taskTitle: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <KbButton variant="primary">
          <Download className="h-3.5 w-3.5 stroke-[1.9]" aria-hidden />
          导出报告
        </KbButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[236px] rounded-[10px] border-[#DCEBED]">
        <DropdownMenuLabel className="text-[11px] text-muted-foreground">
          选择导出格式
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {EXPORT_FORMATS.map((format) => (
          <DropdownMenuItem
            key={format.key}
            className="cursor-pointer gap-2.5 py-2 text-[13px]"
            onSelect={() =>
              toast.success(`已开始导出：${taskTitle}`, { description: format.label })
            }
          >
            <format.icon className="h-4 w-4 text-kb-muted" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate font-medium text-kb-body">{format.label}</span>
              <span className="block truncate text-[11px] text-kb-muted">{format.hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
