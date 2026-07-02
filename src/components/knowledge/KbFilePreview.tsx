import { FileText } from "lucide-react";
import type { KbFile } from "@/lib/mock/knowledge-space";

export function KbFilePreview({ file }: { file: KbFile }) {
  if (file.fileType !== "pdf") {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/30 p-8">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">暂不支持在线预览此格式</p>
            <p className="mt-1.5 text-[12px] text-muted-foreground">请下载后查看：{file.name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-muted/30 px-4 py-5">
      {/* 文档纸张 */}
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg bg-white ring-1 ring-black/8"
        style={{ boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)" }}
      >
        {/* 文档顶部工具条（模拟阅读器 chrome） */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/50 px-4 py-2">
          <span className="text-[11px] text-muted-foreground/70 tabular-nums">第 1 页 / 共 12 页</span>
          <span className="max-w-[60%] truncate text-center text-[11px] text-muted-foreground/70">
            {file.name}
          </span>
          <span className="text-[11px] text-muted-foreground/70">100%</span>
        </div>

        {/* 文档正文 */}
        <div className="px-10 pb-12 pt-10">
          {/* 文档标题 */}
          <h2 className="text-[18px] font-bold leading-tight text-foreground">
            {file.name.replace(/\.pdf$/i, "")}
          </h2>

          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>发布日期：2024-03-15</span>
            <span className="h-3 w-px bg-border" />
            <span>修订版本：V2.1</span>
          </div>

          <div className="my-5 h-px bg-border/50" />

          {/* 摘要 */}
          <p className="text-[13px] leading-[1.85] text-foreground/85">{file.summary}</p>

          {/* 演示提示 */}
          <div className="mt-5 rounded-md border-l-4 border-primary/40 bg-primary-soft/50 px-4 py-3">
            <p className="text-[12.5px] leading-relaxed text-foreground/80">
              本文件为知识库演示预览。实际环境中将内嵌 PDF 阅读器展示完整文档内容，支持全文检索与 AI 问答引用高亮定位。
            </p>
          </div>

          <h3 className="mt-7 text-[15px] font-bold text-foreground">1. 适用范围</h3>
          <p className="mt-2 text-[13px] leading-[1.85] text-foreground/80">
            操作人员（包括监护人）应了解文件适用范围与执行要求。对条款有疑问时应向主管部门询问清楚无误后执行。相关人员均应具备相应资质，并严格遵守相关规程要求开展操作。
          </p>

          <h3 className="mt-6 text-[15px] font-bold text-foreground">2. 执行要求</h3>
          <p className="mt-2 text-[13px] leading-[1.85] text-foreground/80">
            本条款为基本要求的补充说明，适用范围、执行主体及配合环节应按相关章节执行，严禁违反规程要求开展操作。各部门应结合现场实际，制定实施细则并定期组织培训。
          </p>

          <div className="mt-8 border-t border-border/50 pt-4 text-center text-[11px] text-muted-foreground/50">
            — 第 1 页，共 12 页 —
          </div>
        </div>
      </div>
    </div>
  );
}
